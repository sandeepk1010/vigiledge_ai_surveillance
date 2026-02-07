require("dotenv").config();
const { Pool } = require("pg");

const missing = [];
const DB_USER = process.env.DB_USER;
const DB_HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;

if (!DB_USER) missing.push("DB_USER");
if (!DB_HOST) missing.push("DB_HOST");
if (!DB_NAME) missing.push("DB_NAME");
if (!DB_PASSWORD) missing.push("DB_PASSWORD");

if (missing.length) {
  console.warn(
    `⚠️  Missing DB env vars: ${missing.join(", ")}. Check anpr-backend/.env or your environment.`
  );
}

// Allow a single DATABASE_URL env var (e.g. postgres://user:pass@host:5432/db)
const connectionString = process.env.DATABASE_URL;

const poolConfig = connectionString
  ? { connectionString }
  : {
      user: DB_USER,
      host: DB_HOST,
      database: DB_NAME,
      password: DB_PASSWORD,
      port: DB_PORT,
    };

if (connectionString) {
  console.log("Using DATABASE_URL for Postgres connection");
}

const pool = new Pool(poolConfig);

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL error", err);
});

async function testConnection() {
  try {
    const res = await pool.query("SELECT 1 AS ok");
    if (res && res.rows && res.rows[0] && res.rows[0].ok === 1) {
      console.log("✅ PostgreSQL connectivity test passed");
      return true;
    }
  } catch (err) {
    console.error("❌ PostgreSQL connectivity test failed:", err.message || err);
  }
  return false;
}

module.exports = { pool, testConnection };
