# Brand Intelligence Engine v9 - Visual QA Audit Report

**Audit Date:** March 7, 2026
**Scope:** Complete visual and UX audit of all 7 HTML pages
**Prepared for:** Board presentation (12 days from now)

---

## Executive Summary

This audit reveals **3 critical issues, 8 major issues, and 12 minor issues** affecting visual consistency, dark-theme contrast, responsiveness, and UI patterns across the system. The floating question mark button (Material Analyst) is positioned adequately but lacks contextual integration. Overall design maintains strong consistency in spacing and color treatment, but several components need refinement before board presentation.

---

## SECTION 1: THE FLOATING QUESTION MARK BUTTON (`.analyst-trigger`)

### Current Implementation
- **Location:** Fixed bottom-right corner
- **Position:** `bottom: calc(var(--feed-height) + var(--space-lg))` (56px + 24px = 80px from bottom)
- **Right offset:** `var(--space-lg)` (24px from right)
- **Size:** 56px circle
- **Color:** Purple brand color `#745AFF`
- **Behavior:** Hover scale and shadow effect, plus animated dot indicator
- **Files:** All pages use global CSS (`css/global.css` lines 250-302)

### Assessment: UI Pattern Evaluation

**Current Strengths:**
1. ✅ Consistent placement across all 7 pages
2. ✅ Proper z-index layering (300)
3. ✅ Good hover feedback (scale 1.05 + glow)
4. ✅ Animation on notification dot is subtle
5. ✅ Positioned above fixed feed bar properly

**Issues Identified:**

**MAJOR ISSUE #1: Floating Button Placement Conflicts with Content**
- **Files affected:** `command-center.html`, `signal-terminal.html`, `guided-analysis.html`, `scenario-lab.html`
- **Problem:** On pages with tall content that scrolls, the fixed FAB at `bottom: 80px` can overlap content on smaller screens (1024px and below)
- **Impact:** Board presentation screens (typically 1920px) are fine, but responsive design breaks
- **Fix:** Add breakpoint media query:
  ```css
  @media (max-width: 1200px) {
    .analyst-trigger {
      bottom: calc(var(--feed-height) + var(--space-md));
      right: var(--space-md);
    }
  }

  @media (max-width: 768px) {
    .analyst-trigger {
      width: 48px;
      height: 48px;
      bottom: var(--space-md);
      right: var(--space-md);
    }
  }
  ```

**MAJOR ISSUE #2: Insufficient Visual Affordance**
- **Problem:** The button looks like a generic + icon button; users may not immediately understand it's an AI assistant trigger
- **Current state:** Has purple background and white + icon, but no label
- **Fix:** Add `title="Material Analyst"` attribute (already present, good!) but consider:
  - On hover, briefly show "Ask me anything" label
  - Or add a small label below the FAB: "Ask"

**ISSUE #3: Panel Sizing Not Responsive**
- **File:** `css/global.css` line 308
- **Problem:** `.analyst-panel` is hard-coded to `width: 380px` and `max-height: 500px`
- **On mobile:** This panel will consume 100%+ of viewport on phones
- **Fix:**
  ```css
  .analyst-panel {
    width: min(380px, 90vw);
    max-height: min(500px, 80vh);
  }
  ```

### Recommendation for Board Presentation

**Status:** ACCEPTABLE FOR DEMO with minor adjustments
- The FAB pattern is industry-standard and works well on large screens
- No changes required for 1920px+ board presentation
- Document the responsive fixes for production release (not blocking)

---

## SECTION 2: SPACING & ALIGNMENT CONSISTENCY

### Spacing Token Audit

**Design System:** 8px base unit
**Tokens defined:** `css/tokens.css` lines 105-113
```
--space-xs: 0.25rem (4px)
--space-sm: 0.5rem (8px)
--space-md: 1rem (16px)
--space-lg: 1.5rem (24px)
--space-xl: 2.5rem (40px)
--space-2xl: 4rem (64px)
--space-3xl: 6rem (96px)
--space-4xl: 10rem (160px)
```

