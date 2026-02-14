const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { pool } = require('../src/config/db');

async function walk(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files = files.concat(await walk(p));
    else files.push(p);
  }
  return files;
}

function parse(p) {
  const parts = p.split(path.sep);
  const idx = parts.indexOf('uploads');
  if (idx === -1 || parts.length < idx + 5) return null;
  const camera = parts[idx+1];
  const date = parts[idx+2];
  const plate = parts[idx+3];
  const filename = parts.slice(idx+4).join(path.sep);
  return { camera, date, plate, filename, full: p };
}

async function findLatestDetection(camera, plate) {
  const res = await pool.query(
    'SELECT id, created_at FROM vehicle_detections WHERE camera_name=$1 AND plate=$2 ORDER BY created_at DESC LIMIT 1',
    [camera, plate]
  );
  return res.rows.length ? res.rows[0].id : null;
}

async function existsLinked(detectionId, imagePath) {
  const res = await pool.query('SELECT id FROM vehicle_images WHERE detection_id=$1 AND image_path=$2 LIMIT 1', [detectionId, imagePath]);
  return res.rows.length > 0;
}

async function run() {
  const uploadsRoot = path.join(process.cwd(), 'anpr-backend', 'uploads');
  if (!fs.existsSync(uploadsRoot)) {
    console.error('uploads root missing', uploadsRoot);
    process.exit(1);
  }

  const files = await walk(uploadsRoot);
  let linked = 0;
  for (const f of files) {
    const info = parse(f);
    if (!info) continue;
    const ext = path.extname(info.filename).toLowerCase();
    if (!['.jpg','.jpeg','.png'].includes(ext)) continue;

    const detectionId = await findLatestDetection(info.camera, info.plate);
    if (!detectionId) continue;

    const already = await existsLinked(detectionId, f);
    if (already) continue;

    // derive type
    let type = 'full';
    const n = info.filename.toLowerCase();
    if (n.includes('plate') || n.includes('cutout')) type = 'plate';
    try {
      await pool.query('INSERT INTO vehicle_images (detection_id, image_type, image_path) VALUES ($1,$2,$3)', [detectionId, type, f]);
      linked++;
      console.log('Linked', f, '->', detectionId);
    } catch (e) {
      console.error('insert err', e.message);
    }
  }
  console.log('Done. linked=', linked);
  await pool.end();
}

run().catch(e=>{console.error(e); process.exit(1);});
