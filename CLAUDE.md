# CLAUDE.md — CT&P Inspection Portal

> Reverse-engineered documentation for the CT&P (Cawangan Teknik & Pemeriksaan) Inspection Portal.
> This file is the single source of truth for AI-assisted development on this repo.

---

## Project Context

**Name:** Portal CT&P — Cawangan Teknik & Pemeriksaan  
**Language:** Bahasa Melayu (primary), English (secondary)  
**Audience:** Technical and non-technical inspection officers in a Malaysian government agency  
**Purpose:** Read-only portal to view, track, and coordinate equipment inspection job requests. Data lives in Google Sheets; the portal renders it.  
**Architecture:** Static HTML/CSS/JS frontend → Google Apps Script (GAS) backend → Google Sheets data

**Key constraint:** This is a read-only portal. No forms, no mutations, no auth. Everything is `GET` requests to public GAS endpoints.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS (custom properties), vanilla JS |
| Styling | Inline `<style>` per page + Tailwind CDN on newer pages |
| Charts | Chart.js (CDN) |
| Maps | Leaflet.js + OpenStreetMap + Leaflet.heat (CDN) |
| PDF | PDF.js bundled in `/assets/vendor/pdfjs/` |
| Icons | Font Awesome 6.4.0 (CDN, used in timeline.html only) |
| Fonts | Google Fonts (Inter, Space Grotesk, EB Garamond, Playfair Display, Fira Code, etc.) |
| Backend | Google Apps Script (serverless functions) |
| Data store | Google Sheets (two sheets: teknikal + bukan_teknikal) |
| Build step | **None.** Open any HTML file directly in a browser. |

---

## Directory Structure

```
ctp-portal/
│
├── CLAUDE.md                    ← This file
│
├── ── Root HTML Pages ──────────────────────────────────────────
├── index.html                   ← Landing page (Sel Teknikal, forest green theme)
├── indextwo.html                ← Landing page (Sel Bukan Teknikal, alternate)
├── dashboard.html               ← Main job list + detail drawer (Teknikal cell)
├── dashboardtwo.html            ← Job list (Bukan Teknikal, blue accent variant)
├── analytics.html               ← Chart.js analytics (doughnut + bar charts)
├── inspectors.html              ← Inspector directory with search & workload bar
├── job.html                     ← Single job detail page (URL param: ?id=XXX)
├── map.html                     ← Leaflet map of all georeferenced jobs
├── timeline.html                ← Competency timeline (submission → completion)
├── about.html                   ← Portal mission & information
├── guide.html                   ← User guide (smooth-scroll TOC)
├── how-it-works.html            ← System flow explanation (Fraunces + Manrope)
├── carta.html                   ← SOP flowchart rendered from PDF
├── rancangan.html               ← Movement / scheduling planner
├── maklumbalas.html             ← Embedded PDF viewer (PDF.js)
├── senarai-gunasama.html        ← Shared-use inspection tables
│
├── ── JavaScript Modules ───────────────────────────────────────
├── js/
│   ├── config.js                ← API base URLs for both cells
│   ├── api.js                   ← Thin fetch wrapper (API.request, API.listJobs, etc.)
│   ├── ui.js                    ← Shared utilities (XSS-safe render, date format, badge)
│   ├── pages.index.js           ← Landing page behaviour
│   ├── pages.job.js             ← Job detail page logic
│   ├── pages.inspectors.js      ← Inspector grid + search logic
│   ├── pages.analytics.js       ← Chart.js data prep and render
│   ├── pages.map.js             ← Leaflet map init + job pin placement
│   └── pages.timeline.js        ← Timeline event building + competency scoring
│
├── ── Theme System (Weekly Rotation) ──────────────────────────
├── assets/
│   ├── theme-rotator.js         ← Core weekly theme rotator (inject into all pages)
│   ├── themes/
│   │   ├── theme-hutan.css      ← Week A: Hutan Digital (forest green OLED)
│   │   ├── theme-neon.css       ← Week B: Neon Archipelago (cyberpunk)
│   │   ├── theme-senja.css      ← Week C: Senja Emas (golden dusk)
│   │   └── theme-batu.css       ← Week D: Batu Putih (minimal stone white)
│   │
│   ├── app.css                  ← Tailwind base for newer pages
│   ├── icon1.png                ← Teknikal cell branding icon
│   ├── icon2.png                ← Bukan Teknikal cell branding icon
│   ├── zaidi.jpg                ← Staff photo asset
│   ├── aidilfitri.mp3           ← Holiday Easter egg audio (4.6 MB)
│   ├── easter-egg.mp3           ← Easter egg sound effect (679 KB)
│   ├── inspectors/              ← 12 portraits (INS_A2_01.jpg … INS_A2_12.jpg)
│   ├── inspectortwo/            ← 10 portraits (NON_*.jpg)
│   ├── docs/                    ← Static PDF documents
│   └── vendor/pdfjs/            ← Bundled PDF.js (pdf.mjs + worker)
│
├── ── Google Apps Script ──────────────────────────────────────
├── google/
│   ├── code.gs                  ← GAS backend for Teknikal cell
│   ├── webapp.html              ← GAS web app shell
│   └── *.xlsx                   ← Local Sheets exports (reference only)
├── googletwo/
│   ├── codetwo.gs               ← GAS backend for Bukan Teknikal cell
│   └── webaptwo.html
│
├── ── Data ────────────────────────────────────────────────────
├── holidays_my_2026.json        ← Public holiday data (parsed from ICS)
├── holidays_my.ics              ← iCal source
└── _parse_holidays.js           ← One-shot utility: ICS → JSON
```