### Finding #1: Inconsistent Section Padding in index.html

**File:** `index.html` (Strategic Brief)
**Issue:** `.scene` padding is 80px on all sides
- **Line 48:** `padding: 80px;`
- **Should be:** `padding: var(--space-4xl);` (160px is too much; closer to `var(--space-3xl) + var(--space-2xl)`)
- **Impact:** Creates unusually wide gutters that waste space
- **Fix:**
  ```css
  /* In index.html <style> tag, line 48 */
  .scene {
    padding: var(--space-3xl) var(--space-2xl);  /* 96px top/bottom, 64px left/right */
  }
  ```

### Finding #2: Card Padding Inconsistency Across Pages

**Pattern audit:**
- `command-center.html` line 327: `.st-signal { padding: 20px; }` ✓ (20px = reasonable)
- `guided-analysis.html` line 115: `.ga-card { padding: 24px; }` ✓ (24px = good)
- `signal-terminal.html` line 327: `.st-signal { padding: 20px; }` ✓ (20px = good)
- `scenario-lab.html` line 447: `.scenario-card { padding: 32px; }` ✓ (32px = good for large cards)
- `how-it-works.html` line 349: `.confidence-card { padding: 32px; }` ✓ (32px = good)
- `day-in-the-life.html` line 448: `.ditl-preview { padding: var(--space-lg); }` ✓ (24px = good)

**Verdict:** Cards are CONSISTENT (20-32px range is appropriate for dark theme)

### Finding #3: Gap Consistency in Grids

**Audit results:**
- Most grids use `gap: 28px` or `gap: 32px` ✓
- Some use `gap: 24px` ✓ (all within acceptable range)
- **No issues found** - gap sizing is well-controlled

### Finding #4: Hero Section Spacing Issues

**File:** `index.html`
**Lines:** 48-90
**Problem:**
- `.scene-label { margin-bottom: 40px; }` (line 56) = OK
- `.scene-headline { margin-bottom: 30px; }` (line 73) = OK
- But inconsistent with tokens (should use `var(--space-xl)` which is 40px, not 30px)

**Fix:**
```css
/* Standardize margins to token values */
.scene-headline {
  margin-bottom: var(--space-xl);  /* 40px, not 30px */
}
```

### Finding #5: Content Width Overflow on Mobile

**File:** Multiple (especially `command-center.html`, `signal-terminal.html`)
**Issue:** Hard-coded widths without max-width constraints
- `command-center.html` line 61: `.command-center { padding: 48px 64px 120px; }` - NO max-width
- On 375px phone: This creates 47px padding on each side = 281px available, too tight
- **Missing:** `max-width: 100%;` or responsive padding

**Fix - Add to all main content containers:**
```css
.command-center,
.signal-terminal,
.guided-analysis {
  max-width: 100%;
}

@media (max-width: 768px) {
  .command-center,
  .signal-terminal,
  .guided-analysis {
    padding: 32px 20px 120px;
  }
}
```

**Severity:** MAJOR - affects mobile experience

---

## SECTION 3: BUTTON & INTERACTIVE ELEMENT PATTERNS

### Finding #1: Inconsistent Button Styling Across Pages

**File:** `signal-terminal.html`
**Issue:** Multiple button styles without clear hierarchy

1. **`.st-pill` buttons** (lines 189-225)
   - Padding: `6px 12px` (too small, looks cramped)
   - Should be: `8px 14px` for better dark-theme affordance
   - Problem: Text is 11px but padding is minimal - text-to-button ratio is poor

2. **`.glass-box-toggle` button** (line 658 in HTML)
   - Has inline style: `color: #f59e0b; background: rgba(245, 158, 11, 0.12); border-color: rgba(245, 158, 11, 0.25); font-weight: 600;`
   - Problem: Color is hardcoded in HTML, should be CSS-only
   - Also inconsistent with other buttons

