# BIE v9 — System Architecture

> **Status:** Living document
> **Author:** Material+ Applied AI
> **Last updated:** March 2026

---

## 1. System Overview

BIE v9 is a static HTML/CSS/JS application deployed on GitHub Pages. There is no build step, no framework, and no server-side processing. The entire system runs in the browser.

- **8 HTML surfaces** (pages), each self-contained
- **4 shared CSS files** defining the design system
- **4 JS modules** handling core logic, LLM integration, RSS feeds, and simulation
- **5 JSON data files** loaded at runtime
- **Claude Haiku** integration for AI-assisted analysis with intelligent fallbacks

---

## 2. What's Real vs. Simulated

BIE v9 is an interactive prototype. Understanding what's live vs. illustrative is critical for anyone working on or presenting the system.

### Real (Functional)

- All 8 HTML surfaces render with data from JSON files
- Material Analyst chat panel connects to Claude Haiku API (when API key is configured in `data/config.json`)
- RSS feed client (`api-client.js`) fetches live news from 5 sources via CORS proxies
- Agent-based simulation engine (`brand-sim.js`) runs real computations: 650 agents, Bass diffusion model, Softmax utility function
- Glass Box panels expand/collapse to show methodology attribution
- Navigation, mode switching, filters, and all UI interactions are fully functional

### Simulated / Hardcoded

- Brand data (Stayworthy and competitors) is synthetic — not ingested from real APIs
- Signal feed in Command Center and Signal Terminal is pre-generated, not live
- Analyst has hardcoded fallback responses when API key is not configured
- Signal confidence scores and source citations are illustrative
- "847 signals" count and similar aggregates are static
- Competitive composite scores are fixed, not dynamically computed

---

## 3. CSS Architecture

The visual system is built on 4 CSS files, loaded in order on every page.

### tokens.css — Design Tokens

Single source of truth for the entire visual system. Contains 80+ CSS custom properties:

**Color palette (6-tier black stack):**
- `--surface-base`: #000000
- `--surface-subtle`: #030303
- `--surface-dim`: #050505
- `--surface-muted`: #0a0a0a
- `--surface-default`: #0f0f0f
- `--surface-raised`: #141414

**Signal colors (never use other colors for data):**
- `--signal-human`: #818cf8 (Human-Expressive — indigo)
- `--signal-behavioral`: #34d399 (Behavioral — teal)
- `--signal-cultural`: #f59e0b (Cultural — amber)

**Brand accent:**
- `--brand-purple`: #745AFF — logo and accent only, never for data visualization

**Typography:**
- Space Grotesk — display headings, nav, labels
- Inter — body text, descriptions, long-form
- JetBrains Mono — data values, scores, code, timestamps

### global.css — Layout and Navigation

- Page layout grid: `.app > .sidebar + .app-content`
- Sidebar navigation with active states
- Typography scale and defaults
- Intelligence ticker (scrolling feed at page bottom)
- Material Analyst panel: chat container, message bubbles, suggestion pills, mode toggle
- Skip-to-content link and focus indicators (WCAG 2.1 AA)

### components.css — Reusable UI Components

- Metric cards with score displays and delta indicators
- Signal badges (color-coded by layer)
- Driver gauge visualizations
- Progress bars and loading states
- Chart containers and data tables
- Alert and status indicators

### glass-box.css — Transparency System

- Expandable panels that reveal methodology behind every data claim
- Header with toggle button ("SHOW MY WORK")
- Content area for source attribution, confidence scores, sample sizes
- Consistent styling across all surfaces

---

## 4. JavaScript Modules

### app.js (~900 lines) — Core Application

The central module loaded on every page. Handles:

**Navigation:** Sidebar links, active page detection, routing between surfaces.

**Material Analyst:** The AI chat panel accessible from every page.
- Two modes: Ask (Socratic questioning) and Explore (diagnostic analysis)
- 3-tier suggestion system: tier 0 (opening questions), tier 1 (focused follow-ups), tier 2 (strategic deep-dives)
- Topic detection from user queries (14 keyword categories)
- Conversation depth tracking (`_conversationDepth`) prevents suggestion repetition
- Pre-loaded example conversations per page per mode
- 14 topic categories x 2 modes = 84 contextual follow-up sets
- Page-specific default responses for all 8 surfaces

**Glass Box:** Toggle behavior for transparency panels across all surfaces.

**Intelligence Ticker:** Scrolling signal feed at the bottom of every page.

### analyst-llm.js — LLM Integration

- Reads API key from `data/config.json` (gitignored)
- Builds system prompts with full brand context: all 6 driver scores, signal volumes, competitor data, current page context
- Two prompt variants matching Ask and Explore modes
- Streaming response rendering (character by character)
- Graceful fallback to `app.js` hardcoded responses on API failure or missing key

### api-client.js — RSS Feed Client

