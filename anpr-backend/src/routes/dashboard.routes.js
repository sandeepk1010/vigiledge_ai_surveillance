const express = require("express");
const router = express.Router();
const { stats, live } = require("../controllers/dashboard.controller");

router.get("/api/dashboard/stats", stats);
router.get("/api/dashboard/live", live);

module.exports = router;
