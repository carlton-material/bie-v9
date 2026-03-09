# SCENARIO LAB - IMPLEMENTATION GUIDE

## Target Changes Summary

This document provides specific technical guidance for implementing the three main improvements:
1. **Make Market Share chart bigger with right-side legend**
2. **Add definitive scenario choices like Foresight**
3. **Reduce scrolling**

---

## CHANGE 1: MARKET SHARE CHART - BIGGER + RIGHT-SIDE LEGEND

### Current State
- Canvas: 960×450px (line 2758)
- Legend: Inside canvas, top-right corner (lines 3450–3462)
- Container padding: 24px (line 1747, nexus-chart-container)
- Brand Sim container padding: var(--space-lg) ≈ 24–32px (line 2728)

### Proposed State
- Canvas: 960×550px (or responsive: `max-width: 100%`)
- Legend: Right-side panel, separate from canvas
- Container: Flex layout (chart on left, legend on right)
- Legend items: Organized in 2 columns, scrollable if needed

### HTML Changes Needed
**Location**: Lines 2756–2759 (Brand Sim chart section)

**Replace this**:
```html
<div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: var(--space-lg);">
  <div style="font-family: var(--font-mono, 'JetBrains Mono', monospace); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: var(--space-md);">MARKET SHARE OVER TIME</div>
  <canvas id="sim-share-chart" width="960" height="450" style="width: 100%; height: auto;"></canvas>
</div>
```

**With this**:
```html
<div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: var(--space-lg); display: grid; grid-template-columns: 1fr 280px; gap: var(--space-lg); align-items: start;">
  <div>
    <div style="font-family: var(--font-mono, 'JetBrains Mono', monospace); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: var(--space-md);">MARKET SHARE OVER TIME</div>
    <canvas id="sim-share-chart" width="960" height="550" style="width: 100%; height: auto;"></canvas>
  </div>
  <div id="sim-share-legend" style="display: flex; flex-direction: column; gap: var(--space-sm); max-height: 550px; overflow-y: auto;">
    <!-- Legend items will be injected here by JavaScript -->
  </div>
</div>
```

### CSS Changes Needed

Add to style block (around line 2000):
```css
#sim-share-legend {
  font-family: var(--font-body);
  font-size: 12px;
}

.sim-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s ease;
  cursor: pointer;
}

.sim-legend-item:hover {
  background: rgba(255,255,255,0.05);
}

.sim-legend-color {
  width: 16px;
  height: 3px;
  border-radius: 2px;
  flex-shrink: 0;
}

.sim-legend-label {
  color: rgba(255,255,255,0.7);
  font-weight: 500;
}

.sim-legend-item.stayworthy .sim-legend-color {
  width: 18px;
  height: 4px;
}

.sim-legend-item.stayworthy .sim-legend-label {
  color: rgba(255,255,255,0.95);
  font-weight: 600;
}
```

### JavaScript Changes Needed

**Location**: Lines 3449–3462 (in `drawCanvas()` method of ABMSimulation class)

**Replace the canvas legend code**:
```javascript
// REMOVE THIS SECTION (lines 3449–3462):
// Legend — top-right corner
const legendX = width - padding - 180;
const legendY = padding + 8;
const lineH = 16;
this.ctx.font = '10px "JetBrains Mono", monospace';
this.ctx.textAlign = 'left';
this.brands.slice(0, 6).forEach((brand, idx) => {
  const color = brand === 'Stayworthy' ? '#745AFF' : colors[idx];
  const y = legendY + idx * lineH;
  this.ctx.fillStyle = color;
  this.ctx.fillRect(legendX, y - 4, 12, 3);
  this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
  this.ctx.fillText(brand, legendX + 18, y);
});
```

**Add this new method to ABMSimulation class** (after `drawCanvas` method):
```javascript
updateLegend() {
  const legendContainer = document.getElementById('sim-share-legend');
  if (!legendContainer) return;

  const colors = [
    '#818cf8', '#34d399', '#f59e0b', '#745AFF',
    '#ec4899', '#8b5cf6', '#06b6d4', '#14b8a6', '#f97316', '#6366f1'
  ];

  legendContainer.innerHTML = '';

  this.brands.forEach((brand, idx) => {
    const color = brand === 'Stayworthy' ? '#745AFF' : colors[idx];
    const itemDiv = document.createElement('div');
    itemDiv.className = `sim-legend-item ${brand === 'Stayworthy' ? 'stayworthy' : ''}`;
    itemDiv.innerHTML = `
      <div class="sim-legend-color" style="background-color: ${color};"></div>
      <span class="sim-legend-label">${brand}</span>
    `;
    legendContainer.appendChild(itemDiv);
  });
}
```