**Fix:**
```css
.st-pill {
  padding: 8px 14px;  /* increased from 6px 12px */
  min-height: 32px;   /* ensure clickable area */
}

.glass-box-toggle {
  color: var(--signal-cultural);
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.25);
  font-weight: 600;
  /* remove inline styles from HTML */
}
```

### Finding #2: Dark-on-Dark Contrast Issues

**File:** `guided-analysis.html`
**Line 401:** `.ga-question-btn { background: #0a0a0a; }`
- **Problem:** 0a0a0a on 050505 (bg-primary) creates insufficient contrast
- **Current:** Contrast ratio ~1.2:1 (FAILS WCAG AA)
- **Fix:** Use `background: var(--bg-card)` (0f0f0f) for better contrast

**File:** `day-in-the-life.html`
**Line 452:** `.preview-ga-msg { background: var(--bg-elevated); }`
- **0a0a0a on 050505 = poor contrast**
- **Should be:** `background: var(--bg-card);`

**Severity:** CRITICAL for accessibility audit - even though board won't test WCAG, this reflects poorly on design rigor

### Finding #3: Missing Hover States

**File:** `command-center.html`
**Line 224:** `.metric-accent` class - NO hover state defined
**File:** `scenario-lab.html`
**Line 739:** `.control-btn.active` has hover, but `.scenario-preset` hover is generic
- **Problem:** Hover states are inconsistent across similar button types
- **Fix:** Standardize hover treatment:
  ```css
  .control-btn:hover {
    background: var(--bg-glass-hover);
    border-color: var(--border-strong);
    color: rgba(255,255,255,0.9);
  }

  .scenario-preset:hover {
    background: var(--bg-glass-hover);
    border-color: var(--border-strong);
    color: rgba(255,255,255,0.95);
  }
  ```

### Finding #4: Button Text Sizing Inconsistencies

**Audit across all pages:**
- Signal Terminal filter pills: 11px ✓
- Scenario Lab mode buttons: var(--text-small) ✓
- Guided Analysis question buttons: 13px ✓
- BUT: Some buttons are 13px, others 11px - **should all be consistent**

**Recommendation:** Standardize ALL action buttons to `var(--text-small)` (13px) unless they're small pills (11px is OK for pills)

### Finding #5: White-on-Dark Edge Cases

**File:** `signal-terminal.html`
**Line 774:** `.analyst-trigger-icon { opacity: 0.7; }`
- The white + icon at 70% opacity on purple background
- **Problem:** Looks hollow/disabled when it's actually interactive
- **Fix:** Change to `opacity: 0.85` on default, remove opacity change on hover

---

## SECTION 4: MOBILE RESPONSIVENESS

### Finding #1: Missing Mobile Breakpoints

**Files affected:** `index.html`, `command-center.html`, `signal-terminal.html`, `guided-analysis.html`, `day-in-the-life.html`, `how-it-works.html`

**Issues:**
1. Main content padding (80px) is not responsive
2. Hero headlines scale with `clamp()` but some are static
3. Grid layouts specified but no 1-column fallbacks

**Critical gaps:**
```css
/* MISSING from index.html */
@media (max-width: 768px) {
  .scene {
    padding: 48px 24px;  /* Reduced padding */
  }

  .scene-headline {
    font-size: 2rem;  /* From 3.5rem */
  }
}

@media (max-width: 480px) {
  .scene {
    padding: 32px 16px;
  }

  .scene-headline {
    font-size: 1.5rem;
  }
}
```

### Finding #2: Signal Terminal 3-Column Layout Breaks

**File:** `signal-terminal.html`
**Line 256:** `.st-feed-container { grid-template-columns: 1fr 1fr 1fr; }`
- **Breakpoint at 1600px:** Changes to 2 columns ✓
- **Breakpoint at 1200px:** Changes to 1 column ✓
- **MISSING:** No media query for tablets (768px)
  - On iPad: 3 columns still trying to fit = horizontal scroll

**Fix:**
```css
@media (max-width: 1024px) {
  .st-feed-container {
    grid-template-columns: 1fr 1fr;  /* Better for tablets */
    gap: 20px;  /* Reduce gap on smaller screens */
  }
}
```

