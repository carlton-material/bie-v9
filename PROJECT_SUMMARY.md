# BIE v9 — Project Summary & Publish Workflow

> **Last updated**: 2026-03-07
> **Repo**: `carlton-material/bie-v9`
> **Live URL**: https://carlton-material.github.io/bie-v9/
> **Target**: March 19, 2026 board presentation

---

## 1. What This Is

The Brand Intelligence Engine (BIE) v9 is a 7-surface interactive prototype demonstrating how Material+ can evolve brand tracking from periodic survey reports into a continuous, multi-signal decision engine. It uses a synthetic brand ("Stayworthy" — Travel & Hospitality) to showcase the full system across strategic brief, operational dashboard, guided analysis, and simulation surfaces.

### The 7 Surfaces

| # | File | Surface | Purpose |
|---|------|---------|---------|
| 1 | `index.html` | Strategic Brief | The pitch — why brand tracking must evolve |
| 2 | `command-center.html` | Command Center | Live operational dashboard with signal feeds |
| 3 | `guided-analysis.html` | Guided Analysis | AI-guided exploration (Guide/Guardian modes) |
| 4 | `day-in-the-life.html` | Day in the Life | 6 scenes showing daily BIE usage narrative |
| 5 | `how-it-works.html` | How It Works | Architecture, signal types, methodology |
| 6 | `signal-terminal.html` | Signal Terminal | Raw signal feed with filtering |
| 7 | `scenario-lab.html` | Scenario Lab | 5-mode simulation (Insight, War Gaming, Focus Group, Signal Nexus, Brand Sim) |

### Architecture

Pure static HTML/CSS/JS — no build step, no bundler, no framework. Hosted on GitHub Pages directly from `main` branch.

```
bie-v9/
├── index.html                    # Strategic Brief
├── command-center.html           # Command Center
├── guided-analysis.html          # Guided Analysis
├── day-in-the-life.html          # Day in the Life
├── how-it-works.html             # How It Works
├── signal-terminal.html          # Signal Terminal
├── scenario-lab.html             # Scenario Lab
├── css/
│   ├── tokens.css                # Design tokens (colors, typography, spacing)
│   ├── global.css                # Shared layout, nav, overflow guards
│   ├── components.css            # Reusable component styles
│   └── glass-box.css             # Glass Box transparency system
├── js/
│   ├── app.js                    # Core: BIE global, nav, brand loading, analyst
│   ├── analyst-llm.js            # Claude API integration for Material Analyst
│   └── brand-sim.js              # Agent-based brand simulation engine
├── data/
│   ├── stayworthy.json           # Brand data (equity scores, competitors, signals)
│   ├── brands.json               # Brand registry + sector taxonomy
│   ├── brand-sim-config.json     # Simulation parameters
│   ├── synthetic-cohorts.json    # Synthetic consumer cohort data
│   ├── signals-metadata.json     # Signal source definitions
│   └── config.json               # Runtime configuration
├── assets/logos/                  # Brand logos
├── docs/screenshots/             # Documentation screenshots
└── tasks/
    └── lessons.md                # Design system lessons learned
```

---

## 2. Design System

### 6-Tier Black Stack (Surfaces)

```
--bg-void:      #000000   ← deepest background
--bg-deep:      #030303
--bg-primary:   #050505   ← main page background
--bg-elevated:  #0a0a0a
--bg-card:      #0f0f0f   ← cards, panels
--bg-card-hover:#141414   ← hover state
```

### 3 Signal Colors (The ONLY chromatic colors)

| Signal | Hex | Role |
|--------|-----|------|
| Human-Expressive | `#818cf8` | Perceptual, emotional — primary actions |
| Behavioral | `#34d399` | Transactional, factual — success states |
| Cultural | `#f59e0b` | Environmental, systemic — warnings |

### Typography (3-Font System)

- **Display**: Space Grotesk — headings, hero text
- **Body**: Inter — paragraphs, labels
- **Mono**: JetBrains Mono — data, code

### Text Hierarchy

```
--text-primary:   #f0f0f0   (headings, main content)
--text-secondary: #999      (body text, descriptions)
--text-tertiary:  #666      (labels, metadata)
--text-muted:     #444      (hints, disabled states)
--text-ghost:     #2a2a2a   (decorative)
```

### Interactive Element Rules

ALL buttons/options on dark backgrounds need THREE explicit states:

1. **Inactive**: `background: rgba(255,255,255,0.04)`, `border: rgba(255,255,255,0.08)`, `color: rgba(255,255,255,0.6)`
2. **Hover**: Brighten all three to 0.08 / 0.12 / 0.8
3. **Active/Selected**: Accent color tint (`rgba(129,140,248,0.12)` for Human signal)

