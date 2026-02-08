const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let detections = [];


// =========================
// ENTRY CAMERA WEBHOOK
// =========================
app.post("/webhook", (req, res) => {
  const data = {
    plate: req.body.plate || "UNKNOWN",
    camera: "ENTRY",
    time: new Date()
  };

  detections.push(data);
  console.log("ENTRY:", data);

  res.json({ success: true });
});


// =========================
// EXIT CAMERA WEBHOOK
// =========================
app.post("/webhooks", (req, res) => {
  const data = {
    plate: req.body.plate || "UNKNOWN",
    camera: "EXIT",
    time: new Date()
  };

  detections.push(data);
  console.log("EXIT:", data);

  res.json({ success: true });
});


// =========================
// LIVE DATA (last 10)
// =========================
app.get("/api/live", (req, res) => {
  res.json(detections.slice(-10).reverse());
});


// =========================
// ALL DETECTIONS
// =========================
app.get("/api/detections", (req, res) => {
  res.json(detections);
});


// =========================
// DASHBOARD STATS
// =========================
app.get("/api/dashboard", (req, res) => {
  const total_in = detections.filter(d => d.camera === "ENTRY").length;
  const total_out = detections.filter(d => d.camera === "EXIT").length;

  res.json({
    total_in,
    total_out
  });
});


// =========================
// DAILY GRAPH DATA
// =========================
app.get("/api/daily", (req, res) => {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const result = days.map(day => ({
    day,
    count: Math.floor(Math.random() * 10)
  }));

  res.json(result);
});


// =========================
app.listen(5000, () => {
  console.log("SERVER RUNNING ON http://localhost:5000");
});
