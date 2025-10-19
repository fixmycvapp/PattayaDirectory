// Client-side logic for Pattaya Directory
// - Fetches events from /api/events with filters, sorting, pagination
// - Renders a responsive grid
// - Supports infinite scroll and 5-minute auto refresh

const grid = document.getElementById("eventsGrid");
const loadingEl = document.getElementById("loading");
const endEl = document.getElementById("end");
const sentinel = document.getElementById("sentinel");
const yearEl = document.getElementById("year");

// Controls
const dateEl = document.getElementById("filter-date");
const timeEl = document.getElementById("filter-time");
const typeEl = document.getElementById("filter-type");
const placeEl = document.getElementById("filter-place");
const popEl = document.getElementById("filter-popularity");
const sortByEl = document.getElementById("sort-by");
const sortOrderEl = document.getElementById("sort-order");
const applyBtn = document.getElementById("apply-filters");
const clearBtn = document.getElementById("clear-filters");
const refreshBtn = document.getElementById("refresh");

yearEl.textContent = new Date().getFullYear();

// State
let page = 1;
const limit = 4; // Show 4 events at a time as required
let isLoading = false;
let reachedEnd = false;
let lastQueryKey = ""; // cache key to detect filter changes

function buildQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) q.set(k, v);
  });
  return q.toString();
}

function currentFilters() {
  return {
    date: dateEl.value || undefined,
    time: timeEl.value || undefined,
    type: typeEl.value || undefined,
    place: placeEl.value || undefined,
    popularityMin: popEl.value || undefined,
    sortBy: sortByEl.value || "dateTime",
    order: sortOrderEl.value || "desc",
  };
}

async function fetchEvents({ reset = false } = {}) {
  if (isLoading || reachedEnd) return;
  isLoading = true;
  loadingEl.hidden = false;

  const filters = currentFilters();
  const qKey = JSON.stringify(filters);

  // Reset paging when filters changed or explicit reset
  if (reset || qKey !== lastQueryKey) {
    page = 1;
    reachedEnd = false;
    grid.innerHTML = "";
    endEl.hidden = true;
  }
  lastQueryKey = qKey;

  const params = { ...filters, page, limit };
  const queryString = buildQuery(params);

  try {
    const res = await fetch(`/api/events?${queryString}`);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const json = await res.json();
    renderEvents(json.data || []);

    // If fewer than limit returned, we've reached the end
    if (!json.data || json.data.length < limit || page >= json.totalPages) {
      reachedEnd = true;
      endEl.hidden = false;
    } else {
      page += 1; // prepare next page
    }
  } catch (err) {
    console.error(err);
    alert("Failed to load events. Please try again.");
  } finally {
    isLoading = false;
    loadingEl.hidden = true;
  }
}

function renderEvents(events) {
  const fragment = document.createDocumentFragment();
  events.forEach((ev) => {
    const card = document.createElement("article");
    card.className = "card";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = ev.name;

    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = ev.type || "Event";

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `
      <span><strong>Date:</strong> ${ev.date}</span>
      <span><strong>Time:</strong> ${ev.time || "–"}</span>
      <span><strong>Place:</strong> ${ev.place || "–"}</span>
      <span><strong>Popularity:</strong> ${ev.popularity ?? "–"}</span>
    `;

    card.appendChild(title);
    card.appendChild(badge);
    card.appendChild(meta);

    fragment.appendChild(card);
  });
  grid.appendChild(fragment);
}

// Event listeners
applyBtn.addEventListener("click", () => fetchEvents({ reset: true }));
clearBtn.addEventListener("click", () => {
  dateEl.value = "";
  timeEl.value = "";
  typeEl.value = "";
  placeEl.value = "";
  popEl.value = "";
  sortByEl.value = "dateTime";
  sortOrderEl.value = "desc";
  fetchEvents({ reset: true });
});
refreshBtn.addEventListener("click", () => fetchEvents({ reset: true }));

// Infinite scroll using IntersectionObserver
const io = new IntersectionObserver((entries) => {
  const entry = entries[0];
  if (entry.isIntersecting && !isLoading && !reachedEnd) {
    fetchEvents();
  }
});

ios.observe(sentinel);

// Auto-refresh every 5 minutes
setInterval(() => {
  fetchEvents({ reset: true });
}, 5 * 60 * 1000);

// Initial load
fetchEvents({ reset: true });
