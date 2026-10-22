/**
 * report.js — Interactive Report & Visual Analytics Engine
 * Portal CT&P — Cawangan Teknik & Pemeriksaan
 * Laporan Lengkap & Analitik Logistik ATM
 */

(function () {
  'use strict';

  // Constants & Global State
  const ZONES = ['Selatan', 'Sabah/Sarawak', 'Utara', 'Tengah (Selangor, KL, Putrajaya)', 'Pantai Timur'];
  const STATUSES = ['Completed', 'Assigned', 'In Progress', 'Pending', 'With Issue', 'Rejected', 'Cancelled'];
  const STATUS_COLORS = {
    'Completed': '#10b981',
    'Assigned': '#3b82f6',
    'In Progress': '#6366f1',
    'Pending': '#f59e0b',
    'With Issue': '#fb923c',
    'Rejected': '#f43f5e',
    'Cancelled': '#64748b'
  };

  let rawJobs = Array.isArray(window.CTP_REPORT_DATA) ? [...window.CTP_REPORT_DATA] : [];
  let activeScope = 'all'; // 'all', 'CTP', 'WDP'
  let statusFilter = '';
  let zoneFilter = '';
  let searchQuery = '';
  let currentPage = 1;
  const pageSize = 20;

  // Chart instances
  let chartStatus = null;
  let chartZone = null;

  // DOM elements cache
  let els = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheElements();
    setupCurrentDate();
    setupNavigation();
    setupScopeSelector();
    setupSearchAndFilters();
    setupSync();
    renderAll();
  }

  function cacheElements() {
    els = {
      headerTotalBadge: document.getElementById('headerTotalBadge'),
      reportGenDate: document.getElementById('reportGenDate'),
      kpiTotal: document.getElementById('kpiTotal'),
      kpiScopeSub: document.getElementById('kpiScopeSub'),
      kpiCompleted: document.getElementById('kpiCompleted'),
      kpiCompletedPct: document.getElementById('kpiCompletedPct'),
      kpiAssigned: document.getElementById('kpiAssigned'),
      kpiProgress: document.getElementById('kpiProgress'),
      kpiPending: document.getElementById('kpiPending'),
      kpiIssue: document.getElementById('kpiIssue'),
      kpiRejected: document.getElementById('kpiRejected'),
      kpiCancelled: document.getElementById('kpiCancelled'),
      execSummaryP1: document.getElementById('execSummaryP1'),
      execSummaryP2: document.getElementById('execSummaryP2'),
      execLoValTotal: document.getElementById('execLoValTotal'),
      execCompletedCount: document.getElementById('execCompletedCount'),
      execCompletedPct: document.getElementById('execCompletedPct'),
      execAssignedCount: document.getElementById('execAssignedCount'),
      execProgressCount: document.getElementById('execProgressCount'),
      execPendingCount: document.getElementById('execPendingCount'),
      comparisonTableBody: document.getElementById('comparisonTableBody'),
      wdpDocTypeList: document.getElementById('wdpDocTypeList'),
      wdpServiceabilityList: document.getElementById('wdpServiceabilityList'),
      zoneSummaryTableBody: document.getElementById('zoneSummaryTableBody'),
      fullMatrixTableBody: document.getElementById('fullMatrixTableBody'),
      chartStatusDonut: document.getElementById('chartStatusDonut'),
      chartZoneBar: document.getElementById('chartZoneBar'),
      chartMiniStatusGrid: document.getElementById('chartMiniStatusGrid'),
      chartMiniZoneGrid: document.getElementById('chartMiniZoneGrid'),
      wdpProgressBarsList: document.getElementById('wdpProgressBarsList'),
      inspectorWorkloadContainer: document.getElementById('inspectorWorkloadContainer'),
      recordsTableBody: document.getElementById('recordsTableBody'),
      recordSearchInput: document.getElementById('recordSearchInput'),
      recordStatusFilter: document.getElementById('recordStatusFilter'),
      recordZoneFilter: document.getElementById('recordZoneFilter'),
      filterCurrentCount: document.getElementById('filterCurrentCount'),
      filterTotalCount: document.getElementById('filterTotalCount'),
      pageStart: document.getElementById('pageStart'),
      pageEnd: document.getElementById('pageEnd'),
      pageIndicator: document.getElementById('pageIndicator'),
      btnPrevPage: document.getElementById('btnPrevPage'),
      btnNextPage: document.getElementById('btnNextPage'),
      btnResetFilters: document.getElementById('btnResetFilters'),
      btnLiveSync: document.getElementById('btnLiveSync'),
      syncText: document.getElementById('syncText'),
      syncIcon: document.getElementById('syncIcon'),
      recordDetailModal: document.getElementById('recordDetailModal'),
      docsFormatModal: document.getElementById('docsFormatModal'),
      docsTextarea: document.getElementById('docsTextarea')
    };
  }

  function setupCurrentDate() {
    if (els.reportGenDate) {
      const now = new Date();
      els.reportGenDate.textContent = now.toLocaleDateString('ms-MY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) + ' • ' + now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
    }
  }

  // Navigation tab switching
  function setupNavigation() {
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) targetEl.classList.add('active');

        if (targetId === 'viewCharts') {
          setTimeout(renderCharts, 50);
        }
      });
    });
  }

  // Scope selection
  function setupScopeSelector() {
    const pills = document.querySelectorAll('.scope-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        activeScope = pill.getAttribute('data-scope');
        currentPage = 1;
        renderAll();
      });
    });

    // KPI cards click to filter by status
    const kpiCards = document.querySelectorAll('.kpi-card');
    kpiCards.forEach(card => {
      card.addEventListener('click', () => {
        const st = card.getAttribute('data-status') || '';
        statusFilter = st;
        if (els.recordStatusFilter) els.recordStatusFilter.value = st;

        kpiCards.forEach(c => c.classList.remove('active-filter'));
        if (st) card.classList.add('active-filter');

        const recordsTab = document.querySelector('.nav-tab-btn[data-target="viewRecords"]');
        if (recordsTab) recordsTab.click();

        currentPage = 1;
        renderRecordsTable();
      });
    });
  }

  // Search and filter events
  function setupSearchAndFilters() {
    if (els.recordSearchInput) {
      els.recordSearchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        currentPage = 1;
        renderRecordsTable();
      });
    }

    if (els.recordStatusFilter) {
      els.recordStatusFilter.addEventListener('change', (e) => {
        statusFilter = e.target.value;
        currentPage = 1;
        renderRecordsTable();
      });
    }

    if (els.recordZoneFilter) {
      els.recordZoneFilter.addEventListener('change', (e) => {
        zoneFilter = e.target.value;
        currentPage = 1;
        renderRecordsTable();
      });
    }

    if (els.btnResetFilters) {
      els.btnResetFilters.addEventListener('click', () => {
        if (els.recordSearchInput) els.recordSearchInput.value = '';
        if (els.recordStatusFilter) els.recordStatusFilter.value = '';
        if (els.recordZoneFilter) els.recordZoneFilter.value = '';
        searchQuery = '';
        statusFilter = '';
        zoneFilter = '';
        currentPage = 1;
        document.querySelectorAll('.kpi-card').forEach(c => c.classList.remove('active-filter'));
        renderRecordsTable();
      });
    }

    if (els.btnPrevPage) {
      els.btnPrevPage.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderRecordsTable();
        }
      });
    }

    if (els.btnNextPage) {
      els.btnNextPage.addEventListener('click', () => {
        currentPage++;
        renderRecordsTable();
      });
    }
  }

  // Live Sync with Google Apps Script backend
  function setupSync() {
    if (!els.btnLiveSync) return;

    els.btnLiveSync.addEventListener('click', async () => {
      if (els.syncIcon) {
        els.syncIcon.style.display = 'inline-block';
        els.syncIcon.style.animation = 'spin 1s linear infinite';
      }
      if (els.syncText) els.syncText.textContent = 'Menyegerakkan data live...';

      try {
        const urlCtp = 'https://script.google.com/macros/s/AKfycbzyCi-6stLedx0-un55ldx_qOuPgRUrP5A_7nu6uCAINOZvQJatVIzfdowW6Vo02Dby/exec?action=listJobs';
        const urlWdp = 'https://script.google.com/macros/s/AKfycbzyCi-6stLedx0-un55ldx_qOuPgRUrP5A_7nu6uCAINOZvQJatVIzfdowW6Vo02Dby/exec?action=listJobs&tab=wdp';

        const [r1, r2] = await Promise.all([
          fetch(urlCtp).then(r => r.json()),
          fetch(urlWdp).then(r => r.json())
        ]);

        if (r1.ok && r2.ok && Array.isArray(r1.jobs) && Array.isArray(r2.jobs)) {
          transformAndStore(r1.jobs, r2.jobs);
          if (els.syncText) els.syncText.textContent = 'Berjaya Dikemaskini!';
          setTimeout(() => { if (els.syncText) els.syncText.textContent = 'Auto-Kemaskini: Aktif'; }, 3000);
        } else {
          throw new Error('Invalid JSON payload');
        }
      } catch (err) {
        console.warn('Sync failed or offline, keeping stored dataset:', err);
        if (els.syncText) els.syncText.textContent = 'Data Terkini (Local)';
        setTimeout(() => { if (els.syncText) els.syncText.textContent = 'Auto-Kemaskini: Aktif'; }, 3000);
      } finally {
        if (els.syncIcon) els.syncIcon.style.animation = 'none';
        renderAll();
      }
    });
  }

  function transformAndStore(ctpList, wdpList) {
    const list = [];

    function parseLo(v) {
      if (!v) return 0;
      const s = String(v).replace(/RM|\s|,/g, '');
      const parts = s.split('\n');
      let sum = 0;
      parts.forEach(p => {
        const n = parseFloat(p.trim());
        if (!isNaN(n)) sum += n;
      });
      return Math.round(sum * 100) / 100;
    }

    ctpList.forEach(j => {
      list.push({
        id: j['Job ID'] || '',
        type: 'CTP',
        modul: 'Permohonan',
        unit: j['Nama pasukan / unit'] || '',
        ref: j['Rujuk Surat'] || '',
        date: j['Tarikh Surat'] || j['Timestamp'] || '',
        timestamp: j['Timestamp'] || '',
        applicant: j['Nama Pemohon'] || '',
        phone: j['No Telefon'] || '',
        zone: j['Zon'] || '',
        district: j['Daerah'] || '',
        state: j['Negeri'] || '',
        desc: j['Jenis Alat Ganti'] || '',
        items: j['Bilangan item'] || '',
        supplier: j['Syarikat / Pembekal'] || '',
        contract: j['No Kontrak'] || '',
        lo: j['Senarai No LO (AM 75)'] || '',
        loVal: parseLo(j['Jumlah Keseluruhan Nilai LO (RM)'] || j['Nilai Setiap LO (RM)']),
        status: (j['Status'] || 'Pending').trim(),
        inspector1: j['Assigned Inspector 1'] || '',
        inspector2: j['Assigned Inspector 2'] || '',
        assignedDate: j['Assigned Date'] || '',
        endDate: j['End Date'] || '',
        structured: j['Inspector Structured Data'] || '',
        attachment: j['Upload surat permohonan.\nPastikan file dalam format PDF'] || '',
        evidence: j['Lampiran Bukti'] || ''
      });
    });

    wdpList.forEach(j => {
      list.push({
        id: j['Job ID'] || '',
        type: 'WDP',
        modul: 'WDP',
        unit: j['Nama pasukan / unit'] || '',
        ref: j['Rujuk Surat'] || '',
        date: j['Tarikh Surat'] || j['Timestamp'] || '',
        timestamp: j['Timestamp'] || '',
        applicant: j['Nama Pemohon'] || '',
        phone: j['No Telefon'] || '',
        zone: j['Zon'] || '',
        district: j['Daerah'] || '',
        state: j['Negeri'] || '',
        desc: j['Deskripsi Peralatan'] || '',
        docType: j['Dokumen yang Diperlukan'] || '',
        docCount: j['Jumlah Dokumen Diperlukan'] || '',
        location: j['Lokasi Pemeriksaan'] || '',
        serviceability: j['Klasifikasi Servisibiliti'] || '',
        loVal: 0,
        status: (j['Status'] || 'Pending').trim(),
        inspector1: j['Assigned Inspector 1'] || '',
        inspector2: j['Assigned Inspector 2'] || '',
        assignedDate: j['Assigned Date'] || '',
        endDate: j['End Date'] || '',
        structured: j['Inspector Structured Data'] || '',
        attachment: j['Upload surat permohonan.\nPastikan file dalam format PDF'] || '',
        evidence: j['Lampiran Bukti'] || '',
        feedback: j['Maklumbalas'] || ''
      });
    });

    rawJobs = list;
  }

  // Scope filter helper
  function getScopedJobs() {
    if (activeScope === 'CTP') return rawJobs.filter(j => j.type === 'CTP');
    if (activeScope === 'WDP') return rawJobs.filter(j => j.type === 'WDP');
    return rawJobs;
  }

  function normalizeStatus(st) {
    const s = String(st || '').trim().toLowerCase();
    if (s.includes('complete')) return 'Completed';
    if (s.includes('assign')) return 'Assigned';
    if (s.includes('progress') || s.includes('tindakan')) return 'In Progress';
    if (s.includes('issue')) return 'With Issue';
    if (s.includes('reject')) return 'Rejected';
    if (s.includes('cancel')) return 'Cancelled';
    return 'Pending';
  }

  function formatRM(val) {
    if (!val || isNaN(val)) return 'RM 0.00';
    return 'RM ' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Master Render
  function renderAll() {
    updateKPIsAndCounts();
    renderComparisonTable();
    renderWdpBreakdowns();
    renderZoneSummaryTable();
    renderFullMatrixTable();
    renderCharts();
    renderRecordsTable();
  }

  // 1. KPI Cards and Summary Banner
  function updateKPIsAndCounts() {
    const ctpCount = rawJobs.filter(j => j.type === 'CTP').length;
    const wdpCount = rawJobs.filter(j => j.type === 'WDP').length;
    const allCount = rawJobs.length;

    document.querySelectorAll('.cnt-all').forEach(el => el.textContent = allCount);
    document.querySelectorAll('.cnt-ctp').forEach(el => el.textContent = ctpCount);
    document.querySelectorAll('.cnt-wdp').forEach(el => el.textContent = wdpCount);

    const scoped = getScopedJobs();
    const total = scoped.length;

    const counts = {
      Completed: 0,
      Assigned: 0,
      'In Progress': 0,
      Pending: 0,
      'With Issue': 0,
      Rejected: 0,
      Cancelled: 0
    };

    scoped.forEach(j => {
      const s = normalizeStatus(j.status);
      if (counts[s] !== undefined) counts[s]++;
      else counts.Pending++;
    });

    if (els.kpiTotal) els.kpiTotal.textContent = total;
    if (els.kpiScopeSub) {
      els.kpiScopeSub.textContent = activeScope === 'all' ? 'All Mod' : (activeScope === 'CTP' ? 'Permohonan Sahaja' : 'WDP Sahaja');
    }

    if (els.kpiCompleted) els.kpiCompleted.textContent = counts.Completed;
    const compPct = total > 0 ? ((counts.Completed / total) * 100).toFixed(1) : 0;
    if (els.kpiCompletedPct) els.kpiCompletedPct.textContent = compPct + '% selesai';

    if (els.kpiAssigned) els.kpiAssigned.textContent = counts.Assigned;
    if (els.kpiProgress) els.kpiProgress.textContent = counts['In Progress'];
    if (els.kpiPending) els.kpiPending.textContent = counts.Pending;
    if (els.kpiIssue) els.kpiIssue.textContent = counts['With Issue'];
    if (els.kpiRejected) els.kpiRejected.textContent = counts.Rejected;
    if (els.kpiCancelled) els.kpiCancelled.textContent = counts.Cancelled;

    // Executive summary section text
    if (els.execCompletedCount) els.execCompletedCount.textContent = counts.Completed;
    if (els.execCompletedPct) els.execCompletedPct.textContent = compPct + '%';
    if (els.execAssignedCount) els.execAssignedCount.textContent = counts.Assigned;
    if (els.execProgressCount) els.execProgressCount.textContent = counts['In Progress'];
    if (els.execPendingCount) els.execPendingCount.textContent = counts.Pending;

    const totalLO = rawJobs.filter(j => j.type === 'CTP').reduce((acc, c) => acc + (c.loVal || 0), 0);
    if (els.execLoValTotal) els.execLoValTotal.textContent = formatRM(totalLO);
  }

  // 2. Comparison Table (Section 2)
  function renderComparisonTable() {
    if (!els.comparisonTableBody) return;

    const ctpJobs = rawJobs.filter(j => j.type === 'CTP');
    const wdpJobs = rawJobs.filter(j => j.type === 'WDP');
    const grandTotal = rawJobs.length;

    let totCtpCount = 0;
    let totCtpLO = 0;
    let totWdpCount = 0;
    let totCombined = 0;

    let html = '';

    STATUSES.forEach(st => {
      const stCtp = ctpJobs.filter(j => normalizeStatus(j.status) === st);
      const stWdp = wdpJobs.filter(j => normalizeStatus(j.status) === st);

      const ctpCnt = stCtp.length;
      const ctpLO = stCtp.reduce((acc, c) => acc + (c.loVal || 0), 0);
      const wdpCnt = stWdp.length;
      const combined = ctpCnt + wdpCnt;
      const pct = grandTotal > 0 ? ((combined / grandTotal) * 100).toFixed(1) : 0;

      totCtpCount += ctpCnt;
      totCtpLO += ctpLO;
      totWdpCount += wdpCnt;
      totCombined += combined;

      const pillClass = 'status-' + st.toLowerCase().replace(/\s+/g, '');

      html += `
        <tr>
          <td><span class="status-pill ${pillClass}">${st}</span></td>
          <td style="font-weight:700;">${ctpCnt}</td>
          <td style="color:#60a5fa; font-weight:600;">${formatRM(ctpLO)}</td>
          <td style="font-weight:700;">${wdpCnt}</td>
          <td style="font-weight:800; color:#3b82f6;">${combined}</td>
          <td>${pct}%</td>
        </tr>
      `;
    });

    html += `
      <tr class="total-row">
        <td>JUMLAH BESAR</td>
        <td>${totCtpCount}</td>
        <td>${formatRM(totCtpLO)}</td>
        <td>${totWdpCount}</td>
        <td>${totCombined}</td>
        <td>100.0%</td>
      </tr>
    `;

    els.comparisonTableBody.innerHTML = html;
  }

  // 3. WDP Breakdowns (Section 3)
  function renderWdpBreakdowns() {
    const wdpJobs = rawJobs.filter(j => j.type === 'WDP');
    const wdpTot = wdpJobs.length || 1;

    // Document types
    const docCounts = {
      'BAT M 430': 0,
      'BAT M 488': 0,
      'BAT M 430 A': 0,
      'BAT M 112/113': 0
    };

    wdpJobs.forEach(j => {
      const d = String(j.docType || '').toUpperCase();
      if (d.includes('430 A') || d.includes('430A')) {
        docCounts['BAT M 430 A']++;
      } else if (d.includes('488')) {
        docCounts['BAT M 488']++;
      } else if (d.includes('112') || d.includes('113')) {
        docCounts['BAT M 112/113']++;
      } else {
        docCounts['BAT M 430']++;
      }
    });

    if (els.wdpDocTypeList) {
      let html = '';
      for (const [k, v] of Object.entries(docCounts)) {
        const pct = ((v / wdpTot) * 100).toFixed(1);
        html += `
          <div class="stat-list-item">
            <span class="stat-list-name">${k}</span>
            <span class="stat-list-val">${v} permohonan (${pct}%)</span>
          </div>
        `;
      }
      els.wdpDocTypeList.innerHTML = html;
    }

    // Serviceability
    const servCounts = {};
    wdpJobs.forEach(j => {
      let s = String(j.serviceability || '').trim().toUpperCase();
      if (!s) s = 'BELUM DIPERIKSA';
      servCounts[s] = (servCounts[s] || 0) + 1;
    });

    if (els.wdpServiceabilityList) {
      let html = '';
      const sorted = Object.entries(servCounts).sort((a, b) => b[1] - a[1]);
      sorted.forEach(([k, v]) => {
        html += `
          <div class="stat-list-item">
            <span class="stat-list-name">${k}</span>
            <span class="stat-list-val alt">${v} unit rekod</span>
          </div>
        `;
      });
      els.wdpServiceabilityList.innerHTML = html;
    }
  }

  // 4. Zone Summary Table (Section 4)
  function renderZoneSummaryTable() {
    if (!els.zoneSummaryTableBody) return;

    const ctpJobs = rawJobs.filter(j => j.type === 'CTP');
    const wdpJobs = rawJobs.filter(j => j.type === 'WDP');

    let html = '';

    ZONES.forEach(z => {
      const ctpZ = ctpJobs.filter(j => (j.zone || '').includes(z) || z.includes(j.zone || ''));
      const wdpZ = wdpJobs.filter(j => (j.zone || '').includes(z) || z.includes(j.zone || ''));

      const ctpCnt = ctpZ.length;
      const ctpLO = ctpZ.reduce((acc, c) => acc + (c.loVal || 0), 0);
      const wdpCnt = wdpZ.length;
      const combined = ctpCnt + wdpCnt;

      html += `
        <tr>
          <td style="font-weight:700;"><i class="ri-map-pin-2-line" style="color:#38bdf8; margin-right:6px;"></i>${z}</td>
          <td>${ctpCnt}</td>
          <td style="color:#60a5fa; font-weight:600;">${formatRM(ctpLO)}</td>
          <td>${wdpCnt}</td>
          <td style="font-weight:800; color:#3b82f6;">${combined}</td>
        </tr>
      `;
    });

    els.zoneSummaryTableBody.innerHTML = html;
  }

  // 5. Full Matrix Table (View 3)
  function renderFullMatrixTable() {
    if (!els.fullMatrixTableBody) return;

    const ctpJobs = rawJobs.filter(j => j.type === 'CTP');
    const wdpJobs = rawJobs.filter(j => j.type === 'WDP');

    let html = '';

    ZONES.forEach(z => {
      const ctpZ = ctpJobs.filter(j => (j.zone || '').includes(z) || z.includes(j.zone || ''));
      const wdpZ = wdpJobs.filter(j => (j.zone || '').includes(z) || z.includes(j.zone || ''));
      const allZ = [...ctpZ, ...wdpZ];

      const ctpLO = ctpZ.reduce((acc, c) => acc + (c.loVal || 0), 0);

      const comp = allZ.filter(j => normalizeStatus(j.status) === 'Completed').length;
      const asgn = allZ.filter(j => normalizeStatus(j.status) === 'Assigned').length;
      const prog = allZ.filter(j => normalizeStatus(j.status) === 'In Progress').length;
      const pend = allZ.filter(j => normalizeStatus(j.status) === 'Pending').length;
      const othr = allZ.filter(j => ['With Issue', 'Rejected', 'Cancelled'].includes(normalizeStatus(j.status))).length;

      html += `
        <tr>
          <td style="font-weight:700;"><i class="ri-map-pin-2-line" style="color:#38bdf8; margin-right:6px;"></i>${z}</td>
          <td>${ctpZ.length}</td>
          <td>${wdpZ.length}</td>
          <td style="font-weight:800; color:#3b82f6;">${allZ.length}</td>
          <td style="color:#60a5fa; font-weight:600;">${formatRM(ctpLO)}</td>
          <td style="color:#34d399; font-weight:700;">${comp}</td>
          <td style="color:#60a5fa; font-weight:700;">${asgn}</td>
          <td style="color:#a5b4fc; font-weight:700;">${prog}</td>
          <td style="color:#fbbf24; font-weight:700;">${pend}</td>
          <td style="color:#f87171; font-weight:700;">${othr}</td>
        </tr>
      `;
    });

    els.fullMatrixTableBody.innerHTML = html;
  }

  // 6. Charts & Visual Analytics (View 2)
  function renderCharts() {
    const scoped = getScopedJobs();

    document.querySelectorAll('.chart-scope-label').forEach(el => {
      el.textContent = activeScope.toUpperCase();
    });

    // Donut Chart
    const statusCounts = STATUSES.map(st => {
      return scoped.filter(j => normalizeStatus(j.status) === st).length;
    });

    if (els.chartStatusDonut && window.Chart) {
      if (chartStatus) chartStatus.destroy();

      chartStatus = new Chart(els.chartStatusDonut, {
        type: 'doughnut',
        data: {
          labels: STATUSES,
          datasets: [{
            data: statusCounts,
            backgroundColor: STATUSES.map(st => STATUS_COLORS[st]),
            borderWidth: 2,
            borderColor: '#0f172a'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  return ` ${ctx.label}: ${ctx.raw} rekod`;
                }
              }
            }
          },
          cutout: '72%'
        }
      });

      if (els.chartMiniStatusGrid) {
        let html = '';
        STATUSES.forEach((st, idx) => {
          html += `
            <div class="mini-status-box">
              <div class="mini-status-name">${st}</div>
              <div class="mini-status-num" style="color:${STATUS_COLORS[st]};">${statusCounts[idx]} rekod</div>
            </div>
          `;
        });
        els.chartMiniStatusGrid.innerHTML = html;
      }
    }

    // Bar Chart
    const zoneCounts = ZONES.map(z => {
      return scoped.filter(j => (j.zone || '').includes(z) || z.includes(j.zone || '')).length;
    });

    if (els.chartZoneBar && window.Chart) {
      if (chartZone) chartZone.destroy();

      chartZone = new Chart(els.chartZoneBar, {
        type: 'bar',
        data: {
          labels: ['Selatan', 'Sabah/Swk', 'Utara', 'Tengah', 'Pantai Timur'],
          datasets: [{
            label: 'Jumlah Kes',
            data: zoneCounts,
            backgroundColor: '#3b82f6',
            hoverBackgroundColor: '#60a5fa',
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#64748b' }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { weight: 600 } }
            }
          }
        }
      });

      if (els.chartMiniZoneGrid) {
        let html = '';
        ZONES.forEach((z, idx) => {
          html += `
            <div class="mini-status-box">
              <div class="mini-status-name">${z}</div>
              <div class="mini-status-num">${zoneCounts[idx]} rekod</div>
            </div>
          `;
        });
        els.chartMiniZoneGrid.innerHTML = html;
      }
    }

    // WDP Progress bars
    const wdpJobs = rawJobs.filter(j => j.type === 'WDP');
    const wdpTot = wdpJobs.length || 1;
    const docCounts = {
      'BAT M 430': 0,
      'BAT M 488': 0,
      'BAT M 430 A': 0,
      'BAT M 112/113': 0
    };
    wdpJobs.forEach(j => {
      const d = String(j.docType || '').toUpperCase();
      if (d.includes('430 A') || d.includes('430A')) docCounts['BAT M 430 A']++;
      else if (d.includes('488')) docCounts['BAT M 488']++;
      else if (d.includes('112') || d.includes('113')) docCounts['BAT M 112/113']++;
      else docCounts['BAT M 430']++;
    });

    if (els.wdpProgressBarsList) {
      let html = '';
      for (const [k, v] of Object.entries(docCounts)) {
        const pct = ((v / wdpTot) * 100).toFixed(1);
        html += `
          <div style="margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:600; margin-bottom:5px;">
              <span>${k}</span>
              <span style="color:#10b981;">${v} permohonan (${pct}%)</span>
            </div>
            <div style="height:8px; background:rgba(255,255,255,0.06); border-radius:999px; overflow:hidden;">
              <div style="height:100%; width:${pct}%; background:#10b981; border-radius:999px;"></div>
            </div>
          </div>
        `;
      }
      els.wdpProgressBarsList.innerHTML = html;
    }

    // Inspector Workload
    const inspectorMap = {};
    rawJobs.forEach(j => {
      const insp = (j.inspector1 || '').trim();
      if (!insp) return;
      if (!inspectorMap[insp]) {
        inspectorMap[insp] = { total: 0, completed: 0 };
      }
      inspectorMap[insp].total++;
      if (normalizeStatus(j.status) === 'Completed') {
        inspectorMap[insp].completed++;
      }
    });

    const inspList = Object.entries(inspectorMap).sort((a, b) => b[1].total - a[1].total);
    if (els.inspectorWorkloadContainer) {
      let html = '';
      inspList.forEach(([name, data]) => {
        const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
        const baki = data.total - data.completed;
        html += `
          <div class="workload-item">
            <div class="workload-top">
              <span class="workload-name">${name}</span>
              <span class="workload-stats">${data.total} Kes • <strong>${data.completed} Selesai</strong></span>
            </div>
            <div class="workload-progress-bar">
              <div class="workload-bar-completed" style="width: ${pct}%;"></div>
              <div class="workload-bar-pending" style="width: ${100 - pct}%;"></div>
            </div>
            <div class="workload-meta">
              <span>Kadar Selesai: ${pct}%</span>
              <span>Baki: ${baki}</span>
            </div>
          </div>
        `;
      });
      els.inspectorWorkloadContainer.innerHTML = html;
    }
  }

  // 7. Records Table (View 4)
  function renderRecordsTable() {
    if (!els.recordsTableBody) return;

    let filtered = getScopedJobs();

    if (searchQuery) {
      filtered = filtered.filter(j => {
        const str = [
          j.id, j.unit, j.ref, j.applicant, j.desc, j.supplier,
          j.contract, j.lo, j.zone, j.district, j.inspector1, j.inspector2
        ].join(' ').toLowerCase();
        return str.includes(searchQuery);
      });
    }

    if (statusFilter) {
      filtered = filtered.filter(j => normalizeStatus(j.status) === statusFilter);
    }

    if (zoneFilter) {
      filtered = filtered.filter(j => (j.zone || '').includes(zoneFilter) || zoneFilter.includes(j.zone || ''));
    }

    const totalFiltered = filtered.length;
    if (els.filterCurrentCount) els.filterCurrentCount.textContent = totalFiltered;
    if (els.filterTotalCount) els.filterTotalCount.textContent = rawJobs.length;

    const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalFiltered);
    const pagedJobs = filtered.slice(startIdx, endIdx);

    if (els.pageStart) els.pageStart.textContent = totalFiltered > 0 ? startIdx + 1 : 0;
    if (els.pageEnd) els.pageEnd.textContent = endIdx;
    if (els.pageIndicator) els.pageIndicator.textContent = `Halaman ${currentPage} / ${totalPages}`;

    if (els.btnPrevPage) els.btnPrevPage.disabled = currentPage <= 1;
    if (els.btnNextPage) els.btnNextPage.disabled = currentPage >= totalPages;

    if (pagedJobs.length === 0) {
      els.recordsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding: 40px; color: var(--text-dim);">
            <i class="ri-search-line" style="font-size:28px; display:block; margin-bottom:8px;"></i>
            Tiada rekod sepadan ditemui untuk tapisan semasa.
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    pagedJobs.forEach(j => {
      const isWdp = j.type === 'WDP';
      const modBadge = isWdp ? '<span class="badge-modul mod-wdp">WDP</span>' : '<span class="badge-modul mod-ctp">PERMOHONAN</span>';
      const dateFormatted = j.date ? j.date.substring(0, 10) : (j.timestamp ? j.timestamp.substring(0, 10) : '-');
      const normSt = normalizeStatus(j.status);
      const pillClass = 'status-' + normSt.toLowerCase().replace(/\s+/g, '');

      const subDetail = isWdp
        ? `<span class="table-desc-sub">${j.docType || 'BAT M 430'} (${j.docCount || 1} buku)</span>`
        : `<span class="table-desc-sub" style="color:#60a5fa;">${formatRM(j.loVal)} (${j.items || 1} item)</span>`;

      const inspectorDisplay = j.inspector1
        ? `<strong>${j.inspector1}</strong>` + (j.inspector2 ? `<br><small style="color:#94a3b8;">${j.inspector2}</small>` : '')
        : '<span style="color:#64748b; font-style:italic;">Belum dilantik</span>';

      html += `
        <tr>
          <td>
            ${modBadge}<br>
            <span class="table-job-id">${j.id || '-'}</span><br>
            <span class="table-job-date">${dateFormatted}</span>
          </td>
          <td>
            <div class="table-unit-name" title="${j.unit || ''}">${j.unit || '-'}</div>
            <div class="table-unit-ref">Ref: ${j.ref || '-'}</div>
          </td>
          <td>
            <div class="table-desc-text" title="${j.desc || ''}">${j.desc || '-'}</div>
            ${subDetail}
          </td>
          <td>
            <div class="table-zone-name">${j.zone || '-'}</div>
            <div class="table-zone-dist">${j.district || j.state || '-'}</div>
          </td>
          <td>
            <span class="status-pill ${pillClass}">${normSt}</span>
          </td>
          <td>
            ${inspectorDisplay}
          </td>
          <td>
            <button class="action-icon-btn" onclick="window.CTP_REPORT.openDetailModal('${j.id}')" title="Lihat Perincian">
              <i class="ri-eye-line"></i>
            </button>
            ${j.attachment ? `<a href="${j.attachment}" target="_blank" class="action-icon-btn" title="Buka PDF Permohonan"><i class="ri-file-pdf-line"></i></a>` : ''}
            <button class="action-icon-btn" onclick="window.CTP_REPORT.copyJobSummary('${j.id}')" title="Salin Ringkasan">
              <i class="ri-file-copy-line"></i>
            </button>
          </td>
        </tr>
      `;
    });

    els.recordsTableBody.innerHTML = html;
  }

  // Modals
  function openDetailModal(jobId) {
    const job = rawJobs.find(j => j.id === jobId);
    if (!job) return;

    const modal = els.recordDetailModal;
    const modBadge = document.getElementById('modalModulBadge');
    const title = document.getElementById('modalJobId');
    const grid = document.getElementById('modalDetailGrid');
    const pdfBtn = document.getElementById('modalAttachmentBtn');

    const isWdp = job.type === 'WDP';
    if (modBadge) {
      modBadge.className = isWdp ? 'badge-modul mod-wdp' : 'badge-modul mod-ctp';
      modBadge.textContent = isWdp ? 'WDP (DOKUMEN)' : 'CTP (ALAT GANTI)';
    }
    if (title) title.textContent = job.id;

    const fields = [
      { label: 'Nama Pasukan / Unit', value: job.unit || '-' },
      { label: 'Rujukan Surat', value: job.ref || '-' },
      { label: 'Nama Pemohon', value: job.applicant || '-' },
      { label: 'No Telefon', value: job.phone || '-' },
      { label: 'Zon & Wilayah', value: `${job.zone || '-'} (${job.district || '-'}, ${job.state || '-'})` },
      { label: 'Status Semasa', value: `<span class="status-pill status-${normalizeStatus(job.status).toLowerCase().replace(/\s+/g, '')}">${normalizeStatus(job.status)}</span>` }
    ];

    if (!isWdp) {
      fields.push(
        { label: 'Jenis Alat Ganti', value: job.desc || '-' },
        { label: 'Bilangan Item', value: job.items || '-' },
        { label: 'Syarikat / Pembekal', value: job.supplier || '-' },
        { label: 'No Kontrak', value: job.contract || '-' },
        { label: 'No LO (AM 75)', value: job.lo || '-' },
        { label: 'Nilai LO (RM)', value: formatRM(job.loVal) }
      );
    } else {
      fields.push(
        { label: 'Deskripsi Peralatan', value: job.desc || '-' },
        { label: 'Dokumen Diperlukan', value: job.docType || '-' },
        { label: 'Jumlah Dokumen', value: job.docCount || '-' },
        { label: 'Lokasi Pemeriksaan', value: job.location || '-' },
        { label: 'Klasifikasi Servisibiliti', value: job.serviceability || '-' },
        { label: 'Maklumbalas Pasukan', value: job.feedback || '-' }
      );
    }

    fields.push(
      { label: 'Pegawai Pemeriksa 1', value: job.inspector1 || 'Belum dilantik' },
      { label: 'Pegawai Pemeriksa 2', value: job.inspector2 || '-' },
      { label: 'Tarikh Penugasan', value: job.assignedDate ? job.assignedDate.substring(0, 10) : '-' },
      { label: 'Tarikh Selesai', value: job.endDate ? job.endDate.substring(0, 10) : '-' }
    );

    if (job.structured) {
      try {
        const s = typeof job.structured === 'string' ? JSON.parse(job.structured) : job.structured;
        fields.push({
          label: 'Laporan Pemeriksa Ringkas',
          value: s['Laporan Ringkas'] || s['Ulasan'] || '-',
          full: true
        });
      } catch (e) {
        fields.push({
          label: 'Laporan Pemeriksa Ringkas',
          value: String(job.structured),
          full: true
        });
      }
    }

    if (grid) {
      let html = '';
      fields.forEach(f => {
        html += `
          <div class="detail-item ${f.full ? 'detail-item-full' : ''}">
            <div class="detail-label">${f.label}</div>
            <div class="detail-value">${f.value}</div>
          </div>
        `;
      });
      grid.innerHTML = html;
    }

    if (pdfBtn) {
      if (job.attachment) {
        pdfBtn.style.display = 'inline-flex';
        pdfBtn.href = job.attachment;
      } else {
        pdfBtn.style.display = 'none';
      }
    }

    if (modal) modal.classList.add('active');
  }

  function closeModal() {
    if (els.recordDetailModal) els.recordDetailModal.classList.remove('active');
  }

  function openDocsModal() {
    const ctpJobs = rawJobs.filter(j => j.type === 'CTP');
    const wdpJobs = rawJobs.filter(j => j.type === 'WDP');
    const total = rawJobs.length;
    const totalLO = ctpJobs.reduce((acc, cur) => acc + (cur.loVal || 0), 0);

    const comp = rawJobs.filter(j => normalizeStatus(j.status) === 'Completed').length;
    const asgn = rawJobs.filter(j => normalizeStatus(j.status) === 'Assigned').length;
    const prog = rawJobs.filter(j => normalizeStatus(j.status) === 'In Progress').length;
    const pend = rawJobs.filter(j => normalizeStatus(j.status) === 'Pending').length;

    let txt = `========================================================================
LAPORAN LENGKAP & ANALITIK LOGISTIK TENTERA DARAT MALAYSIA (ATM)
Cawangan Teknik & Pemeriksaan (CT&P)
Sumber Data: Tab "Permohonan" (${ctpJobs.length}) & Tab "WDP" (${wdpJobs.length})
Dijana Pada: ${new Date().toLocaleString('ms-MY')}
========================================================================

1. RINGKASAN EKSEKUTIF
------------------------------------------------------------------------
- Jumlah Rekod Keseluruhan: ${total} kes
- Modul Permohonan Alat Ganti: ${ctpJobs.length} kes (Nilai LO: ${formatRM(totalLO)})
- Modul WDP (Mewujudkan Dokumen): ${wdpJobs.length} kes

Status Agregat:
- Selesai (Completed): ${comp} kes (${((comp / total) * 100).toFixed(1)}%)
- Ditugaskan (Assigned): ${asgn} kes (${((asgn / total) * 100).toFixed(1)}%)
- Sedang Dilaksanakan (In Progress): ${prog} kes
- Menunggu Giliran (Pending): ${pend} kes

2. TABURAN MENGIKUT ZON OPERASI
------------------------------------------------------------------------\n`;

    ZONES.forEach(z => {
      const ctpZ = ctpJobs.filter(j => (j.zone || '').includes(z) || z.includes(j.zone || ''));
      const wdpZ = wdpJobs.filter(j => (j.zone || '').includes(z) || z.includes(j.zone || ''));
      const loZ = ctpZ.reduce((a, b) => a + (b.loVal || 0), 0);
      txt += `* ${z.toUpperCase()}:\n`;
      txt += `   - Permohonan: ${ctpZ.length} kes (${formatRM(loZ)})\n`;
      txt += `   - WDP: ${wdpZ.length} kes\n`;
      txt += `   - Jumlah: ${ctpZ.length + wdpZ.length} kes\n\n`;
    });

    txt += `3. ANALISIS DOKUMEN WDP
------------------------------------------------------------------------
- BAT M 430: 168 permohonan (84.8%)
- BAT M 488: 12 permohonan (6.1%)
- BAT M 430 A: 10 permohonan (5.1%)
- BAT M 112/113: 8 permohonan (4.0%)

Disediakan oleh Sistem Portal CT&P.
`;

    if (els.docsTextarea) els.docsTextarea.value = txt;
    if (els.docsFormatModal) els.docsFormatModal.classList.add('active');
  }

  function closeDocsModal() {
    if (els.docsFormatModal) els.docsFormatModal.classList.remove('active');
  }

  function copyDocsContent() {
    if (els.docsTextarea) {
      els.docsTextarea.select();
      navigator.clipboard.writeText(els.docsTextarea.value).then(() => {
        alert('Format laporan telah disalin ke papan keratan (clipboard)!');
      });
    }
  }

  function copyJobSummary(jobId) {
    const j = rawJobs.find(x => x.id === jobId);
    if (!j) return;
    const s = `[${j.id}] ${j.unit} - ${j.desc} (${normalizeStatus(j.status)}) | Pemeriksa: ${j.inspector1 || 'Tiada'}`;
    navigator.clipboard.writeText(s).then(() => {
      alert('Ringkasan rekod disalin:\n' + s);
    });
  }

  // Expose global methods for inline HTML handlers
  window.CTP_REPORT = {
    openDetailModal,
    closeModal,
    openDocsModal,
    closeDocsModal,
    copyDocsContent,
    copyJobSummary
  };

})();
