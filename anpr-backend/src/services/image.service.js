const fs = require("fs");
const path = require("path");

function decodeBase64Image(base64String) {
  if (!base64String) return null;

  if (base64String.includes(",")) {
    base64String = base64String.split(",")[1];
  }

  return Buffer.from(base64String, "base64");
}

function saveImage({ camera, plate, type, base64 }) {
  const date = new Date().toISOString().split("T")[0];
  const dir = path.join(
    "uploads",
    camera,
    date,
    plate || "UNKNOWN"
  );

  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${type}.jpg`);
  const buffer = decodeBase64Image(base64);

  if (!buffer) return null;

  fs.writeFileSync(filePath, buffer);
  return filePath;
}

module.exports = { saveImage };
