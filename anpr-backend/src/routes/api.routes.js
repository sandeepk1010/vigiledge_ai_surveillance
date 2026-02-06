const express = require("express");
const router = express.Router();
const { getDetections } = require("../controllers/api.controller");

router.get("/api/detections", getDetections);

module.exports = router;
