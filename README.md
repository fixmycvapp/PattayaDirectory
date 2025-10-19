# Pattaya Directory

A complete guide to events happening in Pattaya. Full-stack Node.js app with an Express backend and a vanilla HTML/CSS/JS frontend.

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Scripts

- `npm run dev` – start with Nodemon for development
- `npm start` – start the server with Node

## API

Base URL (local): `http://localhost:3000`

- `GET /api/health` – health check
- `GET /api/events` – list events with filtering, sorting, and pagination

Query params for `/api/events`:
- `page` (number, default 1)
- `limit` (number, default 4)
- `date` (YYYY-MM-DD)
- `time` (HH:MM)
- `type` (string)
- `place` (string)
- `popularity` (number, exact)
- `popularityMin` (number, minimum)
- `sortBy` one of `dateTime`|`date`|`time`|`popularity`|`name`|`place`|`type` (default `dateTime`)
- `order` `asc` or `desc` (default `desc`)

Example:
```
GET /api/events?date=2025-10-24&sortBy=popularity&order=desc&page=1&limit=4
```

## Frontend

- Responsive grid (4 cards per row on desktop, fewer on small screens)
- Dynamic filters and sorting without full page reload
- Infinite scroll for older events
- Manual refresh button and automatic refresh every 5 minutes

## Tech & Packages

- Backend: Node.js, Express, CORS
- Frontend: HTML, CSS, JavaScript (Fetch API)
- Dev: Nodemon

Suggested packages if you prefer alternatives:
- Axios (client HTTP requests) – currently using `fetch`, but axios can be used via CDN or npm

## Project Structure

```
PattayaDirectory/
├─ backend/
│  ├─ index.js
│  ├─ routes/
│  │  └─ events.js
│  └─ data/
│     └─ events.json
└─ public/
   ├─ index.html
   ├─ css/
   │  └─ style.css
   └─ js/
      └─ app.js
```

## Notes

- The data source is `backend/data/events.json`. Replace with a database in production.
- CORS is enabled for local development convenience.

## GitHub

This repository is set up on the `main` branch. To commit and push changes manually:

```bash
git add -A
git commit -m "Initial Node.js website skeleton with frontend and backend"
git push -u origin main
```
