# SCENARIO LAB ANALYSIS - Comprehensive Findings

**Date**: March 2026
**File**: /tmp/bie-v9-push/scenario-lab.html (4,586 lines)
**Comparison**: /tmp/bie-v9-push/signal-terminal.html (1,397 lines)

---

## EXECUTIVE SUMMARY

The Scenario Lab is a multi-mode simulation interface with **5 distinct modes** accessed via dropdown. The page is **very tall** (extensive scrolling required), has **poor scenario selectability** (dropdown hidden on most modes), and the **Market Share Over Time chart lacks a legend to the right** (legend is embedded inside the canvas, occupying valuable real estate). The simulation controls and visualization are functional but suboptimal for the intended use case.

---

## 1. OVERALL LAYOUT & SCROLLING BEHAVIOR

### Document Structure
- **Total lines**: 4,586
- **Header section**: Lines 1–2,086 (mode dropdown, wizard stepper, scenario selector)
- **Content area**: Lines 2,125–2,693 (5 scenario modes)
- **Script section**: Lines 2,830–4,586 (initialization, simulation engine)

### Scrolling Analysis

**Header** (lines 2005–2087)
```css
.scenario-header {
  padding: 60px 80px;  /* Heavy padding at top */
  border-bottom: 1px solid var(--border-subtle);
  position: relative;
  z-index: 10;
  background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%);
}
```
- Tall header with animated mesh overlay (300px height, lines 48–54)
- Mode dropdown and confidence indicator on right side
- Synthetic brand notice with prominent spacing

**Content Area** (line 2125+)
```css
.scenario-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 80px 80px;  /* 80px side padding + 80px bottom padding */
}
```
- Each mode contains **substantial vertical content** before charts appear
- Modal-specific descriptions (40px margin-bottom)
- Scenario cards in grid layout (24px gaps between)
- Large chart containers with 40px padding each

**Scrolling Issues**:
1. **Scenario selector at top** (lines 2112–2123) forces users to scroll past it even after selection
2. **Wizard stepper** (lines 2089–2109) always visible, takes ~100px height
3. **Multiple descriptive sections** before reaching actionable simulations
4. **80px horizontal padding** reduces effective viewport width on smaller screens
5. **Canvas containers** are not maximized vertically relative to available space

**Quantified scrolling**:
- Header + stepper + selector: ~400px before any mode content
- Mode content before first chart: ~200–500px depending on mode
- Chart containers: 40px padding top + bottom = 80px overhead
- Bottom padding: 80px
- **Total vertical wastage**: ~560–660px before interactive simulations

---

## 2. ALL MODES/TABS - DETAILED INVENTORY

### Mode 1: INSIGHT / NEARSIGHT (Conversion Funnel)
**Lines**: 2129–2237
**HTML location**: `<div class="scenario-mode active mode-insight" data-mode="insight">` (line 2129)

**What it shows by default**:
- Headline: "Where Are We Losing Them?" (line 2131)
- Description paragraph (line 2132)
- **Conversion funnel** with 4 stages (lines 2135–2202)
  - Each stage has animated bar, label, value, and detail card
  - Animation delays: 0ms, 100ms, 200ms, 300ms (lines 626–629)
  - Funnel bars progressively narrow: 100% → 60% → 17% → 4% (lines 638–656)
- **Key Metrics Panel** (lines 2205–2229)
  - 4-column grid layout showing: Conversion Rate, Biggest Drop, Primary Friction, Intervention Window
- **Key Opportunity box** (lines 2231–2234)
  - Styled with elevated background, 40px padding
- **Attribution note** (line 2236)

**How it works**:
- No simulation—purely analytical display
- Funnel bars animate on mode load via CSS keyframe `slideIn` (615ms)
- Metrics use count-up animation (data attributes: `data-value`, `data-suffix`, `data-decimals`)
- No user interaction beyond reading

---

