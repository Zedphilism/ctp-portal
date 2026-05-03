// Drop-in landing for ctp-portal — renders engine background + top bar + side panel + quick links.
// Reads ANNOUNCEMENTS from window.ANNOUNCEMENTS_TEXT (set by index.html) and uses existing CSS variables.
const { useState, useEffect, useRef } = React;

const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showHints": true,
  "showTicker": true,
  "defaultView": "exploded"
}/*EDITMODE-END*/;

const LINK_INFO = {
  dashboard: { code: '01 · DASHBOARD', title: 'Dashboard Teknikal',
    body: 'Senarai permohonan yang diterima oleh CT&P untuk pemantauan status, pemeriksa yang ditugaskan, beban semasa dan sebagainya.' },
  f01: { code: 'F-01 · BORANG', title: 'Pemeriksaan Alat Ganti',
    body: 'Borang untuk pemeriksaan alat ganti kenderaan ATM. Digunakan oleh KSOD / BOD / KOD.' },
  f02: { code: 'F-02 · BORANG', title: 'Mewujudkan Dokumen / Penerimaan Peralatan ATM',
    body: 'Borang untuk mewujudkan dokumen peralatan di pasukan atau penerimaan peralatan baru oleh ATM.' },
  f03: { code: 'F-03 · BORANG', title: 'Penerimaan Akhir (FAT)',
    body: 'Borang untuk Pemeriksaan Penerimaan Akhir.' },
  sop: { code: 'SOP · CARTA', title: 'Carta Sempadan Kuasa',
    body: 'Carta alir penguatkuasaan tugas.' },
};

