function el(sel) { return document.querySelector(sel); }
function els(sel) { return Array.from(document.querySelectorAll(sel)); }

function fmtDate(v) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  
  // Use "en-GB" locale to force DD/MM/YYYY format
  // Example output: 17/12/2025
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function chip(status) {
  const s = String(status || "").toLowerCase();
  let cls = "bg-slate-100 text-slate-800";
  if (s === "pending") cls = "bg-amber-100 text-amber-900";
  if (s === "assigned") cls = "bg-blue-100 text-blue-900";
  if (s === "completed") cls = "bg-emerald-100 text-emerald-900";
  if (s === "cancelled") cls = "bg-rose-100 text-rose-900";
  return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${cls}">${status || ""}</span>`;
}

function prioChip(p) {
  const s = String(p || "").toLowerCase();
  let cls = "bg-slate-100 text-slate-800";
  if (s === "high" || s === "urgent") cls = "bg-rose-100 text-rose-900";
  return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${cls}">${p || ""}</span>`;
}

function qsParam(name) {
  const u = new URL(location.href);
  return u.searchParams.get(name) || "";
}

function toast(msg, ok = true) {
  const t = document.createElement("div");
  t.className = `fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${ok ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

function safeText(v) {
  return (v === null || v === undefined) ? "" : String(v);
}

function initials(name) {
  const n = String(name || "").trim();
  if (!n) return "?";
  const parts = n.split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() || "").join("") || "?";
}

/**
 * Menghitung kompetensi (hari bekerja) & mengembalikan HTML badge
 */
function getCompetencyUI(subDateStr, jsonStr) {
  if (!subDateStr) return `<span class="text-slate-400">-</span>`;
  
  const start = new Date(subDateStr);
  let end = null;
  
  try {
    const data = JSON.parse(jsonStr || "{}");
    const dateKey = Object.keys(data).find(k => k.toLowerCase().includes('tarikh'));
    if (dateKey && data[dateKey]) end = new Date(data[dateKey]);
  } catch (e) { return `<span class="text-slate-400">-</span>`; }

  if (!end || isNaN(end.getTime())) {
    return `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">BELUM DIPERIKSA</span>`;
  }

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let cls = "bg-rose-100 text-rose-700"; // Lewat (>7 hari)
  let status = "LEWAT";
  
  if (diffDays <= 3) {
    cls = "bg-emerald-100 text-emerald-700";
    status = "CEMERLANG";
  } else if (diffDays <= 7) {
    cls = "bg-amber-100 text-amber-700";
    status = "MEMUASKAN";
  }

  return `<span class="px-2 py-0.5 rounded text-[10px] font-bold ${cls}">${status} (${diffDays} HARI)</span>`;
}

// Add this to your ui.js
function typeChip(jobId) {
  const id = String(jobId || "").toUpperCase();
  let cls = "bg-indigo-100 text-indigo-700";
  let label = "CT&P";
  
  if (id.startsWith("WDP")) {
    cls = "bg-purple-100 text-purple-700";
    label = "WDP";
  }
  
  return `<span class="px-2 py-0.5 rounded text-[10px] font-bold ${cls}">${label}</span>`;
}

// Add these to ui.js
let currentActiveTab = 'permohonan'; // Default

async function switchTab(tabName) {
    currentActiveTab = tabName;
    
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(btn => {
        if (btn.id === `btn-${tabName}`) {
            // Active: Accent Blue, Solid Background
            btn.className = "tab-btn px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 bg-blue-600 text-white shadow-lg";
        } else {
            // Inactive: Muted text, Transparent
            btn.className = "tab-btn px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 text-slate-400 hover:text-white border border-transparent";
        }
    });

    if (typeof loadJobs === "function") {
        loadJobs(tabName);
    }
}

// THE TYPE CHIP - Use this in your table rendering loop
function typeChip(jobId) {
    const id = String(jobId || "").toUpperCase();
    const isWdp = id.startsWith("WDP");
    
    // Using opacity-based colors to match your translucent UI
    const cls = isWdp 
        ? "bg-purple-500/20 text-purple-400 border-purple-500/30" 
        : "bg-blue-500/20 text-blue-400 border-blue-500/30";
    
    const label = isWdp ? "WDP" : "CTP";

    return `<span class="px-2 py-0.5 rounded border text-[10px] font-black tracking-widest uppercase ${cls}">${label}</span>`;
}
