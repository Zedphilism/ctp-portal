const { useState, useEffect } = React;

const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showHints": true,
  "showTicker": true,
  "defaultView": "exploded",
  "accent": "chartreuse"
}/*EDITMODE-END*/;

const ACCENTS = {
  chartreuse: 'oklch(0.88 0.21 130)',
  cyan:       'oklch(0.85 0.16 195)',
  amber:      'oklch(0.85 0.18 75)',
  magenta:    'oklch(0.78 0.22 340)',
  bone:       'oklch(0.92 0.02 90)',
};

const ANNOUNCEMENTS = [
  "Sila pastikan anda memilih sel dan borang yang betul mengikut keperluan pemeriksaan anda.",
  "Semak SOP dan garis panduan yang telah disediakan sebelum menghantar permohonan.",
  "Sebarang permasalahan boleh berhubung terus dengan SSjn Zaidi Abdullah.",
];

const LINK_INFO = {
  dashboard: {
    code: '01 / DASHBOARD',
    title: 'Dashboard Teknikal',
    body: 'Senarai permohonan yang diterima oleh CT&P untuk pemantauan status, pemeriksa yang ditugaskan, beban semasa dan sebagainya.',
  },
  f01: {
    code: 'F-01 / BORANG',
    title: 'Pemeriksaan Alat Ganti',
    body: 'Borang untuk pemeriksaan alat ganti kenderaan ATM. Digunakan oleh KSOD / BOD / KOD.',
  },
  f02: {
    code: 'F-02 / BORANG',
    title: 'Mewujudkan Dokumen / Penerimaan Peralatan ARM',
    body: 'Borang untuk mewujudkan dokumen peralatan di pasukan atau penerimaan peralatan baru oleh ATM.',
  },
  f03: {
    code: 'F-03 / BORANG',
    title: 'Penerimaan Akhir (FAT)',
    body: 'Borang untuk Pemeriksaan Penerimaan Akhir.',
  },
  sop: {
    code: 'SOP / CARTA',
    title: 'Carta Sempadan Kuasa',
    body: 'Carta alir penguatkuasaan tugas.',
  },
};

function Ticker() {
  const msg = ANNOUNCEMENTS.join("    ·    ");
  return (
    <div className="ticker">
      <span className="ttag">Peringatan</span>
      <div className="tport">
        <div className="ttrack">
          <span className="ttext">{msg}</span>
          <span className="ttext">{msg}</span>
        </div>
      </div>
    </div>
  );
}

const ArrowOut = () => (
  <svg className="qarrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M7 17 L17 7 M9 7 h8 v8"/>
  </svg>
);

