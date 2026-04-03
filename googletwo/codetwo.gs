/* Code2.gs - CT&P Non-Technical Inspection Portal BACKEND */

const CFG = {
  // ── TAB NAMES ──────────────────────────────────────────────────────────────
  // Exact tab names from the sheet (case-sensitive).
  // Sheet: https://docs.google.com/spreadsheets/d/120kexRPIJPwAxK1kr0E68-8mxVKdzcCd5RUJPIH4ekQ
  SHEET_GUNASAMA:  "GUNASAMA",
  SHEET_FAT:       "FAT",
  SHEET_PEMERIKSA: "Pemeriksa",
  SHEET_LOG:       "LogSheet",

  // ── HEADER ROW POSITIONS ────────────────────────────────────────────────────
  // Screenshot confirmed: GUNASAMA headers are at row 1 (data starts row 2).
  // Pemeriksa and LogSheet headers also at row 1.
  ROW_HEADER_GUNASAMA:  1,
  ROW_HEADER_FAT:       1,
  ROW_HEADER_PEMERIKSA: 1,
  ROW_HEADER_LOG:       1,
  // Existing evidence root (update to non-technical folder when ready)
  DRIVE_EVIDENCE_ROOT_FOLDER_ID: "1CIRngT5t29yhj_k9vn3NsTXmPKhBda-P",
  // Add these for movement documents (Borang Tugas Rasmi)
  DRIVE_DOC_ROOT_FOLDER_ID: "19ErRpv0nw_dHIlXF1J4KpEaaJ2D969mF",
  TPL_BORANG_TUGAS_RASMI_ID: "1pOhV-7ad_IqFpLzPHPriQ4rpKO31GwNCaQ6cWKkoJfI",
  TPL_PERINTAH_PERGERAKAN_ID: "1w8GjII7vt4Hn4PsuOqbC2vI9jv74CtJb4dDKuzfMEEI",
  TPL_PERMOHONAN_KENDERAAN_ID: "1roypjaoIyOSeGxAVhFx8DOTlYnQm3WLXczVuOv0N9sw",
  // API isolation guard: keep non-technical backend pinned to its own sheet ecosystem.
  API_DEFAULT_SHEET_ID: "120kexRPIJPwAxK1kr0E68-8mxVKdzcCd5RUJPIH4ekQ",
  API_ALLOW_SHEET_OVERRIDE: false,

};

function onOpen() {
  SpreadsheetApp.getUi().createMenu("CTP Admin")
    .addItem("Supervisor Panel", "showSidebar")
    .addSeparator()
    .addItem("Inspector Panel (Execution)", "showExecutionSidebar")
    .addSeparator()
    .addItem("Install Form Trigger (run once)", "setupFormTrigger")
    .addSeparator()
    .addItem("FLUSH ALL DATA (WIPE)", "wipeTestData")
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("Sidebar")
    .setTitle("Supervisor Assignment & Roster")
    .setWidth(420);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showExecutionSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("ExecutionSidebar")
    .setTitle("CTP Inspection Execution Panel")
    .setWidth(350);
  SpreadsheetApp.getUi().showSidebar(html);
}


/**
 * Triggered on Google Form submission.
 * Wire this up by running setupFormTrigger() once from the Apps Script editor.
 */
function onFormSubmit(e) {
  if (!e) throw new Error("Run setupFormTrigger() to install the trigger, then test via a real form submission.");

  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  const rowNum = range.getRow();
  const rowData = e.values;

  let prefix = "";
  let headerRow = 1;

  if (sheetName === CFG.SHEET_GUNASAMA) {  // "GUNASAMA"
    prefix = "GS";
    headerRow = CFG.ROW_HEADER_GUNASAMA;
  } else if (sheetName === CFG.SHEET_FAT) {
    prefix = "FAT";
    headerRow = CFG.ROW_HEADER_FAT;
  } else {
    return; // ignore other sheets
  }

  const headers = sheet.getRange(headerRow, 1, 1, sheet.getMaxColumns()).getValues()[0];
  const idColIdx = findCol(headers, ["Job ID"]);

  if (idColIdx > -1) {
    const year = Utilities.formatDate(new Date(), "GMT+8", "yyyy");
    // Use rowNum directly (same as code.gs) — gives reliable unique IDs tied to sheet row.
    const jobId = prefix + "-" + year + "-" + String(rowNum).padStart(3, "0");

    sheet.getRange(rowNum, idColIdx + 1).setValue(jobId);

    const statusColIdx = findCol(headers, ["Status"]);
    if (statusColIdx > -1) sheet.getRange(rowNum, statusColIdx + 1).setValue("Pending");

    sendSubmissionEmail(jobId, headers, rowData);
  }
}

/**
 * Run this function ONCE from the Apps Script editor to install the form-submit trigger.
 * After running, check Edit → Triggers to confirm it appears.
 */
function setupFormTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Remove any existing onFormSubmit triggers first to avoid duplicates
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === "onFormSubmit") ScriptApp.deleteTrigger(t);
  });

  ScriptApp.newTrigger("onFormSubmit")
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  SpreadsheetApp.getUi().alert("Trigger installed! onFormSubmit is now wired to form submissions on this spreadsheet.");
}

/* ==========================================
   WEB APP ENTRY POINT (ROUTER)
   ========================================== */

function doGet(e) {
  if (e && e.parameter && e.parameter.action) return handleApi_(e);

  const template = HtmlService.createTemplateFromFile("WebApp");
  return template.evaluate()
    .setTitle("CT&P Inspection Portal")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}
function doPost(e) { return handleApi_(e); }
function handleApi_(e) {
  const p = (e && e.parameter) || {};
  const action = p.action || "ping";

  let result = { ok: false, error: "Unknown action" };

  try {
    if (action === "ping") {
      result = { ok: true, status: "CTP Non-Tek API Alive" };
    } else if (action === "meta") {
      result = apiMeta_();
    } else if (action === "listJobs") {
      result = apiListJobs_(p);
    } else if (action === "getJob") {
      result = apiGetJob_(p);
    } else if (action === "listInspectors") {
      result = apiListInspectors_(p);
    } else {
      result = { ok: false, error: "Unknown action" };
    }
  } catch (err) {
    result = { ok: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheetForApi_(sheetId) {
  const incoming = String(sheetId || "").trim();
  const fixed = String(CFG.API_DEFAULT_SHEET_ID || "").trim();
  const allowOverride = !!CFG.API_ALLOW_SHEET_OVERRIDE;
  const id = (allowOverride && incoming) ? incoming : (fixed || incoming);
  if (!id) return SpreadsheetApp.getActiveSpreadsheet();
  return SpreadsheetApp.openById(id);
}

function apiMeta_() {
  return {
    ok: true,
    app: "CTP Non-Tek API",
    version: "local-router-1",
    tabs: ["permohonan", "wdp", "fat"],
    sheets: {
      permohonan: CFG.SHEET_GUNASAMA,
      wdp: CFG.SHEET_GUNASAMA,
      fat: CFG.SHEET_FAT,
      inspectors: CFG.SHEET_PEMERIKSA
    }
  };
}

function apiListJobs_(params) {
  const p = params || {};
  const q = String(p.q || p.search || "").trim().toLowerCase();
  const statusQ = String(p.status || "").trim().toLowerCase();
  const ss = getSpreadsheetForApi_(p.sheetId);
  const sources = apiJobSources_(p.tab || p.sheet || "");

  let jobs = [];
  sources.forEach(src => {
    jobs = jobs.concat(apiReadSheetObjects_(ss, src.sheetName, src.headerRow, src.tag));
  });

  if (q) {
    jobs = jobs.filter(row => apiRowSearchText_(row).includes(q));
  }

  if (statusQ) {
    jobs = jobs.filter(row => String(row["Status"] || "").trim().toLowerCase() === statusQ);
  }

  jobs.sort((a, b) => apiSortTimeValue_(b) - apiSortTimeValue_(a));
  return { ok: true, jobs: jobs };
}

function apiGetJob_(params) {
  const p = params || {};
  const jobId = String(p.jobId || p.id || "").trim();
  if (!jobId) return { ok: false, error: "Missing jobId" };

  const ss = getSpreadsheetForApi_(p.sheetId);
  const tab = apiNormalizeTab_(p.tab || p.sheet || "");

  if (tab) {
    const sources = apiJobSources_(tab);
    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      const rows = apiReadSheetObjects_(ss, src.sheetName, src.headerRow, src.tag);
      const hit = rows.find(row => String(row["Job ID"] || "").trim() === jobId);
      if (hit) return { ok: true, job: hit };
    }
  }

  const hit = apiLocateJobRow_(ss, jobId);
  if (!hit) return { ok: false, error: "Job ID not found" };

  const rowValues = hit.sheet.getRange(hit.row, 1, 1, hit.sheet.getLastColumn()).getValues()[0];
  return { ok: true, job: apiRowToObject_(hit.headers, rowValues, hit.sheetName || hit.sheet.getName()) };
}

function apiListInspectors_(params) {
  const p = params || {};
  const q = String(p.q || p.search || "").trim().toLowerCase();
  const ss = getSpreadsheetForApi_(p.sheetId);
  const inspectors = apiReadSheetObjects_(ss, CFG.SHEET_PEMERIKSA, CFG.ROW_HEADER_PEMERIKSA, "inspectors");

  const filtered = q
    ? inspectors.filter(row => apiRowSearchText_(row).includes(q))
    : inspectors;

  return { ok: true, inspectors: filtered };
}

function apiJobSources_(tab) {
  const t = apiNormalizeTab_(tab);
  const all = [
    { sheetName: CFG.SHEET_GUNASAMA, headerRow: CFG.ROW_HEADER_GUNASAMA, tag: "gunasama" },
    { sheetName: CFG.SHEET_FAT, headerRow: CFG.ROW_HEADER_FAT, tag: "fat" }
  ];

  if (!t) return all;
  return all.filter(src => src.tag === t);
}

function apiNormalizeTab_(tab) {
  const t = String(tab || "").trim().toLowerCase();
  if (!t) return "";
  if (t.includes("fat")) return "fat";
  if (
    t.includes("wdp") ||
    t.includes("permohonan") ||
    t.includes("ctp") ||
    t.includes("teknikal") ||
    t.includes("technical") ||
    t.includes("gunasama") ||
    t.includes("pg") ||
    t.includes("gs")
  ) return "gunasama";
  return "";
}

function apiReadSheetObjects_(ss, sheetName, headerRow, tag) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) return [];

  const data = sh.getDataRange().getValues();
  if (data.length < headerRow) return [];

  const headers = data[headerRow - 1];
  const out = [];

  for (let r = headerRow; r < data.length; r++) {
    const row = data[r];
    if (apiIsBlankRow_(row)) continue;
    const obj = apiRowToObject_(headers, row, sheetName);
    obj._sheet = sheetName;
    obj.sheetName = sheetName;
    if (tag) obj.source = tag;
    out.push(obj);
  }

  return out;
}

function apiLocateJobRow_(ss, jobId) {
  const candidates = [
    { name: CFG.SHEET_GUNASAMA, headerRow: CFG.ROW_HEADER_GUNASAMA },
    { name: CFG.SHEET_FAT, headerRow: CFG.ROW_HEADER_FAT }
  ];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const sh = ss.getSheetByName(candidate.name);
    if (!sh) continue;

    const data = sh.getDataRange().getValues();
    if (data.length <= candidate.headerRow) continue;

    const headers = data[candidate.headerRow - 1];
    const idxId = findCol(headers, ["Job ID"]);
    if (idxId === -1) continue;

    for (let r = candidate.headerRow; r < data.length; r++) {
      if (String(data[r][idxId] || "").trim() === jobId) {
        return {
          sheet: sh,
          headers: headers,
          row: r + 1,
          sheetName: candidate.name
        };
      }
    }
  }

  return null;
}