### Mode 2: WAR GAMING / FORESIGHT (Scenario Planning)
**Lines**: 2242–2440
**HTML location**: `<div class="scenario-mode mode-wargame" data-mode="wargame">` (line 2242)

**What it shows by default**:
- Headline: "What Futures Should We Prepare For?" (line 2244)
- Description: "Explore three divergent futures..." (line 2245)
- **Scenario Cards** in 3-column grid (lines 2248–2305)
  - Card 1: "2027: Regulatory Wave" — 72% likely (lines 2249–2266)
    - Badge: "Share Shift" (line 2250)
    - Color overlay: Green tint (line 813)
    - Grid: BF Impact + Status (2262–2263)
  - Card 2: "2029: AI Concierge Era" — 65% likely (lines 2268–2285)
    - Badge: "Category Expansion"
    - Color overlay: Yellow tint (line 819)
  - Card 3: "2031: Decentralized Travel" — 48% likely (lines 2287–2304)
    - Badge: "Mixed"
    - Color overlay: Red tint (line 825)
  - Each card is clickable to trigger simulation

- **Strategic Output Panel** (lines 2308–2340)
  - Appears when scenario selected
  - Contains: Diagnostic, Attack Vector, Defend Vector, Bridge Strategy, Recommended Actions, Strategic Question
  - Hidden by default (`display: none`, line 915)

- **ABM Simulation Section** (lines 2343–2439)
  - Active by default (line 2343)
  - Contains all controls and canvas

**How it works**:
- Click scenario card → `selectScenario()` called (line 2931 in script)
- Card gets `.selected` class (line 940)
- Wizard advances to step 2 (line 2944)
- `showStrategicOutput()` populates output panel (lines 2950–3001)
- `runSimulationForScenario()` auto-selects preset (line 3028)

---

### Mode 3: VIRTUAL FOCUS GROUP (Synthetic Respondents)
**Lines**: 2445–2569
**HTML location**: `<div class="scenario-mode mode-focus-group" data-mode="focus-group">` (line 2445)

**What it shows by default**:
- Headline: "What Do Real Travelers Think?" (line 2447)
- Description paragraph (line 2448)
- Attribution note (lines 2451–2453)
- **Configure Step** (lines 2456–2498)
  - Audience segment dropdown (lines 2460–2466)
  - Sample size selector (lines 2471–2475)
  - Survey questions checkboxes (lines 2481–2494)
  - "Continue to Run" button (line 2496)

- **Run Step** (lines 2501–2512)
  - Progress counter: "0 / 500" (lines 2505–2506)
  - Progress bar with animation (line 2508)
  - Status text (line 2510)

- **Results Step** (lines 2515–2568)
  - Shows "500 Synthetic Respondents Generated" (line 2517)
  - Response Distribution (4 horizontal bar charts, lines 2521–2561)
  - Key Finding box (lines 2563–2566)

**How it works**:
- Multi-step modal: Configure → Run → Results
- Each step is a `.step-panel` with `data-step` attribute
- Visibility controlled by wizard stepper progression
- Synthetic respondents loaded from `data/synthetic-cohorts.json` (line 3484)

---

### Mode 4: SIGNAL NEXUS / FIDELITY LIVE (Real-Time Multi-Signal Intelligence)
**Lines**: 2574–2692
**HTML location**: `<div class="scenario-mode mode-signal-nexus" data-mode="signal-nexus">` (line 2574)

**What it shows by default**:
- Label: "Fidelity LIVE · Multi-Signal Intelligence" (line 2575)
- Headline: "How Signals Converge Into Intelligence" (line 2576)
- Description: "Three parallel signal streams..." (line 2577)
- **Live indicator** (lines 2580–2586)
  - Pulsing green dot + "LIVE" badge
  - Signal count: "847 signals flowing"

