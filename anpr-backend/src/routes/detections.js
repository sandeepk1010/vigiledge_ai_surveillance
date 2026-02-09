const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        vd.id,
        vd.plate,
        vd.camera_name,
        vd.created_at,
        vi.image_path
      FROM vehicle_detections vd
      LEFT JOIN vehicle_images vi 
        ON vd.id = vi.detection_id
      ORDER BY vd.id DESC
      LIMIT 50
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
