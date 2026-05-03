// 3D-style exploded turbine/engine — axonometric perspective
// Each part is a cylindrical/disc shape drawn with ellipses for 3D feel
// Layout: horizontal axis with components arranged left-to-right along centerline

// Helper: draws a 3D cylinder (disc) at a given x position
// length = how thick the cylinder is on the axis
// rTop = top radius (Y-axis ellipse), rFront = front-face radius
const Cylinder = ({ x = 0, length = 30, r = 30, ry = 12, fillOpacity = 0.06, label }) => (
  <g>
    {/* Body (rectangle between two ellipses) */}
    <path
      className="part-stroke"
      d={`M ${x - length/2} ${-r} L ${x + length/2} ${-r} M ${x - length/2} ${r} L ${x + length/2} ${r}`}
    />
    {/* Back ellipse (dashed, partially visible) */}
    <ellipse
      className="part-stroke"
      cx={x - length/2} cy={0} rx={ry} ry={r}
      strokeDasharray="2 3"
      opacity="0.5"
    />
    {/* Front ellipse */}
    <ellipse
      className="part-fill"
      cx={x + length/2} cy={0} rx={ry} ry={r}
      style={{fillOpacity}}
    />
    <ellipse
      className="part-stroke"
      cx={x + length/2} cy={0} rx={ry} ry={r}
    />
    {/* Inner ellipse for depth */}
    <ellipse
      className="part-stroke"
      cx={x + length/2} cy={0} rx={ry * 0.7} ry={r * 0.7}
      opacity="0.6"
    />
    <ellipse
      className="part-stroke"
      cx={x + length/2} cy={0} rx={ry * 0.4} ry={r * 0.4}
      opacity="0.4"
    />
  </g>
);

// A turbine disc with fins
const TurbineDisc = ({ x = 0, r = 40, ry = 14, fins = 24 }) => {
  const lines = [];
  for (let i = 0; i < fins; i++) {
    const a = (i / fins) * Math.PI * 2;
    const y1 = Math.sin(a) * r * 0.6;
    const y2 = Math.sin(a) * r;
    const xOff1 = Math.cos(a) * ry * 0.6;
    const xOff2 = Math.cos(a) * ry;
    lines.push(
      <line
        key={i}
        className="part-stroke"
        x1={x + xOff1} y1={y1}
        x2={x + xOff2} y2={y2}
        opacity="0.7"
      />
    );
  }
  return (
    <g>
      <ellipse className="part-fill" cx={x} cy={0} rx={ry} ry={r} style={{fillOpacity:0.05}}/>
      <ellipse className="part-stroke" cx={x} cy={0} rx={ry} ry={r} strokeWidth="1.5"/>
      {lines}
      <ellipse className="part-stroke" cx={x} cy={0} rx={ry * 0.6} ry={r * 0.6}/>
      <ellipse className="part-stroke" cx={x} cy={0} rx={ry * 0.25} ry={r * 0.25} fill="var(--acc-bg)"/>
    </g>
  );
};

// A pipe/cylinder oriented horizontally with bends
const PipeAssembly = ({ x = 0, scale = 1 }) => (
  <g transform={`translate(${x},0) scale(${scale})`}>
    <path className="part-stroke" d="M -80 0 Q -80 -40 -40 -40 L 40 -40 Q 80 -40 80 0 L 80 30"
          strokeWidth="1.5" fill="none"/>
    <path className="part-stroke" d="M -80 8 Q -80 -32 -40 -32 L 40 -32 Q 72 -32 72 0 L 72 30"
          strokeWidth="0.8" fill="none" opacity="0.6"/>
    <ellipse className="part-fill" cx="-80" cy="0" rx="6" ry="14" style={{fillOpacity:0.1}}/>
    <ellipse className="part-stroke" cx="-80" cy="0" rx="6" ry="14"/>
    <ellipse className="part-fill" cx="80" cy="30" rx="6" ry="14" style={{fillOpacity:0.1}}/>
    <ellipse className="part-stroke" cx="80" cy="30" rx="6" ry="14"/>
    <line className="part-stroke" x1="-40" y1="-46" x2="-40" y2="-34" opacity="0.5"/>
    <line className="part-stroke" x1="40" y1="-46" x2="40" y2="-34" opacity="0.5"/>
  </g>
);

