const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

/* CORS */
app.use(cors());

/* BODY */
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

/* IMAGE FOLDER */
const imgDir = path.join(__dirname, "images");
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir);

/* ROUTES */
const webhookRoutes = require("./routes/webhook.routes");
const detectionsRoute = require("./routes/detections");

app.use("/", webhookRoutes);
app.use("/api/detections", detectionsRoute);

/* STATIC */
app.use("/images", express.static(path.join(__dirname, "images")));

/* HEALTH */
app.get("/health", (req, res) => res.json({ ok: true }));

/* START */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running http://192.168.1.120:${PORT}`);
});
