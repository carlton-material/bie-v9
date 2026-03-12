# Quick Start — Claude Haiku Integration

## Setup (2 minutes)

1. Open `data/config.json`
2. Replace `PASTE_YOUR_KEY_HERE` with your Anthropic API key (from [console.anthropic.com](https://console.anthropic.com))
3. Save and reload the app

**That's it!**

## Usage

1. Open any page in BIE v9
2. Click the **Analyst button** (purple chat bubble, top-right)
3. Type a question:
   - "What's driving the trust gap?"
   - "Analyze the Dependable driver"
   - "Compare to Booking.com"
   - "What should we do about Personal?"
4. Watch the pulsing dots, then the AI response streams in

## How It Works

- **LLM Module**: `js/analyst-llm.js` handles all API calls
- **System Prompt**: AI gets brand data, drivers, signals, and current page context
- **Streaming**: Response appears character-by-character
- **Fallback**: If API fails, uses hardcoded responses automatically
- **Modes**: Toggle between "Ask" (Socratic questions) and "Explore" (direct analysis)

## What the AI Knows

- Stayworthy brand data (composite 72, all 6 drivers with scores/deltas)
- 847 signals (312 Human-Expressive, 289 Behavioral, 246 Cultural)
- Competitors (Booking.com 74, Marriott 71, etc.)
- Your current page (Strategic Brief, Command Center, etc.)
- Signal types and confidence levels

## Examples

| Question | Mode | Response Type |
|----------|------|---|
| "Trust gap?" | Guide | Questions about sentiment vs. behavior divergence |
| "Trust gap?" | Guardian | Data on 22-point gap, correlation analysis, attribution |
| "What to do?" | Both | Scenario-based recommendations with drivers |
| "Gen Z" | Either | Cultural signals + behavioral patterns |

## Cost

~$0.003 per response (Claude Haiku is optimized for cost/speed)

## Files Created/Modified

**New:**
- `js/analyst-llm.js` — LLM module
- `data/config.json` — API key storage
- `LLM_INTEGRATION.md` — Full documentation
- `QUICK_START.md` — This file

**Modified:**
- `js/app.js` — Added LLM calls + streaming
- `css/global.css` — Added thinking animation
- All 7 HTML files — Added `<script src="js/analyst-llm.js"></script>`

## Troubleshooting

**"API Error (401)"** → Wrong API key in `config.json`

**No thinking animation** → Check browser console (F12)

**Hardcoded response instead of LLM** → API call failed (check Network tab in DevTools)

**Slow responses** → Network issue or Anthropic API latency

---

**For full documentation**, see `LLM_INTEGRATION.md`

**Ready for board presentation!**
