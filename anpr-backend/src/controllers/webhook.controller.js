const { pool } = require("../config/db");
const { saveImage } = require("../services/image.service");

async function handleWebhook(req, res) {
  try {
    const cameraIp = req.ip.replace("::ffff:", "");

    const camera =
      req.path === "/webhook" ? "camera1" :
      req.path === "/webhooks" ? "camera2" :
      "unknown";

    const data = req.body || {};
    const picture = data.Picture || {};
    const plate = picture.Plate?.PlateNumber || "UNKNOWN";

    // 1️⃣ insert detection
    const det = await pool.query(
      `INSERT INTO vehicle_detections (camera_name,camera_ip,plate)
       VALUES ($1,$2,$3) RETURNING id`,
      [camera, cameraIp, plate]
    );

    const detectionId = det.rows[0].id;

    // 2️⃣ save images
    const images = [
      { type: "plate", content: picture.CutoutPic?.Content },
      { type: "vehicle", content: picture.VehiclePic?.Content }
    ];

    for (const img of images) {
      if (!img.content) continue;

      const imagePath = saveImage({
        camera,
        plate,
        type: img.type,
        base64: img.content
      });

      if (imagePath) {
        await pool.query(
          `INSERT INTO vehicle_images (detection_id,image_type,image_path)
           VALUES ($1,$2,$3)`,
          [detectionId, img.type, imagePath]
        );
      }
    }

    // 3️⃣ VEHICLE UPSERT
    const v = await pool.query(
      `INSERT INTO vehicles (plate_number)
       VALUES ($1)
       ON CONFLICT (plate_number)
       DO UPDATE SET plate_number=EXCLUDED.plate_number
       RETURNING id`,
      [plate]
    );

    const vehicleId = v.rows[0].id;

    // 4️⃣ CAMERA ID
    const cam = await pool.query(
      `SELECT id FROM cameras WHERE name=$1`,
      [camera]
    );

    const cameraId = cam.rows[0].id;

    // 5️⃣ EVENT INSERT
    await pool.query(
      `INSERT INTO events (vehicle_id,camera_id)
       VALUES ($1,$2)`,
      [vehicleId, cameraId]
    );

    res.json({
      status: "ok",
      plate,
      camera,
      detectionId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Webhook error" });
  }
}

module.exports = { handleWebhook };