- **3-Panel Nexus Layout** (line 2589–2665)
  - **LEFT: Signal Layers Panel** (lines 2591–2618)
    - 3 signal cards: Human-Expressive (312), Behavioral (298), Cultural (237)
    - Composite card: Brand Fidelity = 72
    - Click handlers for signal selection (line 2592, 2599, 2606)

  - **CENTER: Charts** (lines 2621–2633)
    - 30-Day Signal Trajectory (SVG, line 2624)
    - Brand Fidelity Driver Strength radar (SVG, line 2630)

  - **RIGHT: Detail Panel** (lines 2636–2664)
    - Active Signal Mechanism card (lines 2637–2642)
    - Active Drivers list (lines 2644–2656)
    - Cross-Signal Insight box (lines 2658–2663)

- **Signal Ticker** (lines 2668–2691)
  - Live feed of streaming signal items
  - Infinite scroll animation (2890ms at 60s duration, line 1890)
  - 10 items duplicated for seamless loop

**How it works**:
- Mode loads with Nexus layout visible
- `SignalNexus.selectSignal()` called on card click (lines 2592, 2599, 2606)
- Radar and trajectory SVGs rendered dynamically
- Ticker scrolls continuously via CSS animation

---

### Mode 5: BRAND SIM / Strategic Scenario Lab (Agent-Based Market Simulation)
**Lines**: 2696–2794
**HTML location**: `<div class="scenario-mode mode-brand-sim" data-mode="brand-sim">` (line 2696)

**What it shows by default**:
- Label: "AGENT-BASED MARKET SIMULATION" (line 2698)
- Headline: "Brand Competitive Dynamics" (line 2699)
- Description: "650 synthetic agents make brand choices..." (line 2700)

- **Controls Section** (lines 2705–2716)
  - Scenario selector dropdown (lines 2706–2711) — options: Status Quo, Premium Positioning, Price War, Market Expansion
  - Buttons: ▶ Run 20 Quarters, Step, Reset
  - Step counter: "Q0" (line 2715)

- **Strategic Scenario Simulations** (collapsible, lines 2719–2751)
  - `<details>` element (line 2719)
  - Contains scenario chart (line 2729) — **Canvas ID**: `scenario-chart`
  - 4 scenario outcome cards with fidelity ranges (lines 2733–2748)

- **Charts Grid** (lines 2754–2765)
  - **MARKET SHARE OVER TIME** (lines 2756–2759) — **Canvas ID**: `sim-share-chart`
    - Dimensions: 960×450 (line 2758)
    - **ISSUE**: Legend inside canvas at (width - padding - 180, padding + 8) — lines 3450–3462
  - **TIER DISTRIBUTION** (lines 2761–2764) — **Canvas ID**: `sim-tier-chart`
    - Dimensions: 960×350 (line 2763)

- **Brand Rankings** (lines 2768–2771)
  - Table rendered into `#sim-rankings` div

- **Scenario Description** (lines 2774–2776)
  - Currently: "No strategic changes. Market dynamics play out naturally."

- **Agent Stats** (lines 2779–2792)
  - Total Agents: 650
  - Active Buyers: (dynamic)
  - Latent (Non-Buyers): (dynamic)

**How it works**:
- Simulation engine initialized at line 4004: `new ABMSimulation('simulation-canvas')`
- Canvas context obtained and drawn every tick (line 3172)
- Brands array: 10 brands (Airbnb, Vrbo, Stayworthy, Booking.com, Marriott, Hilton, Plum Guide, Hopper, Vacasa, Inspirato)
- Simulation runs with Bass Diffusion + softmax utility model (lines 3292–3325)

---

## 3. INSIGHT/NEARSIGHT MODE - DEFAULT BEHAVIOR

**Headline**: "Where Are We Losing Them?"
**Shows**: Conversion funnel (4 stages), key metrics (4 boxes), key opportunity

**By design**: This is the **default active mode** when page loads
```css
.scenario-mode {
  display: none;
}
.scenario-mode.active {
  display: block;
}
```
Line 2129: `<div class="scenario-mode active mode-insight">`

