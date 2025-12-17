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
    for (const j of jobs) {
      const jobId = String(j["Job ID"] || "");
      const unit = String(j["Nama Pasukan / Unit"] || "");
      const insp1 = j["Assigned Inspector 1"];
      const insp2 = j["Assigned Inspector 2"];

      // 1. Submitted Event
      const tSubmit = toDate(j["Timestamp"]);
      if (tSubmit) {
        ev.push({
          type: "submitted",
          label: "Submitted",
          badgeClass: "bg-slate-100 text-slate-600",
          time: tSubmit,
          jobId,
          unit,
          extra: ""
        });
      }

      // 2. Assigned Event
      const tAssign = toDate(j["Assigned Date"]);
      if (tAssign) {
        ev.push({
          type: "assigned",
          label: "Assigned",
          badgeClass: "bg-blue-100 text-blue-700",
          time: tAssign,
          jobId,
          unit,
          extra: [insp1, insp2].filter(Boolean).join(", ")
        });
      }

      // 3. Completed Event
      const tEnd = toDate(j["End Date"]);
      if (tEnd) {
        ev.push({
          type: "completed",
          label: "Completed",
          badgeClass: "bg-emerald-100 text-emerald-700",
          time: tEnd,
          jobId,
          unit,
          extra: [insp1, insp2].filter(Boolean).join(", ")
        });
      }
    }
    // Sort Newest First
    ev.sort((a, b) => b.time.getTime() - a.time.getTime());
    return ev;
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