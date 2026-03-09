# BIE v9 — Sprint 15 Builder Log

## Repo
- **Mac-side (push access):** `/tmp/bie-v9-push/`
- **VM-side (READ-ONLY stale mirror):** `/sessions/.../mnt/bie-v9/` — DO NOT USE for edits
- **GitHub Pages:** 8 standalone HTML files, no build step, `main` branch
- **All edits MUST go through Desktop Commander** pointing at `/tmp/bie-v9-push/`

## 8 HTML Surfaces
1. `index.html` — Strategic Brief (radar chart, initiative cards)
2. `day-in-the-life.html` — Day in the Life (journey cards, stagger animations)
3. `how-it-works.html` — How It Works (architecture, signal layers, methodology)
4. `brand-fidelity.html` — Brand Fidelity (NEW in Sprint 15)
5. `command-center.html` — Command Center (TL;DR, dashboards)
6. `signal-terminal.html` — Signal Terminal (card+drawer pattern)
7. `guided-analysis.html` — Guided Analysis (Anthropic API, chat)
8. `scenario-lab.html` — Scenario Lab (simulations, stepper wizard)

## Design System
- **Colors:** 6-tier black stack, signals: #818cf8 (purple), #34d399 (green), #f59e0b (amber)
- **Fonts:** Space Grotesk (headings), Inter (body), JetBrains Mono (code)
- **Icons:** Phosphor Icons CDN `https://unpkg.com/@phosphor-icons/web@2.1.1`
- **Charts:** Chart.js 4.4.7

## Brand Fidelity Submetrics (for radar chart)
- **In the Moment:** Accessible, User Friendly, Personal
- **Over Time:** Dependable, Salient, Meaningful

## Nav Icon Mapping (Phosphor)
| Page | Icon Class |
|------|-----------|
| Strategic Brief | `ph ph-diamond` |
| Day in the Life | `ph ph-sun-horizon` |
| How It Works | `ph ph-gear-six` |
| Brand Fidelity | `ph ph-flower-lotus` |
| Command Center | `ph ph-squares-four` |
| Signal Terminal | `ph ph-terminal` |
| Guided Analysis | `ph ph-chat-centered-text` |
| Scenario Lab | `ph ph-flask` |

---

## Completed Phases

### Phase 1 ✅ — Strategic Brief Fixes
**Commit:** `b1bddaf` (combined with Phase 2)
- Removed "Analyzing" label from Strategic Brief header (was at line 991)
- Fixed radar legend overlap: moved legend outside `.radar-visual` div, changed to `flex-direction: row; flex-wrap: wrap`
- Increased `.radar-visual` height from 300px → 360px

### Phase 2 ✅ — Phosphor Icons + Brand Fidelity Nav
**Commit:** `b1bddaf`
- Added Phosphor CDN `<link>` to all 8 files
- Replaced ALL Unicode nav symbols (◇◉◈▣▤▥◬) with Phosphor `<i>` elements
- Added Brand Fidelity nav item in Methodology section of all 8 files
- Replaced remaining emojis (💼📊👥📈📌) with Phosphor equivalents
- Fixed brand-fidelity.html CDN from `<script>` to `<link rel="stylesheet">`
- Fixed content-area Unicode in scenario-lab.html and brand-fidelity.html
- **Gotcha:** how-it-works.html already had `brand-fidelity.html` link (teaser CTA), so the script skipped it — had to manually add nav item

---

### Phase 3 ✅ — Day in the Life Styling Consistency
**Commit:** `977d8b8`
- Standardized border-radius from 12px → 4px across all DITL card types
- Cards: `.ditl-journey`, `.ditl-journey-icon`, `.ditl-stat-card`, `.ditl-compare-card`, `.ditl-scenario-card`, `.persona-card`
- Preserved stagger animations and glass morphism surfaces

### Phase 4 ✅ — Command Center + Guided Analysis Scroll Fix
**Commit:** `977d8b8`
- Root cause: `.command-center`/`.guided-analysis` had padding on the scroll container itself
- Fix: Distributed padding to child elements via `> *`, `:first-child`, `:last-child` selectors
- Scroll now starts at top like all other pages

### Phase 5 ✅ — How It Works Architecture Enhancement
**Commit:** `2ee0f79`
- Added new "01b. Deep Architecture" section with AI Model Timeline-style content
- ASCII system architecture diagram (ingestion → processors → consensus → intelligence)
- Consensus algorithm cards: Convergence Detection, Conflict Resolution, Temporal Weighting
- Data flow pipeline diagram (raw data → NLP/Stats/Topic → normalization → consensus → outputs)
- Technology stack grid (6 categories: NLP, Behavioral, Cultural, Simulation, Infrastructure, Outputs)
- Version changelog (v9.0, v8.0, v7.0)

### Bug Fixes ✅
**Commit:** `977d8b8` + `2ee0f79`
1. **Scenario Lab:** H1 changed from "Strategic Scenario Lab" to "Simulation Engine". Added `nextStep()`/`prevStep()` methods, clickable wizard steps, step-nav CSS
2. **Signal Terminal:** Added `overflow-y: auto` + `max-height: 800px` to `.st-signal-column`. Cultural & Contextual description verified correct.

