const express = require("express");
const cors = require("cors");

const app = express();
const path = require("path");

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use(express.static(path.join(__dirname, "..", "public")));

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use(require("./routes/health.routes"));
app.use(require("./routes/webhook.routes"));
app.use(require("./routes/api.routes"));   
app.use(require("./routes/dashboard.routes"));

/* ====================================
   CAMERA 1 ENDPOINTS
==================================== */
app.post("/webhook", require("./controllers/webhook.controller").handleWebhook);  // Generic webhook
app.post("/NotificationInfo/TollgateInfo", require("./controllers/webhook.controller").handleCameraPayload);  // Camera 1 (Hikvision/Dahua)

/* ====================================
   CAMERA 2 ENDPOINTS
==================================== */
app.post("/webhooks", require("./controllers/webhook.controller").handleWebhook);  // Generic webhook
app.post("/NotificationInfo/TollgateInfo1", (req, res) => {
  // Route to camera 2 handler
  req.cameraNumber = 2;
  require("./controllers/webhook.controller").handleCameraPayload(req, res);
});

/* ====================================
   VEHICLE LIST (Both Cameras)
==================================== */
app.post("/NotificationInfo/VehicleList", require("./controllers/webhook.controller").handleCameraPayload);  // Can come from either camera

module.exports = app;
