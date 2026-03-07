# Code Reference — Key Integration Points

## 1. LLM Module Entry Point (`js/analyst-llm.js`)

```javascript
// Public interface - called from app.js
await AnalystLLM.getAnalystResponse(query, mode, currentPage, brand, onChunk)
```

**Parameters**:
- `query` (string) — User's question
- `mode` (string) — "guide" or "guardian"
- `currentPage` (string) — Current page context (e.g., "strategic-brief")
- `brand` (object) — Brand data with drivers, competitors, signals
- `onChunk` (function) — Callback that receives text chunks as they stream

---

## 2. App.js Integration Points

### Modified: `sendAnalystMessage(query, messages, input)`

```javascript
// BEFORE: Hardcoded 800ms delay with generateAnalystResponse()
// AFTER: Shows thinking animation + calls LLM

const thinkingMsg = document.createElement('div');
thinkingMsg.className = 'analyst-msg system thinking';
thinkingMsg.innerHTML = '<span class="thinking-dot"></span><span class="thinking-dot"></span><span class="thinking-dot"></span>';
messages.appendChild(thinkingMsg);

this.callAnalystLLM(query, messages, thinkingMsg);
```

### New: `async callAnalystLLM(query, messages, thinkingMsg)`

```javascript
try {
  const resp = document.createElement('div');
  resp.className = 'analyst-msg system';
  messages.replaceChild(resp, thinkingMsg);

  let fullResponse = '';
  await AnalystLLM.getAnalystResponse(query, this.analystMode, this.currentPage, this.brand, (chunk) => {
    fullResponse += chunk;
    resp.textContent = fullResponse;
    messages.scrollTop = messages.scrollHeight;
  });

  const htmlResponse = this.parseAnalystResponse(fullResponse);
  resp.innerHTML = htmlResponse;
  messages.scrollTop = messages.scrollHeight;
} catch(e) {
  console.warn('LLM failed, falling back:', e);
  // Falls back to hardcoded generateAnalystResponse()
}
```

### New: `parseAnalystResponse(text)`

```javascript
parseAnalystResponse(text) {
  let html = text;
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(◆[^◆]*)/g, '<span style="font-family:var(--font-mono);font-size:var(--text-nano);color:var(--text-muted)">$1</span>');
  html = html.replace(/\n\n/g, '</p><p>').replace(/^(.+)$/, '<p>$1</p>');
  return html;
}
```

---

## 3. System Prompt Construction (`js/analyst-llm.js`)

```javascript
buildSystemPrompt(mode, currentPage, brand) {
  // Format driver data
  const driverList = [
    ...inTheMoment.map(d => `${d.name} ${d.score}/${d.delta > 0 ? '+' : ''}${d.delta}`),
    ...overTime.map(d => `${d.name} ${d.score}/${d.delta > 0 ? '+' : ''}${d.delta}`)
  ].join(', ');

  // Mode-specific guidance
  const modeContext = mode === 'guide'
    ? 'Guide mode: Ask Socratic questions...'
    : 'Guardian mode: Deliver direct analysis with attribution...';

  // Build comprehensive prompt
  return `You are the Material Analyst...
BRAND DATA: ${brand.name}
Composite: ${brand.composite} (${brand.compositeDelta})
Drivers: ${driverList}
...
[Full context template]`;
}
```

**What the prompt includes**:
1. Role & context (Material Analyst inside BIE)
2. Mode behavior (Guide vs. Guardian)
3. Brand data (composite, all drivers, competitors)
4. Signal volume (Human-Expressive, Behavioral, Cultural)
5. Framework (6 drivers, In the Moment vs. Over Time)
6. Response guidelines (concise, cite sources, confidence)

---

## 4. API Call with Streaming (`js/analyst-llm.js`)

```javascript
async callAPI(systemPrompt, userQuery, onChunk) {
  const payload = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: userQuery }],
    stream: true
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.anthropic_api_key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify(payload)
  });

  // Process SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const event = JSON.parse(line.slice(6));
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          onChunk(event.delta.text); // Character-by-character callback
        }
      }
    }
  }
}
```

**Headers explained**:
- `x-api-key` — Your Anthropic API key (from config.json)
- `anthropic-version` — API version (required for streaming)
- `anthropic-dangerous-direct-browser-access` — Flag for browser-based client-side calls
- `content-type` — Always application/json for API calls

---

## 5. CSS Thinking Animation (`css/global.css`)

```css
/* Show thinking dots while waiting for LLM */
.analyst-msg.thinking {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 24px;
}

.thinking-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--signal-human);
  opacity: 0.4;
  animation: thinking-pulse 1.2s ease-in-out infinite;
}

.thinking-dot:nth-child(1) { animation-delay: 0s; }
.thinking-dot:nth-child(2) { animation-delay: 0.2s; }
.thinking-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes thinking-pulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}
```

---

## 6. HTML Script Loading (All 7 HTML files)

```html
<!-- BEFORE app.js is loaded, load the LLM module -->
<script src="js/analyst-llm.js"></script>
<script src="js/app.js"></script>
```

**Why before app.js**: `app.js` calls `AnalystLLM` methods, so the module must be available.

---

## 7. Config File Format (`data/config.json`)