### Finding #3: Analyst Panel Not Responsive

**File:** `css/global.css`
**Lines 304-324:** Panel is fixed 380px width
- **On 480px phone:** Takes up 79% of screen width, no room for margins
- **Fix:** Already identified in Section 1, Issue #3

### Finding #4: Overflow Issues

**File:** `how-it-works.html`
**Line 144:** `.diagram-container { min-width: max-content; }`
- This creates horizontal scrolling on all screen sizes
- **On board (1920px):** Works fine ✓
- **On mobile:** Overflows
- **Fix:** Wrap with media query:
  ```css
  @media (max-width: 1024px) {
    .architecture-diagram {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
  }
  ```

---

## SECTION 5: ICON & VISUAL CONSISTENCY

### Finding #1: Icon Sizing Variance

**Audit across pages:**

| Icon Type | Size | Page | Status |
|-----------|------|------|--------|
| Nav icons | 12px+ (unicode) | All pages | ✓ Consistent |
| `.analyst-trigger-icon` | 24px | All pages | ✓ Consistent |
| `.st-column-dot` | 6px | signal-terminal | ✓ Consistent |
| `.st-pulse-dot` | 6px | signal-terminal | ✓ Consistent |
| Glass-box icon | Auto | All pages | ✓ Consistent |
| Driver badges dots | 3-4px | All pages | ✓ Consistent |

**Verdict:** Icon sizing is WELL-CONTROLLED across the system

### Finding #2: Signal Color Inconsistency

**Defined colors (tokens.css):**
- Human-Expressive: `#818cf8` (indigo) ✓
- Behavioral: `#34d399` (teal) ✓
- Cultural: `#f59e0b` (amber) ✓

**Audit across pages:**
1. **signal-terminal.html** - Uses `#818cf8`, `#34d399`, `#f59e0b` ✓
2. **how-it-works.html** - Uses hardcoded `#818cf8`, `#34d399`, `#f59e0b` ✓
3. **day-in-the-life.html** - Uses `var(--signal-human)`, `var(--signal-behavioral)`, `var(--signal-cultural)` ✓
4. **scenario-lab.html** - Uses `var(--signal-human)` ✓

**Issue:** Some pages use hardcoded hex, others use tokens - inconsistent source-of-truth approach

**Fix:** Audit and standardize ALL color references to use CSS tokens, not hardcoded hex
```css
/* BAD - in index.html line 32 */
background: radial-gradient(circle, rgba(129, 140, 248, 0.15) 0%, transparent 70%);

/* GOOD */
background: radial-gradient(circle, rgba(var(--signal-human-rgb), 0.15) 0%, transparent 70%);
```

### Finding #3: Visual Hierarchy of Color Dots

**Issue:** Three signal colors (human/behavioral/cultural) are used consistently, but there's no clear visual priority system. On Signal Terminal, they appear equally prominent.

