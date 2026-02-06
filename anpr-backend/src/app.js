const express = require("express");
const cors = require("cors");

const app = express();
const path = require("path");

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use(require("./routes/health.routes"));
app.use(require("./routes/webhook.routes"));
app.use(require("./routes/api.routes"));   

module.exports = app;
