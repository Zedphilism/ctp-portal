const { useState, useEffect, useRef } = React;

const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "cyan"
}/*EDITMODE-END*/;

const ACCENTS = {
  chartreuse: 'oklch(0.88 0.21 130)',
  cyan:       'oklch(0.88 0.14 220)',
  amber:      'oklch(0.85 0.18 75)',
  magenta:    'oklch(0.78 0.22 340)',
  bone:       'oklch(0.92 0.02 90)',
};

function App(){
  const [tweaks, setTweaks] = useTweaks(TWEAKS_DEFAULTS);
  const [progress, setProgress] = useState(0);
  const [target, setTarget] = useState(0);
  const rafRef = useRef();

  useEffect(() => {
    const c = ACCENTS[tweaks.accent] || ACCENTS.chartreuse;
    document.documentElement.style.setProperty('--acc', c);
  }, [tweaks.accent]);

  // Smoothly animate progress towards target
  useEffect(() => {
    const tick = () => {
      setProgress(prev => {
        const diff = target - prev;
        if (Math.abs(diff) < 0.0005) return target;
        return prev + diff * 0.08;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  const stages = window.HERO_STAGES;
  let stageIdx = stages.findIndex(s => progress >= s.range[0] && progress <= s.range[1]);
  if (stageIdx === -1) stageIdx = stages.length - 1;
  const active = stages[stageIdx];

  // Each stage has a hover target = midpoint of its range
  const stageTargets = stages.map(s => (s.range[0] + s.range[1]) / 2);

  return (
    <>
      <div className="bg-canvas">
        <window.HeroCanvas progress={progress}/>
      </div>

      {/* Hover strip — bottom of viewport — replaces scroll trigger */}
      <div className="hover-strip"
           onMouseLeave={() => setTarget(0)}>
        <div className="hs-rail"/>
        {stages.map((s, i) => (
          <button key={i}
                  className={`hs-stage ${stageIdx === i ? 'on' : ''}`}
                  onMouseEnter={() => setTarget(stageTargets[i])}
                  onFocus={() => setTarget(stageTargets[i])}>
            <span className="hs-dot"/>
            <span className="hs-code">{s.code}</span>
            <span className="hs-name">{s.nameMs}</span>
          </button>
        ))}
      </div>

      <div className="hint">
        <span className="hint-pip"/>
        <span>HOVER STAGE TO TRIGGER · {Math.round(progress*100)}%</span>
      </div>

      <div className="stage-tag">
        <span className="st-num">{active.code}</span>
        <span className="st-name">{active.nameMs}</span>
        <span className="st-en">{active.label.toUpperCase()}</span>
      </div>

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
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
