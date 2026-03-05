require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../src/config/db');

async function main() {
  try {
    const tables = ['vehicles','vehicle_detections','vehicle_images'];
    for (const t of tables) {
      const r = await pool.query(`SELECT COUNT(*) AS c FROM ${t}`);
      console.log(`${t}: ${r.rows[0].c}`);
    }

    console.log('\nRecent detections (10):');
    const dets = await pool.query(`
      SELECT d.id,d.camera_name,d.camera_ip,d.plate,d.created_at,
        (SELECT COUNT(*) FROM vehicle_images i WHERE i.detection_id=d.id) AS images_count
      FROM vehicle_detections d
      ORDER BY d.created_at DESC
      LIMIT 10
    `);
    for (const row of dets.rows) {
      console.log(row);
    }

    console.log('\nSample vehicle_images (10):');
    const imgs = await pool.query('SELECT id,detection_id,image_type,image_path FROM vehicle_images ORDER BY id DESC LIMIT 10');
    for (const r of imgs.rows) console.log(r);

    process.exit(0);
  } catch (e) {
    console.error('DB STATUS ERROR', e.message || e);
    process.exit(1);
  }
}

main();
