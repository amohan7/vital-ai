// Local development server — mirrors Vercel's routing
// Run with: node dev-server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Mount API routes
app.post("/analyze", require("./api/analyze"));
app.get("/health",   require("./api/health"));

// Fallback to dashboard
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  vital.ai running at http://localhost:${PORT}\n`);
});
