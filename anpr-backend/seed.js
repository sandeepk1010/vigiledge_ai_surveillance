require('dotenv').config();
const { pool } = require('./src/config/db');

(async () => {
  try {
    const detections = [
      { plate: 'MH01AB1234', camera: 'camera1' },
      { plate: 'UP14GH5678', camera: 'camera2' },
      { plate: 'MH02CD9999', camera: 'camera1' },
      { plate: 'UP15IJ1111', camera: 'camera2' },
      { plate: 'MH03EF2222', camera: 'camera1' }
    ];

    for (let d of detections) {
      const v = await pool.query(
        'INSERT INTO vehicles(plate) VALUES($1) ON CONFLICT(plate) DO UPDATE SET plate=EXCLUDED.plate RETURNING id',
        [d.plate]
      );
      await pool.query(
        'INSERT INTO vehicle_detections(camera_name,camera_ip,plate) VALUES($1,$2,$3)',
        [d.camera, '192.168.1.100', d.plate]
      );
    }

    console.log('✅ Added 5 test detections (3 Camera 1, 2 Camera 2)');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
