"use strict";

// Main Express server for Pattaya Directory
// - Serves API under /api
// - Serves static frontend from /public
// - Enables CORS and includes basic error handling

const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow cross-origin requests for local dev and flexibility
app.use(express.json()); // Parse JSON request bodies

// API routes
const eventsRouter = require("./routes/events");
app.use("/api/events", eventsRouter);

// Simple health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "PattayaDirectory API", time: new Date().toISOString() });
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, "..", "public")));

// Fallback: serve index.html for root and unknown routes on the client
app.get(["/", "/*"], (req, res, next) => {
  // Only serve index.html for non-API routes
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// 404 handler for API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }
  return next();
});

// Centralized error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Server error:", err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Pattaya Directory server running at http://localhost:${PORT}`);
});
