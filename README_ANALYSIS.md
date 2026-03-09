# Scenario Lab Analysis - README

## Documents Included

This analysis package contains three detailed documents examining the Scenario Lab interface and providing implementation guidance:

### 1. **ANALYSIS.md** (Comprehensive Findings)
The primary analysis document covering:
- Overall layout and scrolling behavior (560–660px of vertical wastage identified)
- All 5 modes: Insight, Foresight, Focus Group, Signal Nexus, Brand Sim
- Detailed examination of each mode's default behavior
- Conversion funnel structure and animation patterns
- Foresight scenario selection mechanism (currently modal-specific, not top-level)
- Market Share chart analysis with legend placement issues
- Simulation engine controls (Play/Pause/Reset, speed selection, preset scenarios)
- Current vs proposed scenario selection flow
- Layout comparison with Signal Terminal
- Quick reference tables for all sections
- 11 specific findings sections with line numbers and CSS class references

**Size**: ~3,000 words
**Key findings**:
- Canvas legend occupies 6.7% of chart area
- Header + stepper + selector = 400px before mode content
- Scenarios are mode-embedded, not pre-selectable

### 2. **IMPLEMENTATION_GUIDE.md** (Step-by-Step Changes)
Technical guidance for three primary improvements:

#### Change 1: Market Share Chart Enhancement
- Proposed HTML structure (grid layout with separate legend panel)
- CSS additions for legend styling
- JavaScript `updateLegend()` method
- Canvas height increase (450 → 550px)
- Legend item styling with hover effects

#### Change 2: Definitive Scenario Choices
- Top-level scenario selector (2-column grid layout)
- 3 Foresight scenarios: Regulatory Wave, AI Concierge, Decentralized Travel
- 5 Analysis modes: Insight, Focus Group, Fidelity LIVE, Brand Sim, Strategic Lab
- New `launchScenario()` method for direct mode + scenario jumping
- Display toggle logic

#### Change 3: Scrolling Reduction
- 7 specific changes with before/after code:
  1. Header padding: 60px → 32px (saves 28px)
  2. Content padding: 80px → 64px (saves 16px)
  3. Remove scenario chooser max-width
  4. Hide wizard stepper after selection
  5. Convert descriptions to collapsible details
  6. Inline tier meters (flex instead of grid)
  7. Reduce canvas container padding: 40px → 24px
- **Estimated savings**: 200–300px vertical space (35–50% reduction)

**Size**: ~2,000 words
**Includes**: Complete code snippets, line number references, CSS classes, responsive design guidance

### 3. **This README**
Quick navigation and summary of findings.

---

## Key Findings Summary

### Layout Issues
| Issue | Current | Impact | Solution |
|-------|---------|--------|----------|
| Header padding | 60px top | Takes 60px+ at top | Reduce to 32px |
| Scenario selector | Hidden (line 104) | Not visible | Unhide + restructure |
| Wizard stepper | Always visible | ~100px height | Hide after mode select |
| Legend placement | Inside canvas | 6.7% of chart area | Move to right panel |
| Canvas size | 960×450 fixed | Not responsive | Increase to 550px height |

### Scenario Selection
**Current flow**: Mode selection → Card click (for Foresight only)
**Proposed flow**: Scenario selection → Auto mode + scenario load

**Definitive scenarios** (Foresight mode):
1. 2027: Regulatory Wave (72% likely) → EU compliance regulations
2. 2029: AI Concierge Era (65% likely) → AI disintermediation
3. 2031: Decentralized Travel (48% likely) → Blockchain platforms

### Simulation Controls
- **Play/Pause/Reset buttons** for 100-iteration simulation
- **Speed control**: 1x, 2x, 5x (tick interval: 200ms base)
- **Iteration counter**: Real-time display (0/100)
- **Preset scenarios**: 6 options (Baseline, Pricing, Trust, Gen Z, AI, Price War)

