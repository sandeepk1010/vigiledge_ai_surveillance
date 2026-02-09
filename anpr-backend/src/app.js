const express = require("express");
const cors = require("cors");

const app = express();
const path = require("path");

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use(require("./routes/health.routes"));
app.use(require("./routes/webhook.routes"));
app.use(require("./routes/api.routes"));   
app.use(require("./routes/dashboard.routes"));

module.exports = app;
