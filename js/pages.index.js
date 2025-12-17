(async function () {
  // ===== helpers =====
  const $ = (s) => document.querySelector(s);

  const $list = $("#list");
  const $meta = $("#meta");
  const $count = $("#count");
  const $stats = $("#stats");
  const $q = $("#q");
  const $status = $("#status");
  const $refresh = $("#refresh");

  // ===== row renderer =====
  function rowHtml(j) {
    const id = j["Job ID"] || "";
    if (!id) return "";

    // KEYS UPDATED TO MATCH BACKEND 'prettifyHeader_'
    const unit = j["Nama Pasukan / Unit"] || "";
    const jenis = j["Jenis Pemeriksaan"] || "";
    const daerah = j["Daerah"] || "";
    const negeri = j["Negeri"] || "";
    const zon = j["Zon"] || "";
    const st = j["Status"] || "";
    const pr = j["Priority"] || "";
    // Note: Backend might return "Assigned Inspector 1" or similar based on CSV header
    const a1 = j["Assigned Inspector 1"] || ""; 
    const a2 = j["Assigned Inspector 2"] || "";

    const loc = [daerah, negeri].filter(Boolean).join(", ");

    return `
      <a href="./job.html?jobId=${encodeURIComponent(id)}"
         class="listItem block py-4 px-3 hover:bg-slate-50 transition-colors">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="font-extrabold text-blue-700 mb-1">${safeText(id)}</div>
            <div class="font-bold text-slate-900 mb-0.5">${safeText(unit)}</div>
            <div class="text-sm text-slate-600 mb-2">${safeText(jenis)}</div>
            <div class="text-xs smallmuted flex items-center gap-2">
              <span>${safeText(loc)}</span>
              ${zon ? `<span>• ${safeText(zon)}</span>` : ""}
            </div>
            <div class="mt-2 text-xs smallmuted2">
               ${a1 ? `<div class="flex items-center gap-1">👮 ${safeText(a1)}</div>` : ""}
            </div>
          </div>
          <div class="text-right shrink-0 flex flex-col items-end gap-2">
            ${chip(st)}
            ${pr ? prioChip(pr) : ""}
          </div>
        </div>
      </a>
    `;
  }

  function safeText(t) {
    return String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ===== main logic =====
  async function load() {
    $list.innerHTML = `<div class="p-6 text-center text-sm smallmuted">Loading...</div>`;
    $count.textContent = "";
    
    const q = $q.value.trim();
    let status = $status.value.trim();
    if (!status || status.toLowerCase().includes("all")) status = "";

    try {
      $meta.textContent = "Connecting...";
      // We can skip explicit meta() call if we just want data, but it's fine to keep
      const m = await API.meta(); 
      $meta.textContent = m.ok ? "Connected" : "API Error";
    } catch (e) {
      console.error(e);
      $meta.textContent = "Offline";
    }

    let res;
    try {
      res = await API.listJobs({ q, status });
    } catch (e) {
      console.error(e);
      $list.innerHTML = `<div class="py-6 text-sm text-rose-700 font-semibold px-4">Connection failed. Check console.</div>`;
      return;
    }

    if (!res || !res.ok) {
      $list.innerHTML = `<div class="py-6 text-sm text-rose-700 font-semibold px-4">API Error: ${safeText(res ? res.error : "Unknown")}</div>`;
      return;
    }

    // Filter
    let jobs = (res.jobs || []).filter(j => String(j["Job ID"] || "").trim());

    // Client-side search (since backend is dumb list)
    if (q) {
      const lowQ = q.toLowerCase();
      jobs = jobs.filter(j => 
        Object.values(j).some(val => String(val).toLowerCase().includes(lowQ))
      );
    }

    if (status) {
      jobs = jobs.filter(j => String(j["Status"]).toLowerCase() === status.toLowerCase());
    }

    $count.textContent = `${jobs.length} job(s)`;
    $list.innerHTML = jobs.length 
      ? jobs.map(rowHtml).join("") 
      : `<div class="p-6 text-center text-sm smallmuted">No jobs found</div>`;

    // Update Stats
    updateStats(jobs);
  }

  function updateStats(jobs) {
    const total = jobs.length;
    const pending = jobs.filter(x => String(x.Status).toLowerCase() === "pending").length;
    const assigned = jobs.filter(x => String(x.Status).toLowerCase() === "assigned").length;
    
    $stats.innerHTML = `
      <div class="flex justify-between"><span>Total</span><span class="font-bold">${total}</span></div>
      <div class="flex justify-between text-amber-700"><span>Pending</span><span class="font-bold">${pending}</span></div>
      <div class="flex justify-between text-blue-700"><span>Assigned</span><span class="font-bold">${assigned}</span></div>
    `;
  }

  // ===== init =====
  $refresh.onclick = load;
  $q.onkeydown = (e) => e.key === "Enter" && load();
  $status.onchange = load;

  // Initial load
  load();

})();