---

## Design System

### CSS Custom Properties (shared across pages)

All pages define these at `:root`. The theme rotator overrides them via inline style:

| Variable | Purpose |
|----------|---------|
| `--bg` | Page background colour |
| `--panel` | Card / panel background |
| `--panel2` | Secondary panel tint |
| `--text` | Primary text |
| `--muted` | Secondary / helper text |
| `--line` | Separator / border colour |
| `--shadow` | Box-shadow shorthand |
| `--radius` | Default border radius |
| `--tech` | Primary accent (e.g. green / cyan / amber) |
| `--nontech` | Secondary accent |
| `--gold` | Gold / warning accent |
| `--cream` | Off-white tint |
| `--accent` | Alias for tech (injected by rotator) |
| `--glow` | RGBA glow colour (injected by rotator) |

### Dark / Light Mode

- Toggle class: `body.theme-light`  
- Stored in: `localStorage.getItem('ctp_selected_theme')` → `'dark'` or `'light'`
- All pages define both `:root { ... }` (dark) and `body.theme-light { ... }` (light) CSS blocks

### Typography

**Existing pages:** `system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`  
**Theme A injects:** EB Garamond (headings) + Lato (body)  
**Theme B injects:** Fira Code (headings) + Fira Sans (body)  
**Theme C injects:** Playfair Display (headings) + Inter (body)  
**Theme D injects:** Inter 300–900 (universal, weight-based hierarchy)

### Spacing & Breakpoints

```
Mobile:  < 640px   → 1-column grids
Tablet:  640–1024px → 2-column grids
Desktop: > 1024px  → 3+ columns; navigation fully visible
Nav hide: @media (max-width: 980px)
Container max-width: 1200px / 1100px / 900px (page-dependent)
```

### Border Radii

`--radius` defaults: `24px` (index.html hero), `18px` (dashboards), `12px` (small buttons)

---

## Weekly Theme Rotation System

### Overview

The portal rotates through **4 visually distinct UI/UX themes**, one per week.  
The rotation is automatic — no config required. Week number is ISO 8601.

```
Week % 4 === 0 → Theme A: Hutan Digital
Week % 4 === 1 → Theme B: Neon Archipelago
Week % 4 === 2 → Theme C: Senja Emas
Week % 4 === 3 → Theme D: Batu Putih
```

### Theme A — Hutan Digital (Digital Forest)

| | |
|---|---|
| Identity | Deep Malaysian rainforest. OLED dark with emerald bioluminescence. |
| Palette | Forest black `#030f07` · Jade `#00e87a` · Amber gold `#f0b429` |
| Fonts | **EB Garamond** (headings, serif, italic elegance) + **Lato** (body) |
| Effects | Breathing radial glow · Jade scanline texture · Emerald button glow |
| Mood | Professional, authoritative, trustworthy, organic |
| Design style | Enterprise dark mode (WCAG AAA) |

### Theme B — Neon Archipelago

| | |
|---|---|
| Identity | Rain-slick midnight city. Electric data streams, neon islands of light. |
| Palette | Abyss navy `#000814` · Neon cyan `#00f5ff` · Signal purple `#a855f7` |
| Fonts | **Fira Code** (headings, monospace precision) + **Fira Sans** (body) |
| Effects | Scanlines overlay · CRT vignette corners · Neon text-shadow pulse · Glitch keyframes |
| Mood | Futuristic, technical, high-energy, precise |
| Design style | Cyberpunk UI |

### Theme C — Senja Emas (Golden Dusk)

| | |
|---|---|
| Identity | Last light before dark — molten amber, ochre, liquid warmth of sunset. |
| Palette | Mahogany `#0f0700` · Amber sun `#f59e0b` · Warm gold `#fbbf24` |
| Fonts | **Playfair Display** (headings, serif italic) + **Inter** (body) |
| Effects | Sunset radial gradient · Liquid glass panels · Golden shimmer on h1 · Warm vignette |
| Mood | Premium, editorial, luxurious, warm |
| Design style | Liquid Glass |

