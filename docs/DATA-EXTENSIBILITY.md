# BIE Data Extensibility Architecture

> **Status:** Architecture Decision Record (ADR)
> **Author:** Carlton Rice · Material+ Applied AI
> **Date:** March 2026
> **Scope:** Multi-industry brand swap across 10+ verticals

---

## Problem Statement

BIE v9 is hardcoded to Stayworthy (Travel & Hospitality). Swapping to a new brand in a different industry requires touching 380+ data points across 12+ files. The goal is to make brand-swapping a configuration change, not a code rewrite.

**Target industries:** Media & Entertainment, Consumer Tech, Enterprise Tech, Lifestyle & Beauty, CPG, Retail, Home & Construction, Finance & Business Services, Travel & Hospitality, Meds & Eds, Health & Pharma, Government & Foundations.

---

## Current State Assessment

### Hardcoded Coupling Points

| File | Hardcoded Items | Coupling Type |
|------|----------------|---------------|
| `data/stayworthy.json` | ~120 | Brand data, competitors, drivers, signals |
| `data/brand-sim-config.json` | ~40 | Simulation brands, Bass diffusion params |
| `data/config.json` | ~5 | API keys, model config |
| `command-center.html` | ~30 | TL;DR briefing, driver scores, signal feed |
| `guided-analysis.html` | ~35 | Glass-box citations, dimension briefs, suggestions |
| `scenario-lab.html` | ~50 | Scenario cards, brand names, market share data |
| `signal-terminal.html` | ~25 | Signal cards, source citations, confidence scores |
| `how-it-works.html` | ~20 | Architecture references, pipeline stats |
| `day-in-the-life.html` | ~25 | Persona names, role contexts, insight cards |
| `brand-fidelity.html` | ~15 | Driver framework, scoring methodology |
| `js/app.js` | ~10 | Brand name references, suggested questions |
| `js/analyst-llm.js` | ~8 | System prompt hardcodes driver scores |

**Extensibility score:** 28% (only `config.json` and `brand-sim-config.json` are partially abstracted).

### What's Already Abstracted

The simulation engine (`scenario-lab.html`) partially reads from `brand-sim-config.json`, making it the closest to extensible. The analyst LLM reads brand data from `stayworthy.json` at runtime. Everything else is inline HTML/JS.

---

## Target Architecture

### Layer 1: Industry Configuration (`data/industries/{id}.json`)

Each industry defines its terminology, default segments, signal taxonomy, and regulatory context.

```json
{
  "id": "travel-hospitality",
  "name": "Travel & Hospitality",
  "terminology": {
    "customer": "Guest",
    "purchase": "Booking",
    "retention": "Repeat Stay Rate",
    "conversion": "Booking Conversion",
    "churn": "Lapsed Guest Rate"
  },
  "segments": ["Luxury Seekers", "Budget Travelers", "Business Travelers", "Adventure Seekers"],
  "signalSources": {
    "humanExpressive": ["TripAdvisor", "Google Reviews", "Trustpilot", "Reddit r/travel"],
    "behavioral": ["Booking Funnel", "App Sessions", "Repeat Rate", "Clickstream"],
    "cultural": ["Travel Trends", "Regulatory", "Macro-Economic", "Seasonal"]
  },
  "regulatoryContext": "Consumer protection, accessibility standards, data privacy (GDPR for EU travelers)",
  "seasonality": { "peak": ["Jun", "Jul", "Aug", "Dec"], "low": ["Jan", "Feb", "Nov"] }
}
```

### Layer 2: Brand Configuration (`data/brands/{id}.json`)

Replaces `stayworthy.json`. Each brand file contains everything BIE needs.

```json
{
  "id": "stayworthy",
  "name": "Stayworthy",
  "industry": "travel-hospitality",
  "composite": 72,
  "compositeDelta": -4,
  "keyInsight": "Trust erosion driven by reliability gap",
  "drivers": {
    "inTheMoment": [
      { "name": "User Friendly", "score": 72, "delta": -4, "status": "watch" },
      { "name": "Personal", "score": 64, "delta": -8, "status": "critical" },
      { "name": "Accessible", "score": 71, "delta": 1, "status": "stable" }
    ],
    "overTime": [
      { "name": "Dependable", "score": 58, "delta": -6, "status": "crisis" },
      { "name": "Meaningful", "score": 66, "delta": -3, "status": "watch" },
      { "name": "Salient", "score": 74, "delta": 2, "status": "strength" }
    ]
  },
  "competitors": [
    { "id": "booking", "name": "Booking.com", "composite": 74 },
    { "id": "marriott", "name": "Marriott Homes", "composite": 71 },
    { "id": "vrbo", "name": "Vrbo", "composite": 68 },
    { "id": "airbnb", "name": "Airbnb", "composite": 68.9 }
  ],
  "signalVolume": {
    "humanExpressive": 12400,
    "behavioral": 24800,
    "cultural": 9800,
    "total": 47000
  },
  "colors": {
    "primary": "#818cf8",
    "competitors": {
      "booking": "#34d399",
      "marriott": "#a78bfa",
      "vrbo": "#fb923c",
      "airbnb": "#f59e0b"
    }
  }
}
```

### Layer 3: Simulation Configuration (`data/simulations/{brand-id}.json`)

Replaces `brand-sim-config.json`. Contains Bass diffusion parameters, scenario presets, and agent distribution.

