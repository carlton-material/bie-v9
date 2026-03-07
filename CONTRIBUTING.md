# Contributing to Brand Intelligence Engine

## Getting Started

```bash
git clone git@github.com:carlton-material/bie-v9.git
cd bie-v9
python3 -m http.server 8090
# Open http://localhost:8090
```

No build step. No `npm install`. Just HTML, CSS, and JS.

## Project Structure

Every surface is a standalone HTML file. Shared styles live in `css/`, shared behavior in `js/app.js`, data in `data/`.

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
5. Add your nav link to the sidebar in all 7 files
6. Add page-specific styles in an inline `<style>` block

### Design Token Rules

- **Never** use hex colors directly — reference tokens from `tokens.css`
- **Only 3 signal colors**: `#818cf8` (Human), `#34d399` (Behavioral), `#f59e0b` (Cultural)
- **Brand purple `#745AFF`**: Logo accent only, never for data visualization
- **Font stack**: Space Grotesk → Inter → JetBrains Mono (display → body → data)

## Code Style

- **HTML**: Semantic elements, BEM-ish class naming
- **CSS**: Mobile-last, CSS custom properties for tokens
- **JS**: Vanilla — no frameworks. Module pattern
- **Data**: JSON files in `data/`, never hardcode data

## Commit Conventions

```
feat(scope): add new feature
fix(scope): bug fix
refine(scope): visual polish
docs(scope): documentation
test(scope): testing
chore(scope): maintenance
```

Scope = surface name (`command-center`, `signal-nexus`, `ditl`, `how-it-works`, `global`, etc.)