**Call this method** at end of `drawCanvas()`:
```javascript
// At line 3463, after axes/labels section:
this.updateLegend();
```

---

## CHANGE 2: DEFINITIVE SCENARIO CHOICES (TOP-LEVEL)

### Current Problem
- Scenario selector dropdown at line 2114 is hidden (line 104–106)
- Scenarios are embedded within modes, not selectable top-level
- Each mode has different scenario mechanism

### Proposed Solution
Create a unified **Scenario Selector** that appears before mode dropdown and allows users to:
1. Select scenario type (Funnel Analysis, Regulatory Wave, AI Concierge, etc.)
2. Auto-select corresponding mode
3. Jump directly to scenario

### HTML Changes

**Location**: Replace lines 2111–2123

**Old code**:
```html
<!-- Scenario Selector Panel -->
<div class="scenario-chooser" id="scenario-selector">
  <label class="chooser-label">Select your analysis type</label>
  <select class="scenario-dropdown" id="scenario-dropdown">
    <option value="" disabled selected>Choose a scenario...</option>
    <option value="insight">Insight / Nearsight — Conversion funnel analysis</option>
    <option value="wargame">War Gaming / Foresight — Scenario planning</option>
    <option value="focus-group">Virtual Focus Group — Synthetic respondents</option>
    <option value="fidelity-live">Fidelity LIVE — Real-time signal convergence</option>
    <option value="brand-sim">Strategic Scenario Lab — Full simulation</option>
  </select>
  <button class="begin-analysis-btn" onclick="BIE.startSelectedScenario()">Begin Analysis →</button>
</div>
```

**New code**:
```html
<!-- Scenario Selector Panel - NOW VISIBLE & COMPREHENSIVE -->
<div class="scenario-chooser" id="scenario-selector" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg); padding: var(--space-xl); background: rgba(255,255,255,0.01); border: 1px solid var(--border-subtle); border-radius: 8px; margin-bottom: var(--space-xl);">

  <!-- LEFT COLUMN: Foresight Scenarios -->
  <div>
    <label class="chooser-label" style="display: block; margin-bottom: var(--space-md);">Strategic Futures (Definitive Scenarios)</label>
    <div style="display: flex; flex-direction: column; gap: var(--space-sm);">
      <button class="scenario-select-card" data-scenario="regulatory" data-mode="wargame" onclick="BIE.launchScenario(this)">
        <div style="font-size: 11px; color: #34d399; font-family: var(--font-mono); font-weight: 600; margin-bottom: 4px;">2027 REGULATORY WAVE</div>
        <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px;">Regulatory Wave</div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.6);">EU regulations force transparency. Compliance-ready platforms win.</div>
        <div style="font-size: 10px; color: #f59e0b; font-family: var(--font-mono); margin-top: 8px;">72% likely</div>
      </button>

      <button class="scenario-select-card" data-scenario="ai-concierge" data-mode="wargame" onclick="BIE.launchScenario(this)">
        <div style="font-size: 11px; color: #818cf8; font-family: var(--font-mono); font-weight: 600; margin-bottom: 4px;">2029 AI CONCIERGE ERA</div>
        <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px;">AI Concierge Era</div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.6);">AI trip planners become default. Google/Apple disintermediate OTAs.</div>
        <div style="font-size: 10px; color: #f59e0b; font-family: var(--font-mono); margin-top: 8px;">65% likely</div>
      </button>

      <button class="scenario-select-card" data-scenario="decentralized" data-mode="wargame" onclick="BIE.launchScenario(this)">
        <div style="font-size: 11px; color: #ec4899; font-family: var(--font-mono); font-weight: 600; margin-bottom: 4px;">2031 DECENTRALIZED TRAVEL</div>
        <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px;">Decentralized Travel</div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.6);">Blockchain-verified stays, peer-to-peer booking platforms.</div>
        <div style="font-size: 10px; color: #f59e0b; font-family: var(--font-mono); margin-top: 8px;">48% likely</div>
      </button>
    </div>
  </div>

  <!-- RIGHT COLUMN: Other Modes -->
  <div>
    <label class="chooser-label" style="display: block; margin-bottom: var(--space-md);">Analysis Modes</label>
    <div style="display: flex; flex-direction: column; gap: var(--space-sm);">
      <button class="scenario-select-card" data-scenario="insight" data-mode="insight" onclick="BIE.launchScenario(this)">
        <div style="font-size: 11px; color: #34d399; font-family: var(--font-mono); font-weight: 600; margin-bottom: 4px;">CURRENT STATE</div>
        <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px;">Insight / Nearsight</div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.6);">Conversion funnel analysis. Where are we losing customers?</div>
      </button>

      <button class="scenario-select-card" data-scenario="focus-group" data-mode="focus-group" onclick="BIE.launchScenario(this)">
        <div style="font-size: 11px; color: #818cf8; font-family: var(--font-mono); font-weight: 600; margin-bottom: 4px;">CUSTOMER VOICE</div>
        <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px;">Virtual Focus Group</div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.6);">Synthetic respondents from real behavioral data. Directional accuracy: 85%.</div>
      </button>

      <button class="scenario-select-card" data-scenario="signal-nexus" data-mode="signal-nexus" onclick="BIE.launchScenario(this)">
        <div style="font-size: 11px; color: #f59e0b; font-family: var(--font-mono); font-weight: 600; margin-bottom: 4px;">LIVE MONITORING</div>
        <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px;">Fidelity LIVE</div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.6);">Real-time signal convergence. 847 signals flowing now.</div>
      </button>

      <button class="scenario-select-card" data-scenario="baseline" data-mode="brand-sim" onclick="BIE.launchScenario(this)">
        <div style="font-size: 11px; color: #34d399; font-family: var(--font-mono); font-weight: 600; margin-bottom: 4px;">COMPETITIVE DYNAMICS</div>
        <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px;">Strategic Scenario Lab</div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.6);">650 agents compete across 20 quarters. Explore market share evolution.</div>
      </button>
    </div>
  </div>
</div>
```