**Verdict:** Acceptable for current implementation, but for future iterations, consider:
- Making Cultural (amber) slightly darker (#f0a000) for better dark-theme visibility
- Maintaining current scheme for board demo

---

## SECTION 6: DARK THEME SPECIFIC ISSUES

### Finding #1: Border Color Insufficient on Some Components

**File:** `guided-analysis.html`
**Line 113:** `.ga-card { border: 1px solid rgba(255,255,255,0.06); }`
- **Problem:** At 6% opacity, borders are barely visible on #050505 background
- **Should be:** `rgba(255,255,255,0.08)` or `var(--border-subtle)`
- **Current code already uses tokens, so this is OK** ✓

### Finding #2: Focus States Not Visible in Dark Theme

**File:** Multiple (especially `command-center.html`)
**Issue:** `.st-search:focus` uses `box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.1);`
- **Problem:** At 10% opacity, the focus halo is extremely faint
- **Fix:**
  ```css
  .st-search:focus {
    border-color: var(--signal-human);
    box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.25);  /* Increased from 0.1 */
  }
  ```

### Finding #3: Text Hierarchy on Dark Backgrounds

**All pages:** Text uses 5-tier hierarchy (primary to ghost)
- **--text-primary:** #f0f0f0 ✓
- **--text-secondary:** #999 ✓
- **--text-tertiary:** #666 ✓
- **--text-muted:** #444 ✓
- **--text-ghost:** #2a2a2a ✓

**Verdict:** Dark theme typography is WELL-DESIGNED with proper luminance hierarchy

---

## SECTION 7: PAGE-BY-PAGE DETAILED FINDINGS

### index.html (Strategic Brief)

| Issue | Severity | Line(s) | Fix |
|-------|----------|---------|-----|
| `.scene` padding 80px not responsive | MAJOR | 48 | Add media queries |
| Hero gradient hardcoded rgba instead of token | MINOR | 32 | Create token for this gradient |
| No `max-width` on main content | MAJOR | 46 | Add `max-width: 1200px` |

### command-center.html

| Issue | Severity | Line(s) | Fix |
|-------|----------|---------|-----|
| `.morning-flash-slide-left` animation undefined | MAJOR | 28 | Animation exists but could be more easing |
| Metric boxes don't have hover states | MINOR | 224 | Add `.metric-box:hover` |
| Grid gaps not responsive | MINOR | 382 | Reduce gap on mobile |

### signal-terminal.html

| Issue | Severity | Line(s) | Fix |
|-------|----------|---------|-----|
| `.st-pill` padding too tight (6px 12px) | MAJOR | 190 | Change to 8px 14px |
| `.st-search` focus halo too faint | MINOR | 155 | Increase shadow opacity to 0.25 |
| 3-column feed doesn't break at 1024px | MAJOR | 256 | Add tablet breakpoint |
| Glass-box toggle color hardcoded in HTML | MAJOR | 658 | Move to CSS |

### guided-analysis.html

| Issue | Severity | Line(s) | Fix |
|-------|----------|---------|-----|
| `.ga-question-btn` background too dark (0a0a0a) | CRITICAL | 397 | Change to var(--bg-card) |
| Card padding inconsistency potential | MINOR | 115 | Standardize to 24px |
| Conversation max-width could be wider | MINOR | 263 | Consider 900px max |

### scenario-lab.html

| Issue | Severity | Line(s) | Fix |
|-------|----------|---------|-----|
| `.control-btn` and `.scenario-preset` hover inconsistent | MINOR | 733, 789 | Standardize hover treatment |
| Metrics panel grid doesn't wrap on mobile | MAJOR | 381 | Add responsive grid |
| Confidence bar colors using hardcoded hex | MINOR | 384-397 | Use tokens |

### how-it-works.html

| Issue | Severity | Line(s) | Fix |
|-------|----------|---------|-----|
| `.diagram-container` creates horizontal scroll | MAJOR | 144 | Add overflow handling |
| Confidence card padding inconsistent (32px vs 24px) | MINOR | 349 | Standardize to 28px |
| Flow cells padding (12px 16px) should use tokens | MINOR | 310 | Create token or standardize |

### day-in-the-life.html

| Issue | Severity | Line(s) | Fix |
|-------|----------|---------|-----|
| `.preview-ga-msg` background too dark | CRITICAL | 452 | Change to var(--bg-card) |
| `.ditl-preview` uses hardcoded padding (24px) | MINOR | 448 | Standardize to var(--space-lg) |
| Scene padding (var(--space-4xl)) excessive on mobile | MAJOR | 211 | Add media queries |
| Timeline dots too small for mobile interaction | MINOR | 97 | Scale up on mobile |

---

## SECTION 8: SUMMARY OF CRITICAL FIXES NEEDED BEFORE BOARD PRESENTATION

### BLOCKING ISSUES (3):

1. **Dark-on-dark contrast in dark theme** (`guided-analysis.html` + `day-in-the-life.html`)
   - Lines: 397, 452
   - Fix: Change `#0a0a0a` backgrounds to `var(--bg-card)`
   - Time to fix: 2 minutes

2. **Floating analyst button not responsive**
   - Lines: css/global.css 250-302
   - Fix: Add media queries for tablet/mobile
   - Time to fix: 5 minutes

3. **Hardcoded colors in HTML instead of CSS**
   - Lines: signal-terminal.html 658, index.html 32
   - Fix: Move inline styles to CSS
   - Time to fix: 10 minutes

### MAJOR ISSUES (8):

1. Hero/scene padding not responsive (multiple files)
2. Card/button padding too tight for dark theme (signal-terminal.html)
3. Content width overflow on mobile (all pages)
4. 3-column grid doesn't break properly (signal-terminal.html)
5. Analyst panel not responsive (global.css)
6. Diagram container horizontal scroll (how-it-works.html)
7. Focus states too faint (multiple pages)
8. Missing mobile breakpoints (multiple pages)

---

## SECTION 9: RECOMMENDATIONS FOR BOARD PRESENTATION

### What Looks Good Right Now ✓
- Overall dark theme implementation is mature and sophisticated
- Icon and color consistency across pages
- Card and button patterns are well-designed
- Spacing hierarchy using tokens is solid
- Analyst trigger button placement is appropriate
- Typography hierarchy is excellent
- Animation and transition timing is polished

### What Needs Immediate Attention Before Demo
1. **Fix dark-on-dark contrast (2 min)** - Looks like a bug to exec eyes
2. **Make FAB responsive (5 min)** - Phone demo will break otherwise
3. **Remove hardcoded colors (10 min)** - Shows sloppiness in dark theme implementation

### What Can Wait Until Production
- Complete mobile responsiveness overhaul (important but not blocking for board)
- Button padding standardization across all pages
- Focus state improvements
- Hover state consistency

### Recommended Timeline
- **Days 1-2:** Fix the 3 blocking issues
- **Days 3-5:** Address major responsive issues
- **Days 6-12:** Polish minor issues, test on various screen sizes

---

## APPENDIX: Quick Reference - All Issues by Severity

### CRITICAL (Fix before demo)
- [ ] guided-analysis.html line 397: `.ga-question-btn` dark background
- [ ] day-in-the-life.html line 452: `.preview-ga-msg` dark background
- [ ] signal-terminal.html line 658: Glass-box toggle color hardcoded

### MAJOR (Fix this week)
- [ ] index.html line 48: Scene padding not responsive
- [ ] signal-terminal.html line 190: Pill padding too small
- [ ] signal-terminal.html line 256: Grid doesn't break at tablet
- [ ] command-center.html line 61: No max-width on content
- [ ] how-it-works.html line 144: Diagram overflow
- [ ] css/global.css line 250: FAB not responsive
- [ ] css/global.css line 308: Panel width not responsive
- [ ] Multiple: Missing tablet/mobile breakpoints

### MINOR (Fix after launch)
- [ ] index.html line 32: Hardcoded rgba instead of token
- [ ] signal-terminal.html line 155: Focus shadow too faint
- [ ] guided-analysis.html: Conversation max-width could be wider
- [ ] All pages: Standardize button text sizing
- [ ] Multiple: Hardcoded hex colors should use tokens
- [ ] scenario-lab.html: Hover state consistency
- [ ] day-in-the-life.html: Timeline dots too small on mobile
- [ ] All pages: Consistency audit on spacing tokens usage
- [ ] command-center.html: Metric boxes missing hover
- [ ] multiple: Focus states need visibility improvement
- [ ] multiple: Button padding standardization
- [ ] All: Complete dark theme WCAG AA audit

---

**Report Status:** READY FOR REVIEW

**Next Steps:**
1. Review with design lead
2. Prioritize fixes based on board demo timeline
3. Assign fixes to development
4. Conduct follow-up audit after fixes
5. Mobile testing on iPhone 12 / iPad (9.7")
6. Accessibility audit (WCAG AA)