function apiRowToObject_(headers, row, sheetName) {
  const obj = {};
  const seen = {};

  for (let i = 0; i < headers.length; i++) {
    let key = apiPrettifyHeader_(headers[i], i);
    if (!key) key = "Column " + (i + 1);

    if (seen[key]) {
      seen[key] += 1;
      key = key + " " + seen[key];
    } else {
      seen[key] = 1;
    }

    obj[key] = apiSerializeCell_(row[i]);
  }

  obj._sheet = sheetName;
  return obj;
}

function apiSerializeCell_(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date && !isNaN(value.getTime())) return value.toISOString();
  return value;
}

function apiIsBlankRow_(row) {
  return !row.some(v => String(v === null || v === undefined ? "" : v).trim() !== "");
}

function apiRowSearchText_(row) {
  return Object.keys(row || {})
    .map(k => String(row[k] === null || row[k] === undefined ? "" : row[k]).toLowerCase())
    .join(" ");
}

function apiSortTimeValue_(row) {
  const candidates = [
    row["Assigned Date"],
    row["End Date"],
    row["Timestamp"],
    row["Tarikh Surat"]
  ];

  for (let i = 0; i < candidates.length; i++) {
    const d = new Date(candidates[i]);
    if (!isNaN(d.getTime())) return d.getTime();
  }

  return 0;
}

function apiPrettifyHeader_(header, idx) {
  const raw = String(header || "").replace(/\s+/g, " ").trim();
  if (!raw) return "";

  const norm = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  const aliases = {
    timestamp: "Timestamp",
    namapasukanunit: "Nama Pasukan / Unit",
    unit: "Nama Pasukan / Unit",
    pasukan: "Nama Pasukan / Unit",
    rujuksurat: "Rujuk Surat",
    tarikhsurat: "Tarikh Surat",
    namapemohon: "Nama Pemohon",
    notelefon: "No Telefon",
    phonenumber: "Phone Number",
    phone: "Phone",
    jenispemeriksaan: "Jenis Pemeriksaan",
    jenis: "Jenis Pemeriksaan",
    daerah: "Daerah",
    negeri: "Negeri",
    zon: "Zon",
    deskripsiperalatan: "Deskripsi Peralatan",
    uploadsuratpermohonanpastikanfiledalamformatpdf: "Upload Surat Permohonan. Pastikan File Dalam Format Pdf",
    uploadarahanpentadbiranpastikanfiledalamformatpdf: "Upload Arahan Pentadbiran. Pastikan File Dalam Format Pdf",
    dokumenyangdiperlukan: "Dokumen Yang Diperlukan",
    jumlahdokumendiperlukan: "Jumlah Dokumen Diperlukan",
    lokasipemeriksaan: "Lokasi Pemeriksaan",
    lokasifat: "Lokasi FAT",
    status: "Status",
    priority: "Priority",
    assignedinspector1: "Assigned Inspector 1",
    assignedinspector2: "Assigned Inspector 2",
    assigneddate: "Assigned Date",
    enddate: "End Date",
    recommendedinspector1: "Recommended Inspector 1",
    recommendedinspector2: "Recommended Inspector 2",
    jobid: "Job ID",
    inspectorstructureddata: "Inspector Structured Data",
    lampiranbukti: "Lampiran Bukti",
    maklumbalas: "Maklumbalas",
    lat: "Lat",
    lng: "Lng",
    namapemeriksa: "Nama Pemeriksa",
    pangkat: "Pangkat",
    penjawatan: "Penjawatan",
    specialization: "Specialization",
    kepakaran: "Specialization",
    baselocation: "Base Location",
    photo: "Photo",
    photourl: "Photo URL",
    email: "Email"
  };

  if (aliases[norm]) return aliases[norm];
  if (raw === "[object Object]") return "Column " + (idx + 1);
  return raw;
}

/* ==========================================
   SUPERVISOR PANEL DATA
   ========================================== */

function getSidebarData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  function pullPendingJobs_(sheetName, headerRow) {
    const sh = ss.getSheetByName(sheetName);
    if (!sh) return [];

    const data = sh.getDataRange().getValues();
    if (data.length < headerRow) return [];

    const headers = data[headerRow - 1];

    const hJob = {
      id: findCol(headers, ["Job ID"]),
      unit: findCol(headers, ["Nama pasukan / unit", "Nama Pasukan / Unit", "Unit"]),
      status: findCol(headers, ["Status"]),
      zon: findCol(headers, ["Zon"]),
      negeri: findCol(headers, ["Negeri"]),
      daerah: findCol(headers, ["Daerah"]),
      jenis: findCol(headers, ["Jenis pemeriksaan", "Jenis Pemeriksaan", "Jenis"]),
    };

    const out = [];

    for (let r = headerRow; r < data.length; r++) {
      const row = data[r];
      const id = hJob.id > -1 ? String(row[hJob.id]).trim() : "";
      if (!id) continue;

      const st = hJob.status > -1 ? String(row[hJob.status]).toLowerCase().trim() : "";
      const isPending = (st === "" || st.includes("pending"));

      if (isPending) {
        out.push({
          id,
          unit: hJob.unit > -1 ? String(row[hJob.unit]) : "Unknown Unit",
          zon: hJob.zon > -1 ? String(row[hJob.zon]) : "",
          negeri: hJob.negeri > -1 ? String(row[hJob.negeri]) : "",
          daerah: hJob.daerah > -1 ? String(row[hJob.daerah]) : "",
          jenis: hJob.jenis > -1 ? String(row[hJob.jenis]) : "General",
          _sheet: sheetName
        });
      }
    }
    return out;
  }

  const pendingJobs = []
    .concat(pullPendingJobs_(CFG.SHEET_GUNASAMA, CFG.ROW_HEADER_GUNASAMA))
    .concat(pullPendingJobs_(CFG.SHEET_FAT, CFG.ROW_HEADER_FAT));

  const roster = getFullRosterData();

  const availableInspectors = roster
    .filter(i => {
      const s = String(i.status || "").toLowerCase();
      return s.includes("aktif") || s.includes("telah ditugaskan");
    })
    .map(i => i.name);

  return { jobs: pendingJobs, inspectors: availableInspectors };
}

/* ==========================================
   ASSIGNMENT WITH CONFLICT DETECTION
   ========================================== */

function processAssignment(formObject) {
  const ids = Array.isArray(formObject.jobIds) ? formObject.jobIds : [formObject.jobIds];
  if (!ids || ids.length === 0) return { ok: false, error: "No jobs selected" };

  const insp1 = String(formObject.insp1 || "").trim();
  const insp2 = String(formObject.insp2 || "").trim();
  if (!insp1) return { ok: false, error: "Inspector 1 required" };

  const startDate = new Date(formObject.startDate);
  const endDate = formObject.endDate ? new Date(formObject.endDate) : null;

  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) return { ok: false, error: "Invalid start date" };

  const win = normalizeDateWindow_(startDate, endDate);

  const c1 = getInspectorConflicts_(insp1, win.start, win.end);
  const c2 = insp2 ? getInspectorConflicts_(insp2, win.start, win.end) : [];

  if (c1.length || c2.length) {
    return { ok: false, error: "Date conflict detected", conflicts: { insp1: c1, insp2: c2 } };
  }

  // detect target sheet by prefix (first id)
  const firstId = String(ids[0]);
  let sheetName = CFG.SHEET_GUNASAMA;
  let headerRow = CFG.ROW_HEADER_GUNASAMA;

  if (firstId.startsWith("FAT")) { sheetName = CFG.SHEET_FAT; headerRow = CFG.ROW_HEADER_FAT; }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(sheetName);
  if (!sh) return { ok: false, error: "Target sheet not found" };

  const data = sh.getDataRange().getValues();
  const headers = data[headerRow - 1];

  const h = {
    id: findCol(headers, ["Job ID"]),
    status: findCol(headers, ["Status"]),
    a1: findCol(headers, ["Assigned Inspector 1"]),
    a2: findCol(headers, ["Assigned Inspector 2"]),
    start: findCol(headers, ["Assigned Date", "Tarikh Mula"]),
    end: findCol(headers, ["End Date", "Tarikh Tamat"]),
    unit: findCol(headers, ["Nama pasukan / unit", "Unit"]),
    jenis: findCol(headers, ["Jenis pemeriksaan", "Jenis"]),
    daerah: findCol(headers, ["Daerah"]),
    negeri: findCol(headers, ["Negeri"]),
    desc: findCol(headers, ["Deskripsi Peralatan", "Keterangan", "Catatan"]),
  };

  const today = new Date(); today.setHours(0,0,0,0);
  const startCheck = new Date(win.start); startCheck.setHours(0,0,0,0);

  let newInspectorStatus = "Telah Ditugaskan";
  if (startCheck <= today) newInspectorStatus = "Sedang Bertugas";

  const units = new Set();
  const types = new Set();
  const daerahs = new Set();
  const negeris = new Set();
  const descs = new Set();

  for (let r = headerRow; r < data.length; r++) {
    const rowId = String(data[r][h.id] || "").trim();
    if (!rowId) continue;
    if (!ids.includes(rowId)) continue;

    if (h.status > -1) sh.getRange(r + 1, h.status + 1).setValue("Assigned");
    if (h.start > -1) sh.getRange(r + 1, h.start + 1).setValue(win.start);
    if (h.end > -1) sh.getRange(r + 1, h.end + 1).setValue(win.end);
    if (h.a1 > -1) sh.getRange(r + 1, h.a1 + 1).setValue(insp1);
    if (h.a2 > -1) sh.getRange(r + 1, h.a2 + 1).setValue(insp2);

    if (h.unit > -1) units.add(String(data[r][h.unit] || ""));
    if (h.jenis > -1) types.add(String(data[r][h.jenis] || ""));
    if (h.daerah > -1) daerahs.add(String(data[r][h.daerah] || ""));
    if (h.negeri > -1) negeris.add(String(data[r][h.negeri] || ""));
    if (h.desc > -1) descs.add(String(data[r][h.desc] || ""));
  }

  writeLog(ids.join(","), "Assignment", `Assigned to: ${insp1}, ${insp2}`);

  updateInspectorStatus(insp1, newInspectorStatus, true);
  if (insp2) updateInspectorStatus(insp2, newInspectorStatus, true);

  try {
    sendAssignmentNotification(
      insp1, insp2,
      Array.from(units).filter(Boolean), Array.from(types).filter(Boolean),
      win.start, win.end,
      Array.from(daerahs).filter(Boolean), Array.from(negeris).filter(Boolean),
      Array.from(descs).filter(Boolean)
    );
  } catch (e) {
    console.error("Assignment email failed: " + e);
  }

  return { ok: true, message: `Assigned ${ids.length} job(s) successfully.` };
}

/* ==========================================
   CANCEL + REASSIGN
   ========================================== */

function cancelJob(jobId, reason) {
  const hit = locateJobRow_(jobId);
  if (!hit) throw new Error("Job not found: " + jobId);

  const { sheet, headers, row } = hit;

  const idxStatus = findCol(headers, ["Status"]);
  const idxInsp1 = findCol(headers, ["Assigned Inspector 1"]);
  const idxInsp2 = findCol(headers, ["Assigned Inspector 2"]);

  const insp1 = idxInsp1 > -1 ? String(sheet.getRange(row, idxInsp1 + 1).getValue() || "").trim() : "";
  const insp2 = idxInsp2 > -1 ? String(sheet.getRange(row, idxInsp2 + 1).getValue() || "").trim() : "";

  if (idxStatus > -1) sheet.getRange(row, idxStatus + 1).setValue("Cancelled");

  writeLog(jobId, "Cancel", reason || "Cancelled");

  refreshInspectorStatus_(insp1);
  refreshInspectorStatus_(insp2);

  return { ok: true, message: "Cancelled " + jobId };
}

