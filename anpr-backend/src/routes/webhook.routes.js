const express = require("express");
const router = express.Router();
const { handleWebhook } = require("../controllers/webhook.controller");

// Camera 1
router.post("/webhook", handleWebhook);

// Camera 2
router.post("/webhooks", handleWebhook);

module.exports = router;
