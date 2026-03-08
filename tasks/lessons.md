# BIE v9 — Design System Lessons Learned

## White-on-White Button Bug Pattern

### Problem
Interactive option buttons/cards in dark-theme surfaces default to white/light backgrounds with white/light text when inactive, creating invisible "ghost buttons" that users cannot see or interact with.

### Root Cause Analysis
The issue manifests in three primary scenarios:

1. **Inactive question option buttons** (`.ga-question-btn`): Lacked any `.active` or `.selected` state styling, making clicked options indistinguishable from unclicked ones
2. **Mode toggle buttons** (`.mode-btn`): Used `color: var(--text-tertiary)` (#666, very dark gray) with `background: transparent`, creating insufficient contrast on dark backgrounds
3. **Analyst panel send button**: Lacked visible background styling, appearing as transparent text on a dark panel

### The Fix Pattern

All interactive buttons/options in the BIE must have explicit styles for THREE states:

#### Inactive State
```css
.option-button {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.6);
}
```

#### Hover State
```css
.option-button:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.8);
}
```

#### Active/Selected State
```css
.option-button.active,
.option-button.selected {
  background: rgba(129,140,248,0.12);
  border-color: rgba(129,140,248,0.4);
  color: rgba(255,255,255,0.95);
}
```

### Implementation Date
Fixed on 2026-03-07.

---

## Overflow Prevention Rules (Sprint 15)

### Root Causes Identified
1. **Flex children expand** — Always add `min-width: 0` to flex children containing text
2. **Fixed px dimensions** — Use `min(maxWidth, 90vw)` instead of fixed pixel widths
3. **No CSS contain** — Scrollable panels need `contain: layout style`
4. **Absolute children escape** — Parents need `position: relative; overflow: hidden`
5. **SVG overflow** — Always set `max-width: 100%; height: auto` on SVGs

### Implementation Date
Implemented on 2026-03-07.

---

## `const` vs `window.` Global Scope in Multi-Script HTML (Sprint 15)

### Problem
`SyntaxError: Identifier 'BIE' has already been declared` when `scenario-lab.html` inline script tried to reference or re-declare `BIE` from `app.js`.

### Root Cause
In HTML with multiple `<script>` tags, `const` declarations are block-scoped to their script tag — NOT globally accessible.

### Fix
Use `window.BIE = { ... }` instead of `const BIE = { ... }` in `app.js`.

### Rule
**Any object shared across `<script>` tags MUST use `window.` assignment, not `const`/`let`/`var`.**

### Implementation Date
Fixed on 2026-03-07. Affects: `/js/app.js` line 7.

---

## Object.assign() Method Name Collision (Sprint 15)

### Problem
After `Object.assign(BIE, ScenarioLab)`, `BIE.init()` no longer loaded brand data. Page loaded with `BIE.brand = null`.

### Root Cause
Both `app.js` and `ScenarioLab` had `init()`. Object.assign overwrites same-named properties.

### Rule
**When using Object.assign() to merge modules, every method name must be unique.** Use `initScenarioLab()` not `init()`.

### Implementation Date
Fixed on 2026-03-07. Affects: `/scenario-lab.html`.

---

## Mode Switching: Sibling Element Visibility (Sprint 15)

### Problem
Brand Sim tab showed wizard stepper and scenario cards that don't apply to it.

### Root Cause
Wizard/selector are DOM siblings of mode panels, not children. `switchMode()` only toggled `.scenario-mode.active`.

### Fix
Added conditional hide/show of shared UI elements in `switchMode()` based on active mode.

### Rule
**Mode switching must manage ALL visible elements, not just mode panels.** Shared UI (steppers, selectors) needs explicit show/hide per mode.

### Implementation Date
Fixed on 2026-03-07. Affects: `/scenario-lab.html` — `switchMode()` method.