function reassignJob(jobId, insp1, insp2, startDate, endDate) {
  const hit = locateJobRow_(jobId);
  if (!hit) throw new Error("Job not found: " + jobId);

  const win = normalizeDateWindow_(new Date(startDate), endDate ? new Date(endDate) : null);

  const c1 = getInspectorConflicts_(insp1, win.start, win.end, jobId);
  const c2 = insp2 ? getInspectorConflicts_(insp2, win.start, win.end, jobId) : [];

  if (c1.length || c2.length) return { ok: false, error: "Date conflict detected", conflicts: { insp1: c1, insp2: c2 } };

  const { sheet, headers, row } = hit;

  const idxStatus = findCol(headers, ["Status"]);
  const idxInsp1 = findCol(headers, ["Assigned Inspector 1"]);
  const idxInsp2 = findCol(headers, ["Assigned Inspector 2"]);
  const idxStart = findCol(headers, ["Assigned Date", "Tarikh Mula"]);
  const idxEnd = findCol(headers, ["End Date", "Tarikh Tamat"]);

  const old1 = idxInsp1 > -1 ? String(sheet.getRange(row, idxInsp1 + 1).getValue() || "").trim() : "";
  const old2 = idxInsp2 > -1 ? String(sheet.getRange(row, idxInsp2 + 1).getValue() || "").trim() : "";

  if (idxStatus > -1) sheet.getRange(row, idxStatus + 1).setValue("Assigned");
  if (idxStart > -1) sheet.getRange(row, idxStart + 1).setValue(win.start);
  if (idxEnd > -1) sheet.getRange(row, idxEnd + 1).setValue(win.end);
  if (idxInsp1 > -1) sheet.getRange(row, idxInsp1 + 1).setValue(insp1);
  if (idxInsp2 > -1) sheet.getRange(row, idxInsp2 + 1).setValue(insp2);

  writeLog(jobId, "Reassign", `Old: ${old1}, ${old2} -> New: ${insp1}, ${insp2}`);

  refreshInspectorStatus_(old1);
  refreshInspectorStatus_(old2);
  refreshInspectorStatus_(insp1);
  refreshInspectorStatus_(insp2);

  return { ok: true, message: "Reassigned " + jobId };
}

/* ==========================================
   INSPECTOR / EXECUTION
   ========================================== */

function getInspectorDropdown() {
  const roster = getFullRosterData();
  return roster
    .filter(i => {
      const s = String(i.status || "").toLowerCase();
      return s.includes("aktif") || s.includes("telah ditugaskan") || s.includes("bertugas");
    })
    .map(i => i.name);
}

function getJobsByInspectorName(inspectorName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsToSearch = [CFG.SHEET_GUNASAMA, CFG.SHEET_FAT];
  const searchName = String(inspectorName || "").trim();
  const searchNameLower = searchName.toLowerCase();
  const jobs = [];

  if (!searchName) return jobs;

  sheetsToSearch.forEach(shName => {
    const cfg = getSheetCfg_(shName);
    const sheet = ss.getSheetByName(shName);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    if (data.length <= cfg.headerRow) return;

    const headers = data[cfg.headerRow - 1];
    const col = {
      status: findCol(headers, ["Status"]),
      insp1: findCol(headers, ["Assigned Inspector 1"]),
      insp2: findCol(headers, ["Assigned Inspector 2"]),
      id: findCol(headers, ["Job ID"]),
      unit: findCol(headers, ["Nama pasukan / unit", "Unit"]),
      daerah: findCol(headers, ["Daerah"]),
      negeri: findCol(headers, ["Negeri"]),
      desc: findCol(headers, ["Deskripsi Peralatan", "Keterangan", "Catatan"]),
      start: findCol(headers, ["Assigned Date", "Tarikh Mula", "Tarikh Penugasan"]),
      end: findCol(headers, ["End Date", "Tarikh Tamat"]),
      struct: findCol(headers, ["Inspector Structured Data", "Structured Data"]),
      notes: findCol(headers, ["Maklumbalas", "Maklum Balas", "Ulasan Pemeriksa", "Ulasan", "Catatan Pemeriksa"]),
      tarikhPemeriksaan: findCol(headers, ["Tarikh Pemeriksaan", "Tarikh pemeriksaan", "Inspection Date"]),
      labSentCtp: findColWithSafeFallback_(headers, ["Tarikh Hantar Sampel Ke Makmal CT&P", "Tarikh Hantar Sampel ke Makmal CT&P"], "T"),
      labSentStride: findColWithSafeFallback_(headers, ["Tarikh Hantar Sampel ke Makmal STRIDE"], "U"),
      labReportReceived: findColWithSafeFallback_(headers, ["Tarikh Terima Laporan Makmal CT&P/STRIDE"], "V"),
      reportResult: findColWithSafeFallback_(headers, ["Report Result"], "Y"),
      zon: findCol(headers, ["Zon"])
    };

    if (col.id === -1 || col.status === -1) return;

    const fmtDate = (value) => {
      const converted = toSheetDateValue_(value);
      if (Object.prototype.toString.call(converted) === "[object Date]" && !isNaN(converted.getTime())) {
        return Utilities.formatDate(converted, "GMT+8", "dd/MM/yyyy");
      }
      return String(value || "");
    };

    for (let i = cfg.headerRow; i < data.length; i++) {
      const row = data[i];
      const jobId = col.id > -1 ? String(row[col.id] || "").trim() : "";
      if (!jobId) continue;

      const statusValue = col.status > -1 ? row[col.status] : "";
      const status = normalizeExecStatus_(statusValue);
      const inspector1Value = col.insp1 > -1 ? row[col.insp1] : "";
      const inspector2Value = col.insp2 > -1 ? row[col.insp2] : "";
      const i1 = String(inspector1Value || "").toLowerCase();
      const i2 = String(inspector2Value || "").toLowerCase();

      const nameMatch =
        inspectorNameMatches_(inspector1Value, searchName) ||
        inspectorNameMatches_(inspector2Value, searchName) ||
        i1.includes(searchNameLower) ||
        i2.includes(searchNameLower);
      const activeStatus =
        status.includes("assigned") ||
        status.includes("progress") ||
        status.includes("issue") ||
        status.includes("bertugas") ||
        status.includes("ditugas");

      if (!(nameMatch && activeStatus)) continue;

      const struct = col.struct > -1 ? parseInspectorExecStruct_(row[col.struct]) : {};

      jobs.push({
        "Job ID": jobId,
        "Unit": col.unit > -1 ? row[col.unit] : "",
        "Status": firstNonBlankValue_([statusValue, "Assigned"]),
        "Daerah": col.daerah > -1 ? row[col.daerah] : "",
        "Negeri": col.negeri > -1 ? row[col.negeri] : "",
        "Assigned Inspector 1": col.insp1 > -1 ? row[col.insp1] : "",
        "Assigned Inspector 2": col.insp2 > -1 ? row[col.insp2] : "",
        "Assigned Date": col.start > -1 ? fmtDate(row[col.start]) : "",
        "End Date": col.end > -1 ? fmtDate(row[col.end]) : "",
        "Deskripsi": col.desc > -1 ? row[col.desc] : "-",
        "Zon": col.zon > -1 ? String(row[col.zon] || "") : "",
        "Tarikh Pemeriksaan": firstNonBlankValue_([
          col.tarikhPemeriksaan > -1 ? fmtDate(row[col.tarikhPemeriksaan]) : "",
          fmtDate(struct["Tarikh Pemeriksaan"])
        ]),
        "reportNotes": firstNonBlankValue_([
          col.notes > -1 ? row[col.notes] : "",
          struct["Laporan Ringkas"]
        ]),
        "labSentCtp": firstNonBlankValue_([
          col.labSentCtp > -1 ? row[col.labSentCtp] : "",
          struct["Tarikh Hantar Sampel Ke Makmal CT&P"],
          struct["Tarikh Hantar Sampel ke Makmal CT&P"]
        ]),
        "labSentStride": firstNonBlankValue_([
          col.labSentStride > -1 ? row[col.labSentStride] : "",
          struct["Tarikh Hantar Sampel ke Makmal STRIDE"]
        ]),
        "labReportReceived": firstNonBlankValue_([
          col.labReportReceived > -1 ? row[col.labReportReceived] : "",
          struct["Tarikh Terima Laporan Makmal CT&P/STRIDE"]
        ]),
        "reportResult": firstNonBlankValue_([
          col.reportResult > -1 ? row[col.reportResult] : "",
          struct["Report Result"]
        ]),
        "_sheet": shName
      });
    }
  });

  jobs.sort((a, b) => {
    const byStatus = inspectorExecStatusRank_(a["Status"]) - inspectorExecStatusRank_(b["Status"]);
    if (byStatus !== 0) return byStatus;

    const byDate = inspectorExecTime_(b["Assigned Date"] || b["Tarikh Pemeriksaan"]) - inspectorExecTime_(a["Assigned Date"] || a["Tarikh Pemeriksaan"]);
    if (byDate !== 0) return byDate;

    return String(a["Job ID"] || "").localeCompare(String(b["Job ID"] || ""), undefined, {
      numeric: true,
      sensitivity: "base"
    });
  });

  return jobs;
}

function updateJobStatusFromSidebar(jobId, newStatus, inspectorName, reportText, extraData) {
  const hit = locateJobRow_(jobId);
  if (!hit) throw new Error("Job ID not found: " + jobId);

  const { sheet, headers, row } = hit;
  let extra = extraData || {};
  if (typeof extra === "string") {
    try { extra = JSON.parse(extra); } catch (e) { extra = {}; }
  }

  const colId = findCol(headers, ["Job ID"]);
  const colStatus = findCol(headers, ["Status"]);
  const colStruct = findCol(headers, ["Inspector Structured Data", "Structured Data"]);
  const colNotes = findCol(headers, ["Maklumbalas", "Maklum Balas", "Ulasan Pemeriksa", "Ulasan", "Catatan Pemeriksa"]);
  const colTarikhPemeriksaan = findCol(headers, ["Tarikh Pemeriksaan", "Tarikh pemeriksaan", "Inspection Date"]);
  const colInsp1 = findCol(headers, ["Assigned Inspector 1"]);
  const colInsp2 = findCol(headers, ["Assigned Inspector 2"]);
  if (colId === -1 || colStatus === -1) throw new Error("Crucial columns (ID/Status) not found");

  const currentStatus = String(sheet.getRange(row, colStatus + 1).getValue() || "").trim();
  const nextStatus = String(newStatus || currentStatus || "Assigned").trim();
  const noteText = String(reportText || "").trim();

  sheet.getRange(row, colStatus + 1).setValue(nextStatus);

  // extract DD/MM/YYYY from reportText for Tarikh Pemeriksaan
  const m = noteText.match(/(\d{2}\/\d{2}\/\d{4})/);
  const tarikhPemeriksaan = m ? m[1] : "";

  // Write directly to Tarikh Pemeriksaan column if it exists in this sheet
  if (colTarikhPemeriksaan > -1 && tarikhPemeriksaan) {
    sheet.getRange(row, colTarikhPemeriksaan + 1).setValue(tarikhPemeriksaan);
  }
  if (colNotes > -1) {
    sheet.getRange(row, colNotes + 1).setValue(noteText);
  }

  if (colStruct > -1) {
    const existingStruct = parseInspectorExecStruct_(sheet.getRange(row, colStruct + 1).getValue());
    const reportObj = Object.assign({}, existingStruct, {
      "Job ID": String(jobId || "").trim(),
      "Status": nextStatus,
      "Laporan Ringkas": noteText,
      "Tarikh Pemeriksaan": tarikhPemeriksaan,
      "Pemeriksa": String(inspectorName || "").trim(),
      "submitDate": new Date().toISOString()
    });

    if (Object.prototype.hasOwnProperty.call(extra, "labSentCtp")) {
      reportObj["Tarikh Hantar Sampel Ke Makmal CT&P"] = String(extra.labSentCtp || "").trim();
    }
    if (Object.prototype.hasOwnProperty.call(extra, "labSentStride")) {
      reportObj["Tarikh Hantar Sampel ke Makmal STRIDE"] = String(extra.labSentStride || "").trim();
    }
    if (Object.prototype.hasOwnProperty.call(extra, "labReportReceived")) {
      reportObj["Tarikh Terima Laporan Makmal CT&P/STRIDE"] = String(extra.labReportReceived || "").trim();
    }
    if (Object.prototype.hasOwnProperty.call(extra, "reportResult")) {
      reportObj["Report Result"] = String(extra.reportResult || "").trim();
    }

    sheet.getRange(row, colStruct + 1).setValue(JSON.stringify(reportObj));
  }


  writeLog(jobId, "Inspector Update", `${inspectorName} set status to ${nextStatus}`);

  // Inspector Exec jobs only leave the list when completed.
  if (isInspectorExecCompletedStatus_(nextStatus)) {
    const assigned = [
      colInsp1 > -1 ? String(sheet.getRange(row, colInsp1 + 1).getValue() || "").trim() : "",
      colInsp2 > -1 ? String(sheet.getRange(row, colInsp2 + 1).getValue() || "").trim() : ""
    ].filter(Boolean);

    assigned.forEach(name => refreshInspectorStatus_(name));
  } else if (inspectorName) {
    updateInspectorStatus(inspectorName, "Sedang Bertugas", true);
  }

  return `Updated ${jobId}`;
}