// Bolt / fastener cluster
const BoltCluster = ({ x = 0, count = 3 }) => (
  <g transform={`translate(${x},0)`}>
    {Array.from({length:count}).map((_,i)=>(
      <g key={i} transform={`translate(0,${(i - (count-1)/2) * 14})`}>
        <rect className="part-stroke" x="-3" y="-3" width="6" height="6"/>
        <line className="part-stroke" x1="3" y1="0" x2="14" y2="0" strokeWidth="1.4"/>
        <circle className="part-stroke" cx="14" cy="0" r="1.5"/>
      </g>
    ))}
  </g>
);

// Housing/casing — large cylinder with bracket
const Housing = ({ x = 0, length = 60, r = 50, ry = 18 }) => (
  <g>
    <Cylinder x={x} length={length} r={r} ry={ry} fillOpacity={0.04}/>
    {/* Mounting brackets */}
    <rect className="part-stroke" x={x - length/2 - 4} y={-r - 2} width={length + 8} height="4" opacity="0.7"/>
    <rect className="part-stroke" x={x - length/2 - 4} y={r - 2} width={length + 8} height="4" opacity="0.7"/>
    {/* Ribs */}
    {[-15, 0, 15].map((dx,i)=> (
      <line key={i} className="part-stroke" x1={x + dx} y1={-r} x2={x + dx} y2={r} opacity="0.4"/>
    ))}
  </g>
);

// PARTS — each is positioned along X axis when assembled, and offset when exploded
// Anchors are the assembled positions (centered around 0)
const PARTS_3D = [
  {
    id: 'intake_pipe',
    code: '01',
    name: 'Paip Saluran Masuk',
    nameEn: 'Intake Pipe',
    status: 'ok',
    link: 'dashboard.html',
    linkLabel: 'Dashboard Teknikal',
    anchor: { x: -360, y: 20 },
    render: () => <PipeAssembly x={0} scale={0.9}/>,
    bbox: { w: 180, h: 100 },
  },
  {
    id: 'compressor',
    code: '02',
    name: 'Pemampat',
    nameEn: 'Compressor',
    status: 'ok',
    link: 'https://docs.google.com/forms/d/e/1FAIpQLSdHfQWKturVq4XISrKFqgZG6teJxpDAiVcwuC26hoavMBjGLw/viewform',
    linkTarget: '_blank',
    linkLabel: 'F-01 · Pemeriksaan Alat Ganti',
    anchor: { x: -240, y: 0 },
    render: () => (
      <g>
        <Cylinder x={-30} length={20} r={48} ry={16}/>
        <TurbineDisc x={0} r={50} ry={15}/>
        <Cylinder x={30} length={18} r={42} ry={14}/>
      </g>
    ),
    bbox: { w: 130, h: 110 },
  },
  {
    id: 'rotor',
    code: '03',
    name: 'Rotor Pusingan',
    nameEn: 'Rotor Assembly',
    status: 'warn',
    link: 'https://forms.gle/9yxfaEAvEiHfBjTXA',
    linkTarget: '_blank',
    linkLabel: 'F-02 · Penerimaan Peralatan',
    anchor: { x: -100, y: 0 },
    render: () => (
      <g>
        <TurbineDisc x={-25} r={44} ry={13}/>
        <TurbineDisc x={0} r={48} ry={14}/>
        <TurbineDisc x={25} r={44} ry={13}/>
        <line className="part-stroke" x1="-50" y1="0" x2="50" y2="0" strokeWidth="2" opacity="0.6"/>
      </g>
    ),
    bbox: { w: 110, h: 110 },
  },
  {
    id: 'generator',
    code: '04',
    name: 'Penjana',
    nameEn: 'Generator Core',
    status: 'ok',
    link: 'https://docs.google.com/forms/d/e/1FAIpQLSc9qcmCLyHy-t-GIo3cz1k9aoTrzk5F-ComMLORNVfxovIJ3A/viewform',
    linkTarget: '_blank',
    linkLabel: 'F-03 · Penerimaan Akhir (FAT)',
    anchor: { x: 60, y: 0 },
    render: () => (
      <g>
        <Housing x={0} length={70} r={42} ry={15}/>
        {/* mesh pattern on body */}
        {[-25,-10,5,20].map((dx,i)=>(
          <line key={i} className="part-stroke" x1={dx} y1={-42} x2={dx} y2={42} opacity="0.3"/>
        ))}
      </g>
    ),
    bbox: { w: 90, h: 100 },
  },
  {
    id: 'turbine',
    code: '05',
    name: 'Turbin Tekanan',
    nameEn: 'Pressure Turbine',
    status: 'ok',
    link: 'carta.html',
    linkLabel: 'SOP · Carta Sempadan Kuasa',
    anchor: { x: 200, y: 0 },
    render: () => (
      <g>
        <Cylinder x={-25} length={16} r={38} ry={12}/>
        <TurbineDisc x={0} r={42} ry={13} fins={20}/>
        <Cylinder x={25} length={16} r={36} ry={12}/>
      </g>
    ),
    bbox: { w: 100, h: 90 },
  },
  {
    id: 'exhaust',
    code: '06',
    name: 'Salur Ekzos',
    nameEn: 'Exhaust Outlet',
    status: 'bad',
    link: 'https://wa.me/qr/QPQSVVZHMP22L1',
    linkTarget: '_blank',
    linkLabel: 'Hubungi Pentadbir',
    anchor: { x: 340, y: 0 },
    render: () => (
      <g>
        <Cylinder x={0} length={40} r={32} ry={11}/>
        <ellipse className="part-stroke" cx={22} cy={0} rx="11" ry="32" strokeDasharray="3 2"/>
        <BoltCluster x={50} count={2}/>
      </g>
    ),
    bbox: { w: 90, h: 80 },
  },
];

