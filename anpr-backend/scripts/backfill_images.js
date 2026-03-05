const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
const { pool } = require('../src/config/db');

async function walkDir(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      files.push(...(await walkDir(p)));
    } else if (ent.isFile()) {
      files.push(p);
    }
  }
  return files;
}

function parseUploadPath(p) {
  // Expect uploads/<camera>/<date>/<plate>/<filename>
  const parts = p.split(path.sep);
  const idx = parts.indexOf('uploads');
  if (idx === -1 || parts.length < idx + 5) return null;
  const camera = parts[idx + 1];
  const date = parts[idx + 2];
  const plate = parts[idx + 3];
  const filename = parts.slice(idx + 4).join(path.sep);
  return { camera, date, plate, filename, full: p };
}

async function findDetection(camera, plate, date) {
  try {
    // look for detection on the same day matching plate and camera
    const start = new Date(date + 'T00:00:00Z').toISOString();
    const end = new Date(date + 'T23:59:59Z').toISOString();
    const res = await pool.query(
      `SELECT id FROM vehicle_detections WHERE camera_name=$1 AND plate=$2 AND created_at >= $3 AND created_at <= $4 ORDER BY created_at DESC LIMIT 1`,
      [camera, plate, start, end]
    );
    return res.rows.length ? res.rows[0].id : null;
  } catch (err) {
    console.error('findDetection error', err.message);
    return null;
  }
}

async function alreadyLinked(detectionId, imagePath) {
  const res = await pool.query(
    'SELECT id FROM vehicle_images WHERE detection_id=$1 AND image_path=$2 LIMIT 1',
    [detectionId, imagePath]
  );
  return res.rows.length > 0;
}

async function run() {
  const uploadsRoot = path.join(process.cwd(), 'anpr-backend', 'uploads');
  if (!fs.existsSync(uploadsRoot)) {
    console.error('uploads root not found:', uploadsRoot);
    process.exit(1);
  }

  const files = await walkDir(uploadsRoot);
  let linked = 0;
  for (const f of files) {
    const info = parseUploadPath(f);
    if (!info) continue;
    const ext = path.extname(info.filename).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;

    const detectionId = await findDetection(info.camera, info.plate, info.date);
    if (!detectionId) continue;

    const normalizedPath = f.replace(/\\/g, '/');

    const linkedAlready = await alreadyLinked(detectionId, f);
    if (linkedAlready) continue;

    // derive image_type from filename or folder name
    let imageType = 'full';
    const lower = info.filename.toLowerCase();
    if (lower.includes('plate') || lower.includes('cutout') || lower.includes('crop')) imageType = 'plate';
    else if (lower.includes('vehicle') || lower.includes('full')) imageType = 'full';

    try {
      await pool.query(
        'INSERT INTO vehicle_images (detection_id, image_type, image_path) VALUES ($1,$2,$3)',
        [detectionId, imageType, f]
      );
      linked++;
      console.log('Linked', f, '-> detection', detectionId);
    } catch (err) {
      console.error('Insert error for', f, err.message);
    }
  }

  console.log('Backfill complete. Linked images:', linked);
  await pool.end();
}

run().catch(err => { console.error(err); process.exit(1); });