function normalizeInspectorName_(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function compactInspectorName_(value) {
  return normalizeInspectorName_(value).replace(/[^a-z0-9]/g, "");
}

function normalizeExecStatus_(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function inspectorNameMatches_(cellValue, targetName) {
  const cellRaw = String(cellValue || "").trim();
  const targetRaw = String(targetName || "").trim();
  if (!cellRaw || !targetRaw) return false;

  const target = normalizeInspectorName_(targetRaw);
  const targetCompact = compactInspectorName_(targetRaw);
  const parts = cellRaw
    .split(/[\n,;/&]+|\s+\band\b\s+|\s+\bdan\b\s+/i)
    .map(x => String(x || "").trim())
    .filter(Boolean);

  const candidates = parts.length ? parts : [cellRaw];
  return candidates.some(candidate => {
    const cell = normalizeInspectorName_(candidate);
    const cellCompact = compactInspectorName_(candidate);
    if (!cell || !target) return false;
    return (
      cell === target ||
      cell.includes(target) ||
      target.includes(cell) ||
      (!!cellCompact && !!targetCompact && (
        cellCompact === targetCompact ||
        cellCompact.includes(targetCompact) ||
        targetCompact.includes(cellCompact)
      ))
    );
  });
}

function isInspectorExecCompletedStatus_(status) {
  const s = normalizeExecStatus_(status);
  return s.includes("completed") || s.includes("selesai");
}

function inspectorExecStatusRank_(status) {
  const s = normalizeExecStatus_(status);
  if (s.includes("in progress") || s.includes("progress") || s.includes("bertugas")) return 0;
  if (s.includes("with issue") || s.includes("issue")) return 1;
  if (s.includes("assigned") || s.includes("ditugas")) return 2;
  if (s.includes("cancel")) return 4;
  return 3;
}

function inspectorExecTime_(value) {
  const converted = toSheetDateValue_(value);
  if (Object.prototype.toString.call(converted) === "[object Date]" && !isNaN(converted.getTime())) {
    return converted.getTime();
  }
  return 0;
}

function parseInspectorExecStruct_(raw) {
  const s = String(raw || "").trim();
  if (!s) return {};
  try {
    const obj = JSON.parse(s);
    return (obj && typeof obj === "object") ? obj : {};
  } catch (e) {
    return {};
  }
}

function firstNonBlankValue_(values) {
  const arr = Array.isArray(values) ? values : [values];
  for (let i = 0; i < arr.length; i++) {
    const value = arr[i];
    if (value === null || value === undefined) continue;
    if (Object.prototype.toString.call(value) === "[object Date]") {
      if (!isNaN(value.getTime())) return value;
      continue;
    }
    if (String(value).trim() !== "") return value;
  }
  return "";
}

/* ==========================================
   SCHEDULE VIEW DATA (ACTIVE JOBS)
   ========================================== */

function getAllActiveJobs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = [CFG.SHEET_GUNASAMA, CFG.SHEET_FAT];
  const out = [];

  sheets.forEach(name => {
    const cfg = getSheetCfg_(name);
    const sh = ss.getSheetByName(name);
    if (!sh) return;

    const data = sh.getDataRange().getValues();
    if (data.length <= cfg.headerRow) return;

    const headersRaw = data[cfg.headerRow - 1];
    const headers = headersRaw.map(h => String(h).toLowerCase().trim());

    const idxId = findColIndex_(headers, ["job id"]);
    const idxUnit = findColIndex_(headers, ["unit", "nama pasukan", "pasukan"]);
    const idxStart = findColIndex_(headers, ["assigned date", "tarikh mula"]);
    const idxEnd = findColIndex_(headers, ["end date", "tarikh tamat"]);
    const idxStatus = findColIndex_(headers, ["status"]);
    const idxInsp1 = findColIndex_(headers, ["assigned inspector 1"]);
    const idxInsp2 = findColIndex_(headers, ["assigned inspector 2"]);

    if (idxId === -1 || idxStart === -1 || idxStatus === -1) return;

    for (let r = cfg.headerRow; r < data.length; r++) {
      const row = data[r];
      const status = String(row[idxStatus] || "").toLowerCase();
      const isActive = status.includes("assigned") || status.includes("progress") || status.includes("completed");
      if (!isActive) continue;

      let dateStart = row[idxStart];
      if (!dateStart) continue;
      if (!(dateStart instanceof Date)) dateStart = new Date(dateStart);

      let dateEnd = (idxEnd > -1) ? row[idxEnd] : null;
      if (!dateEnd || dateEnd === "") dateEnd = dateStart;
      if (!(dateEnd instanceof Date)) dateEnd = new Date(dateEnd);

      try {
        out.push({
          id: String(row[idxId]),
          unit: String(row[idxUnit] || "Unknown"),
          start: Utilities.formatDate(dateStart, "GMT+8", "yyyy-MM-dd"),
          end: Utilities.formatDate(dateEnd, "GMT+8", "yyyy-MM-dd"),
          status: String(row[idxStatus] || ""),
          insp1: (idxInsp1 > -1 && row[idxInsp1]) ? String(row[idxInsp1]) : "Unassigned",
          insp2: (idxInsp2 > -1 && row[idxInsp2]) ? String(row[idxInsp2]) : "-"
        });
      } catch (e) {
        console.log("Date parse error row " + r + ": " + e);
      }
    }
  });

  return out;
}

/* ==========================================
   REFERENCE TAB DATA (Gunasama only)
   Header row is ROW_HEADER_* (row 1)
   ========================================== */
function getReferenceData(filters) {
  filters = filters || {};
  const searchQ = String(filters.search || filters.query || "").trim().toLowerCase();
  const monthQ = String(filters.monthKey || "").trim();

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sources = [
    { sheetName: CFG.SHEET_GUNASAMA, headerRow: CFG.ROW_HEADER_GUNASAMA, tag: "Gunasama" }
  ];

  const out = [];

  sources.forEach(src => {
    const sh = ss.getSheetByName(src.sheetName);
    if (!sh) return;

    const data = sh.getDataRange().getValues();
    if (data.length < src.headerRow) return;

    const headers = data[src.headerRow - 1];

    // Required columns (best effort by name)
    const idxTs    = findCol(headers, ["Timestamp", "Time stamp", "Tarikh", "Masa"]);
    const idxUnit  = findCol(headers, ["Nama pasukan / unit", "Nama Pasukan / Unit", "Unit", "Pasukan"]);
    const idxSurat = findCol(headers, ["Tarikh Surat", "Tarikh surat"]);
    const idxUp    = findCol(headers, ["Upload Arahan Pentadbiran. Pastikan file dalam format PDF", "Upload surat permohonan. Pastikan file dalam format PDF", "Upload Surat Permohonan", "Upload Surat", "Lampiran Bukti"]);
    const idxPemohon = findCol(headers, ["Nama Pemohon", "Nama pemohon"]);
    const idxTel     = findCol(headers, ["No Telefon", "No telefon", "No. Telefon", "Telefon", "Phone"]);


    // If we can't find at least timestamp + unit, skip this sheet
    if (idxTs === -1 || idxUnit === -1) return;

    for (let r = src.headerRow; r < data.length; r++) {
      const row = data[r];

      const tsRaw = row[idxTs];
      const unitRaw = row[idxUnit];

      if (!tsRaw && !unitRaw) continue;

      const ts = normalizeToDate_(tsRaw);
      const surat = (idxSurat > -1) ? normalizeToDate_(row[idxSurat]) : null;

      const uploadVal = (idxUp > -1) ? String(row[idxUp] || "").trim() : "";
      const uploadUrl = extractUrl_(uploadVal);

      // month key uses timestamp (if missing, still return row but month will be "Unknown")
      const monthKey = ts ? Utilities.formatDate(ts, "GMT+8", "yyyy-MM") : "Unknown";
      const pemohon = (idxPemohon > -1) ? String(row[idxPemohon] || "").trim() : "";
      const tel     = (idxTel > -1) ? String(row[idxTel] || "").trim() : "";


      out.push({
        monthKey: monthKey,                                // e.g. "2026-01"
        timestamp: ts ? fmtDMY_(ts) : "",                  // dd/MM/yyyy
        unit: String(unitRaw || "").trim(),
        pemohon: pemohon,
        telefon: tel,
        tarikhSurat: surat ? fmtDMY_(surat) : "",
        uploadUrl: uploadUrl,
        source: src.tag
      });
    }
  });

  // Sort newest first (by monthKey, then timestamp string)
  out.sort((a, b) => String(b.monthKey).localeCompare(String(a.monthKey)) || String(b.timestamp).localeCompare(String(a.timestamp)));

  let rows = out;
  if (monthQ) {
    rows = rows.filter(r => String(r.monthKey || "") === monthQ);
  }
  if (searchQ) {
    rows = rows.filter(r => referenceSearchText_(r).includes(searchQ));
  }

  return rows;
}

/* --- helpers for Reference tab --- */
function normalizeToDate_(v) {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v.getTime())) {
    const d = new Date(v); d.setHours(0,0,0,0);
    return d;
  }
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  d.setHours(0,0,0,0);
  return d;
}

function fmtDMY_(d) {
  return Utilities.formatDate(new Date(d), "GMT+8", "dd/MM/yyyy");
}

function extractUrl_(text) {
  const s = String(text || "").trim();
  if (!s) return "";
  // If the cell already is a URL or contains one, extract first http(s)
  const m = s.match(/https?:\/\/[^\s)]+/i);
  return m ? m[0] : s;
}

function referenceSearchText_(row) {
  const r = row || {};
  return [
    r.monthKey,
    r.timestamp,
    r.unit,
    r.pemohon,
    r.telefon,
    r.tarikhSurat,
    r.uploadUrl,
    r.source
  ].map(v => String(v || "").toLowerCase()).join(" ");
}

/* ==========================================
   ROSTER
   ========================================== */

function getFullRosterData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(CFG.SHEET_PEMERIKSA);
  if (!sh) return [];

  const data = sh.getDataRange().getValues();
  if (data.length <= CFG.ROW_HEADER_PEMERIKSA) return [];

  const headers = data[CFG.ROW_HEADER_PEMERIKSA - 1];
  const h = {
    name: findCol(headers, ["Nama Pemeriksa"]),
    status: findCol(headers, ["Status"]),
    rank: findCol(headers, ["Pangkat"])
  };

  return data.slice(CFG.ROW_HEADER_PEMERIKSA).map(row => ({
    name: String(row[h.name] || "").trim(),
    status: String(row[h.status] || "").trim(),
    rank: String(row[h.rank] || "").trim()
  })).filter(i => i.name !== "");
}

