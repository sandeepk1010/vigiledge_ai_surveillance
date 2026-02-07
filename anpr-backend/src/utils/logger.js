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

function getCountsFile() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `counts_${date}.json`);
}

function readCounts() {
  const file = getCountsFile();
  try {
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, "utf8");
      return JSON.parse(raw || "{}");
    }
  } catch (e) {
    console.error("Failed reading counts file", e.message || e);
  }
  return {};
}

function writeCounts(counts) {
  const file = getCountsFile();
  try {
    fs.writeFileSync(file, JSON.stringify(counts, null, 2));
  } catch (e) {
    console.error("Failed writing counts file", e.message || e);
  }
}

function recordDetection(camera, message) {
  // append standard log
  const msg = `✅ Saved detection ${message}`;
  log(camera, msg);

  // increment per-camera count in daily counts file
  const counts = readCounts();
  counts[camera] = (counts[camera] || 0) + 1;
  writeCounts(counts);

  // also output the count to console and append to camera log
  const countLine = `[${new Date().toISOString()}] COUNT ${camera}=${counts[camera]}\n`;
  fs.appendFileSync(getLogFile(camera), countLine);
  console.log(`COUNT ${camera}=${counts[camera]}`);
  return counts[camera];
}

module.exports = { log, recordDetection };
