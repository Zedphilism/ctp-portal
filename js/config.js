(() => {
  const CELL_KEY = "ctp_selected_cell";
  const selectedCell = String(localStorage.getItem(CELL_KEY) || "").trim();

  const API_BASES = {
    teknikal: "https://script.google.com/macros/s/AKfycbzyCi-6stLedx0-un55ldx_qOuPgRUrP5A_7nu6uCAINOZvQJatVIzfdowW6Vo02Dby/exec",
    bukan_teknikal: "https://script.google.com/macros/s/AKfycbyxCAyLYS0xlUtYOcocOZLF26QgajKc_Dj6ODTYer05WkpHXfpPiidjYxuMR7lHnlXkfA/exec"
  };

  // Use a fixed sheet ID for non-technical calls to avoid accidental cross-env reads.
  const DEFAULT_PARAMS = {
    teknikal: {},
    bukan_teknikal: { sheetId: "120kexRPIJPwAxK1kr0E68-8mxVKdzcCd5RUJPIH4ekQ" }
  };

  const activeCell = selectedCell === "bukan_teknikal" ? "bukan_teknikal" : "teknikal";

  window.CTP_ACTIVE_CELL = activeCell;
  window.CTP_API_BASES = API_BASES;
  window.CTP_API_BASE = API_BASES[activeCell];
  window.CTP_API_DEFAULT_PARAMS = DEFAULT_PARAMS[activeCell] || {};
})();