function updateInspectorStatus(name, newStatus, silent = false) {
  if (!name) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(CFG.SHEET_PEMERIKSA);
  if (!sh) return;

  const data = sh.getDataRange().getValues();
  const headers = data[CFG.ROW_HEADER_PEMERIKSA - 1];
  const nIdx = findCol(headers, ["Nama Pemeriksa"]);
  const sIdx = findCol(headers, ["Status"]);

  for (let i = CFG.ROW_HEADER_PEMERIKSA; i < data.length; i++) {
    if (String(data[i][nIdx]).trim() === String(name).trim()) {
      sh.getRange(i + 1, sIdx + 1).setValue(newStatus);
      if (!silent) writeLog(name, "Status Change", newStatus);
      return;
    }
  }
}

/* ==========================================
   EVIDENCE UPLOAD (BACKEND READY)
   ========================================== */
/**
 * Upload evidence to Drive under folder Evidence/<JOB_ID>/
 * base64Data should be raw base64 string (no data: prefix)
 */
function uploadEvidence(jobId, fileName, mimeType, base64Data) {
  if (!jobId) throw new Error("jobId required");
  if (!fileName) fileName = "evidence";
  if (!mimeType) mimeType = "application/octet-stream";
  if (!base64Data) throw new Error("No data");

  const root = getOrCreateRootFolder_(CFG.DRIVE_EVIDENCE_ROOT_FOLDER_ID, "CTP_PORTAL_NONTEK");
  const evidenceRoot = getOrCreateSubFolder_(root, "Evidence");
  const jobFolder = getOrCreateSubFolder_(evidenceRoot, String(jobId));

  const bytes = Utilities.base64Decode(base64Data);
  const blob = Utilities.newBlob(bytes, mimeType, fileName);
  const file = jobFolder.createFile(blob);

  writeLog(jobId, "Evidence Upload", `${file.getName()} (${file.getMimeType()})`);
  return { ok: true, fileId: file.getId(), url: file.getUrl(), name: file.getName() };
}

/* ==========================================
   DOKUMEN PERGERAKAN (PLACEHOLDER ONLY)
   ========================================== */
function movementModulePlaceholder() {
  return { ok: true, message: "Dokumen Pergerakan placeholder only. Will be implemented later." };
}

/* ==========================================
   DOKUMEN PERGERAKAN - BORANG TUGAS RASMI (LIVE)
   ========================================== */

function generateBorangTugasRasmi(payload) {
  payload = payload || {};
  const inspectorName = String(payload.inspectorName || "").trim();
  const jobIds = Array.isArray(payload.jobIds) ? payload.jobIds : [];
  const docsOnly = !!payload.docsOnly;

  if (!inspectorName) return { ok: false, error: "inspectorName required" };
  if (!jobIds.length) return { ok: false, error: "No job selected" };

  // Read data for each job
  const rows = jobIds.map(id => locateJobRow_(id)).filter(Boolean);
  if (!rows.length) return { ok: false, error: "Jobs not found" };

  const units = new Set();
  const negeris = new Set();
  const jenises = new Set();

  let insp1 = "";
  let insp2 = "";

  // Dates: safest for multi-job is min(start) and max(end)
  let minStart = null;
  let maxEnd = null;

  rows.forEach(hit => {
    const { sheet, headers, row } = hit;

    const idxUnit   = findCol(headers, ["Nama pasukan / unit", "Nama Pasukan / Unit", "Unit"]);
    const idxNegeri = findCol(headers, ["Negeri"]);
    const idxJenis  = findCol(headers, ["Jenis pemeriksaan", "Jenis Pemeriksaan", "Jenis"]);

    const idxA1     = findCol(headers, ["Assigned Inspector 1"]);
    const idxA2     = findCol(headers, ["Assigned Inspector 2"]);
    const idxStart  = findCol(headers, ["Assigned Date", "Tarikh Mula"]);
    const idxEnd    = findCol(headers, ["End Date", "Tarikh Tamat"]);

    const vUnit   = idxUnit > -1 ? String(sheet.getRange(row, idxUnit + 1).getValue() || "").trim() : "";
    const vNegeri = idxNegeri > -1 ? String(sheet.getRange(row, idxNegeri + 1).getValue() || "").trim() : "";
    const vJenis  = idxJenis > -1 ? String(sheet.getRange(row, idxJenis + 1).getValue() || "").trim() : "";

    if (vUnit) units.add(vUnit);
    if (vNegeri) negeris.add(vNegeri);
    if (vJenis) jenises.add(vJenis);

    const a1 = idxA1 > -1 ? String(sheet.getRange(row, idxA1 + 1).getValue() || "").trim() : "";
    const a2 = idxA2 > -1 ? String(sheet.getRange(row, idxA2 + 1).getValue() || "").trim() : "";

    if (!insp1 && a1) insp1 = a1;
    if (!insp2 && a2) insp2 = a2;

    let s = idxStart > -1 ? sheet.getRange(row, idxStart + 1).getValue() : null;
    let e = idxEnd > -1 ? sheet.getRange(row, idxEnd + 1).getValue() : null;

    if (s && !(s instanceof Date)) s = new Date(s);
    if (e && !(e instanceof Date)) e = new Date(e);

    if (s instanceof Date && !isNaN(s.getTime())) {
      s.setHours(0, 0, 0, 0);
      if (!minStart || s < minStart) minStart = s;
    }

    // If end missing, use start
    if (!e) e = s;

    if (e instanceof Date && !isNaN(e.getTime())) {
      e.setHours(0, 0, 0, 0);
      if (!maxEnd || e > maxEnd) maxEnd = e;
    }
  });

  if (!insp1) return { ok: false, error: "Assigned Inspector 1 not found in selected jobs" };
  if (!minStart) return { ok: false, error: "Assigned Date not found in selected jobs" };
  if (!maxEnd) maxEnd = new Date(minStart);

  // Output folder structure: <ROOT>/<Inspector>/<JobGroup>/
  const root = DriveApp.getFolderById(CFG.DRIVE_DOC_ROOT_FOLDER_ID);
  const inspFolder = getOrCreateSubFolder_(root, inspectorName);

  const groupName = buildJobGroupName_(jobIds);
  const groupFolder = getOrCreateSubFolder_(inspFolder, groupName);

  // Copy template
  const tpl = DriveApp.getFileById(CFG.TPL_BORANG_TUGAS_RASMI_ID);
  const docName = `Borang Tugas Rasmi - ${groupName}`;
  const copy = tpl.makeCopy(docName, groupFolder);
  const docId = copy.getId();

  // Replace placeholders (BTR uses {{KEY}} style as keys)
  const map = {
    "{{ASSIGNED_INSP_1}}": insp1,
    "{{ASSIGNED_INSP_2}}": insp2 || "",
    "{{UNIT_NAME}}": Array.from(units).filter(Boolean).join("\n"),
    "{{NEGERI}}": Array.from(negeris).filter(Boolean).join("\n"),
    "{{JENIS_PEMERIKSAAN}}": Array.from(jenises).filter(Boolean).join("\n"),
    "{{TARIKH_MULA}}": fmtDMY_(minStart),
    "{{TARIKH_TAMAT}}": fmtDMY_(maxEnd)
  };

  const doc = DocumentApp.openById(docId);
  const body = doc.getBody();
  Object.keys(map).forEach(k => body.replaceText(escapeRegex_(k), map[k]));
  doc.saveAndClose();

  // Respect docsOnly: bulk generation wants Google Docs only
  let pdfUrl = "";
  if (!docsOnly) {
    const pdfBlob = DriveApp.getFileById(docId).getAs(MimeType.PDF).setName(`${docName}.pdf`);
    const pdfFile = groupFolder.createFile(pdfBlob);
    pdfUrl = pdfFile.getUrl();
  }

  writeLog(jobIds.join(","), "DocGen", `BTR generated by ${inspectorName}`);

  return {
    ok: true,
    folderUrl: groupFolder.getUrl(),
    folderId: groupFolder.getId(),
    docUrl: `https://docs.google.com/document/d/${docId}/edit`,
    pdfUrl: pdfUrl,
    message: docsOnly ? "Borang Tugas Rasmi generated (Google Doc only)" : "Borang Tugas Rasmi generated"
  };
}

/* =========================
   BULK GENERATE ALL 3 DOCS
   ========================= */

