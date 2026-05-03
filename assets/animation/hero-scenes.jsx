/* Turbine cutaway — blueprint side-profile, parts on horizontal shaft axis.
   5 stages driven by scroll: assembled → exploded (lateral) → diagnosis → linear → lock.
   Gear/rotor spins on its own axis (no positional drift).
*/

const { useEffect, useRef, useState } = React;

const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo=0, hi=1) => Math.max(lo, Math.min(hi, v));
const ease = { inOut: t => t<.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2 };
const win = (p, s, e) => clamp((p - s) / (e - s));

const VB_W = 1600, VB_H = 900;
const STROKE = 'currentColor';

/* ──── BLUEPRINT PARTS — side profile (XY plane), centered at (0,0) ──── */

// Bladed rotor disc (turbine wheel). Spins on its own X-axis (so blades appear/disappear via the side profile).
const RotorDisc = ({ rOuter=110, rHub=18, thick=22, blades=42, faulty, spin=0 }) => {
  const stroke = faulty ? 'var(--fault)' : STROKE;
  // Casing: outer ellipse (front face) + back face dashed
  return (
    <g stroke={stroke} fill="none">
      {/* Side profile: pair of vertical lines (outer rim + inner hub) */}
      <line x1={-thick/2} y1={-rOuter} x2={-thick/2} y2={rOuter} strokeWidth="1"/>
      <line x1={ thick/2} y1={-rOuter} x2={ thick/2} y2={rOuter} strokeWidth="1.4"/>
      {/* Top + bottom rim caps */}
      <line x1={-thick/2} y1={-rOuter} x2={thick/2} y2={-rOuter} strokeWidth="1"/>
      <line x1={-thick/2} y1={ rOuter} x2={thick/2} y2={ rOuter} strokeWidth="1"/>
      {/* Hub pair */}
      <line x1={-thick/2} y1={-rHub} x2={ thick/2} y2={-rHub} strokeWidth=".8"/>
      <line x1={-thick/2} y1={ rHub} x2={ thick/2} y2={ rHub} strokeWidth=".8"/>

      {/* Front face — circle showing blades from front. Project so we see them rotated by spin. */}
      <g style={{ transform: `translate(${thick/2 + 0.5}px, 0) scale(0.5, 1)` }}>
        <circle cx="0" cy="0" r={rOuter} stroke={stroke} strokeWidth="1.2" fill="none"/>
        <circle cx="0" cy="0" r={rOuter*0.92} stroke={stroke} strokeWidth=".5" fill="none" opacity=".5"/>
        <circle cx="0" cy="0" r={rHub} stroke={stroke} strokeWidth=".9" fill="none"/>
        {/* Blade fins */}
        {Array.from({length: blades}).map((_, i) => {
          const a = (i / blades) * TAU + spin;
          const r1 = rHub + 4, r2 = rOuter - 4;
          return (
            <line key={i}
                  x1={Math.cos(a) * r1} y1={Math.sin(a) * r1}
                  x2={Math.cos(a) * r2} y2={Math.sin(a) * r2}
                  stroke={stroke} strokeWidth=".55" opacity=".75"/>
          );
        })}
        {/* Subtle shadow ring */}
        <circle cx="0" cy="0" r={rOuter*0.55} stroke={stroke} strokeWidth=".4" fill="none" opacity=".35"/>
      </g>

      {/* Side blade fin marks (top edge — like a comb) for the side profile */}
      {Array.from({length: 24}).map((_, i) => {
        const x = -thick/2 + (i+0.5) * (thick/24);
        return (
          <g key={'sb'+i}>
            <line x1={x} y1={-rOuter} x2={x} y2={-rOuter+10} strokeWidth=".4" opacity=".5"/>
            <line x1={x} y1={ rOuter} x2={x} y2={ rOuter-10} strokeWidth=".4" opacity=".5"/>
          </g>
        );
      })}
    </g>
  );
};

