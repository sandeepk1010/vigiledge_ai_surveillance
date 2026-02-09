const express = require("express");
const router = express.Router();
const { getDetections, getStats, getDailyCounts, getCameras, searchDetections, addImageToDetection } = require("../controllers/api.controller");
const { pool } = require("../config/db");

// Exact routes first
router.get("/api/detections/search", searchDetections);
router.get("/api/stats", getStats);
router.get("/api/detections/daily", getDailyCounts);
router.get("/api/cameras", getCameras);

// Test endpoint to create a detection for testing UI updates
router.post("/api/test/detection", async (req, res) => {
  try {
    const plate = req.body.plate || "TEST" + Math.random().toString(36).substring(7).toUpperCase();
    const camera = req.body.camera || "camera1";
    
    const result = await pool.query(
      "INSERT INTO vehicle_detections (camera_name, camera_ip, plate) VALUES ($1, $2, $3) RETURNING id",
      [camera, "127.0.0.1", plate]
    );
    
    const detectionId = result.rows[0].id;
    res.json({ 
      ok: true, 
      message: `Test detection created`, 
      detectionId,
      plate,
      camera,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parameterized routes after
router.get("/api/detections", getDetections);
router.post("/api/detections/:detectionId/image", addImageToDetection);

module.exports = router;