// VIEW DEFINITIONS — translate offsets for each part
const VIEWS_3D = {
  whole: {
    name: 'Pandangan 3D',
    nameEn: '3D Whole View',
    code: 'V-00',
    desc: 'Keseluruhan modul enjin dipaparkan dalam susunan operasi 3D.',
    transform: (part) => ({ dx: 0, dy: 0, opacity: 1 }),
  },
  exploded: {
    name: 'Letupan Sisi',
    nameEn: 'Lateral Explode',
    code: 'V-01',
    desc: 'Komponen diasingkan secara mendatar untuk pemeriksaan susunan.',
    transform: (part) => {
      const map = {
        intake_pipe: { dx: -180, dy: -20 },
        compressor:  { dx: -90, dy: 0 },
        rotor:       { dx: -30, dy: 0 },
        generator:   { dx: 40, dy: 0 },
        turbine:     { dx: 130, dy: 0 },
        exhaust:     { dx: 220, dy: 0 },
      };
      return { ...map[part.id], opacity: 1 };
    },
  },
  vertical: {
    name: 'Letupan Menegak',
    nameEn: 'Vertical Stack',
    code: 'V-02',
    desc: 'Lapisan dipisah menegak untuk pemeriksaan vertikal komponen.',
    transform: (part) => {
      const map = {
        intake_pipe: { dx: 350, dy: -180 },
        compressor:  { dx: 230, dy: -110 },
        rotor:       { dx: 80, dy: -50 },
        generator:   { dx: -90, dy: 30 },
        turbine:     { dx: -240, dy: 110 },
        exhaust:     { dx: -380, dy: 180 },
      };
      return { ...map[part.id], opacity: 1 };
    },
  },
  isolate: {
    name: 'Pemencilan',
    nameEn: 'Component Isolation',
    code: 'V-03',
    desc: 'Hanya komponen kritikal dipaparkan, lain dimalapkan.',
    transform: (part) => {
      const focus = ['rotor', 'generator', 'turbine'];
      const map = {
        rotor:     { dx: -120, dy: 0 },
        generator: { dx: 0, dy: 0 },
        turbine:   { dx: 120, dy: 0 },
      };
      if (focus.includes(part.id)) {
        return { ...map[part.id], opacity: 1, scale: 1.15 };
      }
      return { dx: 0, dy: 0, opacity: 0.08 };
    },
  },
  diagnostic: {
    name: 'Diagnostik',
    nameEn: 'Diagnostic Status',
    code: 'V-04',
    desc: 'Komponen dikodkan warna mengikut status pemeriksaan.',
    transform: (part) => {
      const map = {
        intake_pipe: { dx: -200, dy: -40 },
        compressor:  { dx: -110, dy: 20 },
        rotor:       { dx: -40, dy: -30 },
        generator:   { dx: 50, dy: 30 },
        turbine:     { dx: 150, dy: -30 },
        exhaust:     { dx: 240, dy: 20 },
      };
      return { ...map[part.id], opacity: 1, useStatus: true };
    },
  },
};