**Funnel structure**:
- TAM: 150M (100%)
- Aware: 90M (60%)
- Considered: 25M (17%)
- Booked: 6M (4%)

**Animation**: Bars animate with `slideIn` keyframe (600ms staggered, 100ms delays)

---

## 4. FORESIGHT MODE (War Gaming) - SCENARIO SELECTION

**Current mechanism**:
1. Click scenario card (e.g., "Regulatory Wave")
2. Card becomes `.selected`
3. `selectScenario()` is called with the card element
4. Scenario ID extracted from `card.dataset.scenario` (line 2942)
5. Output panel becomes visible (line 3000)
6. Simulation auto-starts with preset (line 3038)

**Problem**: Scenario selection is **modal-specific**. The dropdown at the top (line 2073) is:
```javascript
// Hide redundant scenario selector - dropdown is the primary mode switcher
#scenario-selector {
  display: none !important;  // Line 104–106
}
```

**User experience issue**:
- Must switch to War Gaming mode first
- Then click a scenario card
- No way to **select scenario from top-level dropdown** and jump directly to Foresight mode
- This contradicts the stated design goal: "Definitive scenario choices (like foresight)"

---

## 5. FORESIGHT MODE - SIMULATION OUTPUT

**ABM Simulation** (Agent-Based Market):
- **Engine**: Class `ABMSimulation` (line 3121)
- **Canvas ID**: `simulation-canvas` (line 2398)
- **Agents**: 650 total
  - Mass Market: 380 active, 80 latent
  - Prestige: 85 active, 45 latent
  - Luxury: 35 active, 25 latent
- **Brands**: 10 (lines 3137–3140)
- **Initial shares**: Proportional (Booking.com 18%, Airbnb 17%, Marriott 15%, etc.)

**Simulation parameters**:
```javascript
advertisingEffect: 0.03        // p (Bass model)
womEffect: 0.38                // q (word-of-mouth)
stayworkthyBoost: 0            // Scenario intervention
priceSensitivity: 0.8
innovation: 0.7
distribution: 0.75
socialBoost: 0.5
```

**Convention**: Bass Diffusion model (awareness) + softmax utility (brand choice)
- No custom convention name used in code
- Standard ABM approach: agents evaluate utility and choose brands probabilistically

---

## 6. BRAND SIM MODE - MARKET SHARE CHART ANALYSIS

### Canvas Details
**HTML** (line 2758):
```html
<canvas id="sim-share-chart" width="960" height="450" style="width: 100%; height: auto;"></canvas>
```

**Legend placement** (JavaScript, lines 3449–3462):
```javascript
// Legend — top-right corner
const legendX = width - padding - 180;  // x = 960 - 40 - 180 = 740
const legendY = padding + 8;             // y = 40 + 8 = 48
const lineH = 16;
// Draws first 6 brands with colored squares + text labels
```

### Problems
1. **Legend inside canvas**: Takes up ~220×100px in top-right corner
   - Occupies 6.7% of visible chart area
   - Overlaps with potential data visualization space

2. **Only shows 6 brands**: Brands slice(0, 6) (line 3455)
   - Airbnb, Vrbo, Stayworthy (hardcoded), Booking.com, Marriott, Hilton
   - Other 4 brands: Plum Guide, Hopper, Vacasa, Inspirato (not in legend)

3. **Text labels hardcoded on lines**: Brand names drawn at end of each line (lines 3413–3426)
   - Creates visual clutter when lines converge
   - Alignment flips (right vs left) based on canvas width (lines 3419–3425)

4. **Fixed canvas size**: 960×450 pixel dimensions
   - Does not respond to container width dynamically
   - Constraint: `width: 100%; height: auto;` in CSS only resizes proportionally

