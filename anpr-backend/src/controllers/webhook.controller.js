const { pool } = require("../config/db");

async function handleWebhook(req, res) {
  try {
    console.log("\n📸 CAMERA WEBHOOK HIT");
    console.log("URL:", req.originalUrl);
    console.log("BODY:", JSON.stringify(req.body));

    const camera =
      req.originalUrl.includes("webhooks") ? "camera2" : "camera1";

    const plate =
      req.body.plateNumber ||
      req.body.plate ||
      req.body?.Picture?.Plate?.PlateNumber ||
      "UNKNOWN";

    console.log("🚗 PLATE:", plate);

    const cameraIp =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      req.ip ||
      "";

    /* -------------------------------
       1. VEHICLE UPSERT
    --------------------------------*/
    const v = await pool.query(
      "INSERT INTO vehicles (plate) VALUES ($1) ON CONFLICT (plate) DO UPDATE SET plate=EXCLUDED.plate RETURNING id",
      [plate]
    );

    const vehicleId = v.rows[0].id;

    /* -------------------------------
       2. DETECTION INSERT
    --------------------------------*/
    const det = await pool.query(
      "INSERT INTO vehicle_detections (camera_name,camera_ip,plate) VALUES ($1,$2,$3) RETURNING id",
      [camera, cameraIp, plate]
    );

    const detectionId = det.rows[0].id;
    console.log("🆔 detectionId:", detectionId);

    /* -------------------------------
       3. CAMERA ID
    --------------------------------*/
    const cam = await pool.query(
      "SELECT id FROM cameras WHERE name=$1",
      [camera]
    );

    const cameraId = cam.rows.length ? cam.rows[0].id : null;

    /* -------------------------------
       4. EVENT INSERT
    --------------------------------*/
    if (cameraId) {
      await pool.query(
        "INSERT INTO events (vehicle_id,camera_id) VALUES ($1,$2)",
        [vehicleId, cameraId]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("🔥 WEBHOOK ERROR FULL:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { handleWebhook };