- Fetches from 5 configurable news sources
- Uses CORS proxy (corsproxy.io) for cross-origin access
- Parses RSS XML into signal-compatible format
- Populates the intelligence ticker and can feed Signal Terminal

### brand-sim.js — Simulation Engine

- 650 autonomous agents with psychographic segment profiles
- Bass diffusion model for adoption and awareness dynamics
- Softmax utility function for brand choice probability
- Runs in Scenario Lab across 4 modes: Strategic Scenario, War Gaming, Focus Group, Brand Score LIVE
- Parameters loaded from `data/brand-sim-config.json`

---

## 5. Data Layer

All data lives in `data/` as JSON files loaded at page initialization.

| File | Purpose | Change Frequency |
|------|---------|-----------------|
| `stayworthy.json` | Primary brand: composite score, 6 drivers, competitors, signals | Per-client |
| `brands.json` | Competitive set definitions with composite scores | Per-analysis |
| `brand-sim-config.json` | Simulation parameters: agent count, Bass coefficients, brand equities | Per-simulation |
| `signals-metadata.json` | Signal source taxonomy: Human-Expressive, Behavioral, Cultural | Rarely |
| `synthetic-cohorts.json` | Pre-generated cohort data for simulation visualizations | Per-simulation |
| `config.json` | API key storage (gitignored) | Once |

### Brand Score Data Model

Six drivers across two dimensions:

**In the Moment** (experience-driven):
- User Friendly (72, -4) — ease, intuitiveness
- Personal (64, -8) — relevance, customization
- Accessible (71, +1) — availability, inclusivity

**Over Time** (relationship-driven):
- Dependable (58, -6) — consistency, reliability
- Meaningful (66, -3) — purpose, emotional connection
- Salient (74, +2) — awareness, distinctiveness

Composite Brand Score: 72 (-4)

### Signal-to-Driver Mapping

- Human-Expressive signals → Personal, Meaningful
- Behavioral signals → User Friendly, Dependable
- Cultural signals → Salient, Accessible

### Source Tier Weightage

Primary 40% · Secondary 30% · Tertiary 20% · Internal 10%

---

## 6. Page Architecture Pattern

Every surface follows the same structural template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/global.css">
  <link rel="stylesheet" href="css/components.css">
  <link rel="stylesheet" href="css/glass-box.css">
  <style>/* Page-specific styles only */</style>
</head>
<body>
  <a href="#main-content" class="skip-to-content">Skip to content</a>
  <div class="app">
    <nav class="sidebar" role="navigation">
      <!-- Shared navigation links to all 8 surfaces -->
    </nav>
    <main class="app-content" id="main-content" role="main">
      <!-- Page content -->
    </main>
  </div>
  <script src="js/app.js?v=22"></script>
  <!-- Page-specific scripts if needed (e.g., brand-sim.js on scenario-lab) -->
</body>
</html>
```

Page-specific CSS lives in inline `<style>` blocks. This keeps each surface self-contained — changing one page cannot break another.

---

## 7. Key Design Decisions

**Why no framework?**
Static HTML on GitHub Pages. Zero build step means zero build rot. Any developer can clone, serve, and iterate in under 60 seconds. No node_modules, no webpack, no version drift.

**Why JSON over a database?**
No server. JSON files in git provide version control, diff-ability, and zero infrastructure. Can be promoted to API endpoints when real-time data pipelines exist (see DATA-EXTENSIBILITY.md).

**Why inline page-specific CSS?**
Each surface is a self-contained unit. Inline styles prevent cross-surface side effects. The 4 shared CSS files handle only system-level tokens, layout, and reusable components.

**Why Glass Box?**
The core differentiator. Every data claim traces to a source, methodology, and confidence score. Transparency is architectural, not cosmetic.

**Why Claude Haiku?**
Optimized for cost (~$0.003/response) and speed. The Material Analyst needs fast, contextual responses — Haiku delivers both. Intelligent fallbacks ensure the demo works without an API key.

---

## 8. Future Architecture

### Multi-Brand Support (v10)
URL parameter-based brand switching: `?brand=stayworthy` loads the brand config, industry config, and surface templates dynamically. See [DATA-EXTENSIBILITY.md](DATA-EXTENSIBILITY.md) for the full 5-layer architecture.

### Headless Kernel (v11+)
BIE as an API/kernel that powers multiple surface expressions: web dashboard, PDF briefs, email digests, Slack alerts, client portals. One core, many expressions.

### Live Data Integration
Replace JSON files with real-time ingestion from social listening APIs, web analytics, CRM systems. Signal processing pipeline runs server-side; surfaces consume via REST/WebSocket.

---

*See also: [VISION.md](VISION.md) for product direction, [DATA-EXTENSIBILITY.md](DATA-EXTENSIBILITY.md) for multi-brand architecture.*
