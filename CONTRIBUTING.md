# Contributing to Brand Intelligence Engine

## Getting Started

```bash
git clone git@github.com:carlton-material/bie-v9.git
cd bie-v9
python3 -m http.server 8090
# Open http://localhost:8090
```

No build step. No `npm install`. Just HTML, CSS, and JS.

**New to this codebase?** Start with [ONBOARDING.md](ONBOARDING.md) for a guided walkthrough of the repo structure, reading order, and first-contribution checklist.

---

## Project Structure

Every surface is a standalone HTML file. Shared styles live in `css/`, shared behavior in `js/app.js`, data in `data/`. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design.

### Adding a New Surface

1. Copy any existing HTML file as a template
2. Keep these four CSS imports in the `<head>`:
   ```html
   <link rel="stylesheet" href="css/tokens.css">
   <link rel="stylesheet" href="css/global.css">
   <link rel="stylesheet" href="css/components.css">
   <link rel="stylesheet" href="css/glass-box.css">
   ```
3. Keep the `<script src="js/app.js"></script>` at the bottom
4. Wrap content in the standard layout: `.app > .sidebar + .app-content`
5. Add your nav link to the sidebar in **all 8 HTML files**
6. Add page-specific styles in an inline `<style>` block

### Design Token Rules

- **Never** use hex colors directly — reference tokens from `tokens.css`
- **Only 3 signal colors**: `#818cf8` (Human-Expressive), `#34d399` (Behavioral), `#f59e0b` (Cultural)
- **Brand purple `#745AFF`**: Logo accent only, never for data visualization
- **Font stack**: Space Grotesk (display) → Inter (body) → JetBrains Mono (data/mono)

### Glass Box Panels

Every surface that displays data claims should include a Glass Box panel:

```html
<div class="glass-box-panel">
  <div class="glass-box-header">
    <span class="glass-box-icon">☐</span>
    <span class="glass-box-label">GLASS BOX — SECTION TITLE</span>
    <button class="glass-box-toggle">SHOW MY WORK ▾</button>
  </div>
  <div class="glass-box-content">
    <!-- Attribution content here -->
  </div>
</div>
```

---

## Testing

### Manual QA Checklist

Before any PR, verify:

1. All 8 pages load without JS console errors (ignore Chrome extension noise and expected "API key not configured" from analyst-llm.js)
2. Navigation between all 8 pages works
3. Glass Box toggles expand/collapse on each surface
4. Signal Terminal filters update the feed
5. Scenario Lab tabs switch correctly (all 4: Strategic Scenario, War Gaming, Focus Group, Brand Score LIVE)
6. Material Analyst panel opens from any page (click the + button, top-right)
7. Intelligence feed ticker scrolls at the bottom
8. Ask/Explore mode toggle works in the Analyst panel

### Cache Busting

CSS and JS links use `?v=N` query params. Bump the version number when changing shared CSS or JS files. Current version: `v=22`.

### Automated Testing

```bash
# Install Playwright
npm init -y && npm install playwright

# Run QA suite (if test script exists)
node test-interactions.js
```

---

## Code Style

- **HTML**: Semantic elements, BEM-ish class naming, inline styles for page-specific CSS only
- **CSS**: Desktop-first (this is a presentation tool), CSS custom properties for all tokens
- **JS**: Vanilla — no frameworks. Module pattern with namespace objects (`BIE`, `SignalNexus`, `DITL`)
- **Data**: JSON files in `data/`, never hardcode data that could change

---

## Commit Conventions

```
type(scope): description
```

Types: `feat`, `fix`, `refine`, `docs`, `test`, `chore`

Scope = surface name or module: `command-center`, `signal-terminal`, `scenario-lab`, `guided-analysis`, `brand-fidelity`, `how-it-works`, `ditl`, `analyst`, `global`, `tokens`, `sim`

Examples:
```
feat(scenario-lab): add next/back buttons to War Gaming wizard
fix(command-center): correct Brand Score count-up animation
refine(ditl): elevate scroll-triggered scene reveals
docs(readme): update architecture section with current file tree
```

---

## Branch Conventions

```
feature/descriptive-name    # New features
fix/issue-description       # Bug fixes
refine/surface-name         # Visual refinements
sprint/sprint-number        # Sprint bundles
```

---

## PR Checklist

- [ ] Zero JS console errors across all 8 surfaces
- [ ] All Glass Box toggles functional
- [ ] All navigation links work
- [ ] Material Analyst opens and responds on every page
- [ ] Screenshots updated if UI changed
- [ ] No API keys, tokens, or secrets committed
- [ ] Cache buster version bumped if CSS/JS changed