function App() {
  const [tweaks, setTweaks] = useTweaks(TWEAKS_DEFAULTS);
  const [currentView, setCurrentView] = useState(tweaks.defaultView || 'exploded');
  const [pinnedView, setPinnedView] = useState(tweaks.defaultView || 'exploded');
  const [hoveredId, setHoveredId] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null);

  // Apply accent color
  useEffect(() => {
    const c = ACCENTS[tweaks.accent] || ACCENTS.chartreuse;
    document.documentElement.style.setProperty('--acc', c);
    document.documentElement.style.setProperty('--acc-dim', c.replace(')', ' / .35)'));
    document.documentElement.style.setProperty('--acc-bg',  c.replace(')', ' / .08)'));
  }, [tweaks.accent]);

  const handleHover = (key) => setCurrentView(key || pinnedView);
  const handleLeave = () => setCurrentView(pinnedView);

  useEffect(() => {
    setPinnedView(tweaks.defaultView || 'exploded');
    setCurrentView(tweaks.defaultView || 'exploded');
  }, [tweaks.defaultView]);

  // Mount engine into background
  useEffect(() => {
    const bg = document.getElementById('engineBg');
    if (!bg) return;
    if (!bg._root) bg._root = ReactDOM.createRoot(bg);
    bg._root.render(
      <window.EngineWireframe3D
        viewKey={currentView}
        hoveredId={hoveredId}
        setHoveredId={setHoveredId}
      />
    );
  }, [currentView, hoveredId]);

  const view = window.VIEWS_3D[currentView] || window.VIEWS_3D.whole;
  const info = hoveredLink && LINK_INFO[hoveredLink];

  // Clock
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const tstr = now.toTimeString().slice(0,8);
  const dstr = now.toISOString().slice(0,10);

  return (
    <div className="stage">
      {/* Top rail */}
      <header className="top-rail">
        <div className="top-rail-l">
          <div className="brand-mark">
            <img src="assets/icon1.png" alt=""/>
            <img src="assets/icon2.png" alt=""/>
          </div>
          <span className="brand-name">Portal CT&amp;P <span>/</span> Sel Teknikal</span>
        </div>
        <div className="top-rail-r">
          <span className="top-meta"><b>{dstr}</b> &nbsp; {tstr} UTC+8</span>
          <span className="top-meta">REV <b>04.26</b></span>
          <span className="top-meta">PEMERIKSA <b>12</b></span>
          <span className="top-meta live">SISTEM AKTIF</span>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-l">
          <div className="hero-eyebrow">
            <span className="pip"></span>
            <b>SISTEM PEMERIKSAAN ATM</b>
            <span>· v04.26</span>
          </div>
          <h1 className="hero-title">
            Pemeriksaan <em>teknikal</em> <span className="slash">/</span> kenderaan &amp; peralatan ATM,
            <br/>
            satu portal.
          </h1>
          <p className="hero-sub">
            Daftar, semak, dan hantar borang pemeriksaan alat ganti, penerimaan peralatan,
            dan FAT — semua melalui sel teknikal pusat. Hover komponen enjin untuk akses pantas.
          </p>
        </div>
        <div className="hero-r">
          <span className="stamp">[ Klasifikasi · Dalaman ]</span>
          <span className="ver">Modul aktif <b>05/05</b></span>
          <span className="ver">Penyenggaraan <b>2026.04.27</b></span>
        </div>
      </section>

      {/* Command bar */}
      <div className="cta-bar">
        <div className="cmd">
          <span className="prompt">$</span>
          <span><span className="typed">ctp</span> open --module dashboard --user pemeriksa</span>
          <span className="caret"></span>
        </div>
        <a className="go" href="dashboard.html"
           onMouseEnter={() => { handleHover('exploded'); setHoveredId('intake_pipe'); setHoveredLink('dashboard'); }}
           onMouseLeave={() => { handleLeave(); setHoveredId(null); setHoveredLink(null); }}>
          MASUK DASHBOARD
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M5 12h14M13 5l7 7-7 7"/>
          </svg>
        </a>
      </div>

      {/* Body — view readout left, info card right */}
      <div className="body-grid">
        <div className="body-l">
          <div className="view-readout">
            <span>PROJEKSI</span>
            <span className="vname">{view.code} · {view.nameEn.toUpperCase()}</span>
            <span className="sep">│</span>
            <span>SKALA 1:24</span>
            <span className="sep">│</span>
            <span>{Object.keys(window.VIEWS_3D).indexOf(currentView)+1}/{Object.keys(window.VIEWS_3D).length}</span>
          </div>
          <div className="scan-strip">
            <span>SCAN</span>
            <span className="bar"></span>
            <span>OK</span>
          </div>
        </div>

        <aside className="side">
          {info ? (
            <div className="side-block">
              <span className="crumb">{info.code}</span>
              <h3 className="ttl">{info.title}</h3>
              <p className="body">{info.body}</p>
            </div>
          ) : (
            <div className="side-block is-idle">
              <span className="crumb" style={{color:'var(--ink-3)'}}>// hover</span>
              <p className="body">Hover butang atau komponen enjin untuk lihat keterangan modul.</p>
            </div>
          )}
          <div className="side-block" style={{padding:0}}>
            <div className="stat-row">
              <div className="stat">
                <span className="l">Borang aktif</span>
                <span className="v">03</span>
              </div>
              <div className="stat">
                <span className="l">Modul</span>
                <span className="v">05</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer rail with quick links + ticker */}
      <footer className="footer-rail">
        {tweaks.showTicker && <Ticker/>}

        <div className="footer-head">
          <span>Pintasan <b>· 5 modul</b></span>
          <span>Hover untuk pratonton enjin</span>
        </div>

        <nav className="quick-links">
          <a className="qlink" href="dashboard.html"
             data-active={hoveredLink === 'dashboard' ? 'true' : 'false'}
             onMouseEnter={() => { handleHover('exploded'); setHoveredId('intake_pipe'); setHoveredLink('dashboard'); }}
             onMouseLeave={() => { handleLeave(); setHoveredId(null); setHoveredLink(null); }}>
            <span className="qcode"><span className="num">01</span> / DASHBOARD</span>
            <span className="qttl">Dashboard Teknikal</span>
            <ArrowOut/>
          </a>

          <a className="qlink"
             href="https://docs.google.com/forms/d/e/1FAIpQLSdHfQWKturVq4XISrKFqgZG6teJxpDAiVcwuC26hoavMBjGLw/viewform"
             target="_blank" rel="noopener"
             data-active={hoveredLink === 'f01' ? 'true' : 'false'}
             onMouseEnter={() => { handleHover('vertical'); setHoveredId('compressor'); setHoveredLink('f01'); }}
             onMouseLeave={() => { handleLeave(); setHoveredId(null); setHoveredLink(null); }}>
            <span className="qcode"><span className="num">F-01</span> / BORANG</span>
            <span className="qttl">Pemeriksaan Alat Ganti</span>
            <ArrowOut/>
          </a>

          <a className="qlink"
             href="https://forms.gle/9yxfaEAvEiHfBjTXA"
             target="_blank" rel="noopener"
             data-active={hoveredLink === 'f02' ? 'true' : 'false'}
             onMouseEnter={() => { handleHover('diagnostic'); setHoveredId('rotor'); setHoveredLink('f02'); }}
             onMouseLeave={() => { handleLeave(); setHoveredId(null); setHoveredLink(null); }}>
            <span className="qcode"><span className="num">F-02</span> / BORANG</span>
            <span className="qttl">Penerimaan Peralatan ARM</span>
            <ArrowOut/>
          </a>

          <a className="qlink"
             href="https://docs.google.com/forms/d/e/1FAIpQLSc9qcmCLyHy-t-GIo3cz1k9aoTrzk5F-ComMLORNVfxovIJ3A/viewform"
             target="_blank" rel="noopener"
             data-active={hoveredLink === 'f03' ? 'true' : 'false'}
             onMouseEnter={() => { handleHover('isolate'); setHoveredId('generator'); setHoveredLink('f03'); }}
             onMouseLeave={() => { handleLeave(); setHoveredId(null); setHoveredLink(null); }}>
            <span className="qcode"><span className="num">F-03</span> / BORANG</span>
            <span className="qttl">Penerimaan Akhir (FAT)</span>
            <ArrowOut/>
          </a>

          <a className="qlink" href="carta.html"
             data-active={hoveredLink === 'sop' ? 'true' : 'false'}
             onMouseEnter={() => { handleHover('diagnostic'); setHoveredId('turbine'); setHoveredLink('sop'); }}
             onMouseLeave={() => { handleLeave(); setHoveredId(null); setHoveredLink(null); }}>
            <span className="qcode"><span className="num">SOP</span> / CARTA</span>
            <span className="qttl">Carta Sempadan Kuasa</span>
            <ArrowOut/>
          </a>
        </nav>
      </footer>

      {tweaks.showHints && (
        <div className="hint">
          <div className="keys">
            <span><b>HOVER</b></span>
            <span className="key">↳</span>
            <span>pratonton komponen enjin</span>
            <span className="key">·</span>
            <span><b>KLIK</b></span>
            <span className="key">↳</span>
            <span>buka modul</span>
          </div>
          <div className="hint-r">
            <span className="pos">x: {hoveredId || '—'}</span>
            <span>view: {view.code}</span>
          </div>
        </div>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Aksen">
          <TweakRadio label="Warna aksen" value={tweaks.accent}
            options={[
              {value:'chartreuse', label:'Chartreuse'},
              {value:'cyan', label:'Cyan'},
              {value:'amber', label:'Amber'},
              {value:'magenta', label:'Magenta'},
              {value:'bone', label:'Bone'},
            ]}
            onChange={v => setTweaks({accent: v})}/>
        </TweakSection>
        <TweakSection label="Pandangan">
          <TweakSelect label="Pandangan lalai" value={tweaks.defaultView}
            options={[
              {value:'whole', label:'Pandangan 3D'},
              {value:'exploded', label:'Letupan Sisi'},
              {value:'vertical', label:'Letupan Menegak'},
              {value:'isolate', label:'Pemencilan'},
              {value:'diagnostic', label:'Diagnostik'},
            ]}
            onChange={v => setTweaks({defaultView: v})}/>
        </TweakSection>
        <TweakSection label="UI">
          <TweakToggle label="Tunjuk ticker (Peringatan)" value={tweaks.showTicker}
            onChange={v => setTweaks({showTicker: v})}/>
          <TweakToggle label="Tunjuk hint bar" value={tweaks.showHints}
            onChange={v => setTweaks({showHints: v})}/>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
