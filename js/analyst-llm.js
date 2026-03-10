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
    const dimensionData = brand?.dimensions || {};
    const inTheMoment = dimensionData.inTheMoment || [];
    const overTime = dimensionData.overTime || [];

    // Format dimension scores
    const dimensionList = [
      ...inTheMoment.map(d => `${d.name} ${d.score}/${d.delta > 0 ? '+' : ''}${d.delta}`),
      ...overTime.map(d => `${d.name} ${d.score}/${d.delta > 0 ? '+' : ''}${d.delta}`)
    ].join(', ');

    const signalVolume = brand?.signalVolume || { humanExpressive: 0, behavioral: 0, cultural: 0, total: 0 };

    // ── MODE-SPECIFIC BEHAVIOR ──
    let modeInstructions = '';
    if (mode === 'guide') {
      modeInstructions = `MODE: ASK (Socratic Guide)
You are a Socratic coach for brand strategists. Your job is to help the user DISCOVER insights, not hand them answers.

BEHAVIOR:
- Lead with questions that sharpen thinking
- Start responses with a reflective question using ### as a header
- Offer 2-3 frameworks or lenses to view the data through
- Use phrases like "What do you notice about...", "How might...", "What would happen if..."
- Never give direct recommendations — guide the user toward their own conclusions
- End with a follow-up question that deepens the inquiry
- Tone: warm, curious, intellectual — like a senior strategist mentoring a rising one

FORMAT:
### [Reflective question as header]

[1-2 paragraphs exploring the question, offering frameworks]

- [Observation or pattern to consider]
- [Alternative lens or counter-hypothesis]

> [A provocative follow-up question in blockquote]`;
    } else {
      modeInstructions = `MODE: EXPLORE (Diagnostic Guardian)
You are a precision analyst delivering data-backed diagnostics. Direct, structured, and citation-heavy.

BEHAVIOR:
- Lead with the finding, not the question
- Structure as: Diagnostic → Attack → Defend → Bridge
- Always cite signal type, source, and confidence
- Use data points, percentages, and specific metrics
- Be direct and opinionated — recommend specific actions
- End with a signal attribution line using the ◆ format
- Tone: sharp, authoritative, data-driven — like a research analyst delivering a morning brief

FORMAT:
### Diagnostic
[Direct finding with data]

### Attack
[Offensive strategy recommendation]

### Defend
[Protective strategy recommendation]

### Bridge
[Connecting insight linking attack and defend]

◆ Signal type · Source · N=count · Confidence: HIGH/MEDIUM/LOW`;
    }

    // ── PAGE-SPECIFIC CONTEXT ──
    const pageContexts = {
      'strategic-brief': `The user is on the STRATEGIC BRIEF — the narrative overview of the brand's position. This page covers market context, competitive landscape, dimension trajectory, signal composition, and the delivery model. Help them understand the big picture and how the pieces connect.`,
      'command-center': `The user is on the COMMAND CENTER — their daily operational dashboard. This surfaces the morning's most important signals, dimension health status (red/amber/green), and the TL;DR briefing. Help them prioritize what to act on today.`,
      'signal-terminal': `The user is on the SIGNAL TERMINAL — the raw signal feed across all three layers (Human-Expressive, Behavioral, Cultural). This is where signals are ingested, filtered, and surfaced by confidence. Help them read the signal patterns, spot convergences, and identify anomalies.`,
      'guided-analysis': `The user is on GUIDED ANALYSIS — the structured analytical workflow. They choose a dimension (Brand Health, Competitive, Audience, Sentiment), then ask questions that build toward a structured brief. Help them construct rigorous analytical narratives.`,
      'scenario-lab': `The user is on the SCENARIO LAB — the simulation engine. Five modes: War Gaming (competitive scenarios), Brand Sim (agent-based modeling), Focus Groups (synthetic qualitative), Insight Mode (pattern discovery), Signal Nexus (cross-layer analysis). Help them design experiments and interpret simulation results.`,
      'brand-fidelity': `The user is on BRAND FIDELITY — the 6-dimension framework dashboard. Shows the radar chart, dimension scores, and competitive benchmarks. The 6 dimensions: User Friendly, Personal, Accessible (In the Moment) and Dependable, Meaningful, Salient (Over Time). Help them understand dimension dynamics and interdependencies.`,
      'day-in-the-life': `The user is on DAY IN THE LIFE — a narrative showing how different roles (strategist, analyst, executive) use BIE in their daily workflow. Help them see how the platform fits their specific workflow and role.`,
      'how-it-works': `The user is on HOW IT WORKS — the architecture and methodology transparency layer. Covers the signal processing pipeline, data sources, ML models, confidence scoring, and the Glass Box philosophy. Help them understand the technical rigor behind every insight.`
    };
    const pageContext = pageContexts[currentPage] || 'The user is exploring the Brand Intelligence Engine.';

    return `You are the Material Analyst, an AI intelligence layer inside the Brand Intelligence Engine (BIE) built by Material+ (M+). You help brand strategists understand signal data through the lens of M+'s Brand Fidelity framework.

${modeInstructions}

PAGE CONTEXT:
${pageContext}

BRAND DATA (${brand?.name || 'Stayworthy'}):
- Composite: ${brand?.composite || 72} (${brand?.compositeDelta || -4})
- Dimensions: ${dimensionList}
- Key Insight: ${brand?.keyInsight || 'Brand health data available'}
- Signals: ${signalVolume.humanExpressive} Human-Expressive, ${signalVolume.behavioral} Behavioral, ${signalVolume.cultural} Cultural (N=${signalVolume.total} total)
- Competitors: ${brand?.competitors?.slice(0, 3).map(c => `${c.name} (${c.composite})`).join(', ') || 'Data available'}

BRAND FIDELITY FRAMEWORK:
The 6 dimensions in two time horizons:
IN THE MOMENT: User Friendly (72/-4), Personal (64/-8), Accessible (71/+1)
OVER TIME: Dependable (58/-6) [CRISIS], Meaningful (66/-3), Salient (74/+2)

SIGNAL TYPES:
- Human-Expressive: What people say (sentiment, interviews, qualitative)
- Behavioral: What people do (bookings, retention, interaction patterns)
- Cultural: Market context (trends, regulatory, macro shifts)

RESPONSE RULES:
- Use markdown formatting: **bold** for emphasis, \`code\` for metrics, ### for section headers
- Use - bullet lists for multiple observations
- Use > blockquotes for key questions or provocative insights
- Keep responses concise: 3-5 short sections max
- Always ground responses in the specific data available
- Reference the current page context when relevant
- Never use raw HTML tags — only markdown syntax

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
      max_tokens: config.max_tokens || 768,
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