### Push + Verify ✅
- Pushed 3 commits: `b1bddaf`, `977d8b8`, `2ee0f79`
- All 8 surfaces returning HTTP 200 on GitHub Pages

---

# Sprint 15.2 — Polish Pass (Session 2)

## Phase A ✅ — The Shift Redesign
**Commit:** `7bc2392`
- Replaced 2-column `.comparison-grid` with row-based `.shift-table`
- 4 rows: What changed? / Why? / Who experienced it? / What if we do X vs Y?
- Traditional column has strikethrough, AI-Native column in purple highlight
- Dark glass-morphism styling matching design system

## Phase B ✅ — Day in the Life Subtle Colors
**Commit:** `e65a77f` (with Phase C)
- Reduced signal accent opacity: background 0.1→0.06, border 0.3→0.15
- Glass box toggle verified already working (app.js lines 914-927)

## Phase C ✅ — Brand Fidelity Official Image
**Commit:** `e65a77f` (with Phase B)
- Copied `Fidelity-01 1 copy.png` → `assets/images/fidelity-wheel.png`
- Replaced inline SVG wheel with `<img>` tag, max-width 500px, responsive

## Phase D ✅ — Command Center + Guided Analysis Scroll Fix
**Commit:** `043000d`
- Root cause: `padding-bottom: 120px` on `:last-child` of both containers
- Reduced to 32px — content now fills naturally from top

## Phase E ✅ — How It Works Architecture Expansion
**Commit:** `a884483`
- Added ~240 lines of new architecture content
- 01b.1 Signal Ingestion Pipeline (source classification, validation gates)
- 01b.2 Processing & Enrichment (NLP/behavioral/cultural pipelines)
- 01b.3 Consensus Engine Deep Dive (worked example, confidence formula)
- 01b.4 Surface Delivery (8-surface routing)
- 01b.5 Caching & Performance (signal cache, progressive loading)

## Phase F ✅ — Scenario Lab Rework
**Commit:** `a9f66a9`
- Replaced 5-card selector grid with `<select>` dropdown + "Begin Analysis →" CTA
- Renamed all "Signal Nexus" → "Fidelity LIVE" with pulsing red dot animation
- Reordered competitive brands: Airbnb, Vrbo first
- Added shimmer/sweep CSS animations, `BIE.startSelectedScenario()` handler

## Onboarding Popup Fixes ✅
**Commit:** `3e15942`
- **Title truncation root cause:** Wildcard `[class*="title"]` at line ~893 in global.css was forcing `white-space: nowrap` on `.onboarding-title`. Fixed with inline `setProperty('white-space', 'normal', 'important')` in JS
- Replaced pulse SVG with Phosphor `ph-chart-line-up` icon + CSS pulse rings
- Replaced drivers SVG with official `fidelity-wheel.png` image
- Widened timeline SVG from 280→420px for even label spacing (9 PM / 11:45 PM overlap fixed)

## Phase G ✅ — README Screenshots
**Commit:** `caa142b`
- Deleted 31 old screenshots (above-fold, full, scroll variants)
- Playwright captured fresh 1280×800 screenshots for all 8 surfaces
- Added Brand Fidelity + Scenario Lab to README screenshots section
- Updated surface count 7→8, renamed Signal Nexus→Fidelity LIVE

## All Commits (Sprint 15.2)
| Hash | Description |
|------|-------------|
| `7bc2392` | fix: redesign The Shift as from→to comparison table |
| `e65a77f` | fix: DITL subtle colors + Brand Fidelity official image |
| `043000d` | fix: root-cause scroll midline in Command Center + Guided Analysis |
| `a884483` | feat: expand architecture to full technical depth |
| `a9f66a9` | feat: scenario lab dropdown, Fidelity LIVE, premium positioning |
| `3e15942` | fix: onboarding popup — title wrap, icon, fidelity image, timeline |
| `caa142b` | docs: fresh screenshots for all 8 surfaces |

---

## Key Lessons
1. **NEVER use VM-side mirror for edits** — always `/tmp/bie-v9-push/` via Desktop Commander
2. **Agent bulk edits are unreliable** — verify every change, prefer script-based (Python/sed)
3. **Desktop Commander `read_file` can return empty** — use `start_process` with `cat -n` or `sed -n` as fallback
4. **Check for existing content before conditional inserts** — how-it-works.html teaser link caused script to skip nav insertion
5. **VM ≠ Mac filesystem** — Playwright runs in VM, Desktop Commander edits Mac side. Must sync or test from correct location
6. **Wildcard CSS attribute selectors are sneaky** — `[class*="title"]` matched `.onboarding-title` and caused truncation. Always check for wildcard overrides
7. **Inline `style.property = value` loses to `!important` in stylesheets** — use `setProperty(prop, val, 'important')` for guaranteed override
