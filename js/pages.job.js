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

  el("#title").textContent = "Loading.";

  try {
    // ✅ Decide which sheet to query
    // Priority:
    // 1) explicit URL param ?tab=wdp
    // 2) auto-detect from jobId prefix WDP-
    const urlTab = (qsParam("tab") || "").toLowerCase().trim();
    const autoTab = String(jobId).toUpperCase().startsWith("WDP-") ? "wdp" : "";
    const tab = urlTab || autoTab;

    const res = await API.getJob(jobId, tab ? { tab } : {});

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

    // Documents: clickable request letter (still works for both tabs)
    const suratKey = findFirstExistingKey(j, [
      "Upload Surat Permohonan. Pastikan File Dalam Format Pdf",
      "Upload Surat Permohonan",
      "Surat Permohonan",
      "Link Surat Permohonan"
    ]);

    const suratUrl = suratKey ? String(j[suratKey] || "").trim() : "";

    const docsBlock = suratUrl
      ? `
        <div class="md:col-span-2 p-3 rounded-xl border border-slate-200 bg-blue-50">
          <div class="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-1">Surat Permohonan</div>
          <a class="text-blue-700 underline break-words font-semibold" target="_blank" rel="noopener" href="${suratUrl}">${safeText(suratUrl)}</a>
        </div>
      `
      : "";

    // Key fields (curated)
    const curatedKeys = [
      "Nama Pasukan / Unit",
      "Jenis Pemeriksaan",
      "Daerah",
      "Negeri",
      "Zon",
      "Assigned Inspector 1",
      "Assigned Inspector 2",
      "Assigned Date",
      "End Date"
    ];

    const keyHtml = [];
    if (docsBlock) keyHtml.push(docsBlock);

    curatedKeys.forEach(k => {
      const hit = findKeyInsensitive(j, k);
      if (hit) keyHtml.push(kv(hit, j[hit]));
    });

    // Always show Job ID + Status at top (even if headers differ)
    keyHtml.unshift(kv("Status", j["Status"] || "-"));
    keyHtml.unshift(kv("Job ID", j["Job ID"] || jobId));

    el("#key").innerHTML = keyHtml.join("");

    // Full row (audit view)
    const full = Object.keys(j).sort().map(k => kv(k, j[k])).join("");
    el("#full").innerHTML = full;

  } catch (err) {
    el("#title").textContent = "Error";
    el("#key").innerHTML = `<div class="text-rose-600 p-4">Client error: ${safeText(err.message || err)}</div>`;
  }
})();
