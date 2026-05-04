const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Text replacement
html = html.replace('Sistem Pemantauan Pemeriksaan Peralatan ATM', 'Sistem Pemantauan Pemeriksaan');

// 2. Remove 'Masuk Dashboard Teknikal' on the left side
const btnRegex = /<button class="cta-btn" type="button" data-cell="teknikal" data-target="dashboard\.html"[\s\S]*?<\/button>\s*<\/div><!-- \/panel-l -->/;
html = html.replace(btnRegex, '</div><!-- /panel-l -->');

// 3. Add 'Tentang kami' button under 'Masuk dashboard teknikal' on the right side
// Find the right panel's Masuk dashboard button
const rightBtnRegex = /<div style="margin-top: 10px;">\s*<button class="cta-btn" type="button" data-cell="teknikal" data-target="dashboard\.html"[\s\S]*?<\/button>\s*<\/div>/;
const rightBtnMatch = html.match(rightBtnRegex);
if (rightBtnMatch) {
  const newRightBtn = rightBtnMatch[0] + `
      <div style="margin-top: 10px;">
        <button class="cta-btn" type="button" data-target="tentang-kami.html">
          <div class="cta-inner">
            <div>Tentang Kami</div>
            <div class="cta-sub">Mengenai Sel Teknikal</div>
          </div>
          <span class="cta-arrow" aria-hidden="true">→</span>
        </button>
      </div>`;
  html = html.replace(rightBtnRegex, newRightBtn);
}

// 4. Update CSS tokens
const oldTokens = `:root {
      --bg: #08111f;
      --bg2: #0c1828;
      --ink: #e6f0ff;
      --ink2: #a8bcd6;
      --ink3: #6a809c;
      --rule: #1a2a40;
      --bp: #b8d4ee;
      --bp2: #6088b4;
      --acc: oklch(0.88 0.14 220);
      --grn: #1ba05a;
      --gold: #c8a840;
      --fault: oklch(0.68 0.22 25);
    }`;

const newTokens = `:root {
      --bg: #f8f9fa;
      --bg2: #ffffff;
      --ink: #0f172a;
      --ink2: #334155;
      --ink3: #64748b;
      --rule: #e2e8f0;
      --bp: #3b82f6;
      --bp2: #93c5fd;
      --acc: oklch(0.65 0.15 240);
      --grn: #10b981;
      --gold: #f59e0b;
      --fault: oklch(0.6 0.22 25);
      --bg-rgb: 248, 249, 250;
      --bp-rgb: 59, 130, 246;
      --grid-color: rgba(15, 23, 42, .06);
      --panel-bg: rgba(255, 255, 255, .97);
      --glass-bg: rgba(59, 130, 246, .08);
      --glass-hover: rgba(59, 130, 246, .15);
    }
    body.theme-dark {
      --bg: #08111f;
      --bg2: #0c1828;
      --ink: #e6f0ff;
      --ink2: #a8bcd6;
      --ink3: #6a809c;
      --rule: #1a2a40;
      --bp: #b8d4ee;
      --bp2: #6088b4;
      --acc: oklch(0.88 0.14 220);
      --grn: #1ba05a;
      --gold: #c8a840;
      --fault: oklch(0.68 0.22 25);
      --bg-rgb: 8, 17, 31;
      --bp-rgb: 184, 212, 238;
      --grid-color: rgba(26, 42, 64, .06);
      --panel-bg: rgba(8, 17, 31, .97);
      --glass-bg: rgba(184, 212, 238, .04);
      --glass-hover: rgba(184, 212, 238, .10);
    }`;

html = html.replace(oldTokens, newTokens);

// 5. Replace hardcoded RGBAs
html = html.replace(/rgba\(26,\s*42,\s*64,\s*\.06\)/g, 'var(--grid-color)');
html = html.replace(/rgba\(8,\s*17,\s*31,\s*\.97\)/g, 'var(--panel-bg)');
html = html.replace(/rgba\(8,\s*17,\s*31,\s*\.([0-9]+)\)/g, 'rgba(var(--bg-rgb), .$1)');
html = html.replace(/rgba\(184,\s*212,\s*238,\s*\.04\)/g, 'var(--glass-bg)');
html = html.replace(/rgba\(184,\s*212,\s*238,\s*\.10\)/g, 'var(--glass-hover)');
html = html.replace(/rgba\(184,\s*212,\s*238,\s*\.([0-9]+)\)/g, 'rgba(var(--bp-rgb), .$1)');

// 6. Theme Toggle CSS
const toggleCSS = `.theme-toggle { background: none; border: none; color: var(--ink2); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; margin-right: 12px; transition: color 0.2s; } .theme-toggle:hover { color: var(--ink); } .theme-toggle svg { width: 18px; height: 18px; }`;
html = html.replace('/* ── Top nav ─────────────────────────────────────────── */', '/* ── Top nav ─────────────────────────────────────────── */\n    ' + toggleCSS);

// 7. Theme Toggle HTML
const toggleHTML = `<button class="theme-toggle" id="themeToggle" type="button" aria-label="Tukar Tema">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="themeIcon">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </button>`;
html = html.replace('<div class="nav-right">', '<div class="nav-right">\n      ' + toggleHTML);

// 8. Theme Toggle JS
const toggleJS = `    // Theme Toggle Logic
    const toggle = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');
    toggle.addEventListener('click', () => {
      document.body.classList.toggle('theme-dark');
      if (document.body.classList.contains('theme-dark')) {
         icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
      } else {
         icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
      }
    });`;
html = html.replace('// Simulate initial states', toggleJS + '\n\n    // Simulate initial states');

fs.writeFileSync('index.html', html, 'utf8');
