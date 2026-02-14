const path = require('path');
// Ensure the backend .env is loaded when running this script from repository root
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { saveImage } = require('../src/services/image.service');
const { testConnection, pool } = require('../src/config/db');

async function main() {
  try {
    // Tiny 1x1 PNG (data URI)
    const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';

    const platePath = saveImage({ camera: 'camera1', plate: 'TEST123', type: 'plate', base64: tinyPng });
    const fullPath = saveImage({ camera: 'camera1', plate: 'TEST123', type: 'full', base64: tinyPng });

    console.log('Saved plate image:', platePath);
    console.log('Saved full image :', fullPath);

    const dbOk = await testConnection();
    if (!dbOk) {
      console.log('DB not available — skipped DB inserts.');
      return;
    }

    // Insert vehicle, detection and image rows
    const plate = 'TEST123';
    const camera = 'camera1';

    const v = await pool.query(
      'INSERT INTO vehicles (plate) VALUES ($1) ON CONFLICT (plate) DO UPDATE SET plate=EXCLUDED.plate RETURNING id',
      [plate]
    );
    const vehicleId = v.rows[0].id;

    const det = await pool.query(
      'INSERT INTO vehicle_detections (camera_name,camera_ip,plate) VALUES ($1,$2,$3) RETURNING id',
      [camera, '127.0.0.1', plate]
    );
    const detectionId = det.rows[0].id;

    await pool.query('INSERT INTO vehicle_images (detection_id, image_type, image_path) VALUES ($1,$2,$3)', [detectionId, 'plate', platePath]);
    await pool.query('INSERT INTO vehicle_images (detection_id, image_type, image_path) VALUES ($1,$2,$3)', [detectionId, 'full', fullPath]);

    console.log('Inserted DB rows for detection:', detectionId);
  } catch (err) {
    console.error('TEST SAVE ERROR:', err.message || err);
  }
}

main();