### Theme D — Batu Putih (White Stone)

| | |
|---|---|
| Identity | Architectural precision. Stone white, slate grey, arctic blue. No decoration — data speaks. |
| Palette | Stone white `#f7f9fb` · Slate `#0f172a` · Arctic cyan `#0891b2` |
| Fonts | **Inter 300–900** (weight IS the hierarchy — no serif required) |
| Effects | Geometric grid texture · Bold 1.5px borders · Clean shadows only. Zero glow. |
| Mood | Minimal, clinical, focused, high-contrast |
| Design style | Vibrant block-based (minimal variant) |

### How the Rotator Works

**File:** `assets/theme-rotator.js`  
**Injected:** As first `<script>` in every page's `<head>` (after `<meta charset>`)

1. Calculates ISO week number → `weekNo % 4` → selects theme key
2. Reads `ctp_ui_theme_override` from `localStorage` or `?theme=` URL param for manual overrides
3. **Immediately** calls `document.documentElement.style.setProperty()` for all CSS vars (zero FOUC)
4. Dynamically injects `<link>` for Google Fonts
5. Dynamically injects `<link>` for the theme CSS file (`assets/themes/theme-X.css`)
6. On `DOMContentLoaded`: applies light-mode vars to `body` if needed, sets up `MutationObserver` for theme toggle, injects floating badge

### Theme Badge (Bottom-Right Corner)

A small floating pill shows the active theme name + week number:

```
● Hutan Digital  M15
```

- **Left-click** → cycle to next theme (persists across reload via localStorage)
- **Right-click** → reset to weekly auto-rotation
- Badge adapts visually to each theme (font, border-radius, colours)
- `window.__ctpTheme` exposes `{ key, name, week, themes }` for debugging

### Manual Override

```
# URL parameter (temporary, per session)
https://yoursite/dashboard.html?theme=neon

# localStorage (persists until right-click reset)
localStorage.setItem('ctp_ui_theme_override', 'senja')
```

Valid theme keys: `hutan` · `neon` · `senja` · `batu`

### Adding a New Theme

1. Create `assets/themes/theme-<key>.css` following existing patterns
2. Add entry to `THEMES` object in `assets/theme-rotator.js`
3. Increase cycle modulus: `keys[getISOWeek() % keys.length]` auto-adjusts
4. No HTML changes needed

---

## API Architecture

### Dual-Cell Configuration

```javascript
// js/config.js
const API_BASES = {
  teknikal:       "https://script.google.com/macros/s/[KEY_1]/exec",
  bukan_teknikal: "https://script.google.com/macros/s/[KEY_2]/exec"
};
```

The active cell is stored in `localStorage.getItem('ctp_selected_cell')`.

### API Methods (js/api.js)

```javascript
API.ping()                          // Health check
API.meta()                          // Sheet metadata
API.listJobs({ q, status, zone })   // All jobs with optional filters
API.getJob(jobId)                   // Single job by ID
API.listInspectors()                // Inspector list
```

All methods make a `GET ?action=<method>&...params` to the GAS endpoint.  
Backend responds with a JSON array. Fields are pre-normalised by GAS (Title Case).

### Data Flow

```
Browser → GET ?action=listJobs&... → Google Apps Script → Google Sheets
Google Sheets → JSON array → GAS → Browser
Browser → client-side XSS filter → HTML render (via ui.js)
```

### XSS Safety

All user-facing data is rendered through `ui.js` helpers that escape `< > & " '`.  
Never use `innerHTML` with raw API data.

---

## JavaScript Modules

| File | Responsibility |
|------|---------------|
| `js/config.js` | API endpoint URLs, cell key constants |
| `js/api.js` | Fetch wrapper; encodes params; handles errors |
| `js/ui.js` | Shared: XSS-safe render, date formatting (`DD/MM/YYYY`), competency badge, status badge, inspector avatar initials |
| `js/pages.index.js` | Landing page logic: hero animation, cell selector, theme toggle |
| `js/pages.job.js` | Reads `?id=` from URL, fetches job, renders read-only detail grid |
| `js/pages.inspectors.js` | Fetches inspector list, renders grid cards, implements `/` hotkey search |
| `js/pages.analytics.js` | Aggregates job data, renders Chart.js doughnut + bar charts |
| `js/pages.map.js` | Initialises Leaflet, places markers with popup cards |
| `js/pages.timeline.js` | Builds event timeline, calculates competency scores (CEMERLANG / MEMUASKAN / LEWAT) |

---

## Key Conventions

