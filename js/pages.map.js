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
    let cls = "bg-slate-100 text-slate-800";
    if (s === "pending") cls = "bg-amber-100 text-amber-900";
    if (s === "assigned") cls = "bg-blue-100 text-blue-900";
    if (s === "completed") cls = "bg-emerald-100 text-emerald-900";
    if (s === "cancelled") cls = "bg-rose-100 text-rose-900";
    return `<span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600;${cls.replace("bg-", "background-color:var(--").replace(" text-", ";color:var(--") + ");"}">${safeText(status)}</span>`;
  }

  $meta.textContent = "Loading jobs...";

  try {
    const res = await API.listJobs();
    
    if (!res.ok) {
      throw new Error(res.error || "API Error");
    }

    const jobs = res.jobs || [];
    let pins = 0;
    const no = [];

    for (const j of jobs) {
      // Parse Coordinates (Expects columns "Lat" and "Lng" in sheet)
      const lat = parseFloat(j.Lat);
      const lng = parseFloat(j.Lng);

      const id = j["Job ID"] || "";
      const unit = j["Nama Pasukan / Unit"] || "";
      const zon = j["Zon"] || "";
      const negeri = j["Negeri"] || "";
      const st = j["Status"] || "";

      // If invalid coord, add to 'missing' list
      if (!isFinite(lat) || !isFinite(lng)) {
        no.push(j);
        continue;
      }

      pins++;
      
      const popup = `
        <div style="min-width:200px; font-family:sans-serif;">
          <div style="font-weight:800; font-size:14px; margin-bottom:2px;">${safeText(id)}</div>
          <div style="font-size:12px; opacity:.8;">${safeText(unit)}</div>
          <div style="font-size:11px; opacity:.6; margin-bottom:6px;">${safeText(negeri)} ${zon ? "• " + safeText(zon) : ""}</div>
          <div>${chip(st)}</div>
          <div style="margin-top:8px;">
            <a href="./job.html?jobId=${encodeURIComponent(id)}" target="_blank" style="color:#2563eb; text-decoration:underline; font-size:12px;">Open Job</a>
          </div>
        </div>
      `;

      L.marker([lat, lng]).addTo(map).bindPopup(popup);
    }

    $meta.textContent = `Map ready. ${pins} locations plotted.`;

    // Render list of jobs without coordinates
    if (no.length > 0) {
      $nocoord.innerHTML = no.slice(0, 50).map(j => {
        const id = j["Job ID"] || "";
        const unit = j["Nama Pasukan / Unit"] || "";
        const loc = [j.Daerah, j.Negeri].filter(Boolean).join(", ");
        
        return `
          <div class="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
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