# BIE v9 — Hardening Backlog

> Prioritized by asymmetric impact: high-impact items that cost relatively little effort but create disproportionate value.

---

## Tier 1: Thunderbolts (High Impact, Ship This Week)

Items that create the biggest perception shift with minimal effort.

- [ ] **Make the Material Analyst the hero of every demo** — Pre-load a "best of" conversation thread on each page so the panel opens with proof of intelligence, not a blank state. Current state: tiered pills exist but panel opens empty.
- [ ] **Wire the API key for live demos** — When an Anthropic key is configured in `data/config.json`, the Analyst streams real Claude Haiku responses. Fallback to hardcoded responses only when key is missing. Test end-to-end.
- [ ] **Randomize Command Center on every load** — Shuffle signal cards, vary the TL;DR briefing phrasing, rotate featured insights. Currently static — repeat visits feel stale.
- [ ] **Add a "What's Changed" diff overlay** — One line per driver showing score movement since last visit (localStorage). Makes the "continuous" promise tangible.

---

## Tier 2: Flanking Moves (Medium Effort, Competitive Differentiation)

Features that differentiate BIE from anything else in market.

- [ ] **Brand switcher in the nav** — Dropdown to swap between Stayworthy and at least one alternate brand (e.g., a CPG brand). Proves multi-brand architecture without a full backend. Reads from `data/brands/` JSON configs per DATA-EXTENSIBILITY.md.
- [ ] **Connect RSS feeds to Signal Terminal** — `api-client.js` already fetches from 5 news sources. Parse and render as real signal cards in the terminal feed instead of hardcoded signals.
- [ ] **War Gaming actually runs the simulation** — Wire `brand-sim.js` output into War Gaming mode's Simulate step. Show agent-level results, brand share shifts, and driver impact projections with real computed data.
- [ ] **Export Morning Brief as PDF** — One-click export of Command Center state as a branded PDF. Demonstrates the "many expressions" vision (same data, different surface).

---

## Tier 3: Deception Layer (Polish That Creates Illusion of Depth)

Small touches that make the prototype feel like a production system.

- [ ] **Subtle motion on every page** — Micro-animations on metric cards (count-up on scroll), signal badges (pulse on new), driver gauges (animate to score). Currently most pages are static on load.
- [ ] **Glass Box provenance on one real page** — Pick Command Center or Signal Terminal. Make the Glass Box panels show real methodology text with actual source names, confidence calculations, and sample sizes — not placeholder content.
- [ ] **Pre-load 3 example conversation threads** — In the Material Analyst, show brief example exchanges (2-3 turns each) demonstrating Ask and Explore modes. Users see the system's range before typing.

---

## Tier 4: Strategic Reserves (Post-Board, Foundational)

Longer-term investments that strengthen the architecture.

- [ ] **Wire Guided Analysis to the Material Analyst** — Currently Guided Analysis has its own hardcoded Q&A flow. Connect it to the same analyst engine so questions flow through the LLM with full brand context.
- [ ] **Mobile-responsive nav** — Collapsible sidebar for tablet presentation mode (1024px breakpoint). Board presentations happen on varied screen sizes.
- [ ] **"How BIE is Different" comparison page** — A surface that visually contrasts BIE's approach vs. traditional brand tracking (quarterly surveys, single-signal, black box). Useful for sales conversations.
- [ ] **Onboarding tutorial as demo script** — A guided walkthrough overlay (coach marks or stepper) that narrates the platform for first-time viewers. Doubles as a board presentation script.

---

## Completed

- [x] Clarity pass — replace jargon with plain language across all pages
- [x] Accessibility pass — focus indicators, skip links, ARIA roles, semantic HTML
- [x] Bug fixes — composite score alignment, scenario-lab dropdown SyntaxError
- [x] Rename Brand Fidelity → Brand Score across all surfaces
- [x] Material Analyst redesign — tiered conversations, example threads, contextual follow-ups
- [x] Documentation overhaul — README, ARCHITECTURE, VISION, ONBOARDING, TODO
