(async function () {
  const jobId = qsParam("jobId");

  function safeText(t) {
    return String(t || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function isUrl(v) {
    return /^https?:\/\//i.test(String(v || "").trim());
  }

  // Helper: Key-Value Renderer
  function kv(k, v) {
    const vv = String(v ?? "").trim();
    const valHtml = isUrl(vv)
      ? `<a class="text-blue-700 underline break-words" target="_blank" rel="noopener" href="${vv}">${safeText(vv)}</a>`
      : `<div class="font-semibold text-slate-900 break-words">${safeText(vv || "-")}</div>`;

    return `
      <div class="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
        <div class="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-1">${safeText(k)}</div>
        ${valHtml}
      </div>
    `;
  }

  function findKeyInsensitive(obj, targetKey) {
    const t = String(targetKey || "").toLowerCase().trim();
    return Object.keys(obj).find(x => String(x || "").toLowerCase().trim() === t);
  }

  function findFirstExistingKey(obj, candidates) {
    for (const k of candidates) {
      const hit = findKeyInsensitive(obj, k);
      if (hit) return hit;
    }
    return "";
  }

  if (!jobId) {
    el("#title").textContent = "Error";
    el("#jobId").textContent = "Missing Job ID";
    return;
  }

  el("#title").textContent = "Loading...";

  try {
    const res = await API.getJob(jobId);

    if (!res.ok) {
      el("#title").textContent = "Job Not Found";
      el("#key").innerHTML = `<div class="text-rose-600 p-4">Server message: ${safeText(res.error || "Unknown error")}</div>`;
      return;
    }

    const j = res.job;

    // Header
    el("#title").textContent = j["Job ID"] || "Job";
    el("#jobId").textContent = j["Job ID"] || "—";
    el("#chips").innerHTML = `${chip(j["Status"])}${prioChip(j["Priority"])}`;
    el("#ts").textContent = j["Timestamp"] ? ("Submitted: " + fmtDate(j["Timestamp"])) : "";

    // ===== Documents: clickable request letter =====
    // Backend key example from your earlier payload:
    // "Upload Surat Permohonan. Pastikan File Dalam Format Pdf"
    const suratKey = findFirstExistingKey(j, [
      "Upload Surat Permohonan. Pastikan File Dalam Format Pdf",
      "Upload Surat Permohonan",
      "Surat Permohonan",
      "Link Surat Permohonan"
    ]);

    const suratUrl = suratKey ? String(j[suratKey] || "").trim() : "";

    // If you later add <div id="docs"></div> in job.html, we can render there.
    // For now: include it inside Key fields as a top item.
    const docsBlock = suratUrl
      ? `
        <div class="md:col-span-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
          <div class="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-2">Surat Permohonan</div>
          <a class="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold"
             target="_blank" rel="noopener" href="${suratUrl}">
            Open request letter
          </a>
          <div class="mt-2 text-xs text-slate-500 break-words">${safeText(suratUrl)}</div>
        </div>
      `
      : `
        <div class="md:col-span-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
          <div class="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-1">Surat Permohonan</div>
          <div class="text-sm text-slate-600">No link provided</div>
        </div>
      `;

    // ===== Key fields (clean allowlist) =====
    // Removed: No Telefon, Bilangan Item, LO values
    const displayKeys = [
      "Nama Pasukan / Unit",
      "Rujuk Surat",
      "Tarikh Surat",
      "Nama Pemohon",
      "Jenis Pemeriksaan",
      "Daerah",
      "Negeri",
      "Zon",
      "Syarikat / Pembekal",
      "No Kontrak",
      "Catatan Tambahan",
      "Assigned Inspector 1",
      "Assigned Inspector 2",
      "Assigned Date",
      "End Date",
      "Dokumen Berkaitan (jika Ada)"
    ];

    const keyHtml = displayKeys.map(k => {
      const exactKey = findKeyInsensitive(j, k);
      return kv(k, exactKey ? j[exactKey] : "");
    }).join("");

    // Docs first, then key fields
    el("#key").innerHTML = docsBlock + keyHtml;

    // Optional: If your UI ever renders full dump in job.html, you can redact there too.
    // This file currently doesn't touch #dump (your older UI may do it elsewhere).

  } catch (e) {
    console.error(e);
    el("#title").textContent = "Connection Error";
  }
})();