function Ticker() {
  const msg = (window.ANNOUNCEMENTS_TEXT || []).join('   |   ');
  return (
    <div className="ticker">
      <div className="ticker-inner">
        <div className="ticker-row">
          <span className="ticker-tag">⚠ Peringatan</span>
          <div className="ticker-viewport">
            <div className="ticker-track">
              <span className="ticker-text">{msg}</span>
              <span className="ticker-dot"/>
              <span className="ticker-text">{msg}</span>
              <span className="ticker-dot"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [tweaks, setTweaks] = useTweaks(TWEAKS_DEFAULTS);
  const [currentView, setCurrentView] = useState(tweaks.defaultView || 'exploded');
  const [pinnedView, setPinnedView] = useState(tweaks.defaultView || 'exploded');
  const [hoveredId, setHoveredId] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null);

  const handleHover = (key) => setCurrentView(key || pinnedView);
  const handleLeave = () => setCurrentView(pinnedView);

  useEffect(() => {
    setPinnedView(tweaks.defaultView || 'exploded');
    setCurrentView(tweaks.defaultView || 'exploded');
  }, [tweaks.defaultView]);

  useEffect(() => {
    const bg = document.getElementById('engineBg');
    if (!bg) return;
    if (!bg._root) bg._root = ReactDOM.createRoot(bg);
    bg._root.render(
      <window.EngineWireframe3D viewKey={currentView} hoveredId={hoveredId} setHoveredId={setHoveredId}/>
    );
  }, [currentView, hoveredId]);

  const view = window.VIEWS_3D[currentView] || window.VIEWS_3D.whole;

  return (
    <div className="stage">
      <header className="topbar">
        <div className="brand">
          <div className="brand-marks">
            <img src="assets/icon1.png" alt=""/>
            <img src="assets/icon2.png" alt=""/>
          </div>
          <div className="brand-meta">
            <span className="eyebrow">Portal CT&amp;P</span>
            <span className="title">Sel Teknikal — Sistem Pemeriksaan</span>
          </div>
        </div>
        <div className="topbar-meta">
          <span className="meta-pill"><span className="dot"/>SISTEM AKTIF</span>
          <span className="meta-pill" id="metaTotalJobs">— KERJA</span>
          <span className="meta-pill" id="metaCompletion">— SIAP</span>
        </div>
      </header>

      {tweaks.showTicker && <Ticker/>}

      <div className="main-grid">
        <div className="center-area">
          <div className="view-readout">
            <span className="lbl">PROJEKSI</span>
            <span className="vname">{view.code} · {view.nameEn.toUpperCase()}</span>
            <span className="sep">│</span>
            <span className="lbl">SKALA 1:24</span>
          </div>
          <div className="scan-strip"/>
        </div>
        <aside className="side-panel">
          {hoveredLink && LINK_INFO[hoveredLink] ? (
            <div className="info-card">
              <span className="info-code">{LINK_INFO[hoveredLink].code}</span>
              <h3 className="info-title">{LINK_INFO[hoveredLink].title}</h3>
              <p className="info-body">{LINK_INFO[hoveredLink].body}</p>
            </div>
          ) : (
            <div className="info-card is-idle">
              <span className="info-body info-body-muted">Hover butang untuk lihat keterangan.</span>
            </div>
          )}
          <a className="copy-cta" href="dashboard.html"
             onClick={(e)=>{ try{localStorage.setItem('ctp_selected_cell','teknikal');}catch(_){} }}
             onMouseEnter={() => { handleHover('exploded'); setHoveredId('intake_pipe'); setHoveredLink('dashboard'); }}
             onMouseLeave={() => { handleLeave(); setHoveredId(null); setHoveredLink(null); }}>
            <span>Masuk Dashboard Teknikal</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </a>
        </aside>
      </div>

      <footer className="quick-links">
        <a className="qlink" href="dashboard.html"
           data-active={hoveredLink === 'dashboard' ? 'true' : 'false'}
           onMouseEnter={() => { handleHover('exploded'); setHoveredId('intake_pipe'); setHoveredLink('dashboard'); }}
           onMouseLeave={() => { handleLeave(); setHoveredId(null); setHoveredLink(null); }}>
          <span className="qcode">01 · DASHBOARD</span>
          <span className="qtitle">Dashboard Teknikal</span>
          <span className="qarrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M9 7h8v8"/></svg></span>
        </a>
        <a className="qlink"
           href="https://docs.google.com/forms/d/e/1FAIpQLSdHfQWKturVq4XISrKFqgZG6teJxpDAiVcwuC26hoavMBjGLw/viewform"
           target="_blank" rel="noopener"
           data-active={hoveredLink === 'f01' ? 'true' : 'false'}
           onMouseEnter={() => { handleHover('vertical'); setHoveredId('compressor'); setHoveredLink('f01'); }}
           onMouseLeave={() => { handleLeave(); setHoveredId(null); setHoveredLink(null); }}>
          <span className="qcode">F-01 · BORANG</span>
          <span className="qtitle">Pemeriksaan Alat Ganti</span>
          <span className="qarrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M9 7h8v8"/></svg></span>
        </a>
        <a className="qlink"
           href="https://forms.gle/9yxfaEAvEiHfBjTXA"
           target="_blank" rel="noopener"
           data-active={hoveredLink === 'f02' ? 'true' : 'false'}
           onMouseEnter={() => { handleHover('diagnostic'); setHoveredId('rotor'); setHoveredLink('f02'); }}
           onMouseLeave={() => { handleLeave(); setHoveredId(null); setHoveredLink(null); }}>
          <span className="qcode">F-02 · BORANG</span>
          <span className="qtitle">Mewujudkan Dokumen / Penerimaan Peralatan ATM</span>
          <span className="qarrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M9 7h8v8"/></svg></span>
        </a>
        <a className="qlink"
           href="https://docs.google.com/forms/d/e/1FAIpQLSc9qcmCLyHy-t-GIo3cz1k9aoTrzk5F-ComMLORNVfxovIJ3A/viewform"
           target="_blank" rel="noopener"
           data-active={hoveredLink === 'f03' ? 'true' : 'false'}
           onMouseEnter={() => { handleHover('isolate'); setHoveredId('generator'); setHoveredLink('f03'); }}
           onMouseLeave={() => { handleLeave(); setHoveredId(null); setHoveredLink(null); }}>
          <span className="qcode">F-03 · BORANG</span>
          <span className="qtitle">Penerimaan Akhir (FAT)</span>
          <span className="qarrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M9 7h8v8"/></svg></span>
        </a>
        <a className="qlink" href="carta.html"
           data-active={hoveredLink === 'sop' ? 'true' : 'false'}
           onMouseEnter={() => { handleHover('diagnostic'); setHoveredId('turbine'); setHoveredLink('sop'); }}
           onMouseLeave={() => { handleLeave(); setHoveredId(null); setHoveredLink(null); }}>
          <span className="qcode">SOP · CARTA</span>
          <span className="qtitle">Carta Sempadan Kuasa</span>
          <span className="qarrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M9 7h8v8"/></svg></span>
        </a>
      </footer>

      {tweaks.showHints && (
        <div className="hover-hint">
          <b>HOVER</b> butang atau komponen untuk pandangan terurai &nbsp;·&nbsp; <b>KLIK</b> untuk buka pautan
        </div>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Layout">
          <TweakSelect label="Default view" value={tweaks.defaultView}
            options={[
              {value:'whole', label:'Pandangan 3D'},
              {value:'exploded', label:'Letupan Sisi (Lateral)'},
              {value:'vertical', label:'Letupan Menegak'},
              {value:'isolate', label:'Pemencilan'},
              {value:'diagnostic', label:'Diagnostik'},
            ]}
            onChange={v => setTweaks({...tweaks, defaultView: v})}/>
        </TweakSection>
        <TweakSection label="UI">
          <TweakToggle label="Show ticker (Peringatan)" value={tweaks.showTicker}
            onChange={v => setTweaks({...tweaks, showTicker: v})}/>
          <TweakToggle label="Show hover hint" value={tweaks.showHints}
            onChange={v => setTweaks({...tweaks, showHints: v})}/>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