function EngineWireframe3D({ viewKey, hoveredId, setHoveredId, onPartClick, faded = false }) {
  const handleClick = (part) => {
    if (onPartClick) onPartClick(part);
    else if (part.link) {
      if (part.linkTarget === '_blank') window.open(part.link, '_blank', 'noopener');
      else window.location.href = part.link;
    }
  };
  const view = VIEWS_3D[viewKey] || VIEWS_3D.whole;
  const cx = 600, cy = 360;

  return (
    <svg
      className="engine-svg-3d"
      viewBox="0 0 1200 720"
      preserveAspectRatio="xMidYMid slice"
      style={{opacity: faded ? 0.55 : 1, transition: 'opacity .6s'}}
    >
      <defs>
        <pattern id="bp-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(237,237,223,.04)" strokeWidth=".6"/>
        </pattern>
        <pattern id="bp-grid-fine" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(237,237,223,.018)" strokeWidth=".4"/>
        </pattern>
      </defs>

      <rect width="1200" height="720" fill="url(#bp-grid-fine)"/>
      <rect width="1200" height="720" fill="url(#bp-grid)"/>

      {/* Reference axis */}
      <line x1="80" y1={cy} x2="1120" y2={cy}
            stroke="rgba(237,237,223,.08)" strokeWidth=".8" strokeDasharray="2 4"/>
      <line x1={cx} y1="80" x2={cx} y2="640"
            stroke="rgba(237,237,223,.05)" strokeWidth=".8" strokeDasharray="2 4"/>

      {/* Corner ticks — neutral */}
      {[[60,60,1,1],[1140,60,-1,1],[60,660,1,-1],[1140,660,-1,-1]].map(([x,y,sx,sy],i)=>(
        <g key={i} stroke="rgba(237,237,223,.35)" strokeWidth="1">
          <line x1={x} y1={y} x2={x+14*sx} y2={y}/>
          <line x1={x} y1={y} x2={x} y2={y+14*sy}/>
        </g>
      ))}

      {/* Render parts */}
      {PARTS_3D.map((part) => {
        const t = view.transform(part);
        const px = cx + part.anchor.x + (t.dx || 0);
        const py = cy + part.anchor.y + (t.dy || 0);
        const opacity = t.opacity ?? 1;
        const scale = t.scale ?? 1;
        const isHovered = hoveredId === part.id;
        const statusClass = t.useStatus ? `status-${part.status}` : '';

        return (
          <g
            key={part.id}
            className={`part3d ${isHovered ? 'highlight' : ''} ${statusClass}`}
            style={{
              transform: `translate(${px}px, ${py}px) scale(${scale})`,
              opacity,
              cursor: 'pointer',
            }}
            onMouseEnter={() => setHoveredId(part.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => handleClick(part)}
          >
            {part.render()}
          </g>
        );
      })}

      {/* Number bubbles + leader lines (only when exploded) */}
      {viewKey !== 'whole' && PARTS_3D.map((part, i) => {
        const t = view.transform(part);
        const px = cx + part.anchor.x + (t.dx || 0);
        const py = cy + part.anchor.y + (t.dy || 0);
        const opacity = t.opacity ?? 1;
        if (opacity < 0.5) return null;

        // bubble below or above based on position
        const above = py > cy;
        const by = above ? py - 80 : py + 80;
        const bx = px;

        const isHov = hoveredId === part.id;
        return (
          <g key={`n-${part.id}`}
             className={`part-label-grp ${isHov ? 'hov' : ''}`}
             style={{transition:'all 1.1s cubic-bezier(.22,.68,0,1)', opacity, cursor:'pointer'}}
             onMouseEnter={() => setHoveredId(part.id)}
             onMouseLeave={() => setHoveredId(null)}
             onClick={() => handleClick(part)}>
            <line className="dim-line" x1={px} y1={py} x2={bx} y2={by}/>
            <circle className="num-bubble" cx={bx} cy={by} r="13"/>
            <text className="num-text" x={bx} y={by}>{part.code}</text>
          </g>
        );
      })}
    </svg>
  );
}

window.EngineWireframe3D = EngineWireframe3D;
window.PARTS_3D = PARTS_3D;
window.VIEWS_3D = VIEWS_3D;
