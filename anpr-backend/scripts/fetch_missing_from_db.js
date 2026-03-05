require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fetch = global.fetch || require('node-fetch');
const { pool } = require('../src/config/db');
const { saveImageBuffer } = require('../src/services/image.service');

function formatDateForFilename(d) {
  const pad = (n) => String(n).padStart(2, '0');
  const Y = d.getFullYear();
  const M = pad(d.getMonth() + 1);
  const D = pad(d.getDate());
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${Y}${M}${D}${h}${m}${s}`;
}

async function tryFetchCandidates(camera, cameraIp, plate, dateStr, candidates) {
  const hostsRaw = process.env.CAMERA_IMAGE_HOSTS || null;
  let hosts = {};
  if (hostsRaw) {
    try { hosts = JSON.parse(hostsRaw); } catch (e) { console.warn('Invalid CAMERA_IMAGE_HOSTS JSON'); }
  }
  const cameraHost = hosts[camera] || hosts[cameraIp] || null;

  const urls = [];
  if (cameraHost) {
    for (const c of candidates) {
      urls.push(`${cameraHost}/${c}`);
      urls.push(`${cameraHost}/${dateStr}/${plate}/${c}`);
      urls.push(`${cameraHost}/uploads/${camera}/${dateStr}/${plate}/${c}`);
    }
  }

  if (cameraIp) {
    const ipOnly = cameraIp.split(':')[0];
    for (const c of candidates) {
      urls.push(`http://${ipOnly}/${c}`);
      urls.push(`http://${ipOnly}/uploads/${dateStr}/${plate}/${c}`);
    }
  }

  for (const url of urls) {
    try {
      const resp = await fetch(url, { timeout: 5000 });
      if (resp && resp.ok) {
        const ct = resp.headers.get('content-type') || '';
        if (ct.startsWith('image/')) {
          const ab = await resp.arrayBuffer();
          const buf = Buffer.from(ab);
          return { url, buf };
        }
      }
    } catch (e) {
      // ignore network errors
    }
  }
  return null;
}

async function main() {
  console.log('Querying detections with no images...');
  const res = await pool.query(
    `SELECT d.id, d.camera_name, d.camera_ip, d.plate, d.created_at
     FROM vehicle_detections d
     WHERE NOT EXISTS (SELECT 1 FROM vehicle_images i WHERE i.detection_id = d.id)
     ORDER BY d.created_at DESC
     LIMIT 200`
  );

  console.log('Found', res.rows.length, 'detections without images');
  for (const row of res.rows) {
    const detId = row.id;
    const camera = row.camera_name || 'camera1';
    const cameraIp = row.camera_ip || '';
    const plate = (row.plate || 'UNKNOWN').replace(/\s+/g, '_');
    const created = row.created_at ? new Date(row.created_at) : new Date();
    const dateStr = created.toISOString().split('T')[0];
    const fileDate = formatDateForFilename(created);

    const candidates = [
      `${plate}-${fileDate}-vehicle.jpg`,
      `${plate}-${fileDate}-plate.jpg`,
      `${plate}-${fileDate}-full.jpg`,
      `${plate}-${fileDate}-vehicle.jpeg`,
      `${plate}-${fileDate}-plate.jpeg`,
      `${plate}-${fileDate}-full.jpeg`
    ];

    console.log('Trying detection', detId, plate, dateStr);
    const found = await tryFetchCandidates(camera, cameraIp, plate, dateStr, candidates);
    if (found) {
      // Save file
      const filename = candidates[0];
      const savedPath = saveImageBuffer({ camera, plate, filename, buffer: found.buf, date: dateStr });
      await pool.query('INSERT INTO vehicle_images (detection_id, image_type, image_path) VALUES ($1,$2,$3)', [detId, 'fetched', savedPath]);
      console.log('Fetched and saved for detection', detId, '->', savedPath, 'from', found.url);
    } else {
      console.log('No image found for detection', detId);
    }
  }

  console.log('Done');
  process.exit(0);
}

main().catch(e=>{console.error(e); process.exit(1)});
