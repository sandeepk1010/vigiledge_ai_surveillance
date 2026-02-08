const { pool } = require("../config/db");

exports.stats = async (req, res) => {
  try {
    const q = `
    SELECT
    COUNT(*) FILTER (WHERE cameras.type='IN') AS total_in,
    COUNT(*) FILTER (WHERE cameras.type='OUT') AS total_out
    FROM events
    JOIN cameras ON cameras.id=events.camera_id
    WHERE DATE(detected_at)=CURRENT_DATE
    `;
    const r = await pool.query(q);
    res.json(r.rows[0]);
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
