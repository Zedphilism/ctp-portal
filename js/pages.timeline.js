(async function () {
  const $list = document.querySelector("#list");
  const $count = document.querySelector("#count");
  const $type = document.querySelector("#type");
  const $q = document.querySelector("#q");
  const $refresh = document.querySelector("#refresh");

  // Helper: Parse Date
  function toDate(v) {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  // Helper: Date Formatter
  function fmtDate(d) {
    if (!d) return "";
    // DD/MM/YYYY format with Time
    // Example: 17/12/2025, 14:30
    return d.toLocaleString("en-GB", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  }

  // Helper: Event Card HTML
  function eventCard(ev) {
    return `
      <div class="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${ev.badgeClass}">${ev.label}</span>
              <span class="text-xs text-slate-400">${fmtDate(ev.time)}</span>
            </div>
            <div class="font-bold text-slate-900 mt-1">
              <a href="./job.html?jobId=${encodeURIComponent(ev.jobId)}" class="hover:text-blue-700 hover:underline transition-colors">${ev.jobId}</a>
            </div>
            <div class="text-sm text-slate-600 mt-0.5">${ev.unit}</div>
            ${ev.extra ? `<div class="text-xs text-slate-400 mt-2 flex items-center gap-1">👤 ${ev.extra}</div>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  // Helper: Build Event List
function buildEvents(jobs) {
  const ev = [];
  jobs.forEach(j => {
    // 1. Get the original Submission Date
    const subDate = new Date(j["Timestamp"]);
    
    // 2. Look for the Inspection Date in the JSON data
    let jsonStr = j["Inspector Structured Data"] || "";
    let inspDate = null;
    let competencyLabel = "Pending Inspection";

    if (jsonStr && jsonStr.startsWith('{')) {
      try {
        const obj = JSON.parse(jsonStr);
        // Find the "Tarikh Pemeriksaan" entered by the inspector
        const dateKey = Object.keys(obj).find(k => k.toLowerCase().includes('tarikh'));
        if (dateKey && obj[dateKey]) {
          inspDate = new Date(obj[dateKey]);
          
          // CALCULATE COMPETENCY (The "Not Boring" part)
          const diffMs = Math.abs(inspDate - subDate);
          const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          competencyLabel = `Completed in ${days} Days`;
        }
      } catch(e) { console.error("JSON Error", e); }
    }

    // Add the event to the timeline
    ev.push({
      time: inspDate || subDate, // Use inspection date if done, else submission
      type: inspDate ? 'completed' : 'submitted',
      jobId: j["Job ID"],
      unit: j["Nama Pasukan / Unit"],
      extra: competencyLabel // This shows the "Days Taken" on your timeline
    });
  });
  return ev.sort((a, b) => b.time - a.time);
}

  async function load() {
    $list.innerHTML = `<div class="py-10 text-center text-sm text-slate-400">Loading timeline...</div>`;
    $count.textContent = "";

    try {
      const res = await API.listJobs();
      if (!res.ok) throw new Error(res.error || "API Error");

      const jobs = res.jobs || [];
      const allEvents = buildEvents(jobs);

      // Filter
      const typeFilter = $type.value;
      const qFilter = $q.value.trim().toLowerCase();

      const filtered = allEvents.filter(x => {
        if (typeFilter && x.type !== typeFilter) return false;
        if (qFilter) {
          const str = `${x.jobId} ${x.unit} ${x.extra}`.toLowerCase();
          if (!str.includes(qFilter)) return false;
        }
        return true;
      });

      $count.textContent = `${filtered.length} event(s)`;
      
      $list.innerHTML = filtered.length 
        ? filtered.map(eventCard).join('<div class="h-4 border-l-2 border-slate-100 ml-6 my-[-4px] relative z-0"></div>') 
        : `<div class="py-10 text-center text-sm text-slate-400">No events found matching filters</div>`;

    } catch (e) {
      console.error(e);
      $list.innerHTML = `<div class="py-10 text-center text-sm text-rose-600 font-bold">Failed to load timeline</div>`;
    }
  }

  // Init
  $refresh.onclick = load;
  $type.onchange = load;
  $q.onkeydown = (e) => e.key === "Enter" && load();

  load();

})();