// Generator drum (cylinder with vertical fin lines)
const GeneratorDrum = ({ w=160, h=120, faulty }) => {
  const stroke = faulty ? 'var(--fault)' : STROKE;
  return (
    <g stroke={stroke} fill="none">
      <rect x={-w/2} y={-h/2} width={w} height={h} strokeWidth="1.4"/>
      {/* End ellipses */}
      <ellipse cx={-w/2} cy={0} rx="6" ry={h/2} strokeWidth="1"/>
      <ellipse cx={ w/2} cy={0} rx="6" ry={h/2} strokeWidth="1"/>
      {/* Vertical fin lines */}
      {Array.from({length: 22}).map((_, i) => {
        const x = -w/2 + 8 + (i / 21) * (w - 16);
        return <line key={i} x1={x} y1={-h/2 + 4} x2={x} y2={h/2 - 4} strokeWidth=".5" opacity=".7"/>;
      })}
      {/* Cap rings */}
      <line x1={-w/2 + 8} y1={-h/2} x2={-w/2 + 8} y2={h/2} strokeWidth=".6"/>
      <line x1={ w/2 - 8} y1={-h/2} x2={ w/2 - 8} y2={h/2} strokeWidth=".6"/>
    </g>
  );
};

// Pressure pipe — U-bend manifold, profile view
const PressurePipe = ({ w=140, h=110, faulty }) => {
  const stroke = faulty ? 'var(--fault)' : STROKE;
  const t = 16; // tube thickness (radius)
  return (
    <g stroke={stroke} fill="none">
      {/* Outer wall */}
      <path d={`
        M ${-w/2} ${ h/2}
        L ${-w/2} ${-h/2 + t*1.2}
        Q ${-w/2} ${-h/2 - t*0.2} ${-w/2 + t*1.2} ${-h/2 - t*0.2}
        L ${ w/2 - t*1.2} ${-h/2 - t*0.2}
        Q ${ w/2} ${-h/2 - t*0.2} ${ w/2} ${-h/2 + t*1.2}
        L ${ w/2} ${ h/2}
      `} strokeWidth="1.4"/>
      {/* Inner wall */}
      <path d={`
        M ${-w/2 + t*1.4} ${ h/2}
        L ${-w/2 + t*1.4} ${-h/2 + t*1.0}
        Q ${-w/2 + t*1.4} ${-h/2 + t*1.4} ${-w/2 + t*2.6} ${-h/2 + t*1.4}
        L ${ w/2 - t*2.6} ${-h/2 + t*1.4}
        Q ${ w/2 - t*1.4} ${-h/2 + t*1.4} ${ w/2 - t*1.4} ${-h/2 + t*1.0}
        L ${ w/2 - t*1.4} ${ h/2}
      `} strokeWidth="1"/>
      {/* End cap ellipses */}
      <ellipse cx={-w/2 + t*0.7} cy={ h/2} rx={t*0.7} ry="3" strokeWidth=".7"/>
      <ellipse cx={ w/2 - t*0.7} cy={ h/2} rx={t*0.7} ry="3" strokeWidth=".7"/>
      {/* Section detail rings */}
      <line x1={-w/2 - 4} y1={ h/2 - 30} x2={-w/2 + t*1.6} y2={ h/2 - 30} strokeWidth=".6" opacity=".7"/>
      <line x1={ w/2 + 4} y1={ h/2 - 30} x2={ w/2 - t*1.6} y2={ h/2 - 30} strokeWidth=".6" opacity=".7"/>
    </g>
  );
};

// Bearing housing
const Bearing = ({ r=44, faulty }) => {
  const stroke = faulty ? 'var(--fault)' : STROKE;
  return (
    <g stroke={stroke} fill="none">
      <circle cx="0" cy="0" r={r} strokeWidth="1.4"/>
      <circle cx="0" cy="0" r={r*0.78} strokeWidth=".9"/>
      <circle cx="0" cy="0" r={r*0.5} strokeWidth=".7"/>
      <circle cx="0" cy="0" r={r*0.22} strokeWidth=".6"/>
      {Array.from({length: 18}).map((_, i) => {
        const a = (i / 18) * TAU;
        const r1 = r*0.55, r2 = r*0.74;
        return <line key={i} x1={Math.cos(a)*r1} y1={Math.sin(a)*r1}
                     x2={Math.cos(a)*r2} y2={Math.sin(a)*r2} strokeWidth=".4"/>;
      })}
    </g>
  );
};

