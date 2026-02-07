const { pool } = require("../config/db");

async function getDetections(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        d.id,
        d.camera_name,
        d.plate,
        d.created_at,
        i.image_type,
        i.image_path
      FROM vehicle_detections d
      LEFT JOIN vehicle_images i
        ON d.id = i.detection_id
      ORDER BY d.created_at DESC
      LIMIT 50
    `);

    const detections = {};

    for (const row of result.rows) {
      if (!detections[row.id]) {
        detections[row.id] = {
          id: row.id,
          camera: row.camera_name,
          plate: row.plate,
          detected_at: row.created_at, // alias for frontend
          images: {}
        };
      }

      if (row.image_type && row.image_path) {
        detections[row.id].images[row.image_type] =
          "/" + row.image_path.replace(/\\/g, "/");
      }
    }

    res.json(Object.values(detections));
  } catch (err) {
    console.error("API DETECTIONS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}

async function getStats(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(camera_name, 'unknown') AS camera,
        COUNT(*)::int AS total,
        SUM((created_at::date = CURRENT_DATE)::int)::int AS today
      FROM vehicle_detections
      GROUP BY camera_name
      ORDER BY total DESC
    `);

    res.json(result.rows.map(r => ({ camera: r.camera, total: r.total, today: r.today })));
  } catch (err) {
    console.error("API STATS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getDetections, getStats };