### Chart Specifications
- **Market Share Over Time**: 960×450px canvas (Hero visualization)
- **10 brands**: Airbnb, Vrbo, Stayworthy, Booking.com, Marriott, Hilton, Plum Guide, Hopper, Vacasa, Inspirato
- **Stayworthy styling**: Thicker line (3px), brand purple (#745AFF), full opacity
- **Other brands**: 1.5px lines, 60% opacity for subtle styling
- **Current legend**: Shows 6 brands, inside canvas, top-right corner

---

## File Locations - Quick Reference

| Component | File | Lines |
|-----------|------|-------|
| Page container | scenario-lab.html | 2005–2086 |
| Mode dropdown | scenario-lab.html | 2073–2085 |
| Scenario selector | scenario-lab.html | 2111–2123 |
| Insight funnel | scenario-lab.html | 2129–2237 |
| Foresight cards | scenario-lab.html | 2242–2305 |
| ABM simulation | scenario-lab.html | 2343–2439 |
| Focus group config | scenario-lab.html | 2456–2498 |
| Signal Nexus layout | scenario-lab.html | 2589–2665 |
| Brand Sim controls | scenario-lab.html | 2705–2716 |
| Market Share chart | scenario-lab.html | 2756–2759 |
| ScenarioLab class | scenario-lab.html | 2840–3097 |
| ABMSimulation class | scenario-lab.html | 3121–3464 |
| Canvas rendering | scenario-lab.html | 3361–3463 |
| Legend code (current) | scenario-lab.html | 3449–3462 |

---

## CSS Key Classes

### Structure
- `.scenario-lab`: Main container (min-height: 100vh, flex column)
- `.scenario-header`: Top bar with mode dropdown (padding: 60px 80px)
- `.scenario-content`: Scrollable mode container (flex: 1, overflow-y: auto)
- `.scenario-mode`: Individual mode (display: none, toggles active)

### Simulation UI
- `.simulation-controls`: Play/Pause/Reset bar (flex, 20px gap)
- `.control-btn`: Individual button (padding: 8px 16px)
- `.speed-selector`: Speed buttons (flex, 6px gap)
- `.canvas-container`: Chart wrapper (padding: 40px)

### Charts & Visualization
- `.funnel-stage`: Funnel step (display: flex, gap: 24px)
- `.funnel-bar`: Animated bar (height: 32px, width: 100%/60%/17%/4%)
- `.scenario-card`: Foresight scenario (padding: 32px, overflow: hidden)
- `.nexus-layout`: 3-panel signal view (grid: 240px 1fr 280px)
- `.tier-meters`: Progress bars (grid: repeat(3, 1fr))

---

## JavaScript Classes & Objects

### ScenarioLab Object (lines 2840–3097)
- `switchMode(mode)`: Change active mode
- `selectScenario(card)`: Handle Foresight card click
- `showStrategicOutput(scenario)`: Display output panel
- `runSimulationForScenario(scenario)`: Auto-start ABM

### ABMSimulation Class (lines 3121–3464)
- `play()`: Start simulation
- `pause()`: Stop simulation
- `reset()`: Return to iteration 0
- `loadPreset(preset)`: Apply scenario modifier
- `stepSimulation()`: Advance one iteration
- `drawCanvas()`: Render chart to canvas
- `getTotalActive()`: Calculate active agent count

### VirtualFocusGroup Object (lines 3477–3698)
- `init()`: Load synthetic cohorts from JSON
- `runSession()`: Execute focus group session
- `renderPersonas()`: Display persona cards
- `renderAggregateDashboard()`: Show sentiment/themes

---

## Comparison: Signal Terminal vs Scenario Lab

| Aspect | Signal Terminal | Scenario Lab |
|--------|---|---|
| Layout | 3-column grid (fixed) | Single-column mode rotation |
| Header | 48px padding, minimal | 60px padding + animated mesh |
| Content | max-height: 800px (overflow) | flex: 1 (scroll) |
| View switching | Single view | 5 toggleable modes |
| Interaction | Filter pills + search | Mode + scenario selection |
| Charts | Embedded in columns | Full-width canvases |
| Legend | External (column headers) | Internal (canvas) |

---

## Scrolling Analysis

### Current vertical usage breakdown:
- Header + mesh: 300px
- Mode dropdown trigger: 40px
- Confidence bar: 50px
- Wizard stepper: 100px
- Scenario selector: 80px
- Mode description: 40–60px
- First chart appears: After ~610–630px of scrolling

### Post-improvement breakdown:
- Header + mesh (reduced): 250px
- Mode dropdown: 40px (hidden after selection)
- Confidence bar: 40px (reduced)
- Wizard stepper: 0px (hidden)
- Scenario selector: 0px (replaced at top level)
- Mode description: 0px (collapsible)
- First chart appears: After ~330–350px of scrolling

**Result**: ~300px (50%) reduction in pre-chart scrolling

---

## Responsive Breakpoints

### Desktop (1200px+)
- Full 3-column Foresight scenario grid
- Side-by-side chart + legend layout
- Full canvas width responsive sizing

### Tablet (768px–1199px)
- Scenario grid adjusts to 2 columns or stacks
- Chart + legend stacks vertically
- Canvas width constrained to container

### Mobile (<768px)
- Single column layout for all
- Chart + legend full width, vertically stacked
- Reduced padding (20px instead of 32px+)
- Smaller fonts, tighter spacing

---

## Implementation Priority

### Phase 1: Quick Wins (1–2 hours)
1. Reduce header/content padding
2. Hide wizard stepper after selection
3. Move Market Share legend outside canvas

### Phase 2: Medium Effort (2–4 hours)
4. Collapse descriptions to `<details>` elements
5. Add "Back to Scenarios" button
6. Update tier meters to flex layout

### Phase 3: Major Changes (4–8 hours)
7. Unhide and restructure scenario selector
8. Add `launchScenario()` method
9. Implement top-level scenario → mode jumping
10. Test across all modes and breakpoints
11. Responsive design refinement

---

## Testing Checklist

- [ ] Canvas responsive scaling (100% width)
- [ ] Legend visibility and styling
- [ ] Mode switching performance
- [ ] Scenario selection flow (all 3 Foresight scenarios)
- [ ] Brand Sim simulation accuracy
- [ ] Focus Group persona generation
- [ ] Signal Nexus data rendering
- [ ] Back button functionality
- [ ] Collapsible descriptions expand/collapse
- [ ] Mobile layout responsiveness
- [ ] Accessibility (keyboard navigation, screen readers)
- [ ] Performance (canvas rendering at 60fps)

---

## Notes for Developers

1. **Canvas rendering**: All drawing is canvas 2D context, not SVG. Legend code is in `drawCanvas()` method only.

2. **Mode visibility**: Uses CSS `display: none/block` toggle via `classList`. No React/Vue—vanilla JavaScript.

3. **Simulation state**: ABMSimulation maintains history array of snapshots. Each iteration stores `{iteration, shares, totalActive}`.

4. **Preset system**: `loadPreset()` modifies `this.params` object, then calls `reset()` to clear history. Next `play()` starts with new parameters.

5. **SVG charts**: Signal Nexus renders SVG dynamically. Brand Sim scenario chart uses Chart.js library (line 2834).

6. **Focus group data**: Expects `/data/synthetic-cohorts.json` file. Structure: `{segments: {[name]: {name, size, personas: [{name, age, location, profile, responses}]}}}`.

7. **Virtual scroll**: Signal ticker uses CSS animation (tickerScroll, 60s duration). Items duplicated for seamless loop.

---

## Questions & Clarifications

**Q: Should all 10 brands appear in the legend?**
A: Yes. Current implementation shows only 6. All 10 should be listed in the right-side legend, possibly in 2 columns for compactness.

**Q: Can legend items be interactive (click to toggle)?**
A: Not in current implementation. Could be added: store `hiddenBrands` set, skip rendering, update legend styling.

**Q: Should scenario selection persist across page reloads?**
A: Optional enhancement. Use localStorage to save last selected scenario/mode.

**Q: Is the Brand Sim canvas size optimal?**
A: Proposed increase to 550px height is reasonable. Could go to 600px for ultra-widescreen displays.

**Q: What if user zooms to 200%?**
A: Canvas should still scale due to `width: 100%; height: auto;`. Test with browser zoom.

---

## References

- **scenario-lab.html**: 4,586 lines total
- **signal-terminal.html**: 1,397 lines (comparison reference)
- **CSS**: Lines 11–1965 (embedded `<style>` block)
- **HTML**: Lines 2005–2794 (main content)
- **JavaScript**: Lines 2830–4586 (initialization + 3 classes)

---

**Analysis Date**: March 9, 2026
**Analyst**: Claude Code
**Status**: Ready for implementation planning