// Shaft end cap (small cylinder with bolt)
const EndCap = ({ w=70, h=36, faulty }) => {
  const stroke = faulty ? 'var(--fault)' : STROKE;
  return (
    <g stroke={stroke} fill="none">
      <rect x={-w/2} y={-h/2} width={w} height={h} strokeWidth="1.3"/>
      <line x1={-w/2 + 6} y1={-h/2} x2={-w/2 + 6} y2={h/2} strokeWidth=".7"/>
      <line x1={ w/2 - 6} y1={-h/2} x2={ w/2 - 6} y2={h/2} strokeWidth=".7"/>
      <ellipse cx={-w/2} cy={0} rx="3" ry={h/2} strokeWidth=".7"/>
      <ellipse cx={ w/2} cy={0} rx="3" ry={h/2} strokeWidth=".7"/>
      <line x1={-w/2 + 14} y1={0} x2={w/2 - 14} y2={0} strokeWidth=".4" strokeDasharray="2 3" opacity=".6"/>
    </g>
  );
};

// Small detail (washer/nut group)
const SmallSeal = ({ r=14, faulty }) => {
  const stroke = faulty ? 'var(--fault)' : STROKE;
  return (
    <g stroke={stroke} fill="none">
      <circle cx="0" cy="0" r={r} strokeWidth="1"/>
      <circle cx="0" cy="0" r={r*0.55} strokeWidth=".7"/>
      <circle cx="0" cy="0" r={r*0.2} fill={stroke}/>
    </g>
  );
};

/* ──── PARTS DATA ────
   Side-profile only — y is fixed (most parts on shaft axis y=0).
   Stages: assembled (tight clustered), exploded (spread along X), diagnosis,
           linear (uniform spacing), lock (compressed back to small).
*/

const PARTS = [
  // Center stack of bladed rotor discs — these are the "gears" that spin
  { id:'rotor1', code:'1', label:'Rotor · stage I', render:RotorDisc, props:{rOuter:90, rHub:14, thick:18, blades:42},
    SPIN:1.0,
    assembled:{x:-150, y:0,  scale:1,   opacity:1},
    exploded: {x:-380, y:0,  scale:1,   opacity:1},
    diagnosis:{x:-150, y:0,  scale:.7,  opacity:.4},
    linear:   {x:-560, y:0,  scale:.7,  opacity:1},
    lock:     {x:-50,  y:0,  scale:.45, opacity:.85},
  },
  { id:'rotor2', code:'2', label:'Rotor · stage II', render:RotorDisc, props:{rOuter:120, rHub:16, thick:22, blades:48},
    FAULTY:true, SPIN:0.8,
    assembled:{x:-50, y:0,  scale:1,   opacity:1},
    exploded: {x:-180, y:0,  scale:1,   opacity:1},
    diagnosis:{x:0,   y:0,  scale:1.35,opacity:1},
    linear:   {x:-340,y:0,  scale:.7,  opacity:1},
    lock:     {x:0,   y:0,  scale:.55, opacity:1},
  },
  { id:'rotor3', code:'3', label:'Rotor · stage III', render:RotorDisc, props:{rOuter:100, rHub:14, thick:20, blades:44},
    SPIN:1.4,
    assembled:{x:60,  y:0,  scale:1,   opacity:1},
    exploded: {x:30,  y:0,  scale:1,   opacity:1},
    diagnosis:{x:60,  y:0,  scale:.7,  opacity:.4},
    linear:   {x:-120,y:0,  scale:.7,  opacity:1},
    lock:     {x:50,  y:0,  scale:.45, opacity:.85},
  },
  { id:'gen', code:'4', label:'Generator', render:GeneratorDrum, props:{w:200, h:130},
    assembled:{x:240, y:0,  scale:1,   opacity:1},
    exploded: {x:380, y:0,  scale:1,   opacity:1},
    diagnosis:{x:240, y:0,  scale:.7,  opacity:.4},
    linear:   {x:140, y:0,  scale:.7,  opacity:1},
    lock:     {x:120, y:0,  scale:.45, opacity:.85},
  },
  { id:'pipeL', code:'5', label:'High-pressure', render:PressurePipe, props:{w:200, h:120},
    assembled:{x:-280, y:-180, scale:1, opacity:1},
    exploded: {x:-280, y:-220, scale:1, opacity:1},
    diagnosis:{x:-280, y:-180, scale:.7, opacity:.4},
    linear:   {x:380,  y:0,    scale:.7, opacity:1},
    lock:     {x:-150, y:-100, scale:.45, opacity:.85},
  },
  { id:'pipeR', code:'5b', label:'Low-pressure', render:PressurePipe, props:{w:200, h:120},
    assembled:{x:120, y:-180, scale:1, opacity:1},
    exploded: {x:160, y:-220, scale:1, opacity:1},
    diagnosis:{x:120, y:-180, scale:.7, opacity:.4},
    linear:   {x:560, y:0,    scale:.7, opacity:1},
    lock:     {x:150, y:-100, scale:.45, opacity:.85},
  },
  { id:'bear1', code:'6', label:'Bearing housing', render:Bearing, props:{r:48},
    assembled:{x:380, y:0, scale:1, opacity:1},
    exploded: {x:540, y:0, scale:1, opacity:1},
    diagnosis:{x:380, y:0, scale:.7, opacity:.4},
    linear:   {x:340, y:0, scale:.7, opacity:1},
    lock:     {x:200, y:0, scale:.45, opacity:.85},
  },
  { id:'cap', code:'7', label:'End cap', render:EndCap, props:{w:80, h:42},
    assembled:{x:480, y:0, scale:1, opacity:1},
    exploded: {x:680, y:0, scale:1, opacity:1},
    diagnosis:{x:480, y:0, scale:.7, opacity:.4},
    linear:   {x:520, y:0, scale:.7, opacity:1},
    lock:     {x:280, y:0, scale:.45, opacity:.85},
  },
  { id:'sealA', code:'8', label:'Seal', render:SmallSeal, props:{r:16},
    assembled:{x:-260, y:170, scale:1, opacity:1},
    exploded: {x:-260, y:230, scale:1, opacity:1},
    diagnosis:{x:-260, y:170, scale:.7, opacity:.4},
    linear:   {x:-680, y:0,   scale:.7, opacity:1},
    lock:     {x:-200, y:120, scale:.45, opacity:.85},
  },
  { id:'sealB', code:'8b', label:'Seal', render:SmallSeal, props:{r:16},
    assembled:{x:300, y:170, scale:1, opacity:1},
    exploded: {x:300, y:230, scale:1, opacity:1},
    diagnosis:{x:300, y:170, scale:.7, opacity:.4},
    linear:   {x:680, y:0,   scale:.7, opacity:1},
    lock:     {x:200, y:120, scale:.45, opacity:.85},
  },
];

