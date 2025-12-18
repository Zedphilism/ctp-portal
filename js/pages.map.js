(async function () {
  const $meta = document.querySelector("#meta");
  const $nocoord = document.querySelector("#nocoord");

  // Initialize Map (Center on Malaysia)
  const map = L.map("map").setView([4.2105, 101.9758], 6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  // Helper: Safe text
  function safeText(t) {
    return String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Helper: Status Chip
  function chip(status) {
    const s = String(status || "").toLowerCase();
    let cls = "background-color:#f1f5f9; color:#1e293b;"; // Default slate
    if (s === "pending") cls = "background-color:#fef3c7; color:#92400e;";
    if (s === "assigned") cls = "background-color:#dbeafe; color:#1e40af;";
    if (s === "completed") cls = "background-color:#dcfce7; color:#166534;";
    if (s === "cancelled") cls = "background-color:#fee2e2; color:#991b1b;";
    
    return `<span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;${cls}">${safeText(status).toUpperCase()}</span>`;
  }

  // Helper: Format Date (DD/MM/YYYY)
  function fmtDate(v) {
    if (!v) return "-";
    const d = new Date(v);
    if (isNaN(d.getTime())) return safeText(v);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  // NEW Helper: Get Competency HTML
  function getKompetensiBadge(subDateStr, structJson) {
    if (!subDateStr) return '<span style="color:#94a3b8;">-</span>';
    const start = new Date(subDateStr);
    let end = null;
    try {
      const data = JSON.parse(structJson || "{}");
      const dateKey = Object.keys(data).find(k => k.toLowerCase().includes('tarikh'));
      if (dateKey && data[dateKey]) end = new Date(data[dateKey]);
    } catch (e) { return '<span style="color:#94a3b8;">-</span>'; }

    if (!end || isNaN(end.getTime())) {
      return '<span style="font-size:9px; font-weight:700; color:#64748b;">BELUM DIPERIKSA</span>';
    }

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let color = "#b91c1c"; // Lewat (Red)
    if (diffDays <= 3) color = "#059669"; // Cemerlang (Green)
    else if (diffDays <= 7) color = "#d97706"; // Memuaskan (Yellow)

    return `<span style="font-weight:800; color:${color}; font-size:10px;">${diffDays} HARI</span>`;
  }

  $meta.textContent = "Loading jobs...";

  try {
    const res = await API.listJobs();
    if (!res.ok) throw new Error(res.error || "API Error");

    const jobs = res.jobs || [];
    let pins = 0;
    const no = [];

    for (const j of jobs) {
      const lat = parseFloat(j.Lat);
      const lng = parseFloat(j.Lng);
      const id = j["Job ID"] || "";
      const unit = j["Nama Pasukan / Unit"] || "";
      const zon = j["Zon"] || "";
      const negeri = j["Negeri"] || "";
      const st = j["Status"] || "";
      const struct = j["Inspector Structured Data"] || "{}";
      const ts = j["Timestamp"] || "";

      if (!isFinite(lat) || !isFinite(lng)) {
        no.push(j);
        continue;
      }

      pins++;
      
      const compBadge = getKompetensiBadge(ts, struct);

      const popup = `
        <div style="min-width:200px; font-family:sans-serif; padding:2px;">
          <div style="font-weight:800; font-size:11px; color:#64748b; margin-bottom:2px;">${safeText(id)}</div>
          <div style="font-weight:bold; font-size:14px; color:#1e293b; margin-bottom:4px;">${safeText(unit)}</div>
          <div style="font-size:11px; color:#94a3b8; margin-bottom:8px; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">
            ${safeText(negeri)} ${zon ? "• " + safeText(zon) : ""}
          </div>
          
          <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; font-size:11px;">
              <span style="color:#94a3b8;">Permohonan:</span>
              <span style="font-weight:600; color:#475569;">${fmtDate(ts)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:11px;">
              <span style="color:#94a3b8;">Kompetensi:</span>
              <span>${compBadge}</span>
            </div>
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between; margin-top:8px;">
            ${chip(st)}
            <a href="./job.html?jobId=${encodeURIComponent(id)}" 
               style="background:#0f172a; color:white; padding:6px 12px; border-radius:6px; text-decoration:none; font-size:10px; font-weight:bold;">
               Buka Info
            </a>
          </div>
        </div>
      `;

      L.marker([lat, lng]).addTo(map).bindPopup(popup);
    }

    $meta.textContent = `Map ready. ${pins} locations plotted.`;

    if (no.length > 0) {
      $nocoord.innerHTML = no.slice(0, 50).map(j => {
        const id = j["Job ID"] || "";
        const unit = j["Nama Pasukan / Unit"] || "";
        const loc = [j.Daerah, j.Negeri].filter(Boolean).join(", ");
        return `
          <div class="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 bg-white">
            <div class="min-w-0">
              <div class="font-bold text-sm truncate">${safeText(id)}</div>
              <div class="text-xs text-slate-500 truncate">${safeText(unit)}</div>
              <div class="text-[10px] text-slate-400 truncate">${safeText(loc)}</div>
            </div>
            <a href="./job.html?jobId=${encodeURIComponent(id)}" class="text-xs font-semibold text-blue-700 hover:underline">View</a>
          </div>
        `;
      }).join("") + (no.length > 50 ? `<div class="p-3 text-xs text-slate-500 text-center">And ${no.length - 50} more...</div>` : "");
    } else {
      $nocoord.innerHTML = `<div class="p-4 text-sm text-slate-500">All jobs have coordinates.</div>`;
    }

  } catch (e) {
    console.error(e);
    $meta.textContent = "Error loading map data.";
  }
})();
