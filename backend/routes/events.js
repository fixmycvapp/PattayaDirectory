"use strict";

// Events API router
// GET /api/events
// - Filters: q (search), type, place, dateFrom, dateTo, timeFrom, timeTo, popularityMin, popularityMax
// - Sorting: sortBy (date|time|type|place|popularity|title), sortOrder (asc|desc)
// - Pagination: page (1-based), limit
// Returns: { page, limit, total, totalPages, sortBy, sortOrder, filtersUsed, data: [...] }

const fs = require("fs/promises");
const path = require("path");
const express = require("express");

const router = express.Router();
const DATA_FILE = path.join(__dirname, "..", "data", "events.json");

// Utility: parse HH:mm into minutes from midnight
function parseTimeToMinutes(str) {
  if (!str) return null;
  const [hh, mm] = str.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

// Utility: safe string compare (case-insensitive)
function normalize(str) {
  return String(str || "").trim().toLowerCase();
}

// Utility: unified date-time sort key (Date object)
function toDateTime(event) {
  // Expecting date as YYYY-MM-DD and time as HH:mm
  const dateStr = event.date || "1970-01-01";
  const timeStr = event.time || "00:00";
  const iso = `${dateStr}T${timeStr}:00`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date("1970-01-01T00:00:00") : d;
}

// Main GET handler
router.get("/", async (req, res, next) => {
  try {
    const {
      q,
      type,
      place,
      dateFrom,
      dateTo,
      timeFrom,
      timeTo,
      popularityMin,
      popularityMax,
      sortBy = "date",
      sortOrder = "desc",
      page = "1",
      limit = "12",
    } = req.query;

    // Load events data from JSON file
    const raw = await fs.readFile(DATA_FILE, "utf8");
    let events = JSON.parse(raw);

    // Filtering
    const filtersUsed = {};

    if (q && String(q).trim()) {
      const qn = normalize(q);
      events = events.filter((e) => {
        return (
          normalize(e.title).includes(qn) ||
          normalize(e.description).includes(qn) ||
          normalize(e.place).includes(qn)
        );
      });
      filtersUsed.q = q;
    }

    if (type) {
      const types = String(type)
        .split(",")
        .map((t) => normalize(t))
        .filter(Boolean);
      if (types.length) {
        events = events.filter((e) => types.includes(normalize(e.type)));
        filtersUsed.type = types;
      }
    }

    if (place) {
      const places = String(place)
        .split(",")
        .map((p) => normalize(p))
        .filter(Boolean);
      if (places.length) {
        events = events.filter((e) => places.includes(normalize(e.place)));
        filtersUsed.place = places;
      }
    }

    if (dateFrom) {
      const df = new Date(`${dateFrom}T00:00:00`);
      if (!isNaN(df)) {
        events = events.filter((e) => new Date(`${e.date}T00:00:00`) >= df);
        filtersUsed.dateFrom = dateFrom;
      }
    }

    if (dateTo) {
      const dt = new Date(`${dateTo}T23:59:59`);
      if (!isNaN(dt)) {
        events = events.filter((e) => new Date(`${e.date}T23:59:59`) <= dt);
        filtersUsed.dateTo = dateTo;
      }
    }

    const tf = parseTimeToMinutes(timeFrom);
    const tt = parseTimeToMinutes(timeTo);
    if (tf !== null) {
      events = events.filter((e) => {
        const em = parseTimeToMinutes(e.time);
        return em !== null ? em >= tf : true;
      });
      filtersUsed.timeFrom = timeFrom;
    }
    if (tt !== null) {
      events = events.filter((e) => {
        const em = parseTimeToMinutes(e.time);
        return em !== null ? em <= tt : true;
      });
      filtersUsed.timeTo = timeTo;
    }

    const pmin = popularityMin != null ? Number(popularityMin) : null;
    const pmax = popularityMax != null ? Number(popularityMax) : null;
    if (pmin !== null && !Number.isNaN(pmin)) {
      events = events.filter((e) => Number(e.popularity || 0) >= pmin);
      filtersUsed.popularityMin = pmin;
    }
    if (pmax !== null && !Number.isNaN(pmax)) {
      events = events.filter((e) => Number(e.popularity || 0) <= pmax);
      filtersUsed.popularityMax = pmax;
    }

    // Sorting
    const order = normalize(sortOrder) === "asc" ? 1 : -1;
    const sb = normalize(sortBy);

    events.sort((a, b) => {
      let cmp = 0;
      switch (sb) {
        case "date": {
          const ad = toDateTime(a).getTime();
          const bd = toDateTime(b).getTime();
          cmp = ad - bd; // asc by default
          break;
        }
        case "time": {
          const at = parseTimeToMinutes(a.time) ?? -1;
          const bt = parseTimeToMinutes(b.time) ?? -1;
          cmp = at - bt;
          break;
        }
        case "type":
        case "place":
        case "title": {
          cmp = normalize(a[sb]).localeCompare(normalize(b[sb]));
          break;
        }
        case "popularity": {
          cmp = Number(a.popularity || 0) - Number(b.popularity || 0);
          break;
        }
        default: {
          // Fallback to date
          const ad = toDateTime(a).getTime();
          const bd = toDateTime(b).getTime();
          cmp = ad - bd;
        }
      }
      return order * cmp;
    });

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const total = events.length;
    const totalPages = Math.max(1, Math.ceil(total / limitNum));
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const data = events.slice(start, end);

    res.json({
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      sortBy: sb || "date",
      sortOrder: order === 1 ? "asc" : "desc",
      filtersUsed,
      data,
    });
  } catch (err) {
    // Let the global error handler process this
    next(err);
  }
});

module.exports = router;
