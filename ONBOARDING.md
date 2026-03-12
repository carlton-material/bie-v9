# Onboarding Guide — BIE v9

> How to pull, understand, and start working with the Brand Intelligence Engine codebase.

---

## Step 1: Clone and Serve

```bash
git clone git@github.com:carlton-material/bie-v9.git
cd bie-v9
python3 -m http.server 8090
open http://localhost:8090
```

No build step. No npm install. No framework. Just HTML, CSS, and JS.

---

## Step 2: Read These Files First (In This Order)

Before touching any code, read these documents to build context:

1. **README.md** — What this is, what the surfaces do, how the design system works
2. **docs/VISION.md** — Why this exists, the strategic context, where it's headed
3. **docs/ARCHITECTURE.md** — How the code is structured, what's real vs. simulated, JS module descriptions
4. **TODO.md** — What's next, organized by priority tier
5. **docs/DATA-EXTENSIBILITY.md** — The multi-brand architecture plan
6. **CONTRIBUTING.md** — Branch conventions, commit format, PR checklist

---

## Step 3: Walk the Codebase

Open each file in this order to understand the layers:

### Design Tokens (start here)

- **`css/tokens.css`** — All color, font, spacing, and animation variables. This is the single source of truth for the visual system. Every other CSS file references these tokens.

### Layout and Components

- **`css/global.css`** — The page layout grid, navigation, typography, analyst panel, intelligence ticker
- **`css/components.css`** — Reusable UI components: metric cards, signal badges, driver gauges, charts
- **`css/glass-box.css`** — The Glass Box transparency system (expandable methodology panels)

### Core Logic

- **`js/app.js`** — The heart of the application. Navigation, Material Analyst chat panel (tiered conversations, mode switching, topic tracking), Glass Box toggle behavior, intelligence ticker.
- **`js/analyst-llm.js`** — Claude Haiku LLM integration. System prompts, streaming responses, fallback handling.
- **`js/api-client.js`** — RSS feed client. Fetches news from 5 sources via CORS proxy.
- **`js/brand-sim.js`** — Agent-based simulation engine. 650 agents, Bass diffusion, Softmax utility.

### Data

- **`data/stayworthy.json`** — The demo brand. Composite score, 6 drivers, competitors, signal volumes.
- **`data/brands.json`** — Competitive set definitions
- **`data/brand-sim-config.json`** — Simulation parameters (agent count, Bass coefficients)
- **`data/signals-metadata.json`** — Signal source taxonomy
- **`data/synthetic-cohorts.json`** — Pre-generated cohort data for simulations

### Surfaces (HTML Pages)

- **`index.html`** — Strategic Brief (entry point). Start here for the user experience.
- **`command-center.html`** — Morning intelligence brief
- **`signal-terminal.html`** — Live signal feed
- **`guided-analysis.html`** — AI-assisted exploration
- **`scenario-lab.html`** — Simulation engine (4 tabs: Strategic Scenario, War Gaming, Focus Group, Brand Score LIVE). Most complex page (~5000 lines).
- **`brand-fidelity.html`** — Brand Score framework (filename is legacy — the UI says "Brand Score")
- **`how-it-works.html`** — Glass Box methodology
- **`day-in-the-life.html`** — Cinematic scrollytelling

---

## Step 4: Copy 1:1 Before Elevating

**Critical rule: Reproduce the existing codebase exactly before making any changes.**

1. Fork the repo to your own GitHub account
2. Clone your fork locally
3. Serve it and verify all 8 pages load correctly
4. Open the browser console (F12) — you should see zero errors (ignore Chrome extension noise and the expected "API key not configured" warning from analyst-llm.js)
5. Click through every page. Verify:
   - Navigation works between all 8 surfaces
   - Glass Box panels expand/collapse
   - Material Analyst opens (click the + button, top-right)
   - Intelligence ticker scrolls at the bottom
   - Scenario Lab tabs switch correctly (all 4)
6. Only after confirming a clean 1:1 copy, create a new branch for your changes

This step prevents "works on my machine" issues and ensures you have a known-good baseline to diff against.

---

## Step 5: Understand the Patterns

### Adding a New Surface

1. Copy any existing HTML file as a template
2. Keep the 4 CSS imports in `<head>` (tokens, global, components, glass-box)
3. Keep `<script src="js/app.js"></script>` at the bottom
4. Wrap content in `.app > .sidebar + .app-content`
5. Add your nav link to the sidebar in ALL 8 files
6. Page-specific styles go in an inline `<style>` block

### Modifying Data

All brand data lives in `data/stayworthy.json`. Driver scores, competitor data, signal volumes — change them there, not in the HTML.

### Working with the Material Analyst

The analyst chat panel is defined in `app.js`. Key extension points:
- **Add suggested questions:** Modify the `suggestedQuestions` object (organized by mode → page → tier)
- **Add fallback responses:** Modify `generateAnalystResponse()` (organized by topic → mode)
- **Add follow-up pills:** Modify `_getContextualFollowUps()` (organized by topic → mode)

### Cache Busting

CSS and JS links include `?v=N` query params. Bump the version number when you change shared CSS/JS to bust browser caches. Current version: `v=22`.

---

## Step 6: Make Your Changes

1. Create a feature branch: `feature/descriptive-name`
2. Make focused changes — one feature per branch
3. Test all 8 pages after every change
4. Commit with conventional format: `feat(scope): description`
5. Push and open a PR against main

See CONTRIBUTING.md for full branch conventions, commit format, and PR checklist.

---

## Common Gotchas

**"API key not configured" in console** — Expected if you haven't added an Anthropic key to `data/config.json`. The Analyst uses hardcoded fallback responses. This is normal for demos.

**CSS changes not showing** — Bump the `?v=N` cache buster on the CSS `<link>` tags in the HTML files.

**Sidebar nav out of sync** — Navigation is duplicated across all 8 HTML files. Changes must be made in all of them.

**scenario-lab.html is huge** — This is the most complex page (~5000 lines). The 4 tabs each have their own inline JS logic. Handle with care.

**Glass Box panels not toggling** — Check that `glass-box.css` is imported and `app.js` is loaded. Toggle logic is in app.js.

**brand-fidelity.html vs. Brand Score** — The filename says "fidelity" (legacy) but the UI displays "Brand Score." Don't rename the file — it would break existing links. The display name is correct.

---

## Key Terminology

| Term | Meaning |
|------|---------|
| Brand Score | Composite loyalty metric (0-100) aggregated from 6 drivers |
| Driver | One of 6 loyalty dimensions: User Friendly, Personal, Accessible, Dependable, Meaningful, Salient |
| Signal | A data point from one of three layers: Human-Expressive, Behavioral, or Cultural |
| Glass Box | Transparency system — every claim shows its source, methodology, and confidence |
| Material Analyst | AI chat panel powered by Claude Haiku with Ask (Socratic) and Explore (diagnostic) modes |
| Surface | An HTML page in the BIE system |
| In the Moment | Driver dimension covering experience quality (User Friendly, Personal, Accessible) |
| Over Time | Driver dimension covering relationship depth (Dependable, Meaningful, Salient) |

---

*Questions? Check the docs/ folder or reach out to the Material+ Applied AI team.*