### JavaScript Changes

**Add new method to ScenarioLab object** (lines 3040–3096):

```javascript
// NEW METHOD: Launch scenario from top-level selector
launchScenario(element) {
  const mode = element.dataset.mode;
  const scenario = element.dataset.scenario;

  // Switch mode
  this.switchMode(mode);

  // If Foresight, click the corresponding scenario card
  if (mode === 'wargame') {
    const scenarioCard = document.querySelector(`.scenario-card[data-scenario="${scenario}"]`);
    if (scenarioCard) {
      this.selectScenario(scenarioCard);
    }
  }

  // If Brand Sim, load corresponding preset
  if (mode === 'brand-sim') {
    document.getElementById('preset-selector').value = scenario;
    this.simulation.loadPreset(scenario);
  }

  // Hide the selector
  document.getElementById('scenario-selector').style.display = 'none';

  // Update wizard
  updateWizardStep(1);
}
```

**Update scenario selector display logic** (line 104–106):

**Change from**:
```css
#scenario-selector {
  display: none !important;
}
```

**To**:
```css
#scenario-selector {
  display: grid !important; /* NOW VISIBLE */
}

/* Hide only when mode is selected and content is loaded */
#scenario-selector.hidden {
  display: none !important;
}
```

---

## CHANGE 3: REDUCE SCROLLING

### 1. Header Padding Reduction

**Location**: Line 40

**Change from**:
```css
.scenario-header {
  padding: 60px 80px;
}
```

**To**:
```css
.scenario-header {
  padding: 32px 64px;
}
```

### 2. Content Padding Reduction

**Location**: Line 539

**Change from**:
```css
.scenario-content {
  padding: 0 80px 80px;
}
```

**To**:
```css
.scenario-content {
  padding: 0 64px 40px;
}
```

### 3. Scenario Chooser Max-Width Removal

**Location**: Line 346

**Change from**:
```css
.scenario-chooser {
  max-width: 500px;
}
```

**To**:
```css
.scenario-chooser {
  max-width: none;
}
```

### 4. Hide Wizard After Mode Selection

**Location**: Add to `switchMode()` method (around line 2866)

**Add code**:
```javascript
switchMode(mode) {
  this.currentMode = mode;

  // ... existing code ...

  // NEW: Hide wizard stepper after selection
  const wizard = document.querySelector('.scenario-wizard-steps');
  if (wizard) {
    wizard.style.display = 'none';
  }

  // Show "Back to scenarios" button
  this.showBackButton();
}
```

