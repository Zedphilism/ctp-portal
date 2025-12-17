(async function () {
  const $grid = document.querySelector("#grid");
  const $count = document.querySelector("#count");
  const $q = document.querySelector("#q");
  const $refresh = document.querySelector("#refresh");

  function findVal(obj, candidates) {
    if (!obj) return "";
    const keys = Object.keys(obj);

    for (const c of candidates) {
      if (obj[c] !== undefined && String(obj[c]).trim() !== "") return obj[c];
    }

    const lowerKeys = keys.map(k => k.toLowerCase().trim());
    for (const c of candidates) {
      const lowerC = c.toLowerCase().trim();
      const idx = lowerKeys.indexOf(lowerC);
      if (idx !== -1) return obj[keys[idx]];
    }

    for (const c of candidates) {
      const lowerC = c.toLowerCase().trim();
      const foundKey = keys.find(k => k.toLowerCase().includes(lowerC));
      if (foundKey) return obj[foundKey];
    }

    return "";
  }

  function safeText(t) {
    return String(t || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function initials(name) {
    const s = String(name || "").trim();
    if (!s) return "??";
    return s.split(/\s+/).map(n => n[0]).slice(0, 2).join("").toUpperCase();
  }

  function norm(s) {
    return String(s || "").trim().toLowerCase();
  }

  function statusChip(status) {
    const s = norm(status);
    let cls = "bg-slate-50 text-slate-700 border-slate-200";
    let dot = "bg-slate-400";

    if (s.includes("aktif") || s === "available" || s === "active") {
      cls = "bg-emerald-50 text-emerald-800 border-emerald-100";
      dot = "bg-emerald-500";
    }
    if (s.includes("cuti") || s.includes("kursus")) {
      cls = "bg-amber-50 text-amber-800 border-amber-100";
      dot = "bg-amber-500";
    }
    if (s.includes("bertugas") || s.includes("busy")) {
      cls = "bg-blue-50 text-blue-800 border-blue-100";
      dot = "bg-blue-500";
    }
    if (s.includes("unknown")) {
      cls = "bg-slate-50 text-slate-600 border-slate-200";
      dot = "bg-slate-400";
    }

    return `
      <span class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-extrabold tracking-wide ${cls}">
        <span class="h-2 w-2 rounded-full ${dot}"></span>
        ${safeText(status || "Unknown")}
      </span>
    `;
  }

  function renderSkeleton() {
    const cards = new Array(9).fill(0).map(() => `
      <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-4">
            <div class="h-14 w-14 rounded-2xl shimmer"></div>
            <div>
              <div class="h-5 w-44 rounded-xl shimmer"></div>
              <div class="mt-2 h-4 w-28 rounded-xl shimmer"></div>
            </div>
          </div>
          <div class="h-7 w-24 rounded-full shimmer"></div>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-2">
          <div class="h-14 rounded-2xl shimmer"></div>
          <div class="h-14 rounded-2xl shimmer"></div>
        </div>
        <div class="mt-4 h-12 rounded-2xl shimmer"></div>
      </div>
    `).join("");

    $grid.innerHTML = cards;
  }

  function copyToClipboard(text) {
    const t = String(text || "").trim();
    if (!t) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).catch(() => {});
      return;
    }

    const ta = document.createElement("textarea");
    ta.value = t;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    ta.remove();
  }

  function workloadLabel(assigned, completed) {
    const a = Number(assigned || 0);
    const c = Number(completed || 0);

    // Simple heuristic: more assigned than completed = currently loaded
    if (a >= 6) return { text: "Heavy load", cls: "text-rose-800 bg-rose-50 border-rose-100" };
    if (a >= 3) return { text: "Moderate load", cls: "text-amber-800 bg-amber-50 border-amber-100" };
    if (a > 0) return { text: "Light load", cls: "text-emerald-800 bg-emerald-50 border-emerald-100" };
    if (c > 0) return { text: "Available", cls: "text-emerald-800 bg-emerald-50 border-emerald-100" };
    return { text: "No history", cls: "text-slate-700 bg-slate-50 border-slate-200" };
  }

  function workloadBar(stats) {
    const a = Number(stats?.assigned || 0);
    const c = Number(stats?.completed || 0);
    const total = Math.max(1, a + c);

    const ap = Math.round((a / total) * 100);
    const cp = Math.round((c / total) * 100);

    const label = workloadLabel(a, c);

    return `
      <div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div class="flex items-center justify-between gap-2">
          <div class="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Workload</div>
          <span class="text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${label.cls}">${label.text}</span>
        </div>

        <div class="mt-2">
          <div class="h-2 rounded-full bg-white border border-slate-200 overflow-hidden">
            <div class="h-full bg-blue-500" style="width:${ap}%"></div>
          </div>

          <div class="mt-2 flex flex-wrap gap-2 text-[11px]">
            <span class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-700">
              <span class="h-2 w-2 rounded-full bg-blue-500"></span>
              <span class="text-slate-500 font-bold">Assigned</span>
              <span class="font-extrabold text-slate-900">${a}</span>
            </span>

            <span class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-700">
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span class="text-slate-500 font-bold">Completed</span>
              <span class="font-extrabold text-slate-900">${c}</span>
            </span>
          </div>
        </div>
      </div>
    `;
  }

  function renderCard(i) {
    const name = findVal(i, ["Nama Pemeriksa", "Name", "Inspector Name", "nama"]);
    const rank = findVal(i, ["Pangkat", "Rank", "Gred"]);
    const phone = findVal(i, ["No Telefon", "Phone Number", "Phone", "Tel", "hp"]);
    const status = findVal(i, ["Status", "Availability"]) || "Unknown";
    const photo = findVal(i, ["Photo_url", "Photo Url", "Photo", "Gambar", "Image"]);
    const zon = findVal(i, ["Zon", "Zone", "Area"]);
    const spec = findVal(i, ["Specialization", "Kepakaran", "Bidang", "Speciality"]);
    const stats = i._stats;

    if (!name || norm(name) === "unknown") return "";

    const init = initials(name);

    const meta = [
      zon ? `<span class="inline-flex items-center gap-2 text-xs text-slate-600"><span class="h-1.5 w-1.5 rounded-full bg-slate-400"></span>${safeText(zon)}</span>` : "",
      spec ? `<span class="inline-flex items-center gap-2 text-xs text-slate-600"><span class="h-1.5 w-1.5 rounded-full bg-slate-400"></span>${safeText(spec)}</span>` : ""
    ].filter(Boolean).join("");

    const actions = `
      <div class="mt-4 flex flex-wrap gap-2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition">
        ${
          phone
            ? `<button type="button" class="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-extrabold"
                 onclick="window.location.href='tel:${safeText(phone)}'">Call</button>`
            : `<button type="button" class="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-extrabold opacity-40 cursor-not-allowed">Call</button>`
        }
        ${
          phone
            ? `<button type="button" class="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-extrabold"
                 onclick="window.__copyPhone && window.__copyPhone('${safeText(phone)}')">Copy phone</button>`
            : `<button type="button" class="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-extrabold opacity-40 cursor-not-allowed">Copy phone</button>`
        }
      </div>
    `;

    return `
      <div class="group rounded-3xl border border-slate-200 bg-white p-5 shadow-soft hover:shadow-md hover:-translate-y-0.5 transition will-change-transform">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-4 min-w-0">
            <div class="shrink-0 relative">
              ${
                photo
                  ? `<img src="${safeText(photo)}"
                        class="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                        onerror="this.outerHTML='<div class=\\'w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-extrabold\\'>${init}</div>'">`
                  : `<div class="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-extrabold">${init}</div>`
              }
              <span class="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500"></span>
            </div>

            <div class="min-w-0">
              <div class="font-extrabold text-slate-900 text-lg leading-tight truncate">${safeText(name)}</div>
              ${rank ? `<div class="text-xs font-semibold text-slate-500 uppercase mt-0.5">${safeText(rank)}</div>` : `<div class="text-xs text-slate-400 mt-0.5">Inspector</div>`}
              <div class="mt-2 flex flex-wrap gap-3">
                ${meta || `<span class="text-xs text-slate-400">No extra info</span>`}
              </div>
            </div>
          </div>

          <div class="shrink-0">
            ${statusChip(status)}
          </div>
        </div>

        <div class="mt-4">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div class="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Phone</div>
            ${
              phone
                ? `<div class="font-extrabold text-slate-900 break-words">${safeText(phone)}</div>`
                : `<div class="text-slate-400 font-semibold">Not provided</div>`
            }
          </div>
        </div>

        ${stats ? workloadBar(stats) : `
          <div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div class="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Workload</div>
            <div class="mt-1 text-sm text-slate-600">No history yet</div>
          </div>
        `}

        ${actions}
      </div>
    `;
  }

  async function load() {
    $count.textContent = "";
    renderSkeleton();

    try {
      let list = [];
      const inspectorMap = new Map();

      // 1. Fetch Inspectors
      try {
        const res = await API.listInspectors();
        if (res.ok && res.inspectors) {
          res.inspectors.forEach(i => {
            const n = findVal(i, ["Nama Pemeriksa", "Name", "nama"]);
            if (n) inspectorMap.set(String(n).toLowerCase(), i);
          });
        }
      } catch (e) { console.warn("List inspectors failed", e); }

      // 2. Fetch Job Stats
      try {
        const resJobs = await API.listJobs();
        if (resJobs.ok && resJobs.jobs) {
          resJobs.jobs.forEach(j => {
            const names = [
              findVal(j, ["Assigned Inspector 1", "assigned inspector 1"]),
              findVal(j, ["Assigned Inspector 2", "assigned inspector 2"])
            ];
            const st = norm(findVal(j, ["Status", "status"]) || "");

            names.forEach(rawName => {
              const n = String(rawName || "").trim();
              if (!n) return;

              const key = n.toLowerCase();
              if (!inspectorMap.has(key)) {
                inspectorMap.set(key, { "Nama Pemeriksa": n, "Status": "Active (History)" });
              }

              const rec = inspectorMap.get(key);
              if (!rec._stats) rec._stats = { assigned: 0, completed: 0 };

              if (st === "assigned") rec._stats.assigned++;
              if (st === "completed" || st === "done") rec._stats.completed++;
            });
          });
        }
      } catch (e) { console.warn("Job stats failed", e); }

      list = Array.from(inspectorMap.values());

      // Filter (remove email from display, but search can still include it if you want)
      const q = norm($q.value);
      if (q) {
        list = list.filter(i => {
          const blob = [
            findVal(i, ["Nama Pemeriksa", "Name", "Inspector Name", "nama"]),
            findVal(i, ["Zon", "Zone", "Area"]),
            findVal(i, ["Specialization", "Kepakaran", "Bidang", "Speciality"]),
            findVal(i, ["Pangkat", "Rank", "Gred"]),
            findVal(i, ["No Telefon", "Phone Number", "Phone", "Tel", "hp"]),
            findVal(i, ["Status", "Availability"])
          ].map(x => String(x || "")).join(" | ");
          return norm(blob).includes(q);
        });
      }

      $count.textContent = `${list.length} inspector(s)`;

      $grid.innerHTML = list.length
        ? list.map(renderCard).join("")
        : `<div class="col-span-full text-center p-10 text-sm text-slate-500">No inspectors found. Try a different keyword.</div>`;

    } catch (e) {
      console.error(e);
      $grid.innerHTML = `<div class="col-span-full text-center p-10 text-sm text-rose-600 font-extrabold">Error loading directory.</div>`;
    }
  }

  window.__copyPhone = (p) => copyToClipboard(p);

  $refresh.onclick = load;

  let t = null;
  $q.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(load, 180);
  });
  $q.onkeydown = (e) => e.key === "Enter" && load();

  load();
})();
