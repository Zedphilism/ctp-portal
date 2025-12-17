(async function () {
  const $meta = document.querySelector("#meta");
  const $summary = document.querySelector("#summary");
  
  // Canvas elements
  const $cStatus = document.querySelector("#cStatus");
  const $cZon = document.querySelector("#cZon");
  const $cNegeri = document.querySelector("#cNegeri");

  // Helper: Group by key and count
  function countBy(arr, keyFn) {
    const m = new Map();
    for (const x of arr) {
      const k = String(keyFn(x) || "").trim() || "(Empty)";
      m.set(k, (m.get(k) || 0) + 1);
    }
    // Sort descending by count
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }

  // Helper: Chart renderer
  function createChart(ctx, type, labels, data, labelStr) {
    if (!ctx) return;
    new Chart(ctx, {
      type: type,
      data: {
        labels: labels,
        datasets: [{
          label: labelStr,
          data: data,
          backgroundColor: [
            "#0f172a", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1"
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', display: type === 'doughnut' }
        }
      }
    });
  }

  // Main Logic
  $meta.textContent = "Loading data...";

  try {
    const res = await API.listJobs();
    
    if (!res.ok) {
      throw new Error(res.error || "API Error");
    }

    const jobs = res.jobs || [];
    $meta.textContent = `Analyzed ${jobs.length} jobs`;

    // 1. Summary Stats
    const total = jobs.length;
    // Note: Keys must match Code.gs "prettifyHeader_" output (Title Case)
    const pending = jobs.filter(x => String(x.Status || "").toLowerCase() === "pending").length;
    const assigned = jobs.filter(x => String(x.Status || "").toLowerCase() === "assigned").length;
    const completed = jobs.filter(x => String(x.Status || "").toLowerCase() === "completed").length;

    $summary.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Jobs</div>
          <div class="text-3xl font-black text-slate-900 mt-1">${total}</div>
        </div>
        <div class="p-4 rounded-xl border border-amber-100 bg-amber-50/50">
          <div class="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending</div>
          <div class="text-3xl font-black text-amber-900 mt-1">${pending}</div>
        </div>
        <div class="p-4 rounded-xl border border-blue-100 bg-blue-50/50">
          <div class="text-xs font-bold text-blue-700 uppercase tracking-wider">Assigned</div>
          <div class="text-3xl font-black text-blue-900 mt-1">${assigned}</div>
        </div>
        <div class="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50">
          <div class="text-xs font-bold text-emerald-700 uppercase tracking-wider">Completed</div>
          <div class="text-3xl font-black text-emerald-900 mt-1">${completed}</div>
        </div>
      </div>
    `;

    // 2. Prepare Chart Data
    // Keys: "Status", "Zon", "Negeri" (Title Case from backend)
    const statusData = countBy(jobs, j => j.Status);
    const zonData = countBy(jobs, j => j.Zon);
    const negeriData = countBy(jobs, j => j.Negeri);

    // 3. Render Charts
    if (window.Chart) {
      createChart($cStatus, "doughnut", statusData.map(x => x[0]), statusData.map(x => x[1]), "Status");
      createChart($cZon, "bar", zonData.map(x => x[0]), zonData.map(x => x[1]), "Zon");
      createChart($cNegeri, "bar", negeriData.map(x => x[0]), negeriData.map(x => x[1]), "Negeri");
    } else {
      console.warn("Chart.js not loaded");
    }

  } catch (e) {
    console.error(e);
    $meta.textContent = "Failed to load data";
    $summary.innerHTML = `<div class="p-4 text-rose-700 font-bold bg-rose-50 rounded-xl">Error: ${e.message}</div>`;
  }

})();