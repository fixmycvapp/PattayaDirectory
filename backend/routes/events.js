"use strict";

// Events API router
// GET /api/events supports filtering, sorting and pagination
// Query params:
// - page (default 1)
// - limit (default 4)
// - date (YYYY-MM-DD) exact match filter
// - time (HH:MM) exact match filter
// - type (string) exact match filter
// - place (string) exact match filter
// - popularity (number) exact match filter
// - popularityMin (number) minimum popularity filter
// - sortBy: one of dateTime|date|time|popularity|name|place|type (default: dateTime)
// - order: asc|desc (default: desc)

const express = require("express");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Load data from JSON file. In a real app, swap with DB calls.
const dataFile = path.join(__dirname, "..", "data", "events.json");

function loadEvents() {
  try {
    const raw = fs.readFileSync(dataFile, "utf8");
    const json = JSON.parse(raw);
    return Array.isArray(json) ? json : [];
  } catch (e) {
    console.error("Failed to load events.json", e);
    return [];
  }
}

function toDateTime(event) {
  // Combine date and time (assumed local) for sorting
  const t = event.time && event.time.length > 0 ? event.time : "00:00";
  // Ensure seconds included so Date parser is consistent
  return new Date(`${event.date}T${t}:00`);
}

router.get("/", (req, res) => {
  const {
    page = "1",
    limit = "4",
    date,
    time,
    type,
    place,
    popularity,
    popularityMin,
    sortBy = "dateTime",
    order = "desc",
  } = req.query;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 4, 1), 100);

  let events = loadEvents();

  // Filter
  events = events.filter((ev) => {
    if (date && ev.date !== date) return false;
    if (time && ev.time !== time) return false;
    if (type && ev.type && ev.type.toLowerCase() !== String(type).toLowerCase()) return false;
    if (place && ev.place && ev.place.toLowerCase() !== String(place).toLowerCase()) return false;
    if (popularity && Number(ev.popularity) !== Number(popularity)) return false;
    if (popularityMin && Number(ev.popularity) < Number(popularityMin)) return false;
    return true;
  });

  // Sort
  const dir = String(order).toLowerCase() === "asc" ? 1 : -1;
  const sb = String(sortBy).toLowerCase();

  events.sort((a, b) => {
    const aDT = toDateTime(a).getTime();
    const bDT = toDateTime(b).getTime();
    switch (sb) {
      case "datetime":
      case "date":
      case "time":
        return (aDT - bDT) * dir;
      case "popularity":
        return (Number(a.popularity) - Number(b.popularity)) * dir;
      case "name":
        return a.name.localeCompare(b.name) * dir;
      case "place":
        return (a.place || "").localeCompare(b.place || "") * dir;
      case "type":
        return (a.type || "").localeCompare(b.type || "") * dir;
      default:
        return (aDT - bDT) * dir; // default to date/time
    }
  });

  const total = events.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const offset = (pageNum - 1) * pageSize;
  const paged = events.slice(offset, offset + pageSize);

  res.json({
    page: pageNum,
    limit: pageSize,
    total,
    totalPages,
    data: paged,
  });
});

module.exports = router;
