const express = require("express");
const router = express.Router();

router.all("/health", (req, res) => {
  res.json({ status: "ok", camera: "camera1" });
});

router.all("/healths", (req, res) => {
  res.json({ status: "ok", camera: "camera2" });
});

module.exports = router;
