const { pool } = require("../config/db");
const { saveImage } = require("../services/image.service");

/* ====================================
   CAMERA IP MAPPING
==================================== */
const CAMERA_IP_MAP = {
  "192.168.1.108": "camera1",
  "192.168.1.109": "camera2"
};

async function handleWebhook(req, res) {
  try {
    const timestamp = new Date().toISOString();
    console.log("\n" + "=".repeat(70));
    console.log(`📸 WEBHOOK RECEIVED - ${timestamp}`);
    console.log("=".repeat(70));
    console.log("URL:", req.originalUrl);
    console.log("METHOD:", req.method);
    console.log("HEADERS:", JSON.stringify(req.headers, null, 2));
    console.log("BODY:", JSON.stringify(req.body, null, 2));
    console.log("IP ADDRESS:", req.ip || req.connection.remoteAddress);
    console.log("=".repeat(70));

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
       3. SAVE IMAGES
    --------------------------------*/
    // Extract images from webhook payload
    const images = req.body.images || {};
    
    for (const [imageType, base64Data] of Object.entries(images)) {
      if (base64Data) {
        try {
          const filePath = saveImage({
            camera,
            plate,
            type: imageType,
            base64: base64Data
          });

          if (filePath) {
            // Insert image record into database
            await pool.query(
              "INSERT INTO vehicle_images (detection_id, image_type, image_path) VALUES ($1, $2, $3)",
              [detectionId, imageType, filePath]
            );
            console.log(`✅ Saved ${imageType} image: ${filePath}`);
          }
        } catch (imgErr) {
          console.error(`❌ Error saving ${imageType} image:`, imgErr.message);
        }
      }
    }

    /* -------------------------------
       4. CAMERA ID
    --------------------------------*/
    const cam = await pool.query(
      "SELECT id FROM cameras WHERE name=$1",
      [camera]
    );

    const cameraId = cam.rows.length ? cam.rows[0].id : null;

    /* -------------------------------
       5. EVENT INSERT
    --------------------------------*/
    if (cameraId) {
      await pool.query(
        "INSERT INTO events (vehicle_id,camera_id) VALUES ($1,$2)",
        [vehicleId, cameraId]
      );
    }

    res.json({ ok: true, detectionId, imageCount: Object.keys(images).length });
  } catch (err) {
    console.error("🔥 WEBHOOK ERROR FULL:", err);
    res.status(500).json({ error: err.message });
  }
}

/* ============================================
   HANDLE CAMERA-SPECIFIC PAYLOAD FORMAT
   (Hikvision, Dahua, etc.)
============================================ */
async function handleCameraPayload(req, res) {
  try {
    const timestamp = new Date().toISOString();
    console.log("\n" + "=".repeat(70));
    console.log(`📸 CAMERA PAYLOAD RECEIVED - ${timestamp}`);
    console.log("=".repeat(70));
    console.log("URL:", req.originalUrl);
    console.log("BODY:", JSON.stringify(req.body, null, 2));
    console.log("=".repeat(70));

    // Extract plate from Picture.Plate.PlateNumber format
    const plate =
      req.body?.Picture?.Plate?.PlateNumber ||
      req.body?.plateNumber ||
      req.body?.plate ||
      "UNKNOWN";

    console.log("🚗 PLATE:", plate);

    const cameraIp =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      req.ip ||
      "";

    console.log("📡 Camera IP:", cameraIp);

    // Detect which camera is sending data
    let camera = "camera1";
    
    // 1. Check IP address mapping (PRIMARY METHOD)
    if (CAMERA_IP_MAP[cameraIp]) {
      camera = CAMERA_IP_MAP[cameraIp];
      console.log("✅ Camera detected by IP:", camera);
    }
    // 2. Check URL endpoint (FALLBACK METHOD)
    else if (req.cameraNumber === 2 || req.originalUrl.includes("TollgateInfo1")) {
      camera = "camera2";
      console.log("✅ Camera detected by URL:", camera);
    }
    // 3. Check DeviceID in payload (FALLBACK METHOD)
    else if (req.originalUrl.includes("VehicleList")) {
      camera = req.body?.DeviceID?.includes("2") ? "camera2" : "camera1";
      console.log("✅ Camera detected by DeviceID:", camera);
    }
    
    console.log("🎥 Final Camera:", camera);

    /* ---- 1. VEHICLE UPSERT ---- */
    const v = await pool.query(
      "INSERT INTO vehicles (plate) VALUES ($1) ON CONFLICT (plate) DO UPDATE SET plate=EXCLUDED.plate RETURNING id",
      [plate]
    );
    const vehicleId = v.rows[0].id;

    /* ---- 2. DETECTION INSERT ---- */
    const det = await pool.query(
      "INSERT INTO vehicle_detections (camera_name,camera_ip,plate) VALUES ($1,$2,$3) RETURNING id",
      [camera, cameraIp, plate]
    );
    const detectionId = det.rows[0].id;
    console.log("🆔 detectionId:", detectionId);

    /* ---- 3. SAVE IMAGES ---- */
    let imageCount = 0;
    const pictureData = req.body?.Picture || {};

    // Handle Hikvision format: CutoutPic (plate crop) and NormalPic (full frame)
    const imageMappings = {
      CutoutPic: "plate",    // License plate crop
      NormalPic: "full",     // Full vehicle image
      ContextPic: "context"  // Context image
    };

    for (const [sourceKey, imageType] of Object.entries(imageMappings)) {
      const imageData = pictureData[sourceKey];

      if (imageData) {
        try {
          // Handle base64 or Content field
          let base64String = imageData;
          if (typeof imageData === "object" && imageData.Content) {
            base64String = imageData.Content;
          }

          if (base64String) {
            const filePath = saveImage({
              camera,
              plate,
              type: imageType,
              base64: base64String
            });

            if (filePath) {
              await pool.query(
                "INSERT INTO vehicle_images (detection_id, image_type, image_path) VALUES ($1, $2, $3)",
                [detectionId, imageType, filePath]
              );
              console.log(`✅ Saved ${imageType} image: ${filePath}`);
              imageCount++;
            }
          }
        } catch (imgErr) {
          console.error(`❌ Error saving ${imageType} image:`, imgErr.message);
        }
      }
    }

    /* ---- 4. CAMERA ID ---- */
    const cam = await pool.query(
      "SELECT id FROM cameras WHERE name=$1",
      [camera]
    );
    const cameraId = cam.rows.length ? cam.rows[0].id : null;

    /* ---- 5. EVENT INSERT ---- */
    if (cameraId) {
      await pool.query(
        "INSERT INTO events (vehicle_id,camera_id) VALUES ($1,$2)",
        [vehicleId, cameraId]
      );
    }

    res.json({ ok: true, detectionId, imageCount });
  } catch (err) {
    console.error("🔥 CAMERA PAYLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { handleWebhook, handleCameraPayload };
