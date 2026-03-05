require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fetch = global.fetch || require('node-fetch');
const { pool } = require('../src/config/db');
const { saveImageBuffer } = require('../src/services/image.service');

async function fetchAndSave(detectionId, filename, imageType) {
  try {
    const detResult = await pool.query(
      'SELECT camera_name, camera_ip, plate, created_at FROM vehicle_detections WHERE id = $1',
      [detectionId]
    );
    if (detResult.rows.length === 0) throw new Error('Detection not found');
    const det = detResult.rows[0];
    const camera = det.camera_name;
    const cameraIp = det.camera_ip;
    const plate = det.plate || 'UNKNOWN';
    const dateStr = det.created_at ? new Date(det.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

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
        console.log('Trying', url);
        const resp = await fetch(url);
        if (resp && resp.ok) {
          const ct = resp.headers.get('content-type') || '';
          if (ct.startsWith('image/')) {
            const ab = await resp.arrayBuffer();
            const buf = Buffer.from(ab);
            const savedPath = saveImageBuffer({ camera, plate, filename, buffer: buf, date: dateStr });
            await pool.query(
              'INSERT INTO vehicle_images (detection_id, image_type, image_path) VALUES ($1,$2,$3)',
              [detectionId, imageType || 'fetched', savedPath]
            );
            console.log('Saved', savedPath);
            return { ok: true, url, savedPath };
          }
        }
      } catch (e) {
        console.log('fetch failed', e.message);
      }
    }
    return { ok: false, error: 'Not found', candidates };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function main() {
  const detectionId = parseInt(process.argv[2], 10);
  const filename = process.argv[3];
  const imageType = process.argv[4] || 'fetched';
  if (!detectionId || !filename) {
    console.error('Usage: node fetch_and_save_image.js <detectionId> <filename> [imageType]');
    process.exit(1);
  }

  const res = await fetchAndSave(detectionId, filename, imageType);
  console.log(res);
  process.exit(0);
}

main();