const STAGE_KEYS = ['assembled','exploded','diagnosis','linear','lock'];
const STAGE_BREAKS = [0.00, 0.20, 0.45, 0.68, 0.86, 1.00];

function partWaypoint(part, p){
  let idx = 0;
  for (let k = 0; k < STAGE_BREAKS.length - 1; k++){
    if (p >= STAGE_BREAKS[k] && p <= STAGE_BREAKS[k+1]){ idx = k; break; }
  }
  if (p > 1) idx = STAGE_KEYS.length - 2;
  const local = ease.inOut(clamp((p - STAGE_BREAKS[idx]) / (STAGE_BREAKS[idx+1] - STAGE_BREAKS[idx])));
  const a = part[STAGE_KEYS[idx]];
  const b = part[STAGE_KEYS[Math.min(idx+1, STAGE_KEYS.length-1)]] || a;
  return {
    x:lerp(a.x,b.x,local),
    y:lerp(a.y,b.y,local),
    scale:lerp(a.scale,b.scale,local),
    opacity:lerp(a.opacity,b.opacity,local),
  };
}

function HeroCanvas({ progress }){
  const [t, setT] = useState(0);
  const rafRef = useRef();
  useEffect(() => {
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000; last = now;
      setT(prev => prev + dt);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const p = clamp(progress);
  const opLabels = win(p, 0.18, 0.30) * (1 - win(p, 0.86, 1.0));
  const opDiag   = win(p, 0.40, 0.50) * (1 - win(p, 0.62, 0.72));
  const opLinear = win(p, 0.65, 0.74) * (1 - win(p, 0.84, 0.92));
  const opLock   = win(p, 0.86, 0.96);

  const faultyPart = PARTS.find(pp => pp.FAULTY);

  return (
    <svg viewBox={`${-VB_W/2} ${-VB_H/2} ${VB_W} ${VB_H}`} aria-hidden="true">
      <defs>
        <pattern id="bpGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(140,180,220,.05)" strokeWidth=".5"/>
        </pattern>
      </defs>

      <rect x={-VB_W/2} y={-VB_H/2} width={VB_W} height={VB_H} fill="url(#bpGrid)"
            opacity={0.7 * (1 - win(p, 0.7, 1.0) * 0.4)}/>

      {/* Shaft centerline (always visible) */}
      <line x1={-VB_W*0.45} y1={0} x2={VB_W*0.45} y2={0}
            stroke="var(--bp-line-2)" strokeWidth=".6" strokeDasharray="6 4 1 4" opacity=".55"/>

      {/* Lateral explosion axis label */}
      {(() => {
        const opAxis = win(p, 0.22, 0.32) * (1 - win(p, 0.42, 0.55));
        return (
          <g opacity={opAxis} fontFamily="JetBrains Mono, monospace" fontSize="11"
             fill="var(--acc)" letterSpacing="2">
            <text x={VB_W*0.42} y={-12} textAnchor="end">SHAFT AXIS · EXPLOSION VECTOR</text>
          </g>
        );
      })()}

      {/* Linear baseline (S/04) */}
      {opLinear > 0 && (
        <g opacity={opLinear}>
          <line x1={-VB_W*0.45} y1={0} x2={VB_W*0.45} y2={0}
                stroke="var(--acc)" strokeWidth=".7" strokeDasharray="3 4"/>
          <text x={VB_W*0.42} y={-12} fontFamily="JetBrains Mono, monospace" fontSize="11"
                fill="var(--acc)" textAnchor="end" letterSpacing="2">LINEAR · 1:1 SPACING</text>
        </g>
      )}

      {/* Lock reticle (S/05) */}
      {opLock > 0 && (
        <g opacity={opLock}>
          <circle cx={0} cy={0} r="80" fill="none" stroke="var(--acc)" strokeWidth="1.2"/>
          <circle cx={0} cy={0} r="100" fill="none" stroke="var(--acc)" strokeWidth=".6" strokeDasharray="2 4"/>
          {[[-130,0],[130,0],[0,-130],[0,130]].map(([dx,dy], i) => (
            <line key={i} x1={dx*0.55} y1={dy*0.55} x2={dx*0.95} y2={dy*0.95}
                  stroke="var(--acc)" strokeWidth="1.4"/>
          ))}
        </g>
      )}

      {/* Diagnosis ring + callout (S/03) */}
      {opDiag > 0 && (() => {
        const wp = partWaypoint(faultyPart, p);
        const cx = wp.x, cy = wp.y;
        const r = 170;
        const pulse = 1 + Math.sin(t * 4) * 0.05;
        const px = cx + 200, py = cy - 230;
        return (
          <g opacity={opDiag}>
            <circle cx={cx} cy={cy} r={r * pulse} fill="none" stroke="var(--fault)" strokeWidth="1.4" strokeDasharray="6 4"/>
            <circle cx={cx} cy={cy} r={r * 0.78} fill="none" stroke="var(--fault)" strokeWidth=".7" strokeDasharray="2 4" opacity=".6"/>
            <line x1={cx-r-20} y1={cy} x2={cx-r+10} y2={cy} stroke="var(--fault)" strokeWidth="1"/>
            <line x1={cx+r-10} y1={cy} x2={cx+r+20} y2={cy} stroke="var(--fault)" strokeWidth="1"/>
            <line x1={cx} y1={cy-r-20} x2={cx} y2={cy-r+10} stroke="var(--fault)" strokeWidth="1"/>
            <line x1={cx} y1={cy+r-10} x2={cx} y2={cy+r+20} stroke="var(--fault)" strokeWidth="1"/>
            <line x1={cx+120} y1={cy-90} x2={px} y2={py+20} stroke="var(--fault)" strokeWidth=".8" strokeDasharray="2 3"/>
            <rect x={px} y={py} width="300" height="130" fill="rgba(8,14,28,.94)" stroke="var(--fault)" strokeWidth="1"/>
            <text x={px+14} y={py+26} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--fault)" letterSpacing="2">FAULT · F-203</text>
            <text x={px+14} y={py+52} fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--ink)" letterSpacing="1">ROTOR STAGE II</text>
            <text x={px+14} y={py+72} fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--ink-2)">BLADE 14 · WEAR 0.42mm</text>
            <text x={px+14} y={py+88} fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--ink-2)">VIBRATION · +12.6%</text>
            <text x={px+14} y={py+108} fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--fault)">REPLACE · BORANG F-02</text>
            <rect x={px+170} y={py+100} width="116" height="6" fill="none" stroke="var(--ink-3)"/>
            <rect x={px+170} y={py+100} width={116*0.42} height="6" fill="var(--fault)"/>
          </g>
        );
      })()}

      {/* Leader lines back to assembled origin (visible during exploded stage) */}
      <g opacity={opLabels}>
        {PARTS.map(part => {
          const wp = partWaypoint(part, p);
          return (
            <line key={'L'+part.id}
                  x1={part.assembled.x} y1={part.assembled.y}
                  x2={wp.x} y2={wp.y}
                  stroke="var(--bp-line-2)" strokeWidth=".5" strokeDasharray="2 3" opacity=".5"/>
          );
        })}
      </g>

      {/* PARTS */}
      {PARTS.map(part => {
        const wp = partWaypoint(part, p);
        const isFaulty = !!part.FAULTY;
        const useFault = isFaulty && (opDiag > 0.05 || opLock > 0.3);
        // Spin only for parts marked SPIN — applies to inner blade group via prop
        const spin = part.SPIN ? t * part.SPIN : 0;
        return (
          <g key={part.id} style={{
            transform: `translate(${wp.x}px, ${wp.y}px) scale(${wp.scale})`,
            transition: 'transform .55s cubic-bezier(.22,.68,0,1)',
            color: `var(--bp-line)`,
            opacity: wp.opacity,
          }}>
            {React.createElement(part.render, { ...part.props, faulty: useFault, spin })}
          </g>
        );
      })}

      {/* Numbered callouts with leader lines (turbine-cutaway style) */}
      <g opacity={opLabels} fontFamily="JetBrains Mono, monospace" fontSize="11"
         letterSpacing=".5">
        {PARTS.map(part => {
          if (part.FAULTY && opDiag > 0.3) return null;
          const wp = partWaypoint(part, p);
          // Callout placement: above for parts on axis, to side for offset parts
          const onAxis = Math.abs(wp.y) < 50;
          const lx = wp.x + (onAxis ? -10 : 80);
          const ly = wp.y + (onAxis ? -200 : -70);
          return (
            <g key={'lbl'+part.id}>
              {/* Leader L-line: from part edge up/out to label */}
              <line x1={wp.x} y1={wp.y - (onAxis ? 90 : 30)}
                    x2={wp.x} y2={ly + 14}
                    stroke="var(--acc)" strokeWidth=".5" opacity=".7"/>
              <line x1={wp.x} y1={ly + 14}
                    x2={lx + 50} y2={ly + 14}
                    stroke="var(--acc)" strokeWidth=".5" opacity=".5"/>
              {/* Numbered tag */}
              <circle cx={wp.x} cy={ly + 14} r="9" fill="rgba(8,14,28,.95)" stroke="var(--acc)" strokeWidth=".8"/>
              <text x={wp.x} y={ly + 18} textAnchor="middle" fill="var(--acc)" fontSize="10" fontWeight="500">
                {part.code}
              </text>
              <text x={lx + 14} y={ly + 18} fill="var(--ink)" fontSize="11">{part.label}</text>
            </g>
          );
        })}
      </g>

      {/* Progress reticle */}
      <g transform={`translate(${VB_W/2 - 130}, ${-VB_H/2 + 40})`}
         fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--ink-2)">
        <text x="0" y="0" letterSpacing="2">P/{(p*100).toFixed(0).padStart(3,'0')}</text>
      </g>
    </svg>
  );
}

window.HeroCanvas = HeroCanvas;
window.HERO_STAGES = [
  { code:'S/01', label:'Assembled',    nameMs:'Pasangan Penuh',    range:[0.00, 0.20]},
  { code:'S/02', label:'Lateral Blow', nameMs:'Letupan Sisi',      range:[0.20, 0.45]},
  { code:'S/03', label:'Diagnosis',    nameMs:'Diagnosis · Rosak', range:[0.45, 0.68]},
  { code:'S/04', label:'Linear',       nameMs:'Susunan Linear',    range:[0.68, 0.86]},
  { code:'S/05', label:'Lock',         nameMs:'Sasaran Sah',       range:[0.86, 1.00]},
];
