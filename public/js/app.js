(() => {
  const API_URL = "/api/events";

  // Application state
  const state = {
    page: 1,
    limit: 12,
    sortBy: "date",
    sortOrder: "desc",
    filters: {},
    loading: false,
    hasMore: true,
    lastQueryKey: "",
  };

  // DOM elements
  const grid = document.getElementById("eventsGrid");
  const sentinel = document.getElementById("sentinel");
  const loadingEl = document.getElementById("loading");
  const yearEl = document.getElementById("year");
  const refreshBtn = document.getElementById("refreshBtn");

  // Controls
  const q = document.getElementById("q");
  const type = document.getElementById("type");
  const place = document.getElementById("place");
  const dateFrom = document.getElementById("dateFrom");
  const dateTo = document.getElementById("dateTo");
  const timeFrom = document.getElementById("timeFrom");
  const timeTo = document.getElementById("timeTo");
  const popMin = document.getElementById("popMin");
  const popMax = document.getElementById("popMax");
  const sortBy = document.getElementById("sortBy");
  const sortOrder = document.getElementById("sortOrder");
  const applyBtn = document.getElementById("applyFilters");
  const clearBtn = document.getElementById("clearFilters");

  // Helpers
  const fmtDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString();
  const fmtTime = (hhmm) => hhmm || "";

  function buildQuery() {
    const params = new URLSearchParams();
    params.set("page", state.page);
    params.set("limit", state.limit);
    params.set("sortBy", state.sortBy);
    params.set("sortOrder", state.sortOrder);

    const f = state.filters;
    if (f.q) params.set("q", f.q);
    if (f.type) params.set("type", f.type);
    if (f.place) params.set("place", f.place);
    if (f.dateFrom) params.set("dateFrom", f.dateFrom);
    if (f.dateTo) params.set("dateTo", f.dateTo);
    if (f.timeFrom) params.set("timeFrom", f.timeFrom);
    if (f.timeTo) params.set("timeTo", f.timeTo);
    if (f.popularityMin != null && f.popularityMin !== "") params.set("popularityMin", f.popularityMin);
    if (f.popularityMax != null && f.popularityMax !== "") params.set("popularityMax", f.popularityMax);

    return params.toString();
  }

  function makeQueryKey() {
    // Unique key for current filter/sort ignoring page
    const clone = { ...state, page: 0 };
    return JSON.stringify(clone);
  }

  function setLoading(on) {
    state.loading = on;
    loadingEl.classList.toggle("hidden", !on);
  }

  function renderEvents(items) {
    const frag = document.createDocumentFragment();
    items.forEach((e) => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <h3>${escapeHtml(e.title)}</h3>
        <div class="row muted">
          <span>${fmtDate(e.date)} ${fmtTime(e.time)}</span>
          <span class="badge">${escapeHtml(e.type)}</span>
          <span>at ${escapeHtml(e.place)}</span>
          <span class="pop">★ ${Number(e.popularity || 0)}</span>
        </div>
        <p class="muted">${escapeHtml(e.description)}</p>
      `;
      frag.appendChild(card);
    });
    grid.appendChild(frag);
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function fetchEvents() {
    if (state.loading || !state.hasMore) return;

    const queryKey = makeQueryKey();
    const isNewQuery = queryKey !== state.lastQueryKey;

    setLoading(true);

    try {
      const url = `${API_URL}?${buildQuery()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const json = await res.json();

      // If filters changed while request was in-flight, discard data
      if (queryKey !== makeQueryKey()) return;

      renderEvents(json.data || []);
      state.hasMore = state.page < json.totalPages;
      state.lastQueryKey = queryKey;
    } catch (err) {
      console.error(err);
      alert("Error loading events. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function resetAndLoad() {
    // Reset grid and paging for a fresh query
    grid.innerHTML = "";
    state.page = 1;
    state.hasMore = true;
    state.lastQueryKey = "";
    fetchEvents();
  }

  function applyFiltersFromUI() {
    state.sortBy = sortBy.value || "date";
    state.sortOrder = sortOrder.value || "desc";
    state.filters = {
      q: q.value.trim() || undefined,
      type: type.value || undefined,
      place: place.value || undefined,
      dateFrom: dateFrom.value || undefined,
      dateTo: dateTo.value || undefined,
      timeFrom: timeFrom.value || undefined,
      timeTo: timeTo.value || undefined,
      popularityMin: popMin.value || undefined,
      popularityMax: popMax.value || undefined,
    };
  }

  // Infinite scroll using IntersectionObserver
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && state.hasMore && !state.loading) {
        state.page += 1; // next page
        fetchEvents();
      }
    }
  }, { rootMargin: "400px" });
  io.observe(sentinel);

  // Auto refresh every 5 minutes
  setInterval(() => {
    applyFiltersFromUI();
    resetAndLoad();
  }, 5 * 60 * 1000);

  // UI wiring
  applyBtn.addEventListener("click", () => {
    applyFiltersFromUI();
    resetAndLoad();
  });
  clearBtn.addEventListener("click", () => {
    [q, type, place, dateFrom, dateTo, timeFrom, timeTo, popMin, popMax].forEach((el) => (el.value = ""));
    sortBy.value = "date";
    sortOrder.value = "desc";
    applyFiltersFromUI();
    resetAndLoad();
  });
  refreshBtn.addEventListener("click", () => {
    applyFiltersFromUI();
    resetAndLoad();
  });

  // Initial load
  applyFiltersFromUI();
  yearEl.textContent = new Date().getFullYear();
  resetAndLoad();
})();
