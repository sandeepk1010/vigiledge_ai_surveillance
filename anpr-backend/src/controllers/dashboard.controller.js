const { pool } = require("../config/db");

exports.stats = async (req, res) => {
  try {
    // Get stats based on camera names mapping to IN/OUT types
    // Use local timezone when evaluating "today" so counts align with displayed timestamps
    const q = `
    SELECT
      camera_name,
      COUNT(*)::int AS total,
      SUM(((created_at AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date)::int)::int AS today_count
    FROM vehicle_detections
    GROUP BY camera_name
    ORDER BY camera_name
    `;
    const result = await pool.query(q);
    
    // Map camera names to their types
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.live = async (req, res) => {
  try {
    const q = `
    SELECT
    vehicles.plate_number,
    cameras.name,
    cameras.type,
    events.detected_at
    FROM events
    JOIN vehicles ON vehicles.id=events.vehicle_id
    JOIN cameras ON cameras.id=events.camera_id
    ORDER BY detected_at DESC
    LIMIT 50
    `;
    const r = await pool.query(q);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