function generateAllMovementDocs(payload) {
  try {
    payload = payload || {};
    const inspectorName = String(payload.inspectorName || "").trim();
    const jobIds = Array.isArray(payload.jobIds) ? payload.jobIds.map(x => String(x).trim()).filter(Boolean) : [];

    if (!inspectorName) return { ok: false, error: "Missing inspectorName" };
    if (!jobIds.length) return { ok: false, error: "No jobs selected" };

    // Generate Borang Tugas Rasmi as Doc only (no PDF)
    const base = generateBorangTugasRasmi({ inspectorName, jobIds, docsOnly: true });
    if (!base || base.ok === false) return base;

    // Get Folder object safely
    const folderId = base.folderId || extractDriveId_(base.folderUrl);
    if (!folderId) return { ok: false, error: "Failed to resolve output folderId" };
    const folder = DriveApp.getFolderById(folderId);

    // Build shared context for the other 2 docs (keys without braces)
    const ctx = buildMovementContext_(inspectorName, jobIds, folder);

    const perintah = generatePerintahPergerakan_(ctx);
    if (!perintah || perintah.ok === false) return perintah;

    const kenderaan = generatePermohonanKenderaan_(ctx);
    if (!kenderaan || kenderaan.ok === false) return kenderaan;

    return {
      ok: true,
      message: "All 3 documents generated (Google Docs only).",
      folderUrl: base.folderUrl,
      borangUrl: base.docUrl,
      perintahUrl: perintah.docUrl,
      kenderaanUrl: kenderaan.docUrl
    };

  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/* =========================
   DOC GENERATORS (INTERNAL)
   ========================= */

function generatePerintahPergerakan_(ctx) {
  const { folder, map, nameForFile } = ctx;

  const file = DriveApp.getFileById(CFG.TPL_PERINTAH_PERGERAKAN_ID).makeCopy(
    `PERINTAH PERGERAKAN - ${nameForFile}`,
    folder
  );

  const doc = DocumentApp.openById(file.getId());
  const body = doc.getBody();

  // map keys are like UNIT_NAME, so replace {{UNIT_NAME}}
  Object.keys(map).forEach(k => body.replaceText(`\\{\\{${escapeRegex_(k)}\\}\\}`, map[k] ?? ""));

  doc.saveAndClose();
  return { ok: true, docUrl: file.getUrl() };
}

function generatePermohonanKenderaan_(ctx) {
  const { folder, map, nameForFile } = ctx;

  const file = DriveApp.getFileById(CFG.TPL_PERMOHONAN_KENDERAAN_ID).makeCopy(
    `PERMOHONAN KENDERAAN - ${nameForFile}`,
    folder
  );

  const doc = DocumentApp.openById(file.getId());
  const body = doc.getBody();

  Object.keys(map).forEach(k => body.replaceText(`\\{\\{${escapeRegex_(k)}\\}\\}`, map[k] ?? ""));

  doc.saveAndClose();
  return { ok: true, docUrl: file.getUrl() };
}

/* =========================
   CONTEXT BUILDER (INTERNAL)
   Keys WITHOUT braces, eg: UNIT_NAME
   ========================= */

function buildMovementContext_(inspectorName, jobIds, folder) {
  const rows = jobIds.map(id => locateJobRow_(id)).filter(Boolean);
  if (!rows.length) return { ok: false, error: "Jobs not found" };

  const units = new Set();
  const negeris = new Set();
  const jenises = new Set();
  const daerahs = new Set();

  let insp1 = "";
  let insp2 = "";

  let minStart = null;
  let maxEnd = null;

  rows.forEach(hit => {
    const { sheet, headers, row } = hit;

    const idxUnit   = findCol(headers, ["Nama pasukan / unit", "Nama Pasukan / Unit", "Unit"]);
    const idxNegeri = findCol(headers, ["Negeri"]);
    const idxDaerah = findCol(headers, ["Daerah"]);
    const idxJenis  = findCol(headers, ["Jenis pemeriksaan", "Jenis Pemeriksaan", "Jenis"]);

    const idxA1     = findCol(headers, ["Assigned Inspector 1"]);
    const idxA2     = findCol(headers, ["Assigned Inspector 2"]);
    const idxStart  = findCol(headers, ["Assigned Date", "Tarikh Mula"]);
    const idxEnd    = findCol(headers, ["End Date", "Tarikh Tamat"]);

    const vUnit   = idxUnit > -1 ? String(sheet.getRange(row, idxUnit + 1).getValue() || "").trim() : "";
    const vNegeri = idxNegeri > -1 ? String(sheet.getRange(row, idxNegeri + 1).getValue() || "").trim() : "";
    const vDaerah = idxDaerah > -1 ? String(sheet.getRange(row, idxDaerah + 1).getValue() || "").trim() : "";
    const vJenis  = idxJenis > -1 ? String(sheet.getRange(row, idxJenis + 1).getValue() || "").trim() : "";

    if (vUnit) units.add(vUnit);
    if (vNegeri) negeris.add(vNegeri);
    if (vDaerah) daerahs.add(vDaerah);
    if (vJenis) jenises.add(vJenis);

    const a1 = idxA1 > -1 ? String(sheet.getRange(row, idxA1 + 1).getValue() || "").trim() : "";
    const a2 = idxA2 > -1 ? String(sheet.getRange(row, idxA2 + 1).getValue() || "").trim() : "";

    if (!insp1 && a1) insp1 = a1;
    if (!insp2 && a2) insp2 = a2;

    let s = idxStart > -1 ? sheet.getRange(row, idxStart + 1).getValue() : null;
    let e = idxEnd > -1 ? sheet.getRange(row, idxEnd + 1).getValue() : null;

    if (s && !(s instanceof Date)) s = new Date(s);
    if (e && !(e instanceof Date)) e = new Date(e);

    if (s instanceof Date && !isNaN(s.getTime())) {
      s.setHours(0, 0, 0, 0);
      if (!minStart || s < minStart) minStart = s;
    }

    if (!e) e = s;

    if (e instanceof Date && !isNaN(e.getTime())) {
      e.setHours(0, 0, 0, 0);
      if (!maxEnd || e > maxEnd) maxEnd = e;
    }
  });

  if (!insp1) return { ok: false, error: "Assigned Inspector 1 not found in selected jobs" };
  if (!minStart) return { ok: false, error: "Assigned Date not found in selected jobs" };
  if (!maxEnd) maxEnd = new Date(minStart);

  const groupName = buildJobGroupName_(jobIds);

  // Keys WITHOUT braces
  const map = {
    ASSIGNED_INSP_1: insp1,
    ASSIGNED_INSP_2: insp2 || "",
    UNIT_NAME: Array.from(units).filter(Boolean).join("\n"),
    NEGERI: Array.from(negeris).filter(Boolean).join("\n"),
    DAERAH: Array.from(daerahs).filter(Boolean).join("\n"),
    JENIS_PEMERIKSAAN: Array.from(jenises).filter(Boolean).join("\n"),
    TARIKH_MULA: fmtDMY_(minStart),
    TARIKH_TAMAT: fmtDMY_(maxEnd)
  };

  return {
    folder: folder,
    map: map,
    nameForFile: groupName
  };
}

/* =========================
   HELPERS
   ========================= */
// Folder naming that won't explode
function buildJobGroupName_(jobIds) {
  const clean = jobIds.map(s => String(s).trim()).filter(Boolean);
  if (clean.length === 1) return clean[0];
  return `${clean[0]} (+${clean.length - 1})`;
}

function fmtDMY_(d) {
  return Utilities.formatDate(new Date(d), "GMT+8", "dd/MM/yyyy");
}

function escapeRegex_(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractDriveId_(url) {
  // works for folder URLs like https://drive.google.com/drive/folders/<ID>
  const m = String(url || "").match(/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : "";
}

/**
 * (Kept for compatibility, but NOT used anymore because you want Inspector 2 left blank)
 * Borang Tugas Rasmi has 2 repeated sections.
 */
function removeSecondBTRSection_(body) {
  const marker = "1.\tBUTIR-BUTIR PEMOHON";
  let first = body.findText(marker);
  if (!first) return;
  let second = body.findText(marker, first);
  if (!second) return;

  const el = second.getElement();
  const parent = el.getParent(); // usually Paragraph
  const idx = body.getChildIndex(parent);

  for (let i = body.getNumChildren() - 1; i >= idx; i--) {
    body.removeChild(body.getChild(i));
  }

  const lastIdx = body.getNumChildren() - 1;
  if (lastIdx >= 0) {
    const maybe = body.getChild(lastIdx);
    if (maybe.getType && maybe.getType() === DocumentApp.ElementType.PARAGRAPH) {
      const t = maybe.asParagraph().getText().trim();
      if (t === "") body.removeChild(maybe);
    }
  }
}

/* ==========================================
   CONFLICT ENGINE + STATUS REFRESH
   ========================================== */

function getInspectorConflicts_(inspectorName, startDate, endDate, ignoreJobId) {
  if (!inspectorName) return [];
  const searchRaw = String(inspectorName || "").toLowerCase().trim();
  const searchName = normalizeInspectorName_(inspectorName);
  const win = normalizeDateWindow_(startDate, endDate);

  const jobs = getAllActiveJobs(); // includes assigned/progress/completed
  const conflicts = [];

  jobs.forEach(j => {
    if (ignoreJobId && String(j.id) === String(ignoreJobId)) return;

    const insp1Value = String(j.insp1 || "");
    const insp2Value = String(j.insp2 || "");
    const i1 = insp1Value.toLowerCase();
    const i2 = insp2Value.toLowerCase();
    const match =
      i1.includes(searchRaw) ||
      i2.includes(searchRaw) ||
      inspectorNameMatches_(insp1Value, searchName) ||
      inspectorNameMatches_(insp2Value, searchName);
    if (!match) return;

    const js = new Date(j.start);
    const je = new Date(j.end);
    const overlap = (js <= win.end) && (je >= win.start);

    if (overlap) {
      conflicts.push({ jobId: j.id, unit: j.unit, start: j.start, end: j.end, status: j.status, insp1: j.insp1, insp2: j.insp2 });
    }
  });

  return conflicts;
}

function refreshInspectorStatus_(name) {
  if (!name) return;

  // If inspector has any active job where today is within job range:
  // -> Sedang Bertugas
  // Else if inspector has any future assigned job:
  // -> Telah Ditugaskan
  // Else:
  // -> Aktif
  const jobs = getAllActiveJobs();
  const search = String(name).toLowerCase().trim();

  const today = new Date();
  today.setHours(0,0,0,0);

  let hasCurrent = false;
  let hasFuture = false;

  jobs.forEach(j => {
    const i1 = String(j.insp1 || "").toLowerCase();
    const i2 = String(j.insp2 || "").toLowerCase();
    if (!(i1.includes(search) || i2.includes(search))) return;

    const s = new Date(j.start); s.setHours(0,0,0,0);
    const e = new Date(j.end); e.setHours(0,0,0,0);

    if (today >= s && today <= e && String(j.status).toLowerCase().includes("assigned")) hasCurrent = true;
    if (s > today && String(j.status).toLowerCase().includes("assigned")) hasFuture = true;
    if (String(j.status).toLowerCase().includes("progress")) hasCurrent = true;
  });

  if (hasCurrent) updateInspectorStatus(name, "Sedang Bertugas", true);
  else if (hasFuture) updateInspectorStatus(name, "Telah Ditugaskan", true);
  else updateInspectorStatus(name, "Aktif", true);
}

/* ==========================================
   SHEET LOOKUP HELPERS
   ========================================== */

function locateJobRow_(jobId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const candidates = [
    { name: CFG.SHEET_GUNASAMA, headerRow: CFG.ROW_HEADER_GUNASAMA },
    { name: CFG.SHEET_FAT, headerRow: CFG.ROW_HEADER_FAT }
  ];

  for (const c of candidates) {
    const sh = ss.getSheetByName(c.name);
    if (!sh) continue;

    const data = sh.getDataRange().getValues();
    if (data.length <= c.headerRow) continue;

    const headers = data[c.headerRow - 1];
    const idxId = findCol(headers, ["Job ID"]);
    if (idxId === -1) continue;

    for (let r = c.headerRow; r < data.length; r++) {
      if (String(data[r][idxId] || "").trim() === String(jobId).trim()) {
        return { sheet: sh, headers: headers, row: r + 1, sheetName: c.name, headerRow: c.headerRow };
      }
    }
  }

  return null;
}

function getSheetCfg_(name) {
  if (name === CFG.SHEET_FAT) return { headerRow: CFG.ROW_HEADER_FAT };
  return { headerRow: CFG.ROW_HEADER_GUNASAMA };
}

/* ==========================================
   SHARED HELPERS & UTILITIES
   ========================================== */

function normalizeDateWindow_(startDate, endDate) {
  const s = new Date(startDate);
  if (isNaN(s.getTime())) throw new Error("Invalid start date");
  s.setHours(0,0,0,0);

  let e = endDate ? new Date(endDate) : new Date(s);
  if (isNaN(e.getTime())) e = new Date(s);
  e.setHours(0,0,0,0);

  if (e < s) throw new Error("End date cannot be before start date");
  return { start: s, end: e };
}

function findCol(headers, candidates) {
  if (!Array.isArray(candidates)) candidates = [candidates];
  const normalize = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
  const normHeaders = headers.map(normalize);
  for (const c of candidates) {
    const idx = normHeaders.indexOf(normalize(c));
    if (idx > -1) return idx;
  }
  return -1;
}

function findColIndex_(headers, keys) {
  return headers.findIndex(h => keys.some(k => String(h).includes(k)));
}

function columnLetterToIndex_(letter) {
  const s = String(letter || "").trim().toUpperCase();
  if (!s) return -1;
  let out = 0;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code < 65 || code > 90) return -1;
    out = out * 26 + (code - 64);
  }
  return out - 1;
}

function findColOrLetter_(headers, candidates, fallbackLetter) {
  const idx = findCol(headers, candidates);
  if (idx > -1) return idx;
  return columnLetterToIndex_(fallbackLetter);
}

function findColWithSafeFallback_(headers, candidates, fallbackLetter) {
  const idx = findCol(headers, candidates);
  if (idx > -1) return idx;

  const fallbackIdx = columnLetterToIndex_(fallbackLetter);
  if (fallbackIdx < 0) return -1;

  const fallbackHeader = headers[fallbackIdx];
  const normalize = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const headerNorm = normalize(fallbackHeader);
  const candidateNorms = (Array.isArray(candidates) ? candidates : [candidates]).map(normalize);

  if (!String(fallbackHeader || "").trim()) return fallbackIdx;
  if (candidateNorms.includes(headerNorm)) return fallbackIdx;
  return -1;
}

function toSheetDateValue_(value) {
  if (value === null || value === undefined) return "";

  if (Object.prototype.toString.call(value) === "[object Date]") {
    if (isNaN(value.getTime())) return "";
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const s = String(value || "").trim();
  if (!s) return "";

  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));

  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function writeLog(jobId, action, details) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(CFG.SHEET_LOG);
  if (!sh) return;
  sh.appendRow([new Date(), Session.getActiveUser().getEmail(), jobId, action, details]);
}

/* ==========================================
   RESET / WIPE
   ========================================== */

function wipeTestData() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    "SYSTEM RESET / FLUSH",
    'This will PERMANENTLY DELETE all jobs in Pemeriksaan Gunasama 1, Pemeriksaan Gunasama 2, FAT, and Logs.\n\nTo confirm, please type "RESET" below:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK || response.getResponseText() !== "RESET") {
    ui.alert("Cancelled. No data was deleted.");
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const targets = [
    { name: CFG.SHEET_GUNASAMA, startRow: CFG.ROW_HEADER_GUNASAMA + 1 },
    { name: CFG.SHEET_FAT, startRow: CFG.ROW_HEADER_FAT + 1 },
    { name: CFG.SHEET_LOG, startRow: CFG.ROW_HEADER_LOG + 1 }
  ];

  targets.forEach(t => {
    const sheet = ss.getSheetByName(t.name);
    if (sheet) {
      const lastRow = sheet.getLastRow();
      if (lastRow >= t.startRow) sheet.deleteRows(t.startRow, lastRow - t.startRow + 1);
    }
  });

  const inspSheet = ss.getSheetByName(CFG.SHEET_PEMERIKSA);
  if (inspSheet) {
    const lastRow = inspSheet.getLastRow();
    if (lastRow > CFG.ROW_HEADER_PEMERIKSA) {
      const headers = inspSheet.getRange(CFG.ROW_HEADER_PEMERIKSA, 1, 1, inspSheet.getLastColumn()).getValues()[0];
      const statusIdx = findCol(headers, ["Status"]);
      if (statusIdx > -1) {
        inspSheet.getRange(CFG.ROW_HEADER_PEMERIKSA + 1, statusIdx + 1, lastRow - CFG.ROW_HEADER_PEMERIKSA).setValue("Aktif");
      }
    }
  }

  ui.alert("System Reset Complete.\n\n- All Job Data Deleted.\n- Logs Cleared.\n- Inspectors Reset to 'Aktif'.");
}

