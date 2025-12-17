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
