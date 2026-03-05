const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { pool } = require("../src/config/db");

async function run() {
  const id = process.argv[2] || 375;
  try {
    const res = await pool.query(
      "SELECT id,detection_id,image_type,image_path,created_at FROM vehicle_images WHERE detection_id=$1 ORDER BY id",
      [id]
    );
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('ERROR', err.message);
  } finally {
    await pool.end();
  }
}

run();