/* ==========================================
   EMAILS (keep your current behavior)
   ========================================== */

function sendSubmissionEmail(jobId, headers, rowData) {
  const ADMIN_EMAILS = "pokjay7997@gmail.com";
  const EMAIL_SUBJECT = `[CT&P Portal] New Request: ${jobId}`;

  const colUnit = findCol(headers, ["Nama pasukan / unit", "Unit", "Pasukan"]);
  const colType = findCol(headers, ["Jenis pemeriksaan", "Jenis"]);
  const colApplicant = findCol(headers, ["Nama Pemohon"]);
  const applicant = rowData[colApplicant];

  const htmlBody = `<div style="font-family: Arial; max-width: 600px;">
    <h2 style="background: #2c3e50; color: white; padding: 10px;">New Request Received</h2>
    <p>Job ID: <b>${jobId}</b></p>
    <p>Unit: ${rowData[colUnit] || "-"}</p>
    <p>Type: ${rowData[colType] || "-"}</p>
    <p>Applicant: ${applicant || "-"}</p>
    <p>Please login to the Supervisor Panel to assign an inspector.</p>
  </div>`;

  try {
    MailApp.sendEmail({ to: ADMIN_EMAILS, subject: EMAIL_SUBJECT, htmlBody });
  } catch (e) {
    console.error("Email fail: " + e);
  }
}

function sendAssignmentNotification(p1Name, p2Name, units, types, start, end, daerahs, negeris, descs) {
  const p1Email = getInspectorEmailByName_(p1Name);
  const p2Email = getInspectorEmailByName_(p2Name);

  if (!p1Email && !p2Email) return;

  const recipients = [p1Email, p2Email].filter(Boolean).join(",");
  const fmt = (d) => Utilities.formatDate(new Date(d), "GMT+8", "dd/MM/yyyy");
  const dateStr = end ? `${fmt(start)} - ${fmt(end)}` : fmt(start);

  const areaStr = (daerahs && daerahs.length) ? `${daerahs.join(", ")} (${negeris.join(", ")})` : "-";
  const descStr = (descs && descs.length) ? descs.join(", ") : "-";

  const SURAT_URL = "https://drive.google.com/drive/folders/1NjHitT25PKNs1c1lhaQz4K8RIG9m20as?usp=sharing";
  const PORTAL_URL = SpreadsheetApp.getActiveSpreadsheet().getUrl();

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; color: #333; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">Arahan Penugasan</h2>
        <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.8;">Sel Bukan Teknikal CT&P</p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 16px; margin-top: 0;">Assalamualaikum <strong>${p1Name}</strong>${p2Name ? ` & <strong>${p2Name}</strong>` : ""},</p>
        <p>Anda telah ditugaskan untuk menjalankan pemeriksaan berikut:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tr style="background-color: #f1f5f9; text-align: left;">
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 30%;">Tarikh</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Jenis Pemeriksaan</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${(types && types.length) ? types.join(", ") : "-"}</td>
          </tr>
          <tr style="background-color: #f1f5f9;">
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Lokasi / Unit</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${(units && units.length) ? units.join("<br>") : "-"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Daerah / Negeri</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${areaStr}</td>
          </tr>
          <tr style="background-color: #f1f5f9;">
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Deskripsi Peralatan</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${descStr}</td>
          </tr>
        </table>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${SURAT_URL}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; margin-right: 10px;">
            Dokumen Rujukan
          </a>
          <a href="${PORTAL_URL}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
            Buka Spreadsheet
          </a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Ini adalah emel janaan komputer. Tidak perlu dibalas.
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: recipients,
    subject: `Arahan Penugasan: ${(units && units[0]) ? units[0] : "CT&P"} (${dateStr})`,
    htmlBody
  });
}

function getInspectorEmailByName_(name) {
  if (!name) return null;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET_PEMERIKSA);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const headers = data[CFG.ROW_HEADER_PEMERIKSA - 1];
  const colName = findCol(headers, ["Nama Pemeriksa"]);
  const colEmail = findCol(headers, ["Email"]);

  for (let i = CFG.ROW_HEADER_PEMERIKSA; i < data.length; i++) {
    if (String(data[i][colName]).trim().toLowerCase() === String(name).trim().toLowerCase()) return data[i][colEmail];
  }
  return null;
}

/* ==========================================
   DRIVE HELPERS
   ========================================== */
function getOrCreateRootFolder_(folderId, fallbackName) {
  if (folderId) {
    try { return DriveApp.getFolderById(folderId); } catch (e) {}
  }
  const it = DriveApp.getFoldersByName(fallbackName);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(fallbackName);
}

function getOrCreateSubFolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent.createFolder(name);
}

/* ==========================================
   WEBAPP COMPATIBILITY WRAPPERS (SAFE ADD-ON)
   - Does NOT change existing logic
   - Only adds missing function names expected by WebApp UI
   ========================================== */

/**
 * WebApp identity helper (optional, but UI likes it)
 */
function whoAmI() {
  const email = Session.getActiveUser().getEmail() || "";
  return { ok: true, email: email, user: email, name: email };
}

/**
 * WebApp "one call" data pack
 * Some UI variants expect roster + schedule together.
 * This does NOT change your getSidebarData() output.
 */
function getWebAppData() {
  const base = getSidebarData(); // { jobs, inspectors }
  return {
    ok: true,
    user: Session.getActiveUser().getEmail() || "User",
    email: Session.getActiveUser().getEmail() || "",
    jobs: base.jobs || [],
    inspectors: base.inspectors || [],
    roster: getFullRosterData(),     // full roster table
    schedule: getAllActiveJobs()     // active jobs list (assigned/progress/completed)
  };
}

/**
 * Alias names for compatibility with other UI variants
 * If your UI calls getData / getAllData / getInitData, they will work.
 */
function getData() { return getWebAppData(); }
function getAllData() { return getWebAppData(); }
function getInitData() { return getWebAppData(); }
function getPortalData() { return getWebAppData(); }

/**
 * The WebApp UI calls updateInspectorJob(jobId, inspector, status, notes)
 * Your real function is updateJobStatusFromSidebar(jobId, status, inspectorName, reportText)
 * Wrapper only, no logic changes.
 */
function updateInspectorJob(jobId, inspectorName, newStatus, notes) {
  return updateJobStatusFromSidebar(jobId, newStatus, inspectorName, notes);
}

/**
 * The WebApp UI uploads evidence as base64 and calls uploadEvidenceBase64(...)
 * Your real function is uploadEvidence(jobId, fileName, mimeType, base64Data)
 * Wrapper only.
 */
function uploadEvidenceBase64(jobId, inspectorName, fileName, mimeType, base64Data) {
  // inspectorName unused in current backend evidence logic, kept for UI compatibility
  return uploadEvidence(jobId, fileName, mimeType, base64Data);
}

/**
 * UI wrapper for Borang Tugas Rasmi generator
 * Your real generateBorangTugasRasmi expects payload = { inspectorName, jobIds }
 * This wrapper accepts (inspectorName, jobIds) directly.
 */
function generateBorangTugasRasmiFromUI(inspectorName, jobIds) {
  return generateBorangTugasRasmi({
    inspectorName: inspectorName,
    jobIds: Array.isArray(jobIds) ? jobIds : []
  });
}

function extractTarikhPemeriksaanDMY_(text){
  const m = String(text || "").match(/(\d{2}\/\d{2}\/\d{4})/);
  return m ? m[1] : "";
}

function autoUpdateStatusToInProgress() {
  const now = new Date();

  const SHEETS = [
    CFG.SHEET_GUNASAMA,
    CFG.SHEET_FAT
  ];

  SHEETS.forEach(sheetName => {
    const sh = SpreadsheetApp.getActive().getSheetByName(sheetName);
    if (!sh) return;

    const cfg = getSheetCfg_(sheetName);
    const lastRow = sh.getLastRow();
    if (lastRow < cfg.headerRow + 1) return;

    const headerRow = sh.getRange(cfg.headerRow, 1, 1, sh.getLastColumn()).getValues()[0];
    const data = sh.getRange(cfg.headerRow + 1, 1, lastRow - cfg.headerRow, sh.getLastColumn()).getValues();

    // "Assigned Date" is the confirmed column header in this sheet
    const idxStatus = findCol(headerRow, ["Status"]);
    const idxAssignedDate = findCol(headerRow, ["Assigned Date", "Tarikh Mula", "Tarikh Penugasan"]);

    if (idxStatus === -1 || idxAssignedDate === -1) return;

    let changed = false;

    data.forEach((row, r) => {
      const status = String(row[idxStatus]).toLowerCase();
      const assignedDate = row[idxAssignedDate];

      if (
        status === "assigned" &&
        assignedDate instanceof Date &&
        assignedDate <= now
      ) {
        // r is 0-based index into data; data starts at cfg.headerRow + 1 (sheet row)
        sh.getRange(cfg.headerRow + 1 + r, idxStatus + 1).setValue("In Progress");
        changed = true;
      }
    });

    if (changed) {
      Logger.log(`Auto-updated status in sheet: ${sheetName}`);
    }
  });
}

function setupAutoStatusTrigger() {
  ScriptApp.newTrigger("autoUpdateStatusToInProgress")
    .timeBased()
    .everyMinutes(30) // change to 5 if you want it more aggressive
    .create();
}

function setInspectorStatus(name, status){
  name = String(name || "").trim();
  status = String(status || "").trim();
  if(!name) throw new Error("Missing name.");
  if(!status) throw new Error("Missing status.");

  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(CFG.SHEET_PEMERIKSA);
  if(!sh) throw new Error("Missing sheet: " + CFG.SHEET_PEMERIKSA);

  const headerRow = CFG.ROW_HEADER_PEMERIKSA || 1;
  const lastCol = sh.getLastColumn();
  const lastRow = sh.getLastRow();
  if(lastRow <= headerRow) throw new Error("No data rows in Pemeriksa sheet.");

  const headers = sh.getRange(headerRow, 1, 1, lastCol).getValues()[0].map(h => String(h||"").trim().toLowerCase());

  // try common header names
  const nameCol = headers.findIndex(h => ["name","nama","nama pemeriksa","pemeriksa"].includes(h)) + 1;
  const statusCol = headers.findIndex(h => ["status","roster status","kehadiran"].includes(h)) + 1;

  if(nameCol <= 0) throw new Error("Cannot find Name/Nama column in Pemeriksa header.");
  if(statusCol <= 0) throw new Error("Cannot find Status column in Pemeriksa header.");

  const data = sh.getRange(headerRow + 1, 1, lastRow - headerRow, lastCol).getValues();

  let hitRow = -1;
  for(let i = 0; i < data.length; i++){
    const rowName = String(data[i][nameCol - 1] || "").trim();
    if(rowName && rowName.toLowerCase() === name.toLowerCase()){
      hitRow = headerRow + 1 + i;
      break;
    }
  }

  if(hitRow < 0) throw new Error("Inspector not found: " + name);

  sh.getRange(hitRow, statusCol).setValue(status);

  return { ok:true, name:name, status:status, row:hitRow };
}

