const app = require("./app");
const { testConnection } = require("./config/db");

const PORT = 5000;

// Check DB connectivity, then start server (log but don't block startup on failure)
testConnection().then((ok) => {
  if (!ok) {
    console.warn("⚠️  Database connectivity check failed. Server will still start, but API routes may error.");
  }

  app.listen(PORT, () => {
    console.log(`🚀 ANPR backend running on port ${PORT}`);
  });
});