**Add new method**:
```javascript
showBackButton() {
  let backBtn = document.getElementById('back-to-scenarios-btn');
  if (!backBtn) {
    backBtn = document.createElement('button');
    backBtn.id = 'back-to-scenarios-btn';
    backBtn.className = 'step-nav-btn';
    backBtn.textContent = '← Back to Scenarios';
    backBtn.style.position = 'fixed';
    backBtn.style.bottom = '20px';
    backBtn.style.left = '20px';
    backBtn.style.zIndex = '1000';
    backBtn.onclick = () => this.resetScenario();
    document.body.appendChild(backBtn);
  }
}
```

### 5. Collapse Mode Descriptions

**Location**: Lines 2131–2132 (Insight), 2244–2245 (Foresight), etc.

**Replace paragraph elements with collapsible `<details>`**:

**Example for Insight mode** (lines 2131–2132):

**Change from**:
```html
<div class="scenario-mode-label">Insight / Nearsight</div>
<h2 class="scenario-mode-headline">Where Are We Losing Them?</h2>
<p style="...">Descend through the conversion funnel layer by layer...</p>
```

**To**:
```html
<div class="scenario-mode-label">Insight / Nearsight</div>
<h2 class="scenario-mode-headline">Where Are We Losing Them?</h2>
<details style="margin-bottom: 20px;">
  <summary style="cursor: pointer; color: rgba(255,255,255,0.6); font-size: 13px; font-family: var(--font-body);">How to read this funnel →</summary>
  <p style="margin-top: 12px; color: rgba(255,255,255,0.6); font-size: 13px;">Descend through the conversion funnel layer by layer. Identify where friction emerges and what drives each drop. Single number: one insight.</p>
</details>
```

### 6. Inline Tier Meters

**Location**: Lines 1155–1160 (CSS)

**Change from**:
```css
.tier-meters {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 40px;
}
```

**To**:
```css
.tier-meters {
  display: flex;
  gap: 24px;
  margin-top: 40px;
  flex-wrap: wrap;
}

.tier-meter {
  flex: 1 1 300px;
}
```

### 7. Reduce Chart Container Padding

**Location**: Lines 1137–1143, 2728, 2756

**Change from**:
```css
.canvas-container {
  padding: 40px;
}
```

**To**:
```css
.canvas-container {
  padding: 24px;
}
```

---

## IMPLEMENTATION CHECKLIST

- [ ] Update HTML for Market Share chart (add right-side legend panel)
- [ ] Add CSS for legend styling
- [ ] Add JavaScript `updateLegend()` method
- [ ] Remove canvas-embedded legend code
- [ ] Increase canvas height from 450 to 550
- [ ] Make scenario selector visible with grid layout
- [ ] Add `launchScenario()` method
- [ ] Update scenario selector display logic
- [ ] Reduce header padding (60px → 32px)
- [ ] Reduce content padding (80px → 64px)
- [ ] Remove scenario chooser max-width
- [ ] Hide wizard stepper after selection
- [ ] Add "Back to Scenarios" button
- [ ] Convert descriptions to collapsible `<details>`
- [ ] Update tier meters to flex layout
- [ ] Reduce canvas container padding (40px → 24px)
- [ ] Test responsive behavior at multiple breakpoints
- [ ] Verify canvas scaling with `width: 100%; height: auto;`
- [ ] Test mode switching and scenario selection flow
- [ ] Verify back button functionality

---

## RESPONSIVE CONSIDERATIONS

### For mobile (< 768px):
```css
@media (max-width: 768px) {
  .scenario-header {
    padding: 20px 32px;
  }

  .scenario-content {
    padding: 0 32px 20px;
  }

  #scenario-selector {
    grid-template-columns: 1fr !important;
  }

  /* Chart with legend: stack vertically */
  .chart-with-legend {
    grid-template-columns: 1fr !important;
  }

  #sim-share-legend {
    max-height: none;
  }
}
```

---

## TESTING NOTES

1. **Canvas scaling**: Test that chart scales correctly with container width on desktop, tablet, mobile
2. **Legend interactivity**: Add hover effects to verify styling
3. **Mode switching**: Verify wizard hides/shows appropriately
4. **Back button**: Test persistence across mode switches
5. **Scenario launch**: Verify correct mode + scenario combination loads
6. **Scroll height**: Measure pre-chart scrolling reduction before/after changes

