(async function () {
  const $list = document.querySelector("#list");
  const $count = document.querySelector("#count");
  const $type = document.querySelector("#type");
  const $q = document.querySelector("#q");
  const $refresh = document.querySelector("#refresh");

  // Helper: Parse Date strings into JS Date objects
  function toDate(v) {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  // Helper: Format Date for the UI (DD/MM/YYYY)
  function fmtDate(d) {
    if (!d) return "";
    return d.toLocaleString("en-GB", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric"
    });
  }

  // Build the Visual Card for each event
  function eventCard(ev) {
    // Logic for Competency Badges
    let badgeClass = "bg-slate-100 text-slate-500";
    if (ev.daysTaken !== null) {
      if (ev.daysTaken <= 3) badgeClass = "bg-emerald-100 text-emerald-700";
      else if (ev.daysTaken <= 7) badgeClass = "bg-amber-100 text-amber-700";
      else badgeClass = "bg-rose-100 text-rose-700";
    }

    return `
      <div class="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-shadow shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-600 mono">${ev.jobId}</span>
              ${ev.daysTaken !== null ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded ${badgeClass}">${ev.daysTaken} DAYS TAKEN</span>` : ''}
            </div>
            <h3 class="font-bold text-slate-900 truncate">${ev.unit}</h3>
            <div class="text-xs text-slate-500 mt-1">
              <i class="fa-solid fa-calendar-day mr-1"></i> ${fmtDate(ev.time)} 
              <span class="mx-2 text-slate-300">|</span> 
              <span class="capitalize font-semibold">${ev.type}</span>
            </div>
          </div>
          <div class="text-right">
             <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</div>
             <div class="text-xs font-bold text-blue-600 uppercase">${ev.type}</div>
          </div>
        </div>
      </div>
    `;
  }

  // --- THE COMPETENCY ENGINE ---
  function buildEvents(jobs) {
    const ev = [];
    jobs.forEach(j => {
      const subDate = toDate(j["Timestamp"]);
      
      // Extract Inspection Date from the JSON column
      let inspDate = null;
      let daysTaken = null;
      const jsonStr = j["Inspector Structured Data"] || j["json"];

      if (jsonStr && typeof jsonStr === 'string' && jsonStr.startsWith('{')) {
        try {
          const obj = JSON.parse(jsonStr);
          // Look for any key containing "Tarikh" (Date)
          const dateKey = Object.keys(obj).find(k => k.toLowerCase().includes('tarikh'));
          if (dateKey && obj[dateKey]) {
            inspDate = new Date(obj[dateKey]);
            
            // Calculate Competency Gap
            if (subDate && !isNaN(inspDate)) {
              const diff = Math.abs(inspDate - subDate);
              daysTaken = Math.ceil(diff / (1000 * 60 * 60 * 24));
            }
          }
        } catch (e) { console.warn("JSON Parse failed for Job", j["Job ID"]); }
      }

      // Add "Submitted" Event
      if (subDate) {
        ev.push({
          time: subDate,
          type: 'submitted',
          jobId: j["Job ID"] || "N/A",
          unit: j["Nama Pasukan / Unit"] || "Unknown Unit",
          daysTaken: null
        });
      }

      // Add "Completed" Event (Only if inspector date exists)
      if (inspDate && !isNaN(inspDate)) {
        ev.push({
          time: inspDate,
          type: 'completed',
          jobId: j["Job ID"] || "N/A",
          unit: j["Nama Pasukan / Unit"] || "Unknown Unit",
          daysTaken: daysTaken
        });
      }
    });

    // Sort by newest date first
    return ev.sort((a, b) => b.time.getTime() - a.time.getTime());
  }

  async function load() {
    $list.innerHTML = `<div class="py-10 text-center text-sm text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading competency data...</div>`;
    
    try {
      const res = await API.listJobs();
      const jobs = res.jobs || [];
      const allEvents = buildEvents(jobs);

      const typeFilter = $type.value;
      const qFilter = $q.value.trim().toLowerCase();

      const filtered = allEvents.filter(x => {
        if (typeFilter && x.type !== typeFilter) return false;
        if (qFilter) {
          const str = `${x.jobId} ${x.unit}`.toLowerCase();
          if (!str.includes(qFilter)) return false;
        }
        return true;
      });

      $count.textContent = `${filtered.length} event(s)`;
      
      $list.innerHTML = filtered.length 
        ? filtered.map(eventCard).join('<div class="h-4 border-l-2 border-slate-200 ml-8 my-[-4px] relative z-0"></div>') 
        : `<div class="py-10 text-center text-sm text-slate-400">No events found matching filters.</div>`;

    } catch (e) {
      console.error(e);
      $list.innerHTML = `<div class="py-10 text-center text-rose-500 font-bold">Failed to load timeline. Check Console.</div>`;
    }
  }

  // Listeners
  $type.addEventListener("change", load);
  $q.addEventListener("input", load);
  $refresh.addEventListener("click", load);

  // Initial load
  load();

})();
