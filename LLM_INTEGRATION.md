# Material Analyst LLM Integration — Setup & Usage

## Overview

The Material Analyst panel now integrates **Claude Haiku 4.5** via the Anthropic API for real-time, AI-powered brand intelligence analysis. The integration is **client-side only** (no backend), making it ideal for internal prototypes and board presentations.

## Files Modified/Created

### New Files
- **`js/analyst-llm.js`** — LLM module with Anthropic API calls and streaming
- **`data/config.json`** — API configuration (placeholder key)

### Modified Files
- **`js/app.js`** — Updated `sendAnalystMessage()` and added `callAnalystLLM()` and `parseAnalystResponse()`
- **All HTML files** — Added `<script src="js/analyst-llm.js"></script>` before app.js
- **`css/global.css`** — Added thinking animation styles (`.thinking-dot`, `@keyframes thinking-pulse`)

## Setup Instructions

### 1. Add Your Anthropic API Key

Edit **`data/config.json`** and replace the placeholder:

```json
{
  "anthropic_api_key": "sk-ant-v4-YOUR_ACTUAL_KEY_HERE",
  "model": "claude-haiku-4-5-20251001",
  "max_tokens": 512
}
```

Get your API key from [console.anthropic.com](https://console.anthropic.com).

### 2. Verify Setup

1. Open any page (e.g., `index.html`)
2. Click the **Analyst** button (purple chat icon in top-right)
3. Type a question like: "What's the trust gap issue?"
4. You should see a thinking animation (pulsing dots), then streaming response

## How It Works

### Architecture

```
User Query
    ↓
sendAnalystMessage() → Show thinking animation
    ↓
callAnalystLLM() → Call AnalystLLM.getAnalystResponse()
    ↓
AnalystLLM.callAPI() → Anthropic API (streaming)
    ↓
Character-by-character typewriter effect
    ↓
parseAnalystResponse() → Format response (bold, monospace, etc.)
    ↓
Display in analyst panel
```

### System Prompt

The LLM receives a **rich system prompt** that includes:

- **Role**: Material Analyst inside Brand Intelligence Engine
- **Brand Data**: Stayworthy composite, all 6 drivers (scores & deltas), competitor data
- **Signal Context**: Human-Expressive, Behavioral, Cultural signal counts
- **Mode Context**: Socratic Guide vs. Guardian of Data
- **Current Page**: Analyst adjusts context based on which surface the user is viewing
- **Response Guidelines**: Keep to 2-3 paragraphs, cite sources, end with confidence

### Modes

**Guide Mode** (Socratic):
- Asks questions to sharpen thinking
- Suggests patterns without pushing conclusions
- Prefix: "Question:"

**Guardian Mode** (Direct Analysis):
- Delivers attribution-backed analysis
- Cites signal sources and confidence levels
- Prefix: "Diagnostic:"
- Ends with monospace attribution: `◆ Signal type · Source · N=count · Confidence: HIGH`

## Testing Queries

Try these to see the LLM in action:

| Query | Expected Response |
|-------|-------------------|
| "What's the trust gap?" | Discusses 22-point gap between sentiment (78%) and behavior (56%) |
| "Dependable driver" | Analyzes crisis at 58/-6, behavioral correlation patterns |
| "Gen Z" | Cultural signals about peer-review trust, community-first UX |
| "Meaningful" | Bridge between functional satisfaction and emotional loyalty |
| "Competitor analysis" | Booking.com at 74, opportunity in Personal & Meaningful |
| "What should we do?" | Scenario recommendations based on Brand Fidelity data |

## Fallback Behavior

If the LLM call fails (API down, invalid key, network error):
1. Console shows the error
2. The system **automatically falls back** to hardcoded responses in `generateAnalystResponse()`
3. User sees a reasonable answer without realizing the LLM failed

This ensures the app is **always functional**, even without API access.

## Streaming & Performance

- **Streaming**: Response streams character-by-character for a smooth typewriter effect
- **Thinking Animation**: Pulsing dots appear while waiting for the LLM
- **Max Tokens**: Set to 512 for fast responses (2-3 paragraphs)
- **Model**: Claude Haiku 4.5 is optimized for fast, cost-effective inference

## Security Notes

### Why Client-Side is Safe Here

1. **Internal Prototype**: This is not a public app; it's for board presentations
2. **Static Hosting**: No backend server, no credentials exposure
3. **Browser-Only**: API key never leaves the user's browser
4. **Fallback Ready**: Works without the API if needed

### For Production Use

- Move API calls to a **backend server** (Node.js, Python, etc.)
- Backend signs requests and never exposes the key
- Frontend calls backend endpoint instead of Anthropic directly

## Customization

### Changing the System Prompt

Edit **`js/analyst-llm.js`**, function `buildSystemPrompt()`:

```javascript
buildSystemPrompt(mode, currentPage, brand) {
  // ... existing code ...
  return `You are the Material Analyst, ...`;
}
```

Modify the prompt string to change the analyst's personality, guidance style, or include different data.

### Changing the Model

In **`data/config.json`**:
```json
{
  "model": "claude-opus-4-6",
  "max_tokens": 1024
}
```

Options: `claude-opus-4-6`, `claude-sonnet-4-20250514`, `claude-haiku-4-5-20251001`

### Custom Response Parsing

Edit **`parseAnalystResponse()` in app.js** to add more markdown support:

```javascript
parseAnalystResponse(text) {
  let html = text;
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>'); // Add italics
  html = html.replace(/(◆[^◆]*)/g, '<span style="...">$1</span>');
  return html;
}
```

## Debugging

### Check API Key

In browser console:
```javascript
await AnalystLLM.loadConfig();
console.log(AnalystLLM.config);
```

Should show your loaded config (key will be masked in some cases).

### Monitor Network Calls

1. Open DevTools (F12)
2. Go to **Network** tab
3. Type a question in the Analyst panel
4. Look for requests to `api.anthropic.com/v1/messages`
5. Check the response for streaming SSE data

### View LLM Errors

Open DevTools **Console** and look for messages like:
```
LLM Error: API Error (401): Invalid API key
```

## API Costs

Claude Haiku 4.5 pricing (as of March 2026):
- **Input**: ~$0.80 per million tokens
- **Output**: ~$4.00 per million tokens

A typical response (512 tokens) costs **~$0.003** (1/3 cent).

For board presentations with occasional queries, expect negligible costs.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Blank response, no thinking animation | Check API key in `config.json` |
| "API Error (401): Invalid API key" | Verify key from console.anthropic.com |
| Slow responses | Check network speed; Haiku should respond in 1-2 seconds |
| Fallback to hardcoded responses | LLM failed gracefully; check console for errors |
| HTML formatting not rendering | Update `parseAnalystResponse()` function in app.js |

## Future Enhancements

- [ ] Add multi-turn conversation memory
- [ ] Surface confidence indicators per signal layer
- [ ] Cache common queries to reduce API calls
- [ ] Add scenario simulation integration
- [ ] Implement citation links to source data
- [ ] Add voice input/output for accessibility
- [ ] Stream to backend for audit logging

---

**Integration Date**: March 2026
**Model**: Claude Haiku 4.5 (claude-haiku-4-5-20251001)
**Status**: Ready for board presentation
