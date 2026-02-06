const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../../logs");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

function getLogFile(camera) {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `${camera}_${date}.log`);
}

function log(camera, message) {
  const file = getLogFile(camera);
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(file, line);
  console.log(message);
}

module.exports = { log };
