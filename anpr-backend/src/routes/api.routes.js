const express = require("express");
const router = express.Router();
const { getDetections, getStats } = require("../controllers/api.controller");

router.get("/api/detections", async (req, res) => {
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
});

router.get("/api/stats", getStats);

module.exports = router;
