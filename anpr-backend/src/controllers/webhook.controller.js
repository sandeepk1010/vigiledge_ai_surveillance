const { pool } = require("../config/db");
const { saveImage } = require("../services/image.service");
const { log, recordDetection } = require("../utils/logger");

async function handleWebhook(req, res) {
  try {
    const cameraIp = req.ip.replace("::ffff:", "");

    const camera =
      req.path === "/webhook" ? "camera1" :
      req.path === "/webhooks" ? "camera2" :
      "unknown";

    log(camera, `📸 Webhook received from ${cameraIp}`);

    const data = req.body || {};
    const picture = data.Picture || {};
    const plate = picture.Plate?.PlateNumber || "UNKNOWN";

    // 1️⃣ Insert detection
    const result = await pool.query(
      `INSERT INTO vehicle_detections (camera_name, camera_ip, plate)
       VALUES ($1, $2, $3) RETURNING id`,
      [camera, cameraIp, plate]
    );

    const detectionId = result.rows[0].id;

    // 2️⃣ Save images
    const images = [
      { type: "plate", content: picture.CutoutPic?.Content },
      {
        type: "vehicle",
        content:
          picture.VehiclePic?.Content ||
          picture.NormalPic?.Content
      }
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
          `INSERT INTO vehicle_images
           (detection_id, image_type, image_path)
           VALUES ($1, $2, $3)`,
          [detectionId, img.type, imagePath]
        );
      }
    }

    // record detection: logs and increments per-camera daily count
    recordDetection(camera, `${plate} (ID ${detectionId})`);

    res.json({
      status: "success",
      camera,
      plate,
      detection_id: detectionId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

module.exports = { handleWebhook };
