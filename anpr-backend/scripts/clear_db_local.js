const path = require('path');
// load dotenv from this package
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { pool } = require('../src/config/db');

(async () => {
  try {
    console.log('\n=== Clearing ALL ANPR backend data ===\n');

    // Delete in correct order due to FK constraints
    console.log('Deleting vehicle_images...');
    const r1 = await pool.query('DELETE FROM vehicle_images');
    console.log(`Deleted ${r1.rowCount} vehicle_images`);

    console.log('Deleting events...');
    const r2 = await pool.query('DELETE FROM events');
    console.log(`Deleted ${r2.rowCount} events`);

    console.log('Deleting vehicle_detections...');
    const r3 = await pool.query('DELETE FROM vehicle_detections');
    console.log(`Deleted ${r3.rowCount} vehicle_detections`);

    console.log('Deleting vehicles...');
    const r4 = await pool.query('DELETE FROM vehicles');
    console.log(`Deleted ${r4.rowCount} vehicles`);

    console.log('\nVerification: checking counts...');
    const cnt = await pool.query('SELECT COUNT(*) AS total FROM vehicle_detections');
    console.log('vehicle_detections remaining:', cnt.rows[0].total);

    console.log('\n✅ Database cleared.');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing DB:', err.message);
    process.exit(1);
  }
})();