```json
{
  "brandId": "stayworthy",
  "agentCount": 650,
  "brands": [
    {
      "id": "stayworthy",
      "name": "Stayworthy",
      "isSelf": true,
      "equity": 0.72,
      "price": 0.65,
      "innovation": 0.58,
      "distribution": 0.70,
      "bassDiffusion": { "p": 0.03, "q": 0.38 }
    }
  ],
  "presetScenarios": [
    {
      "id": "status-quo",
      "name": "Status Quo",
      "label": "Baseline",
      "description": "No intervention. Gradual decline.",
      "modifiers": {}
    },
    {
      "id": "premium-positioning",
      "name": "Premium Positioning",
      "label": "Invest",
      "description": "Invest in quality signals. Composite recovery.",
      "modifiers": { "stayworthy": { "equity": 0.82, "innovation": 0.75 } }
    }
  ]
}
```

### Layer 4: Surface Templates (`data/surfaces/{surface-id}.json`)

Each HTML surface reads its content from a JSON template instead of hardcoding.

```json
{
  "surfaceId": "command-center",
  "brandId": "stayworthy",
  "briefing": {
    "headline": "Dependable driver in crisis territory",
    "insights": [
      { "title": "Trust Erosion", "body": "22-point gap between stated trust and behavioral signals", "signal": "behavioral", "severity": "critical" },
      { "title": "Competitive Pressure", "body": "Booking.com overtook on composite by 2 points", "signal": "cultural", "severity": "watch" },
      { "title": "Salient Strength", "body": "Top-of-mind awareness holding at 74, best in category", "signal": "human", "severity": "strength" }
    ]
  },
  "signalFeed": [],
  "glassBox": {
    "source": "M+ Brand Fidelity Report 2026",
    "sampleSize": 24000,
    "category": "Travel Category",
    "confidence": "HIGH",
    "period": "Feb 15–Mar 4, 2026"
  }
}
```

### Layer 5: Persona Templates (`data/personas/{industry-id}.json`)

For Day in the Life, personas are industry-specific.

```json
{
  "industry": "travel-hospitality",
  "personas": [
    {
      "id": "sc",
      "name": "Sarah Chen",
      "role": "VP Brand Strategy",
      "avatar": { "initials": "SC", "color": "#818cf8" },
      "scenes": [
        {
          "time": "morning",
          "title": "Morning signal scan",
          "narrative": "Sarah opens the Command Center...",
          "surface": "command-center"
        }
      ]
    }
  ]
}
```

---

## Migration Strategy

### Phase 1: Data Extraction (2 weeks)

Extract all hardcoded data from HTML/JS into JSON config files. No UI changes — surfaces read from JSON at page load instead of inline.

**Deliverables:** `data/brands/stayworthy.json`, `data/industries/travel-hospitality.json`, `data/simulations/stayworthy.json`, surface template JSONs.

### Phase 2: Loader Layer (2 weeks)

Build `js/brand-loader.js` — a central module that:
1. Reads `?brand=stayworthy` from URL params
2. Loads the brand JSON, industry JSON, and surface templates
3. Hydrates all DOM elements via `data-bind` attributes
4. Passes brand context to analyst LLM system prompt

```javascript
// Example: <span data-bind="brand.composite"></span> → "72"
// Example: <div data-bind="brand.drivers.inTheMoment" data-template="driver-card"></div>
```

### Phase 3: Template Engine (2 weeks)

Replace inline HTML content blocks with `<template>` elements + data binding. Each surface becomes a shell that the loader populates.

### Phase 4: Multi-Brand Testing (1 week)

Create a second brand config (e.g., a CPG brand) and verify all 8 surfaces render correctly with zero code changes.

### Phase 5: Brand Builder UI (1 week)

Optional: admin page where users configure a new brand by filling in the JSON structure via a form, then preview all 8 surfaces.

---

## Effort Estimate

| Phase | Duration | Complexity |
|-------|----------|------------|
| Data Extraction | 2 weeks | Medium — tedious but straightforward |
| Loader Layer | 2 weeks | High — central architecture piece |
| Template Engine | 2 weeks | High — touches all 8 surfaces |
| Multi-Brand QA | 1 week | Medium — validation + edge cases |
| Brand Builder | 1 week | Low — optional enhancement |
| **Total** | **6–8 weeks** | |

---

## Files Created/Modified

### New Files
```
data/
  industries/
    travel-hospitality.json
    consumer-tech.json
    cpg.json
    ...
  brands/
    stayworthy.json (migrated from data/stayworthy.json)
  simulations/
    stayworthy.json (migrated from data/brand-sim-config.json)
  surfaces/
    command-center.json
    guided-analysis.json
    signal-terminal.json
    scenario-lab.json
    day-in-the-life.json
    brand-fidelity.json
  personas/
    travel-hospitality.json
js/
  brand-loader.js (new)
```

### Modified Files
All 8 HTML surfaces + `app.js` + `analyst-llm.js` — replace hardcoded content with `data-bind` attributes.

---

## Decision Record

**Why JSON config over a database?** BIE v9 is static HTML on GitHub Pages — no server. JSON files maintain the zero-build-step architecture while enabling brand swapping via URL params.

**Why not a CMS?** Premature complexity. JSON files in git provide version control, diff-ability, and can be promoted to a CMS endpoint in v10 when real-time data pipelines exist.

**Why 5 layers?** Each layer has a different change frequency: industries change rarely, brands change per-client, simulations change per-analysis, surface content changes per-refresh, personas change per-industry.