```json
{
  "anthropic_api_key": "sk-ant-v4-YOUR_ACTUAL_KEY_HERE",
  "model": "claude-haiku-4-5-20251001",
  "max_tokens": 512
}
```

**Usage in code**:
```javascript
const config = await AnalystLLM.loadConfig();
// config.anthropic_api_key → Used in fetch headers
// config.model → Sets model in API payload
// config.max_tokens → Controls response length
```

---

## 8. Error Handling Pattern

```javascript
// In callAnalystLLM()
try {
  await AnalystLLM.getAnalystResponse(query, mode, page, brand, onChunk);
} catch(e) {
  console.warn('LLM failed, falling back:', e);
  // Automatically falls back to hardcoded response
  resp.innerHTML = this.generateAnalystResponse(query.toLowerCase());
}
```

**No user-visible error** — App gracefully degrades to hardcoded responses

---

## 9. Data Flow: Query to Response

```
User Input (text)
    ↓
sendAnalystMessage(query)
    ├─ Display user message
    └─ Create thinking animation
         ↓
callAnalystLLM(query, messages, thinkingMsg)
    ├─ Create response container
    └─ Call AnalystLLM.getAnalystResponse()
         ├─ Load config (API key)
         ├─ Build system prompt (with brand context)
         └─ Call callAPI(systemPrompt, query, onChunk)
              ├─ POST to https://api.anthropic.com/v1/messages
              ├─ Stream SSE response
              └─ Call onChunk() for each text chunk
                   ↓
                 Accumulate text in fullResponse
                 Update DOM in real-time (typewriter effect)
                   ↓
         Call parseAnalystResponse(fullResponse)
              └─ Convert markdown → HTML
                   ↓
                 Display formatted response
                 Auto-scroll to bottom
```

---

## 10. Mode Context in System Prompt

### Guide Mode (Socratic)
```javascript
"Guide mode: Ask Socratic questions to help the user discover insights.
Use 'Question:' prefix. Suggest patterns without pushing conclusions."
```

Example response pattern:
```
Question: You mentioned a 22-point gap between what users say and what
they do with their bookings. What do you think that gap tells us about
the functional vs. emotional dimensions of trust?
```

### Guardian Mode (Direct)
```javascript
"Guardian mode: Deliver direct analysis with full data attribution.
Use 'Diagnostic:' prefix for findings, cite signal sources in monospace
at the end."
```

Example response pattern:
```
Diagnostic: Stayworthy's trust metrics show a 22-point gap between
expressive sentiment (78%) and behavioral signals (56%).

◆ Human-Expressive + Behavioral signal correlation · N=847 · Confidence: HIGH
```

---

## 11. Testing Integration Locally

### Browser Console
```javascript
// Check if LLM module loaded
console.log(AnalystLLM);

// Load config
await AnalystLLM.loadConfig();
console.log(AnalystLLM.config);

// Test API call manually
await AnalystLLM.getAnalystResponse(
  "What's the trust gap?",
  "guide",
  "strategic-brief",
  BIE.brand,
  (chunk) => console.log(chunk)
);
```

### DevTools Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Submit analyst query
4. Look for request to `api.anthropic.com/v1/messages`
5. Check response preview (SSE events)

### Error Scenarios
```javascript
// Test fallback (disconnect network)
// Submit query while offline → Falls back to hardcoded response

// Test invalid key
// Edit config.json with bad key → API Error (401) → Fallback
```

---

## 12. Key Variables & Objects

| Variable | Type | Purpose |
|----------|------|---------|
| `BIE.brand` | object | Brand data (stayworthy.json loaded) |
| `BIE.currentPage` | string | Current page name (e.g., "strategic-brief") |
| `BIE.analystMode` | string | "guide" or "guardian" |
| `AnalystLLM.config` | object | Loaded config with API key |
| `fullResponse` | string | Accumulated LLM response text |
| `resp` | HTMLElement | Response message container in panel |
| `thinkingMsg` | HTMLElement | Thinking animation placeholder |

---

## 13. Extensibility Points

### To change system prompt
Edit `buildSystemPrompt()` in `js/analyst-llm.js` (line ~40)

### To change response formatting
Edit `parseAnalystResponse()` in `js/app.js` (line ~343)

### To change thinking animation
Edit CSS for `.thinking-dot` and `@keyframes thinking-pulse` in `css/global.css` (line ~272)

### To use different model
Edit `data/config.json` (change `model` field)

### To adjust response length
Edit `data/config.json` (change `max_tokens` field)

---

## 14. Common Queries & Expected Patterns

| Query | Mode | Expected Prefix |
|-------|------|-----------------|
| "trust gap" | guide | "Question: You mentioned..." |
| "trust gap" | guardian | "Diagnostic: Stayworthy's trust..." |
| "what to do" | either | Scenario + driver focus |
| "competitor" | either | Comparative analysis |
| "Gen Z" | cultural focus | Signal layer emphasis |
| "driver name" | either | Driver-specific analysis |

---

**Ready to integrate?** Start with `QUICK_START.md`

**Need full context?** See `LLM_INTEGRATION.md`

**Technical deep dive?** Read `IMPLEMENTATION_SUMMARY.md`
