# BIE v9 — Product Vision

> **Author:** Material+ Applied AI
> **Last updated:** March 2026

---

## 1. The Problem We're Solving

Traditional brand tracking is broken in three ways:

**Stale.** Quarterly surveys arrive weeks after fielding. By the time insights reach decision-makers, the market has moved. Brands make multi-million-dollar bets on data that's already outdated.

**Single-signal.** Most trackers rely on one data source — typically surveys asking people what they think. But what people say and what people do are different things. A brand can score well on stated trust while behavioral signals (churn, reduced engagement, negative reviews) tell a contradictory story.

**Opaque.** Clients receive a composite score with no visibility into how it was calculated. Which sources contributed? What was the confidence level? How were signals weighted? The black box breeds skepticism and limits action.

---

## 2. The BIE Thesis

Brand Intelligence Engine replaces quarterly tracking with continuous, multi-signal intelligence built on three principles:

### Multi-Signal Triangulation

Don't just ask what people think. Triangulate across three parallel signal streams:

- **Human-Expressive** — What people SAY: reviews, social media, survey verbatims, forum discussions, customer support transcripts
- **Behavioral** — What people DO: booking funnels, app sessions, repeat purchase rates, clickstream data, churn patterns
- **Cultural** — What the WORLD does around them: industry trends, regulatory changes, macro-economic shifts, seasonal patterns, competitive moves

No single signal tells the truth. The truth lives in the convergence — or divergence — of all three.

### Continuous Learning

Not quarterly waves. Not annual studies. A system that ingests signals daily, detects anomalies in real-time, and surfaces what matters now. The intelligence is always current because the system never stops listening.

### Glass Box Transparency

Every claim traces to a named source, a documented methodology, and a confidence score. No exceptions. Clients can interrogate any number and understand exactly how it was derived. This is transparency by architecture, not by audit.

---

## 3. Brand Score Framework

Six drivers of brand loyalty, organized in two dimensions:

### In the Moment (Experience-Driven)

These drivers reflect the immediate quality of brand interactions:

- **User Friendly** — Ease, intuitiveness, friction reduction. Does the experience respect people's time and intelligence?
- **Personal** — Relevance, customization, feeling known. Does the brand recognize me as an individual, not a segment?
- **Accessible** — Availability, inclusivity, reach. Can everyone who wants to engage with the brand actually do so?

### Over Time (Relationship-Driven)

These drivers reflect the long-term depth of brand relationships:

- **Dependable** — Consistency, reliability, trust. Can I count on this brand to deliver what it promises, every time?
- **Meaningful** — Purpose, emotional connection, values alignment. Does this brand stand for something beyond its product?
- **Salient** — Top-of-mind awareness, distinctiveness, recall. When I think of this category, does this brand come to mind first?

Each driver scores 0-100 with directional deltas showing movement. The composite Brand Score is a weighted aggregate across all six.

---

## 4. Strategic Context

### Board Presentation — March 19, 2026

BIE v9 serves as the interactive prototype for the Material+ board presentation. The talk track follows four acts:

1. **Architecture** — "One core, many expressions." The headless intelligence platform that powers dashboards, briefs, alerts, and APIs from a single engine.
2. **Hero Demo** — War Gaming mode in Scenario Lab. Live competitive simulation showing how brands can stress-test strategies before committing resources.
3. **Day in the Life** — How a brand manager uses BIE from morning signal scan through anomaly detection to evening scenario planning.
4. **Ecosystem Flywheel** — How BIE connects to and amplifies existing Material+ services across the client lifecycle.

### Investment Thesis

BIE represents a platform play, not a product feature. The core intelligence engine can power:

- Web dashboards (this prototype)
- Executive morning briefs (automated PDF/email)
- Real-time alerts (Slack/Teams integration)
- Client portals (white-labeled per account)
- API layer for partner integrations
- Automated reporting pipelines

### Digital Twin Concept

The Scenario Lab's simulation engine is the seed of a brand "digital twin" — a synthetic representation of a brand's competitive market that can be stress-tested with hypothetical scenarios before committing real resources. War Gaming, Strategic Scenarios, and Brand Score LIVE are the first expressions of this concept.

The 650-agent simulation engine uses Bass diffusion for adoption dynamics and Softmax utility for brand choice probability, creating a credible model of market behavior under different conditions.

---

## 5. Architecture Evolution

### Current: v9 — Interactive Prototype

Static HTML/CSS/JS. Synthetic data. Hardcoded to Stayworthy (Travel & Hospitality). Proves the UX vision, information architecture, and analytical framework.

**What it demonstrates:**
- Multi-signal intelligence architecture across 8 interconnected surfaces
- Glass Box transparency system (every claim traceable)
- Agent-based simulation for scenario planning
- AI-assisted analysis via Material Analyst (Claude Haiku)
- Continuous signal monitoring (intelligence ticker, signal terminal)

### Next: v10 — Live Data + Multi-Brand

- Connect to real signal sources (social listening APIs, web analytics, CRM systems)
- Brand configuration via JSON swap — see [DATA-EXTENSIBILITY.md](DATA-EXTENSIBILITY.md)
- Server-side signal processing pipeline
- Persistent analyst conversation history
- Multi-brand comparative views within a category

### Future: v11+ — Headless Platform

- BIE as a headless API/kernel powering multiple surface types
- Proactive intelligence — system surfaces insights unprompted
- Cross-brand, cross-industry comparative analytics
- Self-improving signal taxonomy via ML-driven source discovery
- Client self-service configuration portal

---

## 6. Competitive Differentiation

### What BIE is NOT

- **Not a social listening tool.** We ingest social data as one signal among many — not the whole picture.
- **Not a survey platform.** Survey data is treated as Human-Expressive signal, triangulated against behavioral and cultural data.
- **Not a dashboard builder.** The intelligence layer IS the product. Visualization is an expression, not the core.

### What Makes BIE Different

- **Three-signal architecture.** Most brand intelligence tools are single-signal. BIE triangulates across Human-Expressive, Behavioral, and Cultural streams.
- **Glass Box transparency.** No other brand intelligence platform lets you trace every number to its source, methodology, and confidence score.
- **Simulation capability.** Agent-based modeling for "what if" analysis before committing resources. No other tracker offers this.
- **Continuous vs. periodic.** Designed for daily intelligence cadence, not quarterly report drops.
- **AI-native.** The Material Analyst isn't a bolt-on chatbot — it's an integrated intelligence layer with full context of all brand data, signals, and drivers.

---

## 7. Target Industries

BIE is designed for multi-industry deployment. The data extensibility architecture (see [DATA-EXTENSIBILITY.md](DATA-EXTENSIBILITY.md)) supports industry-specific terminology, signal sources, regulatory context, and seasonality patterns.

Target verticals:

- Travel & Hospitality (current demo: Stayworthy)
- Media & Entertainment
- Consumer Tech
- Enterprise Tech
- Lifestyle & Beauty
- CPG (Consumer Packaged Goods)
- Retail
- Home & Construction
- Finance & Business Services
- Health & Pharma
- Government & Foundations

Each industry swap is a configuration change, not a code rewrite.

---

## 8. Team

**Material+ Applied AI** — R&D / Innovation

Built as a demonstration of what continuous brand intelligence looks like when you combine multi-signal data, transparent methodology, agent-based simulation, and modern interface design.

---

*See also: [ARCHITECTURE.md](ARCHITECTURE.md) for system design, [DATA-EXTENSIBILITY.md](DATA-EXTENSIBILITY.md) for multi-brand architecture, [TODO.md](../TODO.md) for the hardening backlog.*
