/**
 * CTP Portal — Weekly Theme Rotator
 * ────────────────────────────────────────────────────────────────────────────
 * Cycles 4 distinct UI/UX identities based on ISO week number.
 * Each theme has its own fonts, palette, effects and animations.
 *
 * Rotation order (week % 4):
 *   0 → Hutan Digital    (forest-green OLED, EB Garamond + Lato)
 *   1 → Neon Archipelago (cyberpunk dark, Fira Code + Fira Sans)
 *   2 → Senja Emas       (golden dusk, Playfair Display + Inter)
 *   3 → Batu Putih       (minimal stone-white, Inter only)
 *
 * Manual overrides:
 *   URL param  : ?theme=hutan|neon|senja|batu
 *   localStorage: ctp_ui_theme_override
 *   Badge click : cycles to next theme
 *   Badge right-click: resets to auto (weekly rotation)
 */
(function () {
  'use strict';

  // ─── Theme Registry ──────────────────────────────────────────────────────────
  var THEMES = {
    hutan: {
      name: 'Hutan Digital',
      week: 'A',
      vars: {
        '--bg':          '#030f07',
        '--panel':       '#071a10',
        '--panel2':      '#060f0a',
        '--text':        '#e8fff0',
        '--muted':       '#7ab896',
        '--line':        'rgba(20,200,90,0.08)',
        '--shadow':      '0 12px 40px rgba(0,200,80,0.12), 0 24px 70px rgba(0,0,0,0.4)',
        '--radius':      '20px',
        '--tech':        '#00e87a',
        '--nontech':     '#45c984',
        '--gold':        '#f0b429',
        '--cream':       '#f5fff0',
        '--accent':      '#00e87a',
        '--glow':        'rgba(0,232,122,0.22)',
      },
      varsLight: {
        '--bg':          '#f0faf5',
        '--panel':       '#ffffff',
        '--panel2':      '#eaf8f0',
        '--text':        '#0a2118',
        '--muted':       '#3d7a5c',
        '--line':        'rgba(0,120,60,0.1)',
        '--shadow':      '0 8px 28px rgba(0,120,60,0.1), 0 20px 52px rgba(0,80,40,0.08)',
        '--tech':        '#059a45',
        '--nontech':     '#27a75f',
        '--gold':        '#c89020',
        '--cream':       '#f8fff2',
        '--glow':        'rgba(0,150,70,0.15)',
      },
      fonts: 'EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400|Lato:wght@300;400;700',
      css:   'theme-hutan',
    },

    neon: {
      name: 'Neon Archipelago',
      week: 'B',
      vars: {
        '--bg':          '#000814',
        '--panel':       '#050d1a',
        '--panel2':      '#030810',
        '--text':        '#cff4ff',
        '--muted':       '#4a7a94',
        '--line':        'rgba(0,245,255,0.07)',
        '--shadow':      '0 0 20px rgba(0,245,255,0.12), 0 24px 60px rgba(0,0,0,0.6)',
        '--radius':      '6px',
        '--tech':        '#00f5ff',
        '--nontech':     '#a855f7',
        '--gold':        '#ff8c00',
        '--cream':       '#daf0f8',
        '--accent':      '#00f5ff',
        '--glow':        'rgba(0,245,255,0.25)',
      },
      varsLight: {
        '--bg':          '#f0f8ff',
        '--panel':       '#ffffff',
        '--panel2':      '#e8f4ff',
        '--text':        '#001a26',
        '--muted':       '#2a5a70',
        '--line':        'rgba(0,180,220,0.12)',
        '--shadow':      '0 4px 20px rgba(0,150,200,0.12), 0 12px 40px rgba(0,0,0,0.08)',
        '--tech':        '#0080a8',
        '--nontech':     '#7c3aed',
        '--gold':        '#c86000',
        '--cream':       '#e8f4f8',
        '--glow':        'rgba(0,150,200,0.12)',
      },
      fonts: 'Fira+Code:wght@300;400;500;600;700|Fira+Sans:wght@300;400;500;600;700',
      css:   'theme-neon',
    },

    senja: {
      name: 'Senja Emas',
      week: 'C',
      vars: {
        '--bg':          '#0f0700',
        '--panel':       '#1c0e00',
        '--panel2':      '#150a00',
        '--text':        '#fff8ec',
        '--muted':       '#c4986a',
        '--line':        'rgba(255,160,50,0.09)',
        '--shadow':      '0 8px 32px rgba(245,158,11,0.18), 0 24px 60px rgba(0,0,0,0.5)',
        '--radius':      '18px',
        '--tech':        '#f59e0b',
        '--nontech':     '#d97706',
        '--gold':        '#fbbf24',
        '--cream':       '#fff8f0',
        '--accent':      '#f59e0b',
        '--glow':        'rgba(245,158,11,0.28)',
      },
      varsLight: {
        '--bg':          '#fffbf2',
        '--panel':       '#ffffff',
        '--panel2':      '#fef9ed',
        '--text':        '#2c1a00',
        '--muted':       '#8a5c1a',
        '--line':        'rgba(200,100,0,0.1)',
        '--shadow':      '0 8px 28px rgba(180,100,0,0.1), 0 20px 52px rgba(160,80,0,0.08)',
        '--tech':        '#b45309',
        '--nontech':     '#92400e',
        '--gold':        '#d97706',
        '--cream':       '#fef9ed',
        '--glow':        'rgba(180,100,0,0.1)',
      },
      fonts: 'Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500|Inter:wght@300;400;500;600;700',
      css:   'theme-senja',
    },

    batu: {
      name: 'Batu Putih',
      week: 'D',
      vars: {
        '--bg':          '#f7f9fb',
        '--panel':       '#ffffff',
        '--panel2':      '#f0f4f8',
        '--text':        '#0f172a',
        '--muted':       '#475569',
        '--line':        'rgba(15,23,42,0.09)',
        '--shadow':      '0 2px 8px rgba(15,23,42,0.06), 0 8px 24px rgba(15,23,42,0.08)',
        '--radius':      '12px',
        '--tech':        '#0891b2',
        '--nontech':     '#0e7490',
        '--gold':        '#d97706',
        '--cream':       '#f1f5f9',
        '--accent':      '#0891b2',
        '--glow':        'rgba(8,145,178,0.12)',
      },
      varsLight: {
        '--bg':          '#ffffff',
        '--panel':       '#f8fafc',
        '--panel2':      '#f1f5f9',
        '--text':        '#0f172a',
        '--muted':       '#334155',
        '--line':        'rgba(15,23,42,0.07)',
        '--shadow':      '0 1px 4px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06)',
        '--tech':        '#0284c7',
        '--nontech':     '#0369a1',
        '--gold':        '#b45309',
        '--cream':       '#e2e8f0',
        '--glow':        'rgba(8,145,178,0.08)',
      },
      fonts: 'Inter:wght@300;400;500;600;700;800;900',
      css:   'theme-batu',
    },

    command: {
      name: 'Command Center',
      week: 'E',
      vars: {
        '--bg':          '#0a0c0f',
        '--panel':       '#111518',
        '--panel2':      '#0d1014',
        '--text':        '#ccd6f6',
        '--muted':       '#7a8a9e',
        '--line':        'rgba(229,57,53,0.12)',
        '--shadow':      '0 0 0 1px rgba(229,57,53,0.12), 0 8px 32px rgba(0,0,0,0.6)',
        '--radius':      '2px',
        '--tech':        '#e53935',
        '--nontech':     '#ff7043',
        '--gold':        '#ffd54f',
        '--cream':       '#e8edf5',
        '--accent':      '#e53935',
        '--glow':        'rgba(229,57,53,0.2)',
      },
      varsLight: {
        '--bg':          '#f0f2f5',
        '--panel':       '#ffffff',
        '--panel2':      '#e8ecf0',
        '--text':        '#0d1117',
        '--muted':       '#4a5568',
        '--line':        'rgba(229,57,53,0.1)',
        '--shadow':      '0 0 0 1px rgba(229,57,53,0.08), 0 4px 16px rgba(0,0,0,0.1)',
        '--tech':        '#c62828',
        '--nontech':     '#bf360c',
        '--gold':        '#f57f17',
        '--cream':       '#e8ecf0',
        '--glow':        'rgba(198,40,40,0.12)',
      },
      fonts: 'IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400|Rajdhani:wght@300;400;500;600;700',
      css:   'theme-command',
    },

    glass: {
      name: 'Glass Data',
      week: 'F',
      vars: {
        '--bg':          '#05080f',
        '--panel':       'rgba(255,255,255,0.055)',
        '--panel2':      'rgba(255,255,255,0.03)',
        '--text':        '#eef2ff',
        '--muted':       '#8898cc',
        '--line':        'rgba(120,150,255,0.18)',
        '--shadow':      '0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.08)',
        '--radius':      '24px',
        '--tech':        '#818cf8',
        '--nontech':     '#c084fc',
        '--gold':        '#fbbf24',
        '--cream':       '#f0f4ff',
        '--accent':      '#818cf8',
        '--glow':        'rgba(129,140,248,0.25)',
      },
      varsLight: {
        '--bg':          '#f8f9ff',
        '--panel':       'rgba(255,255,255,0.72)',
        '--panel2':      'rgba(248,249,255,0.85)',
        '--text':        '#1a1a3e',
        '--muted':       '#5c6bc0',
        '--line':        'rgba(90,100,220,0.12)',
        '--shadow':      '0 8px 32px rgba(70,80,200,0.08), inset 0 0 0 1px rgba(100,120,255,0.1)',
        '--tech':        '#4f46e5',
        '--nontech':     '#7c3aed',
        '--gold':        '#d97706',
        '--cream':       '#eef2ff',
        '--glow':        'rgba(79,70,229,0.15)',
      },
      fonts: 'Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700|Manrope:wght@300;400;500;600;700;800',
      css:   'theme-glass',
    },

    terminal: {
      name: 'Retro Terminal',
      week: 'G',
      vars: {
        '--bg':          '#000000',
        '--panel':       '#090909',
        '--panel2':      '#060606',
        '--text':        '#00ff41',
        '--muted':       '#007a1e',
        '--line':        'rgba(0,255,65,0.12)',
        '--shadow':      '0 0 0 1px rgba(0,255,65,0.2), 0 0 20px rgba(0,255,65,0.06)',
        '--radius':      '0px',
        '--tech':        '#00ff41',
        '--nontech':     '#ffcc00',
        '--gold':        '#ffcc00',
        '--cream':       '#ccffcc',
        '--accent':      '#00ff41',
        '--glow':        'rgba(0,255,65,0.3)',
      },
      varsLight: {
        '--bg':          '#001200',
        '--panel':       '#002200',
        '--panel2':      '#001a00',
        '--text':        '#00ff41',
        '--muted':       '#00aa2e',
        '--line':        'rgba(0,255,65,0.15)',
        '--shadow':      '0 0 0 1px rgba(0,255,65,0.15)',
        '--tech':        '#00cc33',
        '--nontech':     '#cccc00',
        '--gold':        '#aaaa00',
        '--cream':       '#aaffaa',
        '--glow':        'rgba(0,200,50,0.2)',
      },
      fonts: 'VT323|Share+Tech+Mono',
      css:   'theme-terminal',
    },

    chaos: {
      name: 'Data Chaos',
      week: 'H',
      vars: {
        '--bg':          '#080808',
        '--panel':       '#111111',
        '--panel2':      '#0c0c0c',
        '--text':        '#ffffff',
        '--muted':       '#999999',
        '--line':        'rgba(255,45,85,0.25)',
        '--shadow':      '5px 5px 0 rgba(255,45,85,0.45), 9px 9px 0 rgba(0,255,136,0.15)',
        '--radius':      '0px',
        '--tech':        '#ff2d55',
        '--nontech':     '#00ff88',
        '--gold':        '#ffff00',
        '--cream':       '#f0f0f0',
        '--accent':      '#ff2d55',
        '--glow':        'rgba(255,45,85,0.35)',
      },
      varsLight: {
        '--bg':          '#ffffff',
        '--panel':       '#f5f5f5',
        '--panel2':      '#eeeeee',
        '--text':        '#000000',
        '--muted':       '#444444',
        '--line':        'rgba(255,45,85,0.3)',
        '--shadow':      '5px 5px 0 rgba(255,45,85,0.55), 9px 9px 0 rgba(0,255,136,0.3)',
        '--tech':        '#e91e63',
        '--nontech':     '#00c853',
        '--gold':        '#ffd600',
        '--cream':       '#fafafa',
        '--glow':        'rgba(233,30,99,0.25)',
      },
      fonts: 'Bebas+Neue|Sora:wght@300;400;500;600;700;800',
      css:   'theme-chaos',
    },
  };

  // ─── ISO Week Calculation ─────────────────────────────────────────────────────
  function getISOWeek() {
    var d = new Date();
    var date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    var yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  }

  function getWeekTheme() {
    var keys = Object.keys(THEMES);
    return keys[getISOWeek() % keys.length];
  }

  // ─── Active Theme Resolution ──────────────────────────────────────────────────
  function getActiveTheme() {
    try {
      var param = new URLSearchParams(window.location.search).get('theme');
      if (param && THEMES[param]) return param;
      var stored = localStorage.getItem('ctp_ui_theme_override');
      if (stored && THEMES[stored]) return stored;
    } catch (e) { /* ignore */ }
    return getWeekTheme();
  }

  var KEY   = getActiveTheme();
  var THEME = THEMES[KEY];
  var WEEK  = getISOWeek();
  var ROOT  = document.documentElement;

  // ─── CSS Variable Application ─────────────────────────────────────────────────
  function applyVars(vars) {
    var entries = Object.entries ? Object.entries(vars) : Object.keys(vars).map(function(k){ return [k, vars[k]]; });
    entries.forEach(function(pair) { ROOT.style.setProperty(pair[0], pair[1]); });
  }

  function clearBodyVars() {
    if (!document.body) return;
    var allKeys = Object.keys(THEME.vars).concat(Object.keys(THEME.varsLight));
    allKeys.forEach(function(k) { document.body.style.removeProperty(k); });
  }

  function applyLightToBody() {
    if (!document.body) return;
    var lightVars = Object.assign({}, THEME.vars, THEME.varsLight);
    var entries = Object.entries ? Object.entries(lightVars) : Object.keys(lightVars).map(function(k){ return [k, lightVars[k]]; });
    entries.forEach(function(pair) { document.body.style.setProperty(pair[0], pair[1]); });
  }

  // Immediately apply dark vars to html (no FOUC for dark mode)
  applyVars(THEME.vars);
  ROOT.setAttribute('data-theme', KEY);

  // If user prefers light mode, pre-mark for quick apply once body exists
  var savedMode = '';
  try { savedMode = localStorage.getItem('ctp_selected_theme') || ''; } catch(e){}
  var initialLight = (savedMode === 'light');

  // ─── Load Google Fonts ────────────────────────────────────────────────────────
  var preconnect1 = document.createElement('link');
  preconnect1.rel = 'preconnect';
  preconnect1.href = 'https://fonts.googleapis.com';
  document.head.appendChild(preconnect1);

  var preconnect2 = document.createElement('link');
  preconnect2.rel = 'preconnect';
  preconnect2.href = 'https://fonts.gstatic.com';
  preconnect2.crossOrigin = 'anonymous';
  document.head.appendChild(preconnect2);

  var fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=' + THEME.fonts + '&display=swap';
  document.head.appendChild(fontLink);

  // ─── Load Theme CSS ───────────────────────────────────────────────────────────
  var cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = 'assets/themes/' + THEME.css + '.css';
  document.head.appendChild(cssLink);

  // ─── Expose to Global ─────────────────────────────────────────────────────────
  window.__ctpTheme = { key: KEY, name: THEME.name, week: WEEK, themes: THEMES };

  // ─── DOM-Ready Logic ──────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {

    // Apply light vars to body if user is in light mode
    var isLight = document.body.classList.contains('theme-light') || initialLight;
    if (isLight) applyLightToBody();
    else clearBodyVars();

    // Watch for dark/light mode toggle
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'class') {
          var nowLight = document.body.classList.contains('theme-light') ||
                         ROOT.classList.contains('theme-light');
          if (nowLight) applyLightToBody();
          else clearBodyVars();
        }
      });
    });
    observer.observe(document.body, { attributes: true });
    observer.observe(ROOT, { attributes: true });

    // Inject theme badge
    injectBadge();
  });

  // ─── Theme Badge ──────────────────────────────────────────────────────────────
  function injectBadge() {
    if (document.getElementById('ctp-theme-badge')) return;

    var badge = document.createElement('div');
    badge.id = 'ctp-theme-badge';
    badge.setAttribute('title', 'Tema Minggu ' + WEEK + ' — klik untuk tukar / klik kanan untuk auto');
    badge.innerHTML =
      '<span id="ctp-badge-dot"></span>' +
      '<span id="ctp-badge-name">' + THEME.name + '</span>' +
      '<span id="ctp-badge-week">M' + WEEK + '</span>';

    badge.style.cssText = [
      'position:fixed',
      'bottom:16px',
      'right:16px',
      'display:flex',
      'align-items:center',
      'gap:7px',
      'padding:6px 12px 6px 8px',
      'background:var(--panel,#0c3a28)',
      'border:1px solid var(--line,rgba(255,255,255,0.1))',
      'border-radius:999px',
      'font-family:system-ui,sans-serif',
      'font-size:11px',
      'font-weight:600',
      'color:var(--muted,#bfd8c6)',
      'cursor:pointer',
      'z-index:99999',
      'backdrop-filter:blur(10px)',
      '-webkit-backdrop-filter:blur(10px)',
      'box-shadow:0 4px 20px var(--glow,rgba(0,0,0,0.3))',
      'transition:transform 0.18s ease,box-shadow 0.18s ease',
      'user-select:none',
      'letter-spacing:0.03em',
    ].join(';');

    var dot = badge.querySelector('#ctp-badge-dot');
    dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:var(--tech,#00e87a);box-shadow:0 0 8px var(--tech,#00e87a);flex-shrink:0;animation:ctp-dot-pulse 2.4s ease-in-out infinite';

    var wk = badge.querySelector('#ctp-badge-week');
    wk.style.cssText = 'font-size:9px;opacity:0.45;font-weight:400;margin-left:1px;letter-spacing:0.04em';

    badge.addEventListener('mouseenter', function () {
      badge.style.transform = 'translateY(-2px)';
      badge.style.boxShadow = '0 8px 28px var(--glow,rgba(0,0,0,0.4))';
    });
    badge.addEventListener('mouseleave', function () {
      badge.style.transform = '';
      badge.style.boxShadow = '0 4px 20px var(--glow,rgba(0,0,0,0.3))';
    });

    // Left-click: cycle to next theme
    badge.addEventListener('click', function (e) {
      e.stopPropagation();
      var keys = Object.keys(THEMES);
      var next = keys[(keys.indexOf(KEY) + 1) % keys.length];
      try { localStorage.setItem('ctp_ui_theme_override', next); } catch(e2){}
      location.reload();
    });

    // Right-click: reset to weekly auto
    badge.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      try { localStorage.removeItem('ctp_ui_theme_override'); } catch(e2){}
      location.reload();
    });

    document.body.appendChild(badge);

    // Pulse keyframe injection
    if (!document.getElementById('ctp-badge-keyframes')) {
      var kf = document.createElement('style');
      kf.id = 'ctp-badge-keyframes';
      kf.textContent = '@keyframes ctp-dot-pulse{0%,100%{opacity:1;box-shadow:0 0 6px var(--tech)}50%{opacity:.5;box-shadow:0 0 12px var(--tech)}}';
      document.head.appendChild(kf);
    }
  }

})();
