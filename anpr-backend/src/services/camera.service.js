const { pool } = require("../config/db");

async function getAllCameras() {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        ip
      FROM cameras
      ORDER BY name
    `);
    return result.rows;
  } catch (error) {
    console.error("Error fetching cameras:", error);
    throw error;
  }
}

async function getCameraById(id) {
  try {
    const result = await pool.query(
      "SELECT * FROM cameras WHERE id = $1",
      [id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching camera by ID:", error);
    throw error;
  }
}

async function getCameraByName(name) {
  try {
    const result = await pool.query(
      "SELECT * FROM cameras WHERE name = $1",
      [name]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching camera by name:", error);
    throw error;
  }
}

module.exports = {
  getAllCameras,
  getCameraById,
  getCameraByName
};
