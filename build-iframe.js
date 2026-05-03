const fs = require('fs');

const heroRaw = fs.readFileSync('assets/animation/hero-scenes.jsx', 'utf8');

const htmlTemplate = `<!doctype html>
<html lang="ms">
<head>
  <meta charset="utf-8" />
  <title>Engine v3 Background Renderer</title>
  <script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" crossorigin="anonymous"></script>
  <style>
    :root {
      --acc: oklch(0.88 0.14 220);
      --fault: oklch(0.68 0.22 25);
      --ink: #e6f0ff;
      --ink-2: #a8bcd6;
      --ink-3: #6a809c;
      --bp-line: #b8d4ee;
      --bp-line-2: #6088b4;
    }
    body { margin: 0; padding: 0; overflow: hidden; background: transparent; }
    #root { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
    svg { width: min(96vw, 1400px); height: min(96vh, 1000px); display: block; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    // HERO_SCENES.JSX CONTENT
${heroRaw}
    // END HERO_SCENES.JSX CONTENT

    // Iframe wrapper for index.html communication
    function IframeApp() {
      // Note: useState, useEffect, useRef are already destructured by hero-scenes.jsx
      const [progress, setProgress] = useState(0);
      const [target, setTarget] = useState(0);
      const rafRef = useRef();

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

      useEffect(() => {
        const onMessage = (e) => {
          if (e.data && e.data.type === 'ctp-engine-view') {
            const code = e.data.code;
            if (!code) {
              setTarget(0); // default
            } else {
              const stages = window.HERO_STAGES || [
                { range:[0.00, 0.20] },
                { range:[0.20, 0.45] },
                { range:[0.45, 0.68] },
                { range:[0.68, 0.86] },
                { range:[0.86, 1.00] }
              ];
              // Safely extract digit like 1, 2, 3 from S/01
              const match = code.match(/S\\/0?(\\d)/);
              if (match) {
                const idx = parseInt(match[1], 10) - 1;
                if (idx >= 0 && idx < stages.length) {
                  setTarget((stages[idx].range[0] + stages[idx].range[1]) / 2);
                } else {
                  setTarget(0);
                }
              } else {
                setTarget(0);
              }
            }
          }
        };
        window.addEventListener('message', onMessage);
        
        if (window.parent) {
          window.parent.postMessage({ type: 'ctp-iframe-ready' }, '*');
        }

        return () => window.removeEventListener('message', onMessage);
      }, []);

      return <window.HeroCanvas progress={progress} />;
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<IframeApp />);
  </script>
</body>
</html>`;

fs.writeFileSync('assets/animation/iframe-engine-v3.html', htmlTemplate, 'utf8');
console.log('Successfully wrote iframe-engine-v3.html with correct UTF-8 encoding and fixed syntax errors');
