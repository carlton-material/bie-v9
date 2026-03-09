/* ═══════════════════════════════════════════════════════════
   Material Analyst LLM Integration
   Calls Claude Haiku via Anthropic API with streaming
   v2: Buffer flush, AbortController timeout, updated API version
   ═══════════════════════════════════════════════════════════ */

const AnalystLLM = {
  config: null,
  activeController: null,

  async loadConfig() {
    if (this.config) return this.config;
    try {
      const resp = await fetch('data/config.json');
      this.config = await resp.json();
      return this.config;
    } catch(e) {
      console.warn('Config not loaded, LLM disabled:', e);
      return null;
    }
  },

  buildSystemPrompt(mode, currentPage, brand) {
    const driverData = brand?.drivers || {};
    const inTheMoment = driverData.inTheMoment || [];
    const overTime = driverData.overTime || [];

    // Format driver scores
    const driverList = [
      ...inTheMoment.map(d => `${d.name} ${d.score}/${d.delta > 0 ? '+' : ''}${d.delta}`),
      ...overTime.map(d => `${d.name} ${d.score}/${d.delta > 0 ? '+' : ''}${d.delta}`)
    ].join(', ');

    const signalVolume = brand?.signalVolume || { humanExpressive: 0, behavioral: 0, cultural: 0, total: 0 };

    let modeContext = '';
    if (mode === 'guide') {
      modeContext = 'Guide mode: Ask Socratic questions to help the user discover insights. Use "Question:" prefix. Suggest patterns without pushing conclusions.';
    } else {
      modeContext = 'Guardian mode: Deliver direct analysis with full data attribution. Use "Diagnostic:" prefix for findings, cite signal sources in monospace at the end.';
    }

    return `You are the Material Analyst, an AI intelligence layer inside the Brand Intelligence Engine (BIE) built by Material+ (M+). You help brand strategists understand signal data through the lens of M+'s Brand Fidelity framework.

ROLE & CONTEXT:
${modeContext}

BRAND DATA (${brand?.name || 'Stayworthy'}):
- Composite: ${brand?.composite || 72} (${brand?.compositeDelta || -4})
- Drivers: ${driverList}
- Key Insight: ${brand?.keyInsight || 'Brand health data available'}
- Signals: ${signalVolume.humanExpressive} Human-Expressive, ${signalVolume.behavioral} Behavioral, ${signalVolume.cultural} Cultural (N=${signalVolume.total} total)
- Competitors: ${brand?.competitors?.slice(0, 3).map(c => `${c.name} (${c.composite})`).join(', ') || 'Data available'}

BRAND FIDELITY FRAMEWORK:
The 6 drivers are organized in two time horizons:
IN THE MOMENT (immediate experience):
  - User Friendly (72/-4): Meets my needs easily and reliably
  - Personal (64/-8): Understands my unique needs
  - Accessible (71/+1): Is always there when I need it

OVER TIME (long-term loyalty anchors):
  - Dependable (58/-6): Consistently provides a good experience [CRISIS DRIVER]
  - Meaningful (66/-3): Plays a significant role in my life
  - Salient (74/+2): Top-of-mind choice when need arises

SIGNAL TYPES:
- Human-Expressive: What people say (sentiment, interviews, qualitative)
- Behavioral: What people do (bookings, retention, interaction patterns)
- Cultural: Market context (trends, regulatory, macro shifts)

CURRENT PAGE: ${currentPage || 'Unknown'}

RESPONSE GUIDELINES:
- Keep responses concise: 2-3 paragraphs max
- Use data points when available
- Cite signal sources and layer types
- Include confidence indicators
- End with attribution in monospace: ◆ Signal type · Source · N=count · Confidence: HIGH/MEDIUM/LOW
- For Guide mode: Frame as questions to sharpen thinking
- For Guardian mode: Direct findings with data backing

Remember: You are analyzing brand health signals, not making business decisions. Your role is to illuminate patterns and surface opportunities.`;
  },

  /** Cancel any in-flight request */
  abort() {
    if (this.activeController) {
      this.activeController.abort();
      this.activeController = null;
    }
  },

  async callAPI(systemPrompt, userQuery, onChunk) {
    const config = await this.loadConfig();
    if (!config?.anthropic_api_key || config.anthropic_api_key === 'PASTE_YOUR_KEY_HERE') {
      throw new Error('API key not configured. Please set your Anthropic API key in data/config.json');
    }

    // Cancel any previous in-flight request
    this.abort();

    // Create AbortController with 30s timeout
    const controller = new AbortController();
    this.activeController = controller;
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const payload = {
      model: config.model || 'claude-haiku-4-5-20251001',
      max_tokens: config.max_tokens || 512,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userQuery
        }
      ],
      stream: true
    };

    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.anthropic_api_key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } catch(e) {
      clearTimeout(timeoutId);
      this.activeController = null;
      if (e.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds');
      }
      throw e;
    }

    if (!response.ok) {
      clearTimeout(timeoutId);
      this.activeController = null;
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const processLine = (line) => {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;

        try {
          const event = JSON.parse(data);
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            onChunk(event.delta.text);
          }
        } catch(e) {
          // Skip parsing errors for non-JSON lines
        }
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Flush remaining buffer — fixes data loss on stream end
          if (buffer.trim()) {
            processLine(buffer);
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          processLine(line);
        }
      }
    } finally {
      clearTimeout(timeoutId);
      this.activeController = null;
    }
  },

  async getAnalystResponse(query, mode, currentPage, brand, onChunk) {
    try {
      const systemPrompt = this.buildSystemPrompt(mode, currentPage, brand);
      await this.callAPI(systemPrompt, query, onChunk);
    } catch(e) {
      console.error('LLM Error:', e);
      throw e;
    }
  }
};