See `tasks/lessons.md` for the full pattern documentation.

---

## 3. Sprint History

### Sprint 10 — Brand Fidelity Integration
- Brand Fidelity 5-dimension model
- Analyst dual-mode (Guide/Guardian)
- Cinematic scroll animations
- Virtual Focus Group surface

### Sprint 11 — Cross-Disciplinary Brand Sprint
- Data visualization enrichment across surfaces
- Signal Terminal with filtering
- Competitive landscape radar charts

### Sprint 12 — Visual Enrichment Pass
- Design critique audit and fixes
- Card and panel visual polish
- Typography spacing standardization

### Sprint 13 — Full Data Viz + Spacing Pass
- All charts and graphs refined
- Consistent spacing tokens applied
- Glass Box transparency system

### Sprint 14 — Hardening
- LLM analyst integration (Claude API)
- Progressive disclosure patterns
- QA fixes across all surfaces
- GitHub Pages deployment pipeline

### Sprint 14.1 — Material Analyst Polish
- Fix DITL color saturation and text overflow
- Material Analyst refinements
- Glass Box spacing and icon consistency
- CSS overflow guards

### Sprint 15 — Current Sprint (March 2026)

**Major changes:**

1. **Scenario Lab overhaul**
   - Fixed `const` vs `window.` global scope bug (BIE object not accessible across script tags)
   - Fixed `Object.assign()` method name collision (`init()` → `initScenarioLab()`)
   - Added Brand Sim tab (5th mode) with agent-based simulation
   - Converted mode tabs from linear button row to dropdown selector
   - Fixed mode switching to hide wizard/selector when Brand Sim active

2. **Strategic Brief content**
   - Anonymized client names (Intuit → "major clients", Square → "Fortune 500 CMO")
   - Synthetic brand callout (Stayworthy is fictitious)

3. **Day in the Life visual redesign**
   - Transformed 6 wall-of-text scenes into visual component layouts
   - Added stat callout cards, horizontal bar charts, journey flows, comparison cards, insight callouts, scenario cards, cultural pulse indicators

4. **System extensibility**
   - `data/brands.json` — brand registry with sector taxonomy
   - `data/brand-sim-config.json` — simulation parameters
   - `window.BIE` global pattern for multi-script HTML
   - `.mailmap` to unify contributor identity

5. **Design system hardening**
   - Container dimension tokens (`--container-sm` through `--container-xl`)
   - Overflow prevention rules (flex child `min-width: 0`, `contain: layout style`)
   - White-on-white button bug fix pattern documented

6. **7-agent visual QA workshop** — comprehensive audit of:
   - Cards & Panels, Chips & Pills, Data Viz, Modals & Overlays
   - Typography & Spacing, Responsive & Overflow, Dark Theme & Accessibility

---

## 4. How to Publish to GitHub Pages

### Prerequisites

- Git CLI with push access to `carlton-material/bie-v9`
- GitHub Pages enabled on the repo (Settings → Pages → Source: `main` branch, root `/`)

### Clone or Update the Repo

```bash
# First time
git clone https://github.com/carlton-material/bie-v9.git
cd bie-v9

# Or update existing clone
cd /path/to/bie-v9
git pull origin main
```

### Make Changes

Edit any HTML, CSS, JS, or data file directly. No build step needed.

### Commit and Push

```bash
# Stage specific files
git add index.html css/global.css js/app.js

# Commit with descriptive message
git commit -m "Sprint 15: description of changes"

# Push to main (triggers GitHub Pages deploy)
git push origin main
```

### Verify Deployment

1. Go to https://carlton-material.github.io/bie-v9/
2. GitHub Pages CDN takes 10-30 seconds to propagate
3. If seeing old content: add cache-bust parameter `?v=COMMIT_HASH`
4. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
5. Check Actions tab on GitHub for deploy status

### Working from Cowork/Claude Code

When editing from a Cowork session, the Mac-side clone lives at `/tmp/bie-v9-push/`. The workflow is:

```bash
# Edits happen via Desktop Commander's edit_block tool on Mac-side files
# Then from Mac-side:
cd /tmp/bie-v9-push
git add -A
git commit -m "Sprint XX: description"
git push origin main
```

The VM-side mirror at `/sessions/.../mnt/bie-v9/` is read-only reference — pushes happen from the Mac-side repo.

---

## 5. Key Patterns & Gotchas

### Global Scope in Multi-Script HTML

Use `window.BIE = { ... }` not `const BIE = { ... }`. `const` is block-scoped to its `<script>` tag — inline scripts can't see it.

### Object.assign() Method Name Collision