### Language

- UI labels: Malay (`Permohonan`, `Pemeriksa`, `Status`, `Zon`, `Negeri`)
- Column names in GAS: Title Case English (`Job ID`, `Nama Pasukan / Unit`)
- Date format: `DD/MM/YYYY` (`en-GB` locale)
- Status values: `Belum Diperiksa`, `Dalam Pemeriksaan`, `Selesai`, `Dibatal`

### Competency Scoring (timeline.html, dashboard.html)

```
days = ceil((inspectionDate - submissionDate) / 86_400_000)
≤ 3 days → CEMERLANG  (green)
≤ 7 days → MEMUASKAN  (amber)
> 7 days → LEWAT       (red)
no date  → BELUM DIPERIKSA (grey)
```

### Dual-Cell Pages

Each cell has a mirror page:
- `index.html` ↔ `indextwo.html`
- `dashboard.html` ↔ `dashboardtwo.html`
- `google/code.gs` ↔ `googletwo/codetwo.gs`

Cell context is passed via URL param or `localStorage('ctp_selected_cell')`.

### Theme Toggle Pattern

```javascript
// Existing pages — DO NOT change this pattern
function setTheme(name) {
  document.body.classList.toggle('theme-light', name === 'light');
  localStorage.setItem('ctp_selected_theme', name);
}
```

### Inspector Photos

- Teknikal: `assets/inspectors/INS_A2_01.jpg` … `INS_A2_12.jpg`
- Bukan Teknikal: `assets/inspectortwo/NON_*.jpg`

### Easter Eggs

`assets/aidilfitri.mp3` plays on Eid holidays (detected via `holidays_my_2026.json`).

---

## Page Catalog

| Page | URL | Key Libraries | Notes |
|------|-----|---------------|-------|
| index.html | `/` | Google Fonts | Teknikal landing; radial gradient hero |
| indextwo.html | `/indextwo.html` | Google Fonts | Bukan Teknikal landing |
| dashboard.html | `/dashboard.html` | Leaflet (unused?) | 4890-line main job list with 5 tabs |
| dashboardtwo.html | `/dashboardtwo.html` | — | Blue accent variant, 4462 lines |
| analytics.html | `/analytics.html` | Chart.js | Doughnut + 3 bar charts; auto-refresh |
| inspectors.html | `/inspectors.html` | — | `/` hotkey; workload bar; copy contact |
| job.html | `/job.html?id=X` | — | Read-only; full + curated field views |
| map.html | `/map.html` | Leaflet, Leaflet.heat | Malaysia centred (4.21°N, 101.98°E) |
| timeline.html | `/timeline.html` | Font Awesome | JetBrains Mono + Outfit fonts |
| about.html | `/about.html` | — | Mission statement |
| guide.html | `/guide.html` | — | Smooth-scroll user guide |
| how-it-works.html | `/how-it-works.html` | — | Fraunces + Manrope; paper-style design |
| carta.html | `/carta.html` | — | SOP flowchart; dark/light toggle |
| rancangan.html | `/rancangan.html` | — | Movement schedule |
| maklumbalas.html | `/maklumbalas.html` | PDF.js | Embedded PDF viewer |
| senarai-gunasama.html | `/senarai-gunasama.html` | — | Shared inspection tables |

---

## Development Notes

- **No build step.** Edit HTML/CSS/JS directly and refresh the browser.
- **CORS:** GAS endpoints are public (`doGet`). No API keys in frontend code.
- **Hosting:** GitHub Pages (or any static server). All paths are relative.
- **Adding a page:** Copy closest existing page. Add `<script src="assets/theme-rotator.js"></script>` after `<meta charset>` in `<head>`.
- **Theme rotator path:** All pages are in root; the path `assets/theme-rotator.js` works uniformly.
- **Subdir pages** (e.g. `google/*.html`): Do NOT inject theme rotator into those — they are GAS web app shells.
- **Google Sheets changes:** Update the GAS script (`google/code.gs`); no frontend changes needed unless field names change.
- **Holiday data:** Regenerate `holidays_my_2026.json` by running `node _parse_holidays.js` against a new ICS file.

---

## Memory / AI Notes

- This portal is **read-only**. Never suggest mutations, auth, or form submissions.
- When editing CSS, respect the `--variable` system. Do not hardcode colours.
- Always escape output: use the `ui.js` helpers, never raw `innerHTML`.
- When adding new features to dashboard.html, test both the 5-tab layout and the mobile hamburger nav.
- The `how-it-works.html` has a completely custom design (Fraunces font, paper/beige aesthetic) — it does not follow the main design system and that is intentional.
- `dashboardtwo.html` uses `--accent` (blue) instead of `--tech` (green) — keep them separate.
