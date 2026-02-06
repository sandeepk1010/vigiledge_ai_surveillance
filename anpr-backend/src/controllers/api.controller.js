const pool = require("../config/db");

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

module.exports = { getDetections };
