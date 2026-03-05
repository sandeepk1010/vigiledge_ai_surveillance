require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../src/config/db');
const path = require('path');

async function main() {
  try {
    const res = await pool.query("SELECT id, image_path FROM vehicle_images WHERE image_path LIKE 'C:%' OR image_path LIKE '%\\\\uploads\\\\%'");
    console.log('Found', res.rows.length, 'rows to normalize');
    let updated = 0;
    for (const row of res.rows) {
      let p = row.image_path.replace(/\\/g, '/');
      const idx = p.indexOf('/uploads/');
      if (idx !== -1) {
        const rel = p.substring(idx + 1); // remove leading '/'
        await pool.query('UPDATE vehicle_images SET image_path=$1 WHERE id=$2', [rel, row.id]);
        updated++;
        console.log('Updated', row.id, '->', rel);
      }
    }
    console.log('Normalization complete, updated', updated, 'rows');
    process.exit(0);
  } catch (e) {
    console.error('ERROR', e.message || e);
    process.exit(1);
  }
}

main();
