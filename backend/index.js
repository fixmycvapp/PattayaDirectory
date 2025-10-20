"use strict";

// Core server for Pattaya Directory
// - Serves static frontend from /public
// - Exposes REST API under /api
// - Adds CORS, logging, and robust error handling

const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware: CORS for all routes
app.use(cors());

// Middleware: JSON parsing (future-proofing for POSTs)
app.use(express.json());

// Middleware: HTTP request logging
app.use(morgan("dev"));

// API routes
const eventsRouter = require("./routes/events");
app.use("/api/events", eventsRouter); // GET /api/events

// Serve static files for the frontend
app.use(express.static(path.join(__dirname, "..", "public")));

// Simple health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "pattaya-directory" });
});

// 404 handler for API routes only
app.use("/api", (req, res, next) => {
  res.status(404).json({ error: "API route not found" });
});

// Global error handler
// NOTE: Make sure to pass errors with next(err) in async routes
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err); // Log for diagnostics
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal Server Error",
  });
});

app.listen(PORT, () => {
  console.log(`Pattaya Directory server running on http://localhost:${PORT}`);
});
