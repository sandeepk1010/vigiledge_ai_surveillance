require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');
const { pool } = require('../src/config/db');
const { saveImageBuffer } = require('../src/services/image.service');

async function findPayloadFiles(limit = 100) {
  const uploadsRoot = path.join(process.cwd(), 'uploads');
  const files = [];
  async function walk(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true }).catch(()=>[]);
    for (const ent of entries) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walk(p);
      } else if (ent.isFile() && ent.name.startsWith('payload-') && ent.name.endsWith('.json')) {
        const s = await fs.promises.stat(p).catch(()=>null);
        if (s) files.push({ path: p, mtime: s.mtime.getTime() });
      }
    }
  }
  if (fs.existsSync(uploadsRoot)) await walk(uploadsRoot);
  files.sort((a,b)=>b.mtime - a.mtime);
  return files.slice(0, limit).map(f=>f.path);
}

function extractPicNames(parsed) {
  const pics = [];
  const pic = parsed?.Picture || null;
  if (!pic) return pics;
  if (pic.CutoutPic && (pic.CutoutPic.PicName || pic.CutoutPic.Pic)) pics.push(pic.CutoutPic.PicName || pic.CutoutPic.Pic);
  if (pic.VehiclePic && (pic.VehiclePic.PicName || pic.VehiclePic.Pic)) pics.push(pic.VehiclePic.PicName || pic.VehiclePic.Pic);
  if (pic.NormalPic && (pic.NormalPic.PicName || pic.NormalPic.Pic)) pics.push(pic.NormalPic.PicName || pic.NormalPic.Pic);
  return pics.filter(Boolean);
}

async function findDetectionForPayload(parsed, filePath) {
  const plate = parsed?.Picture?.Plate?.PlateNumber || parsed?.plate || parsed?.plateNumber || 'UNKNOWN';
  // try to use SnapInfo time
  let snapTime = parsed?.Picture?.SnapInfo?.AccurateTime || parsed?.Picture?.SnapInfo?.SnapTime || null;
  let targetDate = null;
  if (snapTime) {
    // snapTime likely 'YYYY-MM-DD HH:MM:SS'
    const t = new Date(snapTime);
    if (!isNaN(t.getTime())) targetDate = t;
  }
  if (!targetDate) {
    // fall back to file mtime
    const s = await fs.promises.stat(filePath).catch(()=>null);
    if (s) targetDate = new Date(s.mtime);
  }

  if (!plate) return null;

  if (targetDate) {
    const start = new Date(targetDate.getTime() - 5*60*1000).toISOString();
    const end = new Date(targetDate.getTime() + 5*60*1000).toISOString();
    const res = await pool.query(
      'SELECT id, created_at FROM vehicle_detections WHERE plate ILIKE $1 AND created_at BETWEEN $2 AND $3 ORDER BY created_at DESC LIMIT 1',
      [`%${plate}%`, start, end]
    );
    if (res.rows.length) return res.rows[0];
  }

  // fallback: latest detection with that plate
  const res2 = await pool.query('SELECT id, created_at FROM vehicle_detections WHERE plate ILIKE $1 ORDER BY created_at DESC LIMIT 1', [`%${plate}%`]);
  return res2.rows.length ? res2.rows[0] : null;
}

async function attemptFetch(detectionId, filename, detRow) {
  const camera = detRow.camera_name || detRow.camera_name;
  const cameraIp = detRow.camera_ip || detRow.camera_ip || '';
  const plate = detRow.plate || 'UNKNOWN';
  const dateStr = detRow.created_at ? new Date(detRow.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  const hostsRaw = process.env.CAMERA_IMAGE_HOSTS || null;
  let hosts = {};
  if (hostsRaw) {
    try { hosts = JSON.parse(hostsRaw); } catch (e) { console.warn('Invalid CAMERA_IMAGE_HOSTS JSON'); }
  }
  const cameraHost = hosts[camera] || hosts[cameraIp] || null;
  const candidates = [];
  if (cameraHost) {
    candidates.push(`${cameraHost}/${filename}`);
    candidates.push(`${cameraHost}/${dateStr}/${plate}/${filename}`);
    candidates.push(`${cameraHost}/uploads/${camera}/${dateStr}/${plate}/${filename}`);
  }
  if (cameraIp) {
    const ipOnly = cameraIp.split(':')[0];
    candidates.push(`http://${ipOnly}/${filename}`);
    candidates.push(`http://${ipOnly}/uploads/${dateStr}/${plate}/${filename}`);
  }

  for (const url of candidates) {
    try {
      const resp = await fetch(url);
      if (resp && resp.ok) {
        const ct = resp.headers.get('content-type') || '';
        if (ct.startsWith('image/')) {
          const ab = await resp.arrayBuffer();
          const buf = Buffer.from(ab);
          const savedPath = saveImageBuffer({ camera: detRow.camera_name || 'camera1', plate, filename, buffer: buf, date: dateStr });
          await pool.query('INSERT INTO vehicle_images (detection_id, image_type, image_path) VALUES ($1,$2,$3)', [detectionId, 'fetched', savedPath]);
          console.log(`Fetched ${url} -> ${savedPath}`);
          return true;
        }
      }
    } catch (e) {
      // ignore
    }
  }
  return false;
}

async function main() {
  console.log('Scanning recent payloads for PicName...');
  const files = await findPayloadFiles(200);
  console.log('Found', files.length, 'payload files');

  for (const f of files) {
    try {
      const raw = await fs.promises.readFile(f, 'utf8');
      const parsed = JSON.parse(raw);
      const pics = extractPicNames(parsed);
      if (pics.length === 0) continue;
      const detRow = await findDetectionForPayload(parsed, f);
      if (!detRow) {
        console.log('No detection found for payload', f);
        continue;
      }
      // enrich detRow with camera_name, camera_ip, plate, created_at
      const fullDet = await pool.query('SELECT id, camera_name, camera_ip, plate, created_at FROM vehicle_detections WHERE id=$1', [detRow.id]);
      const det = fullDet.rows[0];
      for (const pic of pics) {
        const already = await pool.query('SELECT 1 FROM vehicle_images WHERE detection_id=$1 AND image_path ILIKE $2 LIMIT 1', [det.id, `%${pic}%`]);
        if (already.rows.length) {
          console.log('Already linked', pic, 'for detection', det.id);
          continue;
        }
        const ok = await attemptFetch(det.id, pic, det);
        if (!ok) console.log('Failed to fetch', pic, 'for detection', det.id);
      }
    } catch (e) {
      console.error('Error processing file', f, e.message || e);
    }
  }
  console.log('Scan complete');
  process.exit(0);
}

main();