/* ==========================================
   AI COPILOT (PRIVATE SHADOW FEATURES)
   ========================================== */

function aiCopilotContext() {
  const email = aiActorEmail_();
  return {
    ok: true,
    email: email,
    allowed: aiIsAllowed_(email),
    hasGeminiKey: !!aiGetApiKey_()
  };
}

function aiSuggestClusters(payload) {
  const email = aiActorEmail_();
  if (!aiIsAllowed_(email)) throw new Error("AI Copilot access denied.");

  const p = payload || {};
  const jobs = Array.isArray(p.jobs) ? p.jobs : [];
  if (!jobs.length) throw new Error("No jobs provided for clustering.");

  const det = deterministicClustering_(jobs);
  let text = formatDeterministicClusters_(det.clusters);

  const apiKey = aiGetApiKey_();
  if (apiKey) {
    try {
      const prompt = [
        "Anda pembantu operasi dalaman.",
        "Beri cadangan cluster tugasan paling efisien untuk perjalanan.",
        "Gunakan data cluster sedia ada (jangan ubah job id).",
        "Output plain text sahaja, ringkas, format: Cluster X ... | reason: ...",
        "",
        "CLUSTER DATA:",
        JSON.stringify(det.clusters)
      ].join("\n");
      const aiText = aiCallGeminiText_(prompt, apiKey);
      if (String(aiText || "").trim()) text = String(aiText).trim();
    } catch (e) {
      text = text + "\n\n[Fallback deterministic used: " + String(e) + "]";
    }
  }

  aiLogCall_(email, "aiSuggestClusters", det.jobIds, {
    filters: p.filters || {},
    jobCount: jobs.length
  });

  return { ok: true, text: text, clusters: det.clusters };
}

function aiGenerateWhatsapp(payload) {
  const email = aiActorEmail_();
  if (!aiIsAllowed_(email)) throw new Error("AI Copilot access denied.");

  const p = payload || {};
  const jobs = Array.isArray(p.jobs) ? p.jobs : [];
  const jobIds = (Array.isArray(p.jobIds) ? p.jobIds : []).map(x => String(x || "").trim()).filter(Boolean);
  if (!jobs.length && !jobIds.length) throw new Error("No jobs provided.");

  const usedJobs = jobs.length ? jobs : [];
  const startDate = String(p.startDate || "").trim() || aiPickDateFromJobs_(usedJobs, "min");
  const endDate = String(p.endDate || "").trim() || aiPickDateFromJobs_(usedJobs, "max") || startDate;
  const time24 = aiNormalizeTime24_(p.time24 || p.time || aiPickTimeFromJobs_(usedJobs));

  const locations = aiCollectLocations_(p, usedJobs);
  const inspectors = aiCollectInspectors_(p, usedJobs);

  const text = aiFormatWhatsappTemplate_({
    startDate: startDate,
    endDate: endDate,
    time24: time24,
    locations: locations,
    inspectors: inspectors
  });

  aiLogCall_(email, "aiGenerateWhatsapp", jobIds.length ? jobIds : usedJobs.map(j => String(j.jobId || "")).filter(Boolean), {
    locationCount: locations.length,
    inspectorCount: inspectors.length,
    startDate: startDate,
    endDate: endDate,
    time24: time24
  });

  return { ok: true, text: text };
}

function deterministicClustering_(jobs) {
  const clusters = {};
  const allJobIds = [];

  jobs.forEach(j => {
    const jobId = String(j.jobId || j.id || "").trim();
    if (!jobId) return;
    allJobIds.push(jobId);

    const zone = String(j.zone || "").trim();
    const state = String(j.state || j.negeri || "").trim();
    const district = String(j.district || j.daerah || "").trim();

    const key = [zone, state, district].filter(Boolean).join(" | ") || "General";
    if (!clusters[key]) {
      const title = zone
        ? `${zone}${state ? ` - ${state}` : ""}`
        : (district && state ? `${district}, ${state}` : (state || "General"));
      clusters[key] = {
        title: title,
        zone: zone,
        state: state,
        district: district,
        jobIds: [],
        units: []
      };
    }

    clusters[key].jobIds.push(jobId);
    const unit = String(j.unit || "").trim();
    if (unit) clusters[key].units.push(unit);
  });

  const list = Object.keys(clusters).map(k => {
    const c = clusters[k];
    const reasonBits = [];
    if (c.zone) reasonBits.push("same zone");
    if (c.state) reasonBits.push("same state");
    if (c.district) reasonBits.push("same district");
    return {
      title: c.title,
      jobIds: c.jobIds,
      reason: reasonBits.length ? reasonBits.join(", ") : "grouped by available location data"
    };
  }).sort((a, b) => b.jobIds.length - a.jobIds.length || String(a.title).localeCompare(String(b.title)));

  return { clusters: list, jobIds: Array.from(new Set(allJobIds)) };
}

function formatDeterministicClusters_(clusters) {
  if (!clusters || !clusters.length) return "No cluster suggestion available.";
  return clusters.map((c, i) => {
    const idx = i + 1;
    return `Cluster ${idx} (${c.title}): ${c.jobIds.join(", ")} | reason: ${c.reason}`;
  }).join("\n");
}

function aiFormatWhatsappTemplate_(ctx) {
  const dateRange = aiFormatDateRange_(ctx.startDate, ctx.endDate);
  const time24 = aiNormalizeTime24_(ctx.time24 || "0800");
  const locations = Array.isArray(ctx.locations) ? ctx.locations : [];
  const inspectors = Array.isArray(ctx.inspectors) ? ctx.inspectors : [];

  const locLines = locations.length
    ? locations.map((x, i) => `${i + 1}. ${String(x || "").trim()}`).join("\n")
    : "1. -";

  let inspectorBlock = "        -";
  if (inspectors.length > 0) {
    const lines = [];
    lines.push(`        - ${inspectors[0]}`);
    for (let i = 1; i < inspectors.length; i++) {
      lines.push(`               ${inspectors[i]}`);
    }
    inspectorBlock = lines.join("\n");
  }

  return [
    "PEMERIKSAAN MEWUJUDKAN DOKUMEN PERALATAN",
    "",
    `Tarikh: ${dateRange}`,
    `Masa: ${time24}`,
    "Tempat:",
    locLines,
    "",
    "Pemeriksa:",
    inspectorBlock,
    "",
    "Mohon aturkan pergerakan"
  ].join("\n");
}

function aiFormatDateRange_(startDate, endDate) {
  const s = aiToDate_(startDate);
  const e = aiToDate_(endDate || startDate);
  if (!s && !e) return "-";
  if (!s && e) return Utilities.formatDate(e, "GMT+8", "d MMM yyyy");
  if (s && !e) return Utilities.formatDate(s, "GMT+8", "d MMM yyyy");

  const sd = Utilities.formatDate(s, "GMT+8", "d MMM yyyy");
  const ed = Utilities.formatDate(e, "GMT+8", "d MMM yyyy");
  if (sd === ed) return sd;

  const sameMonth = Utilities.formatDate(s, "GMT+8", "MMM yyyy") === Utilities.formatDate(e, "GMT+8", "MMM yyyy");
  if (sameMonth) {
    return Utilities.formatDate(s, "GMT+8", "d") + " - " + Utilities.formatDate(e, "GMT+8", "d MMM yyyy");
  }
  return Utilities.formatDate(s, "GMT+8", "d MMM yyyy") + " - " + Utilities.formatDate(e, "GMT+8", "d MMM yyyy");
}

function aiNormalizeTime24_(raw) {
  const s = String(raw || "").replace(/[^0-9]/g, "");
  if (!s) return "0800H";
  if (s.length <= 2) return s.padStart(2, "0") + "00H";
  const hh = s.slice(0, 2);
  const mm = s.slice(2, 4).padEnd(2, "0");
  return `${hh}${mm}H`;
}

function aiCollectLocations_(payload, jobs) {
  const out = [];
  const add = (x) => {
    const t = String(x || "").trim();
    if (t) out.push(t);
  };

  if (Array.isArray(payload.locations)) payload.locations.forEach(add);
  (jobs || []).forEach(j => {
    if (Array.isArray(j.locations)) j.locations.forEach(add);
    if (j.location) add(j.location);
    if (j.unit) add(j.unit);
    const area = [String(j.district || j.daerah || ""), String(j.state || j.negeri || "")].filter(Boolean).join(", ");
    if (area) add(area);
  });

  return Array.from(new Set(out));
}

function aiCollectInspectors_(payload, jobs) {
  const out = [];
  const add = (x) => {
    const t = String(x || "").trim();
    if (t) out.push(t);
  };

  if (Array.isArray(payload.assignedInspectors)) payload.assignedInspectors.forEach(add);
  if (payload.insp1) add(payload.insp1);
  if (payload.insp2) add(payload.insp2);

  (jobs || []).forEach(j => {
    if (Array.isArray(j.assignedInspectors)) j.assignedInspectors.forEach(add);
    if (j.insp1) add(j.insp1);
    if (j.insp2) add(j.insp2);
  });

  return Array.from(new Set(out));
}

function aiPickDateFromJobs_(jobs, mode) {
  const arr = (jobs || []).map(j => aiToDate_(j.startDate || j.endDate)).filter(Boolean);
  if (!arr.length) return "";
  arr.sort((a, b) => a.getTime() - b.getTime());
  const d = (mode === "max") ? arr[arr.length - 1] : arr[0];
  return Utilities.formatDate(d, "GMT+8", "yyyy-MM-dd");
}

function aiPickTimeFromJobs_(jobs) {
  for (const j of (jobs || [])) {
    const t = String(j.time || "").trim();
    if (t) return t;
  }
  return "0800";
}

function aiToDate_(v) {
  if (!v) return null;
  const d = (v instanceof Date) ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function aiGetApiKey_() {
  return PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY") || "";
}

function aiCallGeminiText_(prompt, apiKey) {
  const model = "gemini-2.0-flash";
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";
  const body = {
    contents: [{ role: "user", parts: [{ text: String(prompt || "") }] }],
    generationConfig: { temperature: 0.2 }
  };

  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: { "x-goog-api-key": apiKey },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });

  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code >= 300) throw new Error("Gemini API error " + code + ": " + text);

  const json = JSON.parse(text);
  const out = json && json.candidates && json.candidates[0] &&
    json.candidates[0].content && json.candidates[0].content.parts &&
    json.candidates[0].content.parts[0] ? json.candidates[0].content.parts[0].text : "";
  return String(out || "").trim();
}

function aiActorEmail_() {
  return String(Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail() || "").trim();
}

function aiIsAllowed_(email) {
  const em = String(email || "").trim().toLowerCase();
  if (!em) return false;

  const prop = PropertiesService.getScriptProperties().getProperty("AI_COPILOT_ALLOWLIST") || "";
  const allow = prop.split(",").map(x => String(x || "").trim().toLowerCase()).filter(Boolean);

  if (allow.length) return allow.includes(em);

  const owner = String(Session.getEffectiveUser().getEmail() || "").trim().toLowerCase();
  return !!owner && em === owner;
}

function aiLogCall_(email, feature, jobIds, payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CFG.SHEET_LOG);
  if (!sh) {
    sh = ss.getSheetByName("AI_LOG");
    if (!sh) sh = ss.insertSheet("AI_LOG");
  }

  const needHeader = sh.getLastRow() === 0;
  if (needHeader) {
    sh.appendRow(["timestamp", "email", "feature", "job_ids", "payload_json"]);
  }

  sh.appendRow([
    new Date(),
    String(email || ""),
    String(feature || ""),
    (Array.isArray(jobIds) ? jobIds : []).join(","),
    JSON.stringify(payload || {})
  ]);
}
