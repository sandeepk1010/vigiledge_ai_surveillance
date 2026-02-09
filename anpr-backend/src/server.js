const app = require("./app");
const { pool } = require("./config/db");

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

/* START */
async function startServer() {
  try {
    // Test database connection
    await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL connected");

    app.listen(PORT, HOST, () => {
      console.log(`🚀 Backend running http://192.168.1.120:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
}

startServer();
