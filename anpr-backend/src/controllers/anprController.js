const db = require("../config/db");
const fs = require("fs");
const path = require("path");

exports.receive = async (req, res) => {
  try {
    const { plate, color, image, camera_id } = req.body;

    // save image
    const fileName = Date.now() + ".jpg";
    const filePath = path.join("uploads", fileName);
    fs.writeFileSync(filePath, Buffer.from(image, "base64"));

    // vehicle insert
    await db.query(
      "INSERT INTO vehicles (plate_number,color) VALUES ($1,$2) ON CONFLICT (plate_number) DO NOTHING",
      [plate, color]
    );

    // event insert
    await db.query(
      "INSERT INTO events (vehicle_id,camera_id,image_url) VALUES ((SELECT id FROM vehicles WHERE plate_number=$1),$2,$3)",
      [plate, camera_id, "/" + filePath]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
};