When merging page-specific modules into `BIE` via `Object.assign(BIE, ScenarioLab)`, all method names must be unique. Use `initScenarioLab()` not `init()`.

### Mode Switching Sibling Visibility

Tab/mode switchers must manage ALL visible elements, not just toggle `.active` on panels. Shared UI (steppers, selectors, toolbars) that only apply to some modes need explicit show/hide.

### Overflow Prevention

- Every flex child: `min-width: 0`
- Every scrollable panel: `contain: layout style`
- Every text element: `overflow-wrap: break-word`
- Every fixed-width component: use `min()` with viewport fallback
- Test at 320px, 768px, 1024px, 1920px

### GitHub Pages CDN Caching

After pushing, changes take 10-30 seconds. Use `?v=commitHash` to cache-bust. The `Cmd+Shift+R` hard refresh also helps.

### Dark Theme Button States

Every interactive element on dark backgrounds MUST have visible inactive, hover, and active states. Minimum opacity: background 4%, border 8%, text 60%. See `tasks/lessons.md` for full CSS patterns.

---

## 6. QA Workshop Findings Summary (Sprint 15)

A 7-agent parallel QA audit identified ~70 findings across all surfaces:

### Critical (Must Fix)

- Missing hover states on several card types
- Invisible active pill text on Signal Terminal
- Missing `focus-visible` states on all interactive elements (a11y)
- Hardcoded pixel dimensions causing mobile overflow
- `.data-status-badge` class referenced in HTML but no CSS defined (how-it-works.html)
- Missing click-outside and Escape key handlers on analyst panel overlay

### Medium Priority

- Border-radius inconsistencies (mix of 6px, 8px, 12px)
- `rgba()` text colors with marginal WCAG contrast
- Missing 768px tablet media queries
- SVG elements not responsive at narrow viewports
- Badge/chip sizing inconsistencies across surfaces

### Low Priority

- Padding inconsistencies between similar components
- Animation timing variations
- Design token adoption gaps (some hardcoded colors remain)

---

## 7. File Quick Reference

| File | Lines | Purpose |
|------|-------|---------|
| `scenario-lab.html` | 3,936 | Largest surface — 5 simulation modes |
| `day-in-the-life.html` | 2,186 | 6-scene narrative with visual breakup |
| `how-it-works.html` | 1,845 | Architecture + methodology |
| `index.html` | 1,617 | Strategic Brief pitch |
| `guided-analysis.html` | 1,609 | AI-guided exploration |
| `command-center.html` | 1,581 | Live operational dashboard |
| `signal-terminal.html` | 1,259 | Raw signal feed |
| `js/app.js` | 1,348 | Core runtime (nav, brand loading, analyst) |
| `js/brand-sim.js` | 248 | Agent-based simulation engine |
| `js/analyst-llm.js` | 158 | Claude API integration |
| `css/global.css` | 1,011 | Shared layout + overflow guards |
| `css/glass-box.css` | 448 | Glass Box transparency |
| `css/components.css` | 375 | Reusable components |
| `css/tokens.css` | 148 | Design tokens |

**Total project**: ~19,000 lines across all files.

---

## 8. Remaining Sprint 15 Work

- [ ] WS3: Strategic Brief content overhaul (rich narrative from reference material)
- [ ] WS6: Multi-brand extensibility (`data-brand` attribute parameterization)
- [ ] QA critical fixes (focus-visible states, missing hover states, badge CSS)
- [ ] Full responsive QA pass at 320/768/1920px
- [ ] Final console error check across all 7 surfaces
- [ ] March 19 presentation polish

---

## 9. Git Commit History (Sprint 15)

```
0eeeb23 Redesign Day in the Life with visual breakup components
9108bc1 Convert mode tabs to dropdown selector + anonymize client names
90839cd chore: add .mailmap to unify contributor identity
05dbe75 docs: add Sprint 15 lessons learned
d4bdbc2 fix: hide full confidence section in Brand Sim mode
6478374 fix: hide wizard/selector when Brand Sim tab active
ce7fa93 fix: rename ScenarioLab.init() to avoid overwriting BIE.init()
2219123 fix: use window.BIE for global scope across script tags
37d78a1 fix: BIE variable redeclaration conflict in scenario-lab.html
63a8291 Sprint 15: Scenario Lab stepper, Brand Sim, content overhaul, extensibility
```

---

## 10. Contributors

| Account | Role |
|---------|------|
| `carlton-material` | Primary author (Material+ org account) |
| `claude` | AI pair programmer (via `.mailmap`) |

The `.mailmap` file unifies `carltonrice` (personal) commits under `carlton-material` for clean contributor display.
