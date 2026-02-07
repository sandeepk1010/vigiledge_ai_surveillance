const express = require("express");
const router = express.Router();
const { getDetections, getStats } = require("../controllers/api.controller");

router.get("/api/detections", getDetections);
router.get("/api/stats", getStats);

module.exports = router;