### What needs to change:
- Move legend to **right side panel** (outside canvas)
- Increase canvas height or chart area
- Display all 10 brands in legend, organized in columns
- Keep Stayworthy prominent (thicker line, #745AFF color)
- Reduce left/right padding to maximize chart area

---

## 7. CHART LEGEND/KEY PLACEMENT & READABILITY

### Current legend locations:

**1. Simulation Canvas Legend** (ABM mode, Insight/Nearsight)
- Inside canvas, top-left corner
- Font: 10px "JetBrains Mono"
- Legend code: lines 3449–3462

**2. Nexus Radar Legend** (Signal Nexus mode)
- In SVG, rendered dynamically
- 3 signals with colored dots
- Code: lines 3941–3946

**3. Scenario Chart Legend** (Brand Sim, collapsible section)
- Inside canvas (Chart.js instance)
- Position: top (line 2536 in options)
- Built into Chart.js library

### Readability issues:

1. **Tiny fonts**: 10px mono is hard to read on HiDPI displays
2. **Color contrast**: Some lines (alpha 0.6) are subtle, hard to distinguish
3. **No interactivity**: Cannot click legend to toggle series visibility
4. **Overlap potential**: When multiple lines converge near end, legend blocks data
5. **No hierarchical grouping**: All brands listed flat; no tier or category grouping

### Signal Terminal comparison:
In `/tmp/bie-v9-push/signal-terminal.html` (lines 264–271):
```css
.st-feed-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;  /* 3-column layout */
  gap: 28px;
  margin-bottom: 56px;
}
.st-signal-column {
  max-height: 800px;
  overflow-y: auto;
}
```
- Uses **external labels** (column headers with dots and text)
- No labels inside the content area itself
- Clean separation of metadata from visualization

---

## 8. SIMULATION ENGINE - CONTROLS & BEHAVIOR

### Control UI (lines 2369–2394 in ABM, lines 2705–2716 in Brand Sim)

**ABM Controls** (Insight/Nearsight Foresight simulation):
```html
<div class="simulation-controls">
  <div class="control-group">
    <button class="control-btn" id="play-btn">▶ Play</button>
    <button class="control-btn" id="pause-btn">⏸ Pause</button>
    <button class="control-btn" id="reset-btn">↻ Reset</button>
  </div>

  <div class="control-stat">
    Iteration <span id="iteration-count">0</span> / 100
  </div>

  <div class="speed-selector">
    <button class="speed-btn active" data-speed="1">1x</button>
    <button class="speed-btn" data-speed="2">2x</button>
    <button class="speed-btn" data-speed="5">5x</button>
  </div>

  <select class="scenario-preset" id="preset-selector">
    <option value="baseline">Baseline (no intervention)</option>
    <option value="pricing">Transparent Pricing (+6 UF)</option>
    <option value="trust">Trust Recovery (+4 Dep)</option>
    <option value="genz">Gen Z Experience (+5 Mean)</option>
    <option value="ai">AI Concierge (+7 Pers)</option>
    <option value="pricewar">Price War (all −3)</option>
  </select>
</div>
```

**Play/Pause/Reset** (lines 3009–3011):
```javascript
document.getElementById('play-btn').addEventListener('click', () => this.simulation.play());
document.getElementById('pause-btn').addEventListener('click', () => this.simulation.pause());
document.getElementById('reset-btn').addEventListener('click', () => this.simulation.reset());
```

**Iteration counter**: Updates on each `tick()` call (line 3341)
```javascript
document.getElementById('iteration-count').textContent = this.iteration;
```

**Speed control** (lines 3013–3020):
```javascript
document.querySelectorAll('.speed-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.simulation.setSpeed(parseInt(btn.dataset.speed));
  });
});
```

**Tick interval**: 200ms base (line 3129)
- Speed 1x: 200ms per iteration
- Speed 2x: 100ms per iteration (2 steps per 200ms tick)
- Speed 5x: 200ms / 5 ≈ 40ms per iteration (5 steps per 200ms tick)

**Preset selector** (lines 3023–3025):
```javascript
document.getElementById('preset-selector').addEventListener('change', (e) => {
  this.simulation.loadPreset(e.target.value);
});
```

---

## 9. SCENARIO SELECTION MECHANISM - CURRENT & PROPOSED

### Current flow:
1. **Page loads** → Insight mode active (default)
2. **User selects mode** from dropdown (lines 2073–2085)
3. **Mode loads** with mode-specific UI
4. **If Foresight (War Gaming)**: Click scenario card to trigger simulation
5. **If Brand Sim**: Interact with simulation controls directly

### The problem:
- **No top-level scenario selector** that works across modes
- Dropdown selector at line 2114 is **hidden** (line 104–106)
- Each mode has its own scenario mechanism:
  - Insight: No scenario choice (fixed funnel)
  - Foresight: Click card in the mode
  - Focus Group: Configure in the mode
  - Signal Nexus: No scenario choice (live data)
  - Brand Sim: Dropdown inside the mode (line 2706)

### "Definitive scenario choices (like foresight)" requirement:
- Foresight has 3 hard-coded scenarios: Regulatory, AI Concierge, Decentralized
- These are **definitive, predetermined futures**
- Each has fixed BF impacts, probabilities, and strategic responses
- Other modes lack equivalent pre-defined scenarios

### Proposed change:
1. **Unhide the scenario selector** (line 2114) — or create a similar one
2. **Add options for each mode's scenarios**:
   - Insight: Single option (no choice)
   - Foresight: Regulatory Wave, AI Concierge, Decentralized Travel
   - Focus Group: Segment-based (Gen Z Travelers, Millennial Families, etc.)
   - Signal Nexus: Live (no scenario)
   - Brand Sim: Status Quo, Premium Positioning, Price War, Market Expansion
3. **Allow scenario pre-selection**, then mode selection
4. **Jump directly to selected mode + scenario**

---

## 10. LAYOUT COMPARISON: scenario-lab.html vs signal-terminal.html

### Scenario Lab layout:
```
Header (60px top padding, animated mesh)
├─ Left: Headline + Confidence bar
├─ Right: Mode dropdown
│
Wizard stepper (24px padding, ~100px height)
Scenario selector (max-width: 500px, hidden on most modes)
│
Content area (80px horizontal padding, overflow-y: auto)
├─ Mode 1: Funnel (200px) + Metrics (100px) + Opportunity (50px)
├─ Mode 2: Cards (400px) + Output panel (300px) + Simulation (800px)
├─ Mode 3: Configure/Run/Results steps (variable height)
├─ Mode 4: Nexus layout with 3 panels (600px min height)
├─ Mode 5: Brand Sim with 2 large canvases (900px+ min height)
│
Footer (80px padding, intelligence feed)
```

### Signal Terminal layout:
```
Header (48px top padding, NO animated background)
├─ Title + signal count
├─ Search bar
├─ Filter pills
│
3-column feed grid (266 style, line 266)
├─ max-height: 800px per column
├─ Gap: 28px between columns
└─ No bottom padding → scrolls to footer

Footer (minimal)
```

### Key differences:

| Aspect | Scenario Lab | Signal Terminal |
|--------|---|---|
| Header padding | 60px | 48px |
| Side padding | 80px | 64px |
| Bottom padding | 80px | 120px |
| Grid layout | 1-column mode rotation | 3-column fixed layout |
| Scrollable content | Mode-based (flex: 1) | Column-based (max-height) |
| Header animation | Mesh overlay (300px) | Static |
| Mode visibility | CSS `display: none` toggle | Not applicable (single view) |

---

## 11. SCROLLING REDUCTION OPPORTUNITIES

### 1. Reduce header padding
- Current: `padding: 60px 80px` (line 40)
- Proposal: `padding: 32px 64px` → saves ~28px top, ~16px sides

### 2. Reduce scenario selector max-width constraint
- Current: `max-width: 500px` (line 346)
- Proposal: Remove or set to `none` → eliminate unnecessary width limit

### 3. Collapse wizard stepper when mode is loaded
- Current: Always visible (lines 2089–2109)
- Proposal: Hide after user selects mode, show "Back to modes" button

### 4. Increase content area flex space
- Current: `padding: 0 80px 80px` (line 539)
- Proposal: `padding: 0 64px 40px` → saves ~44px total

### 5. Reduce gap in chart grid
- Current: `gap: var(--space-xl)` which is `var(--space-xl, 1.5rem)` ≈ 24–32px (line 2754)
- Proposal: `gap: var(--space-lg)` → saves ~8–16px between charts

### 6. Use collapsible sections for descriptive content
- Current: Mode descriptions always visible (paragraphs at start of each mode)
- Proposal: `<details>` element for "How this mode works" → saves 40–60px per mode

### 7. Inline tier meters instead of stacking
- Current: 3-column grid (lines 1155–1160), takes ~240px height
- Proposal: 1-row flex layout → ~80px height savings

**Total estimated vertical savings: 200–300px** (35–50% reduction in pre-chart scrolling)

---

## SECTION LOCATIONS - QUICK REFERENCE

| Section | HTML Lines | Purpose |
|---------|---|---|
| Scenario header | 2005–2087 | Title, mode dropdown, confidence |
| Wizard stepper | 2088–2109 | Progress indicator |
| Scenario selector | 2111–2123 | Dropdown (hidden) |
| Content container | 2125–2693 | All 5 modes |
| Mode 1: Insight | 2129–2237 | Conversion funnel |
| Mode 2: Foresight | 2242–2440 | Scenario cards + ABM sim |
| Mode 3: Focus Group | 2445–2569 | Configure/run/results |
| Mode 4: Signal Nexus | 2574–2692 | Real-time signal dashboard |
| Mode 5: Brand Sim | 2696–2794 | Market share visualization |
| Script section | 2830–4586 | All JavaScript |
| ABM engine class | 3121–3464 | Simulation logic |
| Brand Sim canvas | 2756–2759 | Market share chart |
| Legend code | 3449–3462 | Chart legend rendering |

---

## STYLE DEFINITIONS - KEY CLASSES

| CSS Class | Purpose | Lines |
|-----------|---------|-------|
| `.scenario-lab` | Container | 27–33 |
| `.scenario-header` | Top header bar | 36–45 |
| `.scenario-content` | Scrollable content area | 536–540 |
| `.scenario-mode` | Mode container (one active) | 559–566 |
| `.scenarios-grid` | 3-column card grid (Foresight) | 780–785 |
| `.canvas-container` | Chart wrapper | 1137–1143 |
| `.simulation-controls` | Play/pause/speed UI | 1045–1054 |
| `.tier-meters` | 3-column meters grid | 1155–1160 |
| `.funnel-stage` | Single funnel step | 608–613 |
| `.nexus-layout` | 3-panel signal nexus | 1623–1629 |

---

## CONCLUSION

The Scenario Lab is a complex, multi-mode interface designed for strategic simulation and scenario planning. The current implementation prioritizes completeness over user efficiency:

1. **Scrolling is excessive** due to heavy padding, non-hidden header UI, and descriptive content
2. **Scenario selection is mode-specific** rather than top-level (contradicts design goal)
3. **Market Share chart legend is embedded** in canvas, wasting space
4. **Canvas sizing is fixed** (960×450), not responsive to container

**Key improvements needed**:
- Reduce header/content padding by 30–50%
- Move chart legend outside canvas (right panel)
- Implement top-level scenario selector with pre-defined choices
- Collapse wizard stepper after mode selection
- Increase chart container height/width by 20–30%

All specific file locations, line numbers, and CSS class names are documented above for implementation guidance.
