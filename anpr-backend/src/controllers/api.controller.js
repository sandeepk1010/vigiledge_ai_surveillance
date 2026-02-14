const { pool } = require("../config/db");
const fs = require("fs");
const path = require("path");

async function getDetections(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const camera = req.query.camera;
    const plate = req.query.plate;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // First, get the paginated detection IDs
    let getIdsQuery = `
      SELECT DISTINCT d.id
      FROM vehicle_detections d
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (camera) {
      getIdsQuery += ` AND d.camera_name = $${paramIndex}`;
      params.push(camera);
      paramIndex++;
    }

    if (plate) {
      getIdsQuery += ` AND d.plate ILIKE $${paramIndex}`;
      params.push(`%${plate}%`);
      paramIndex++;
    }

    if (startDate) {
      getIdsQuery += ` AND d.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      getIdsQuery += ` AND d.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    getIdsQuery += ` ORDER BY d.id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const idParams = [...params, limit, offset];

    const idsResult = await pool.query(getIdsQuery, idParams);
    const detectionIds = idsResult.rows.map(r => r.id);

    if (detectionIds.length === 0) {
      return res.json({
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      });
    }

    // Now get all data for those detection IDs
    const placeholders = detectionIds.map((_, i) => `$${i + 1}`).join(',');
    const dataQuery = `
      SELECT
        d.id,
        d.camera_name,
        d.plate,
        d.created_at,
        i.image_type,
        i.image_path
      FROM vehicle_detections d
      LEFT JOIN vehicle_images i
        ON d.id = i.detection_id
      WHERE d.id IN (${placeholders})
      ORDER BY d.id DESC
    `;

    const result = await pool.query(dataQuery, detectionIds);

    const detections = {};

    for (const row of result.rows) {
      if (!detections[row.id]) {
        detections[row.id] = {
          id: row.id,
          camera: row.camera_name,
          plate: row.plate,
          detected_at: row.created_at,
          images: {}
        };
      }

      if (row.image_type && row.image_path) {
        detections[row.id].images[row.image_type] =
          "/" + row.image_path.replace(/\\/g, "/");
      }
    }

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM vehicle_detections d WHERE 1=1";
    const countParams = [];
    let countParamIndex = 1;

    if (camera) {
      countQuery += ` AND d.camera_name = $${countParamIndex}`;
      countParams.push(camera);
      countParamIndex++;
    }
    if (plate) {
      countQuery += ` AND d.plate ILIKE $${countParamIndex}`;
      countParams.push(`%${plate}%`);
      countParamIndex++;
    }
    if (startDate) {
      countQuery += ` AND d.created_at >= $${countParamIndex}`;
      countParams.push(startDate);
      countParamIndex++;
    }
    if (endDate) {
      countQuery += ` AND d.created_at <= $${countParamIndex}`;
      countParams.push(endDate);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    const sortedDetections = detectionIds
      .map(id => detections[id])
      .filter(d => d);

    res.json({
      data: sortedDetections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("API DETECTIONS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}

async function getStats(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        camera_name,
        COUNT(*)::int AS total,
        SUM((created_at::date = CURRENT_DATE)::int)::int AS today_count
      FROM vehicle_detections
      GROUP BY camera_name
      ORDER BY camera_name
    `);

    // Map camera names to their types (camera1=IN, camera2=OUT)
    const stats = {
      total_in: 0,
      total_out: 0,
      today_in: 0,
      today_out: 0,
      cameras: {}
    };
    
    for (const row of result.rows) {
      if (row.camera_name === 'camera1') {
        stats.total_in = row.total;
        stats.today_in = row.today_count;
        stats.cameras.camera1 = { type: 'IN', ...row };
      } else if (row.camera_name === 'camera2') {
        stats.total_out = row.total;
        stats.today_out = row.today_count;
        stats.cameras.camera2 = { type: 'OUT', ...row };
      }
    }

    res.json(stats);
  } catch (err) {
    console.error("API STATS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}

async function getDailyCounts(req, res) {
  try {
    const days = Math.max(1, Math.min(parseInt(req.query.days, 10) || 7, 30));
    const camera = req.query.camera || null;

    const params = [days - 1];
    let filter = "";
    if (camera) {
      filter = " AND d.camera_name = $2";
      params.push(camera);
    }

    // Convert timestamps to local timezone before casting to date so counts match local day
    const result = await pool.query(
      `
        SELECT
          to_char((d.created_at AT TIME ZONE 'Asia/Kolkata')::date, 'YYYY-MM-DD') AS day,
          COALESCE(d.camera_name, 'unknown') AS camera,
          COUNT(*)::int AS total
        FROM vehicle_detections d
        WHERE (d.created_at AT TIME ZONE 'Asia/Kolkata')::date >= (now() AT TIME ZONE 'Asia/Kolkata')::date - ($1::int * INTERVAL '1 day')
        ${filter}
        GROUP BY day, camera
        ORDER BY day DESC, camera ASC
      `,
      params
    );

    res.json({ days, data: result.rows });
  } catch (err) {
    console.error("API DAILY COUNTS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}

async function getCameras(req, res) {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        ip
      FROM cameras
      ORDER BY name
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error("API CAMERAS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}

async function searchDetections(req, res) {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }

    const result = await pool.query(`
      SELECT
        d.id,
        d.camera_name,
        d.plate,
        d.created_at,
        i.image_type,
        i.image_path
      FROM vehicle_detections d
      LEFT JOIN vehicle_images i
        ON d.id = i.detection_id
      WHERE d.plate ILIKE $1 OR d.camera_name ILIKE $1
      ORDER BY d.created_at DESC
      LIMIT 100
    `, [`%${q}%`]);

    const detections = {};

    for (const row of result.rows) {
      if (!detections[row.id]) {
        detections[row.id] = {
          id: row.id,
          camera: row.camera_name,
          plate: row.plate,
          detected_at: row.created_at,
          images: {}
        };
      }

      if (row.image_type && row.image_path) {
        detections[row.id].images[row.image_type] =
          "/" + row.image_path.replace(/\\/g, "/");
      }
    }

    res.json(Object.values(detections));
  } catch (err) {
    console.error("API SEARCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}

async function addImageToDetection(req, res) {
  try {
    const { detectionId } = req.params;
    const { imageType, base64Data } = req.body;
    const { saveImage } = require("../services/image.service");

    if (!detectionId || !imageType || !base64Data) {
      return res.status(400).json({ error: "Missing detectionId, imageType, or base64Data" });
    }

    // Get detection details
    const detResult = await pool.query(
      "SELECT camera_name, plate FROM vehicle_detections WHERE id = $1",
      [detectionId]
    );

    if (detResult.rows.length === 0) {
      return res.status(404).json({ error: "Detection not found" });
    }

    const { camera_name, plate } = detResult.rows[0];

    // Save image to file system
    const filePath = saveImage({
      camera: camera_name,
      plate,
      type: imageType,
      base64: base64Data
    });

    if (!filePath) {
      return res.status(400).json({ error: "Failed to save image" });
    }

    // Insert into database
    await pool.query(
      "INSERT INTO vehicle_images (detection_id, image_type, image_path) VALUES ($1, $2, $3)",
      [detectionId, imageType, filePath]
    );

    res.json({ ok: true, filePath, message: `Image saved: ${filePath}` });
  } catch (err) {
    console.error("API ADD IMAGE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getDetections,
  getStats,
  getDailyCounts,
  getCameras,
  searchDetections,
  addImageToDetection,
  fetchImage: fetchImage,
  getRawWebhooks
};

// Attempt to fetch a missing image for a detection from configured camera hosts
async function fetchImage(req, res) {
  try {
    const { detectionId, filename, imageType } = req.body;
    if (!detectionId || !filename) {
      return res.status(400).json({ error: 'Missing detectionId or filename' });
    }

    const detResult = await pool.query(
      "SELECT camera_name, camera_ip, plate, created_at FROM vehicle_detections WHERE id = $1",
      [detectionId]
    );

    if (detResult.rows.length === 0) {
      return res.status(404).json({ error: 'Detection not found' });
    }

    const det = detResult.rows[0];
    const camera = det.camera_name;
    const cameraIp = det.camera_ip;
    const plate = det.plate || 'UNKNOWN';
    const dateStr = det.created_at ? new Date(det.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const hostsRaw = process.env.CAMERA_IMAGE_HOSTS || null;
    let hosts = {};
    if (hostsRaw) {
      try { hosts = JSON.parse(hostsRaw); } catch (e) { console.warn('Invalid CAMERA_IMAGE_HOSTS JSON'); }
    }

    const cameraHost = hosts[camera] || hosts[cameraIp] || null;
    const candidates = [];
    if (cameraHost) {
      candidates.push(`${cameraHost}/${filename}`);
      candidates.push(`${cameraHost}/${dateStr}/${plate}/${filename}`);
      candidates.push(`${cameraHost}/uploads/${camera}/${dateStr}/${plate}/${filename}`);
    }
    if (cameraIp) {
      const ipOnly = cameraIp.split(':')[0];
      candidates.push(`http://${ipOnly}/${filename}`);
      candidates.push(`http://${ipOnly}/uploads/${dateStr}/${plate}/${filename}`);
    }

    const { saveImageBuffer } = require("../services/image.service");

    for (const url of candidates) {
      try {
        console.log('🔎 fetch candidate', url);
        const resp = await fetch(url);
        if (resp && resp.ok) {
          const ct = resp.headers.get('content-type') || '';
          if (ct.startsWith('image/')) {
            const ab = await resp.arrayBuffer();
            const buf = Buffer.from(ab);
            const savedPath = saveImageBuffer({ camera, plate, filename, buffer: buf, date: dateStr });
            await pool.query(
              "INSERT INTO vehicle_images (detection_id, image_type, image_path) VALUES ($1, $2, $3)",
              [detectionId, imageType || 'fetched', savedPath]
            );
            return res.json({ ok: true, url, savedPath });
          }
        }
      } catch (e) {
        console.log('fetch failed', e.message);
      }
    }

    res.status(404).json({ error: 'No image found at candidate URLs', candidates });
  } catch (err) {
    console.error('FETCH IMAGE ERROR:', err);
    res.status(500).json({ error: err.message });
  }
}

// Returns recent raw webhook payloads saved under uploads
async function getRawWebhooks(req, res) {
  try {
    const uploadsRoot = path.join(process.cwd(), "uploads");
    const limit = Math.min(100, parseInt(req.query.limit || "50", 10));
    const files = [];

    async function walk(dir) {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const ent of entries) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          await walk(p);
        } else if (ent.isFile() && ent.name.startsWith("payload-") && ent.name.endsWith(".json")) {
          files.push(p);
        }
      }
    }

    if (fs.existsSync(uploadsRoot)) {
      await walk(uploadsRoot);
    }

    // Sort by mtime desc and limit
    const filesWithStat = await Promise.all(files.map(async (f) => {
      const s = await fs.promises.stat(f);
      return { path: f, mtime: s.mtime.getTime() };
    }));

    filesWithStat.sort((a, b) => b.mtime - a.mtime);
    const selected = filesWithStat.slice(0, limit);

    const payloads = [];
    for (const f of selected) {
      try {
        const raw = await fs.promises.readFile(f.path, "utf8");
        const parsed = JSON.parse(raw);

        // derive camera/plate/date from path
        const parts = f.path.split(path.sep);
        // expected uploads/<camera>/<date>/<plate>/payload-...json
        const idx = parts.indexOf("uploads");
        const camera = parts[idx + 1] || null;
        const date = parts[idx + 2] || null;
        const plate = parts[idx + 3] || null;

        payloads.push({
          file: f.path.replace(process.cwd() + path.sep, ""),
          camera,
          date,
          plate,
          payload: parsed,
          timestamp: f.mtime
        });
      } catch (e) {
        console.error("Failed to read payload file", f.path, e.message);
      }
    }

    res.json({ ok: true, data: payloads });
  } catch (err) {
    console.error("GET RAW WEBHOOKS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
