/* ═══════════════════════════════════════════════════════════
   BRAND INTELLIGENCE ENGINE v9 - App Core
   Shared state, navigation, scroll reveal, number animations,
   intelligence feed, Material Analyst panel
   ═══════════════════════════════════════════════════════════ */

window.BIE = {
  brand: null,
  currentPage: null,

  analystMode: 'guide', // guide or guardian

  async init() {
    // Load brand config from registry
    await this.loadBrand();

    this.currentPage = document.body.dataset.page;
    this.initNav();
    this.initScrollReveal();
    this.initCountUp();
    this.initSparklines();
    this.initAnalyst();
    this.initFeed();
    this.initSignalPulse();
    this.initRadarChart();
    this.initGlassBox();
    this.hydrateBrandData();
    this.initOnboarding();

    document.body.classList.add('loaded');
  },

  // Load brand registry, then active brand data
  async loadBrand() {
    try {
      // Check URL param first
      const urlParams = new URLSearchParams(window.location.search);
      const brandParam = urlParams.get('brand');

      // Load brand registry
      const registryResp = await fetch('data/brands.json');
      const registry = await registryResp.json();
      this.registry = registry;

      // Determine which brand to load
      const brandId = brandParam || registry.activeBrand || 'stayworthy';
      const brandEntry = registry.brands.find(b => b.id === brandId) || registry.brands[0];

      // Load brand data file
      const dataFile = brandEntry.dataFile || `data/${brandId}.json`;
      const brandResp = await fetch(dataFile);
      this.brand = await brandResp.json();
      this.brand.isSynthetic = brandEntry.isSynthetic || false;

    } catch(e) {
      console.warn('Brand config not loaded, using defaults:', e);
      this.brand = { name: 'Stayworthy', composite: 72, delta: -4, isSynthetic: true };
      this.registry = { sectors: [] };
    }
  },

  hydrateBrandData() {
    if (!this.brand) return;

    // Simple field replacement: data-brand="name" → brand.name
    document.querySelectorAll('[data-brand]').forEach(el => {
      const field = el.dataset.brand;
      const value = this.resolveBrandField(field);
      if (value !== undefined) {
        el.textContent = value;
      }
    });
  },

  resolveBrandField(field) {
    // Support dot notation: "competitor.0.name" → brand.competitors[0].name
    const parts = field.split('.');
    let obj = this.brand;
    for (const part of parts) {
      if (obj === undefined || obj === null) return undefined;
      // Check if part is a number (array index)
      const idx = parseInt(part);
      if (!isNaN(idx) && Array.isArray(obj)) {
        obj = obj[idx];
      } else {
        obj = obj[part];
      }
    }
    return obj;
  },

  initRadarChart() {
    const radarContainer = document.getElementById('bf-radar');
    if (!radarContainer || !this.brand) return;

    const dimensions = this.brand.dimensions;
    const competitor = this.brand.competitors && this.brand.competitors[0];
    renderRadarChart('bf-radar', dimensions, {
      width: 400,
      height: 400,
      showCompetitor: true,
      competitorScore: competitor ? competitor.composite : 74,
      competitorLabel: competitor ? competitor.name : 'Booking.com'
    });
  },

  /* ── Navigation ── */
  initNav() {
    const items = document.querySelectorAll('.nav-item');
    items.forEach(item => {
      if (item.dataset.page === this.currentPage) {
        item.classList.add('active');
      }
    });
  },

  /* ── Scroll Reveal (Intersection Observer) ── */
  initScrollReveal() {
    const scrollRoot = document.querySelector('.app-content') || null;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          if (entry.target.dataset.stagger) {
            const children = entry.target.querySelectorAll('.reveal-child');
            children.forEach((child, i) => {
              child.style.transitionDelay = `${i * 100}ms`;
              child.classList.add('visible');
            });
          }
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px', root: scrollRoot });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  },

  /* ── Count-Up Animation ── */
  initCountUp() {
    const scrollRoot = document.querySelector('.app-content') || null;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = 'true';
          // Support both data-value (for .count-up class) and data-count (for other elements)
          const target = parseFloat(entry.target.dataset.value || entry.target.dataset.count);
          const decimals = (entry.target.dataset.decimals || 0) | 0;
          const prefix = entry.target.dataset.prefix || '';
          const suffix = entry.target.dataset.suffix || '';
          const duration = parseInt(entry.target.dataset.duration || 1500);
          const start = performance.now();

          const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * target;
            entry.target.textContent = prefix + current.toFixed(decimals) + suffix;
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      });
    }, { threshold: 0.5, root: scrollRoot });

    // Observe both .count-up elements and elements with data-count attribute
    document.querySelectorAll('.count-up, [data-count]').forEach(el => observer.observe(el));

    // Re-animate on tab focus
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Reset counted flag to allow re-animation
        document.querySelectorAll('.count-up, [data-count]').forEach(el => {
          el.dataset.counted = 'false';
        });
      }
    });
  },

  /* ── Sparkline SVG Generation ── */
  initSparklines() {
    // 7-day trend data for sparklines
    const sparklineData = {
      'sparkline-volume': [780, 795, 810, 803, 825, 838, 847],
      'sparkline-trust': [82, 80, 78, 76, 74, 73, 72],
      'sparkline-competitive': [69, 70, 71, 71, 72, 72, 72]
    };

    document.querySelectorAll('.cc-sparkline-svg').forEach(svg => {
      const id = svg.id;
      const data = sparklineData[id];
      if (!data) return;

      // Get stroke color from data attribute or use default
      const strokeColor = svg.dataset.color || 'var(--signal-human)';

      // Calculate sparkline dimensions
      const width = 100;
      const height = 40;
      const padding = 4;
      const plotWidth = width - (padding * 2);
      const plotHeight = height - (padding * 2);

      // Find min and max for scaling
      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min || 1;

      // Generate points
      const points = data.map((value, index) => {
        const x = padding + (index / (data.length - 1)) * plotWidth;
        const y = height - padding - ((value - min) / range) * plotHeight;
        return `${x},${y}`;
      }).join(' ');

      // Create SVG content with polyline and gradient
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('preserveAspectRatio', 'none');

      // Add gradient definition
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.setAttribute('id', `gradient-${id}`);
      gradient.setAttribute('x1', '0%');
      gradient.setAttribute('y1', '0%');
      gradient.setAttribute('x2', '0%');
      gradient.setAttribute('y2', '100%');

      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', 'var(--signal-human)');
      stop1.setAttribute('stop-opacity', '0.2');

      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', 'var(--signal-human)');
      stop2.setAttribute('stop-opacity', '0');

      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      defs.appendChild(gradient);
      svg.appendChild(defs);

      // Add polyline stroke
      const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      polyline.setAttribute('points', points);
      polyline.setAttribute('fill', 'none');
      polyline.setAttribute('stroke', strokeColor);
      polyline.setAttribute('stroke-width', '1.5');
      polyline.setAttribute('stroke-linejoin', 'round');
      polyline.setAttribute('stroke-linecap', 'round');
      svg.appendChild(polyline);

      // Add fill area under the line
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      const fillPoints = points + ` ${width - padding},${height - padding} ${padding},${height - padding}`;
      polygon.setAttribute('points', fillPoints);
      polygon.setAttribute('fill', `url(#gradient-${id})`);
      svg.appendChild(polygon);
    });
  },

  /* ── Material Analyst ── */
  initAnalyst() {
    const self = this; // Maintain context for nested functions
    const trigger = document.querySelector('.analyst-trigger');
    const panel = document.querySelector('.analyst-panel');
    if (!trigger || !panel) return;

    const closeBtn = panel.querySelector('.analyst-panel-close');
    const input = panel.querySelector('.analyst-panel-input input');
    const sendBtn = panel.querySelector('.analyst-panel-input button');
    const messages = panel.querySelector('.analyst-panel-messages');
    const suggestionsContainer = panel.querySelector('.analyst-panel-suggestions');
    const modeToggle = panel.querySelector('.analyst-mode-toggle');

    let isOpen = false;

    // Suggested questions: mode-aware, page-specific
    const suggestedQuestions = {
      guide: {
        'strategic-brief': [
          "What patterns do you see in these dimensions?",
          "Why might trust gap differ by segment?",
          "What story does this brief tell you?"
        ],
        'command-center': [
          "What would you prioritize first?",
          "What connects these signals?",
          "Which trend surprises you?"
        ],
        'signal-terminal': [
          "What signal pattern stands out?",
          "Why might these layers conflict?",
          "What hypothesis does this suggest?"
        ],
        'guided-analysis': [
          "What story do the dimensions tell?",
          "Where's the hidden opportunity?",
          "What assumption should we question?"
        ],
        'scenario-lab': [
          "What scenario feels most realistic?",
          "Which dimensions would cascade first?",
          "What risk are we not seeing?"
        ],
        'brand-fidelity': [
          "Why does Dependable matter most?",
          "How do In-Moment dimensions connect to Over Time?",
          "What would move this score fastest?"
        ],
        'day-in-the-life': [
          "How would your role use this?",
          "What's missing from this workflow?",
          "Which surface matters most to you?"
        ],
        'how-it-works': [
          "Why three signal layers?",
          "What makes this different from a survey?",
          "How does convergence work?"
        ],
        'default': [
          "What pattern stands out to you?",
          "What question should we ask first?",
          "What's your hypothesis?"
        ]
      },
      guardian: {
        'strategic-brief': [
          "Diagnose the trust gap",
          "Compare us vs. competitors",
          "Show dimension risk analysis"
        ],
        'command-center': [
          "What needs attention today?",
          "Surface anomalous signals",
          "Show market shift data"
        ],
        'signal-terminal': [
          "Show trending signals",
          "High-confidence findings only",
          "Where do layers converge?"
        ],
        'guided-analysis': [
          "Run full dimension diagnostic",
          "Identify biggest opportunity",
          "What should change first?"
        ],
        'scenario-lab': [
          "Best ROI scenario?",
          "Confidence on projections",
          "Model dimension cascade effects"
        ],
        'brand-fidelity': [
          "Diagnose Dependable crisis",
          "Which dimension moves composite most?",
          "Show competitive dimension comparison"
        ],
        'day-in-the-life': [
          "Key insights for my role",
          "ROI of each BIE surface",
          "What workflow saves most time?"
        ],
        'how-it-works': [
          "Explain signal processing pipeline",
          "Show confidence scoring methodology",
          "Data source coverage audit"
        ],
        'default': [
          "Surface the key insights",
          "Which dimensions need attention?",
          "Show me the data"
        ]
      }
    };

    const toggle = () => {
      isOpen = !isOpen;
      panel.classList.toggle('open', isOpen);
      trigger.style.display = isOpen ? 'none' : 'flex';
      if (isOpen && input) input.focus();
    };

    trigger.addEventListener('click', toggle);
    if (closeBtn) closeBtn.addEventListener('click', toggle);

    // Mode toggle setup
    if (modeToggle) {
      const modeButtons = modeToggle.querySelectorAll('.mode-btn');

      // Set initial data-active-mode on panel
      panel.setAttribute('data-active-mode', self.analystMode);

      modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          modeButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          self.analystMode = btn.dataset.mode;
          panel.setAttribute('data-active-mode', btn.dataset.mode);

          // Show mode description with mode-specific styling
          const description = self.getAnalystModeDescription(self.analystMode);
          if (description) {
            const descMsg = document.createElement('div');
            const modeClass = self.analystMode === 'guide' ? 'desc-guide' : 'desc-guardian';
            descMsg.className = `analyst-msg system mode-description ${modeClass}`;
            descMsg.innerHTML = description;
            messages.appendChild(descMsg);
            messages.scrollTop = messages.scrollHeight;
          }

          // Update input placeholder for mode
          if (input) {
            input.placeholder = self.analystMode === 'guide'
              ? 'What are you curious about?'
              : 'What do you need to know?';
          }

          // Re-render suggestions for current mode
          renderSuggestions();
        });
      });

      // Set initial mode button state
      const initialBtn = modeToggle.querySelector(`[data-mode="${self.analystMode}"]`);
      if (initialBtn) {
        initialBtn.classList.add('active');
      }
    }

    const contextMessages = {
      'strategic-brief': "You're reading the strategic brief — the narrative foundation of the brand intelligence picture. I can walk you through market dynamics, dimension trajectories, or competitive positioning. What catches your eye?",
      'how-it-works': "This is the architecture transparency layer — every methodology, data source, and confidence score exposed. Ask me about any signal type, pipeline stage, or analytical approach. I'll show my work.",
      'command-center': "Welcome to your Command Center — your daily operational intelligence. I've flagged `3 signals` that need attention this morning. The Dependable dimension is in critical territory.",
      'signal-terminal': "Signal Terminal active — monitoring `847 signals` across Human-Expressive, Behavioral, and Cultural layers. I can surface anomalies, convergences, or drill into any signal source.",
      'guided-analysis': "Ready for guided analysis. Tell me what you're trying to understand — a dimension, a competitive question, an audience segment — and I'll help you build a structured brief.",
      'scenario-lab': "Scenario Lab loaded — `650 agents`, 5 simulation modes. War gaming, brand simulation, focus groups, insight generation, or signal nexus. What strategy question are you testing?",
      'brand-fidelity': "Brand Fidelity dashboard — 6 dimensions across two time horizons. Composite at `72` with a `-4` delta. I can diagnose any dimension, compare competitive positions, or explain the framework.",
      'day-in-the-life': "Day in the Life — see how BIE fits into real workflows. I can personalize this narrative for your specific role: strategist, analyst, or executive."
    };

    // Initial context message (render only once to prevent duplicates)
    if (messages && this.currentPage && contextMessages[this.currentPage] && messages.children.length === 0) {
      const msg = document.createElement('div');
      msg.className = 'analyst-msg system mode-guide';
      msg.innerHTML = this.parseAnalystResponse(contextMessages[this.currentPage]);
      messages.appendChild(msg);
    }

    // Render suggested questions based on current mode + page
    const renderSuggestions = () => {
      if (!suggestionsContainer) return;
      const modeQuestions = suggestedQuestions[self.analystMode] || suggestedQuestions.guide;
      const questions = modeQuestions[self.currentPage] || modeQuestions['default'];
      suggestionsContainer.innerHTML = '';
      questions.forEach(q => {
        const pill = document.createElement('div');
        pill.className = 'analyst-suggestion-pill';
        pill.textContent = q;
        pill.addEventListener('click', () => {
          if (!isOpen) toggle();
          setTimeout(() => self.sendAnalystMessage(q, messages, input), 300);
        });
        suggestionsContainer.appendChild(pill);
      });
    };

    renderSuggestions();

    // Preset questions (used by some surfaces)
    const presetBtns = document.querySelectorAll('[data-analyst-preset]');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!isOpen) toggle();
        const query = btn.dataset.analystPreset;
        setTimeout(() => self.sendAnalystMessage(query, messages, input), 300);
      });
    });

    // Send message
    const send = () => {
      if (!input || !input.value.trim()) return;
      self.sendAnalystMessage(input.value, messages, input);
      input.value = '';
    };

    if (sendBtn) sendBtn.addEventListener('click', send);
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  },

  sendAnalystMessage(query, messages, input) {
    const userMsg = document.createElement('div');
    userMsg.className = 'analyst-msg user';
    userMsg.textContent = query;
    messages.appendChild(userMsg);

    // Show thinking animation with mode-specific accent
    const thinkingMsg = document.createElement('div');
    const modeClass = this.analystMode === 'guide' ? 'mode-guide' : 'mode-guardian';
    thinkingMsg.className = `analyst-msg system thinking ${modeClass}`;
    thinkingMsg.innerHTML = '<span class="thinking-dot"></span><span class="thinking-dot"></span><span class="thinking-dot"></span>';
    messages.appendChild(thinkingMsg);
    messages.scrollTop = messages.scrollHeight;

    // Try LLM first, fallback to hardcoded if fails
    this.callAnalystLLM(query, messages, thinkingMsg, input);
  },

  async callAnalystLLM(query, messages, thinkingMsg, input) {
    const suggestionsContainer = document.querySelector('.analyst-panel-suggestions');
    const self = this;
    let streamStarted = false;
    let resp;

    try {
      resp = document.createElement('div');
      const respModeClass = this.analystMode === 'guide' ? 'mode-guide' : 'mode-guardian';
      resp.className = `analyst-msg system ${respModeClass}`;
      messages.replaceChild(resp, thinkingMsg);
      streamStarted = true;
      messages.scrollTop = messages.scrollHeight;

      // Stream text character by character
      let fullResponse = '';
      await AnalystLLM.getAnalystResponse(query, this.analystMode, this.currentPage, this.brand, (chunk) => {
        fullResponse += chunk;
        resp.textContent = fullResponse;
        messages.scrollTop = messages.scrollHeight;
      });

      // Parse response to HTML (handle formatting, XSS-safe)
      const htmlResponse = this.parseAnalystResponse(fullResponse);
      resp.innerHTML = htmlResponse;
      messages.scrollTop = messages.scrollHeight;
    } catch(e) {
      console.warn('LLM failed, falling back to hardcoded responses:', e);
      // Fallback: use original hardcoded response - ALWAYS produces a response
      const fallback = document.createElement('div');
      fallback.className = 'analyst-msg system';
      fallback.innerHTML = this.generateAnalystResponse(query.toLowerCase());
      if (streamStarted && resp && resp.parentNode) {
        // Stream started but errored mid-way — replace the partial response
        messages.replaceChild(fallback, resp);
      } else if (thinkingMsg.parentNode) {
        // Stream never started — replace thinking dots
        messages.replaceChild(fallback, thinkingMsg);
      } else {
        // Neither exists (edge case) — just append
        messages.appendChild(fallback);
      }
      messages.scrollTop = messages.scrollHeight;
    }

    // Re-render mode-aware suggestions after response
    if (suggestionsContainer) {
      setTimeout(() => {
        // Re-use the initAnalyst renderSuggestions pattern inline
        suggestionsContainer.innerHTML = '';
        const modeKey = self.analystMode || 'guide';
        const followUpQuestions = {
          guide: {
            'strategic-brief': ["What else do you notice?", "How might this affect long-term loyalty?", "What would you test first?"],
            'command-center': ["What connects to yesterday?", "Which signal concerns you most?", "What would you investigate next?"],
            'signal-terminal': ["What's the counter-argument?", "Which signal do you trust most?", "What's missing from this picture?"],
            'guided-analysis': ["How confident are you in that?", "What would change your mind?", "What's the next question?"],
            'scenario-lab': ["What assumption are we making?", "How would competitors respond?", "What's the downside risk?"],
            'brand-fidelity': ["Which dimension surprises you?", "How do these connect?", "What would move the needle?"],
            'day-in-the-life': ["What resonates with your workflow?", "What's the biggest gap?", "What would you change?"],
            'how-it-works': ["What makes this defensible?", "Where are the limitations?", "What would you add?"],
            'default': ["Tell me more", "What's the implication?", "What should we explore next?"]
          },
          guardian: {
            'strategic-brief': ["Deep dive on Dependable", "Show competitive gaps", "Signal source breakdown"],
            'command-center': ["Drill into anomalies", "Week-over-week delta", "Priority action list"],
            'signal-terminal': ["Filter high-confidence only", "Cross-layer correlation", "Show source diversity"],
            'guided-analysis': ["Run sensitivity analysis", "Compare to category benchmark", "Show dimension interdependencies"],
            'scenario-lab': ["Model alternative scenario", "Stress test assumptions", "Show agent behavior distribution"],
            'brand-fidelity': ["Benchmark vs. category", "Dimension correlation matrix", "Trend trajectory 6-month"],
            'day-in-the-life': ["Time-to-insight metrics", "Surface usage analytics", "Compare role workflows"],
            'how-it-works': ["Pipeline latency stats", "Signal quality audit", "Coverage gap analysis"],
            'default': ["Go deeper", "Show the data", "What else should I know?"]
          }
        };
        const modeFollowUps = followUpQuestions[modeKey] || followUpQuestions.guide;
        const questions = modeFollowUps[self.currentPage] || modeFollowUps['default'];
        questions.forEach(q => {
          const pill = document.createElement('div');
          pill.className = 'analyst-suggestion-pill';
          pill.textContent = q;
          pill.addEventListener('click', () => {
            self.sendAnalystMessage(q, messages, input);
          });
          suggestionsContainer.appendChild(pill);
        });
      }, 500);
    }
  },

  parseAnalystResponse(text) {
    // Sanitize: strip any HTML tags from LLM output before formatting
    const sanitized = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Split into lines for block-level processing
    const lines = sanitized.split('\n');
    let html = '';
    let inList = false;
    let listType = 'ul';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Horizontal rule
      if (/^---+$/.test(line.trim())) {
        if (inList) { html += `</${listType}>`; inList = false; }
        html += '<hr>';
        continue;
      }

      // Headers (### and ####)
      if (/^#{3,4}\s+/.test(line)) {
        if (inList) { html += `</${listType}>`; inList = false; }
        const headerText = line.replace(/^#{3,4}\s+/, '');
        html += `<h4>${this._inlineMarkdown(headerText)}</h4>`;
        continue;
      }

      // Blockquote
      if (/^>\s+/.test(line)) {
        if (inList) { html += `</${listType}>`; inList = false; }
        const quoteText = line.replace(/^>\s+/, '');
        html += `<blockquote>${this._inlineMarkdown(quoteText)}</blockquote>`;
        continue;
      }

      // Unordered list item
      if (/^[-*]\s+/.test(line.trim())) {
        if (!inList || listType !== 'ul') {
          if (inList) html += `</${listType}>`;
          html += '<ul>';
          inList = true;
          listType = 'ul';
        }
        const itemText = line.trim().replace(/^[-*]\s+/, '');
        html += `<li>${this._inlineMarkdown(itemText)}</li>`;
        continue;
      }

      // Ordered list item
      if (/^\d+\.\s+/.test(line.trim())) {
        if (!inList || listType !== 'ol') {
          if (inList) html += `</${listType}>`;
          html += '<ol>';
          inList = true;
          listType = 'ol';
        }
        const itemText = line.trim().replace(/^\d+\.\s+/, '');
        html += `<li>${this._inlineMarkdown(itemText)}</li>`;
        continue;
      }

      // Signal attribution line (◆ ...)
      if (/◆/.test(line)) {
        if (inList) { html += `</${listType}>`; inList = false; }
        html += `<span class="signal-attribution">${this._inlineMarkdown(line)}</span>`;
        continue;
      }

      // Empty line = close list + paragraph break
      if (line.trim() === '') {
        if (inList) { html += `</${listType}>`; inList = false; }
        continue;
      }

      // Regular paragraph text
      if (inList) { html += `</${listType}>`; inList = false; }
      html += `<p>${this._inlineMarkdown(line)}</p>`;
    }

    if (inList) html += `</${listType}>`;
    return html;
  },

  /** Inline markdown: bold, italic, code, links */
  _inlineMarkdown(text) {
    let out = text;
    // Bold **text**
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic *text* (but not inside **)
    out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    // Inline code `text`
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    return out;
  },

  getAnalystModeDescription(mode) {
    const descriptions = {
      guide: `<strong>Ask mode</strong> — I'll guide your thinking with Socratic questions, helping you discover patterns and form your own strategic hypotheses. I won't hand you answers; I'll help you find them.`,
      guardian: `<strong>Explore mode</strong> — Direct diagnostics backed by signal data. I'll surface findings with confidence scores, cite sources, and structure responses as Diagnostic → Attack → Defend → Bridge.`
    };
    return descriptions[mode] || '';
  },

  generateAnalystResponse(query) {
    const isGuide = this.analystMode === 'guide';
    const brandName = this.brand?.name || 'The brand';
    const competitor = this.brand?.competitors?.[0];
    const competitorName = competitor?.name || 'Booking.com';

    // Fallback responses use markdown (parsed by parseAnalystResponse)
    const responses = {
      trust: {
        guide: `### What does the 22-point trust gap tell you?\n\nThere's a 22-point divergence between what users *say* about ${brandName} (expressive sentiment at 78%) and what they *do* (behavioral signals at 56%). That's a wide gap — and it's widening.\n\n- Consider the **functional vs. emotional** dimensions of trust\n- Which dimension might be at the root: \`User Friendly\` or \`Dependable\`?\n- How might segment differences explain the gap?\n\n> If trust is high in words but low in actions, what's the friction point in the booking experience?`,
        guardian: `### Diagnostic\n\n${brandName}'s trust metrics show a **22-point gap** between expressive sentiment (\`78%\`) and behavioral signals (\`56%\`). Gap widened 4 points in 6 weeks — a leading indicator of churn.\n\n### Attack\n\nDeploy transparent pricing pilot in top 3 markets to close User Friendly gap.\n\n### Defend\n\nMaintain Salient advantage (\`74, +2\`) through consistent booking experience.\n\n### Bridge\n\nPartner with verified-review platforms to convert stated trust into behavioral loyalty.\n\n◆ Human-Expressive + Behavioral signal correlation · N=847 · Confidence: HIGH`
      },
      competitor: {
        guide: `### Where's the real competitive opportunity?\n\n${competitorName} leads at \`74\`, but ${brandName} is closing at \`72\`. Look at *which* dimensions they're strong in vs. where the whitespace is.\n\n- **Personal** and **Meaningful** are both underdeveloped category-wide\n- ${competitorName} wins on Dependable (+8 vs category) and User Friendly (+6)\n- Neither brand owns the emotional loyalty space\n\n> Why do you think Personal and Meaningful are underserved across the whole category? What structural factor might explain that?`,
        guardian: `### Diagnostic\n\n${competitorName} leads at \`74\` BF composite, driven by Dependable (+8 vs category) and User Friendly (+6). ${brandName}'s opportunity lies in **Meaningful** and **Personal**, both underserved category-wide.\n\n### Attack\n\nInvest in Personal (\`64, -8\`) through ML-driven recommendation personalization.\n\n### Defend\n\nProtect Salient (\`74\`) through brand recall campaigns in peak booking season.\n\n### Bridge\n\nMeaningful (\`66, -3\`) bridges functional satisfaction to emotional loyalty.\n\n◆ Brand Fidelity Report 2026 · Travel Category · N=24,000 · Confidence: HIGH`
      },
      'gen z': {
        guide: `### How do you read the Gen Z paradox?\n\nGen Z engagement with peer-reviewed content is up **34%** despite lower trust in brands overall. They don't trust *you* — but they trust *communities you host*.\n\n- How does this paradox inform the **Meaningful** dimension?\n- What would a community-first experience actually look like?\n- Can you shift perception from transactional to belonging?\n\n> If Gen Z trusts communities more than brands, what would it take to make your platform feel like a community rather than a marketplace?`,
        guardian: `### Diagnostic\n\nGen Z trust in travel platforms declined **12% YoY**, but engagement with peer-reviewed content is up **34%**. They trust communities hosted on brand platforms, not the brands themselves.\n\n### Attack\n\nLaunch UGC-first booking experience with social proof at every decision point.\n\n### Bridge\n\nThis is a **Meaningful** dimension opportunity: make the platform a place Gen Z identifies with, not just transacts on.\n\n◆ Cultural + Behavioral signal cross-ref · TikTok, Reddit, Google Trends · Confidence: MEDIUM`
      },
      scenario: {
        guide: `### Which dimension moves first in a pricing intervention?\n\nIf you ran a transparent pricing pilot and saw a \`3.2-point\` composite lift, think about the cascade:\n\n- Would **User Friendly** move first (immediate experience)?\n- Or would Over Time dimensions like **Dependable** shift?\n- How do you expect the first mover to cascade into others?\n\n> What's your theory on whether functional fixes translate into emotional loyalty gains — and over what timeframe?`,
        guardian: `### Diagnostic\n\nStart with **Transparent Pricing** scenario. Directly targets User Friendly (\`72, -4\`).\n\n- Simulation: \`3.2 point\` composite lift over 8 weeks at 78% confidence\n- Alternative: Trust Recovery Campaign produces \`2.1 point\` lift with higher certainty (89%) but slower trajectory (12 weeks)\n\n### Attack\n\nPrioritize transparent pricing — higher ceiling, faster payoff.\n\n### Bridge\n\nBoth scenarios improve Dependable indirectly through operational trust signals.\n\n◆ BIE simulation · 650 agents · 100 iterations · Bass diffusion + softmax utility · Confidence: HIGH`
      },
      fidelity: {
        guide: `### Why does Dependable matter more than Personal right now?\n\nLooking at the 6 dimensions, **Dependable** is the crisis point at \`58\`. It's an Over Time dimension — it anchors long-term loyalty.\n\n- A **6-point decline** over 2 quarters signals something systemic\n- Personal (-8) is the biggest single delta, but operates at shorter horizons\n- Dependable defines whether customers *return*\n\n> What does a sustained Dependable decline tell you about the operational experience? And why might fixing it matter more than improving Personal right now?`,
        guardian: `### Diagnostic\n\n**Brand Fidelity — 6 Dimensions:**\n\n- In the Moment: User Friendly (\`72, -4\`) · Personal (\`64, -8\`) · Accessible (\`71, +1\`)\n- Over Time: Dependable (\`58, -6\`) · Meaningful (\`66, -3\`) · Salient (\`74, +2\`)\n\n### Key Insight\n\nDependable is the crisis dimension at \`58 (-6)\`. It anchors long-term loyalty and is dragging the composite. Personal (-8) is the biggest single delta but operates at shorter time horizons.\n\n◆ M+ Brand Fidelity Framework · 2X advocacy, 2.5X profitability, 3X differentiation · Confidence: HIGH`
      },
      meaningful: {
        guide: `### What would make the brand *meaningful* — not just useful?\n\nMeaningful sits at \`66\` with a **-3 decline**. It's the bridge between functional satisfaction and emotional loyalty.\n\n- What would a "Stories Worth Staying For" content program change about behavior?\n- How do you measure success beyond engagement metrics?\n- Can you create belonging, not just transactions?\n\n> Brands with high Meaningful dimension scores see 2.8X higher advocacy rates. What's the fastest path to making your brand mean something beyond its utility?`,
        guardian: `### Diagnostic\n\nMeaningful (\`66, -3\`) is the bridge between functional satisfaction and emotional loyalty. Brands with high Meaningful scores see **2.8X** higher advocacy rates.\n\n### Attack\n\nLaunch a "Stories Worth Staying For" content series. Turn property stays into narratives.\n\n### Defend\n\nDon't let Meaningful erosion cascade into Dependable. Monitor monthly.\n\n◆ BF Report 2026 · Cross-category analysis · N=229 brands · Confidence: HIGH`
      },
      dependable: {
        guide: `### What's breaking the Dependable promise?\n\nDependable is in critical territory at \`58 (-6)\`. The behavioral data says **73%** of its decline correlates with post-booking experience.\n\n- If you could fix just the top 3 operational pain points — cancellation friction, response time, billing — which comes first?\n- What's your theory on the root cause?\n- Is this perception or reality?\n\n> Behavioral signals don't lie. If 73% of the decline is post-booking, is the brand problem actually a product problem?`,
        guardian: `### Diagnostic\n\nDependable (\`58, -6\`) is in critical territory. This is the most influential Over Time dimension. A 6-point decline over 2 quarters signals **systemic operational issues**, not just perception.\n\n### Attack\n\nAudit and fix the top 5 operational pain points surfaced in behavioral signals:\n\n- Cancellation friction\n- Response time\n- Billing accuracy\n\n### Bridge\n\nBehavioral data shows **73%** of Dependable declines correlate with post-booking experience, not pre-booking perception.\n\n◆ Behavioral signal cluster analysis · Booking + post-stay data · N=312 signals · Confidence: HIGH`
      }
    };

    for (const [key, responseObj] of Object.entries(responses)) {
      if (key !== 'default' && query.includes(key)) {
        const raw = isGuide ? responseObj.guide : responseObj.guardian;
        return this.parseAnalystResponse(raw);
      }
    }

    const defaultGuide = "### Let me help you find the thread...\n\nWhat pattern do you notice first when you look at these dimensions? The Human-Expressive signals suggest one story, but Behavioral signals tell something different.\n\n> *Try asking about: trust gap, competitors, Gen Z, scenarios, Brand Fidelity dimensions, Meaningful, or Dependable.*";
    const defaultGuardian = "### Cross-referencing signal layers...\n\nThe Human-Expressive data suggests one pattern, but Behavioral signals tell a different story. Let me surface the specific data points and confidence scores.\n\n> *Try asking about: trust gap, competitors, Gen Z, scenarios, Brand Fidelity dimensions, Meaningful, or Dependable.*";

    return this.parseAnalystResponse(isGuide ? defaultGuide : defaultGuardian);
  },

  /* ── RSS Intelligence Feed ── */
  async initFeed() {
    const ticker = document.querySelector('.feed-ticker-track');
    if (!ticker) return;

    // Static feed items — always the backbone of the ticker
    const staticItems = [
      { source: 'Strategy+Business', text: 'AI-native analytics platforms projected to capture 40% of brand tracking spend by 2028', time: '2h' },
      { source: 'Adweek', text: 'Gen Z brand loyalty metrics show fundamental shift toward experience-over-product', time: '3h' },
      { source: 'CNBC', text: 'Airbnb reports 23% increase in long-stay bookings, signaling structural shift in travel behavior', time: '4h' },
      { source: 'HBR', text: 'Companies with real-time brand intelligence see 2.5x faster response to competitive threats', time: '5h' },
      { source: 'Skift', text: 'Barcelona announces plan to phase out all STR licenses by 2028. Regulatory wave accelerates', time: '5h' },
      { source: 'Marketing Week', text: 'Brand tracking industry faces disruption as AI synthesis replaces periodic survey models', time: '6h' },
      { source: 'TechCrunch', text: 'New study: multi-signal brand measurement outperforms single-source tracking by 340%', time: '7h' },
      { source: 'Bloomberg', text: 'Travel sector brand valuations diverge sharply as digital-native platforms gain trust edge', time: '8h' },
      { source: 'Phocuswire', text: 'Google Travel expanding AI trip planning. OTA disintermediation risk intensifies', time: '8h' },
      { source: 'Forrester', text: 'Real-time competitive intelligence now cited as top priority by 67% of CMOs surveyed', time: '9h' },
      { source: 'McKinsey', text: 'Predictive brand health models reduce customer churn intervention costs by 45%', time: '10h' },
      { source: 'Reuters', text: 'Hospitality sector sees record M&A activity driven by brand portfolio consolidation', time: '11h' },
      { source: 'WSJ', text: 'Consumer trust in AI-powered services reaches inflection point: 52% now comfortable with AI recommendations', time: '12h' },
      { source: 'Financial Times', text: 'Southeast Asian travel market surges 47% YoY, signaling next frontier for brand expansion', time: '13h' },
      { source: 'ESOMAR', text: 'Synthetic research methodologies gain credibility: 38% of research budgets shifting to AI-augmented approaches', time: '14h' },
      { source: 'Skift', text: 'Booking Holdings invests $500M in AI-driven loyalty personalization platform', time: '15h' },
      { source: 'Adweek', text: 'TikTok becomes #1 travel inspiration source for under-30 travelers. Cultural signal shift', time: '16h' },
      { source: 'CNBC', text: 'Climate-conscious travel segment grows 63%. Sustainability signals now material for brand health', time: '17h' },
      { source: 'HBR', text: 'The trust premium: brands with transparent pricing see 28% higher repeat booking rates', time: '18h' },
      { source: 'Bloomberg', text: 'Private equity exits in hospitality sector accelerate as brand valuations compress', time: '19h' },
    ];

    // Blend: try to sprinkle in a few live signals from the API
    let liveItems = [];
    if (typeof BIEApi !== 'undefined') {
      try {
        const result = await BIEApi.getFeed(8);
        if (result.items && result.items.length > 0 && result.source === 'live') {
          liveItems = result.items.map(item => ({
            ...item,
            _live: true  // Mark live items for the dot color
          }));
          // Live signals blended into ticker
        }
      } catch { /* silent — static ticker works fine alone */ }
    }

    // Interleave: every 3rd-4th item is a live signal (if available)
    let items = [...staticItems];
    if (liveItems.length > 0) {
      const blended = [];
      let liveIdx = 0;
      for (let i = 0; i < items.length; i++) {
        blended.push(items[i]);
        // Insert a live item every 3 static items
        if ((i + 1) % 3 === 0 && liveIdx < liveItems.length) {
          blended.push(liveItems[liveIdx++]);
        }
      }
      // Append any remaining live items at the end
      while (liveIdx < liveItems.length) blended.push(liveItems[liveIdx++]);
      items = blended;
    }

    // Render ticker with seamless loop + hover-pause + link-out
    const renderTicker = (tickerItems) => {
      const allItems = [...tickerItems, ...tickerItems];
      ticker.innerHTML = allItems.map(item => {
        const cls = `feed-item${item._live ? ' feed-item--live' : ''}`;
        const inner = `
          <span class="feed-item-dot"></span>
          <span class="feed-item-source">${item.source}</span>
          <span class="feed-item-text">${item.text}</span>
          <span class="feed-item-time">${item.time || ''}</span>
        `;
        if (item.url && item._live) {
          return `<a class="${cls} feed-item--link" href="${item.url}" target="_blank" rel="noopener">${inner}</a>`;
        }
        return `<span class="${cls}">${inner}</span>`;
      }).join('');
    };

    renderTicker(items);

    // Hover-pause: stop animation when user hovers over ticker
    const feedEl = ticker.closest('.feed-ticker');
    if (feedEl) {
      feedEl.addEventListener('mouseenter', () => { ticker.style.animationPlayState = 'paused'; });
      feedEl.addEventListener('mouseleave', () => { ticker.style.animationPlayState = 'running'; });
    }
  },

  /* ── Signal Pulse (ambient activity indicator) ── */
  async initSignalPulse() {
    const countEl = document.querySelector('.signal-count');
    if (!countEl) return;

    // Get authoritative signal count from signals-metadata.json
    let count = countEl.textContent || '862'; // fallback to HTML hardcoded value

    try {
      const resp = await fetch('data/signals-metadata.json');
      if (resp.ok) {
        const metadata = await resp.json();
        if (metadata.metrics?.signalCounts?.total) {
          count = metadata.metrics.signalCounts.total;
        }
      }
    } catch (e) {
      // Silently fail and use fallback value
      console.debug('[BIE] Could not fetch signals-metadata.json, using fallback');
    }

    countEl.textContent = count;
  },

  /* ── Onboarding Wizard ── */
  initOnboarding() {
    // Check if user has already seen the onboarding
    if (localStorage.getItem('bie-onboarded')) {
      this.addHelpButton();
      return;
    }

    const steps = [
      {
        title: 'Welcome to BIE',
        description: 'The Brand Intelligence Engine transforms how you understand brand health. Not just what people say, but what they do, feel, and share. Real-time intelligence, zero guesswork.',
        visual: 'pulse'
      },
      {
        title: 'Brand Fidelity: Six Dimensions of Brand Fidelity',
        description: 'Every insight maps to six measurable dimensions: three "In the Moment" (User Friendly, Personal, Accessible) and three "Over Time" (Dependable, Meaningful, Salient). Together, they reveal the full picture.',
        visual: 'dimensions'
      },
      {
        title: 'Intelligence That Moves With Your Day',
        description: 'From your morning briefing to midnight autonomous scans, BIE surfaces the right insight at the right moment. Every surface connects through the Brand Fidelity thread.',
        visual: 'timeline'
      },
      {
        title: 'Meet Your M+ Intelligence Partner',
        description: 'Two modes, one goal: clarity. Socratic Guide asks the questions that sharpen your thinking. Guardian of Data delivers precise, attributed answers. Toggle between them anytime.',
        visual: 'analyst'
      },
      {
        title: 'Begin Your Intelligence Journey',
        description: 'Navigate the sidebar to explore each surface. Start with the Strategic Brief for the big picture, or dive into Day in the Life to see the platform in action.',
        visual: 'arrow'
      }
    ];

    // Create overlay DOM
    const overlay = document.createElement('div');
    overlay.className = 'onboarding-overlay active';

    const card = document.createElement('div');
    card.className = 'onboarding-card';

    // Step indicators
    const indicators = document.createElement('div');
    indicators.className = 'onboarding-step-indicator';
    steps.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = `onboarding-dot ${i === 0 ? 'active' : ''}`;
      indicators.appendChild(dot);
    });
    card.appendChild(indicators);

    // Title
    const title = document.createElement('h2');
    title.className = 'onboarding-title';
    title.style.setProperty('white-space', 'normal', 'important');
    title.style.setProperty('overflow', 'visible', 'important');
    title.style.setProperty('text-overflow', 'unset', 'important');
    title.style.setProperty('word-wrap', 'break-word', 'important');
    card.appendChild(title);

    // Description
    const description = document.createElement('p');
    description.className = 'onboarding-description';
    card.appendChild(description);

    // Visual
    const visual = document.createElement('div');
    visual.className = 'onboarding-visual';
    card.appendChild(visual);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'onboarding-actions';
    card.appendChild(actions);

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // State
    let currentStep = 0;

    const updateStep = () => {
      const step = steps[currentStep];

      // Add transition animation
      card.classList.remove('transition');
      void card.offsetWidth; // Trigger reflow
      card.classList.add('transition');

      title.textContent = step.title;
      description.textContent = step.description;

      // Update indicators with smooth transition
      const dots = card.querySelectorAll('.onboarding-dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentStep);
      });

      // Update visual
      visual.innerHTML = this.generateOnboardingVisual(step.visual);

      // Update button labels and visibility
      const prevBtn = actions.querySelector('.onboarding-btn-prev');
      const nextBtn = actions.querySelector('.onboarding-btn-next');
      const skipBtn = actions.querySelector('.onboarding-btn-skip');

      if (currentStep === steps.length - 1) {
        nextBtn.textContent = 'Get Started';
      } else {
        nextBtn.textContent = 'Next';
      }

      // Hide Previous button on step 0, hide Skip button on last step
      prevBtn.style.display = currentStep === 0 ? 'none' : 'inline-flex';
      skipBtn.style.display = currentStep === steps.length - 1 ? 'none' : 'inline-flex';
    };

    const skipOnboarding = () => {
      localStorage.setItem('bie-onboarded', 'true');
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
      this.addHelpButton();
    };

    // Navigation buttons
    const prevBtn = document.createElement('button');
    prevBtn.className = 'onboarding-btn onboarding-btn-skip onboarding-btn-prev';
    prevBtn.textContent = 'Previous';
    prevBtn.style.display = 'none';
    prevBtn.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep--;
        updateStep();
      }
    });

    const skipBtn = document.createElement('button');
    skipBtn.className = 'onboarding-btn onboarding-btn-skip';
    skipBtn.textContent = 'Skip';
    skipBtn.addEventListener('click', skipOnboarding);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'onboarding-btn onboarding-btn-primary onboarding-btn-next';
    nextBtn.textContent = 'Next';
    nextBtn.addEventListener('click', () => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        updateStep();
      } else {
        skipOnboarding();
      }
    });

    actions.appendChild(prevBtn);
    actions.appendChild(skipBtn);
    actions.appendChild(nextBtn);

    // Initialize first step
    updateStep();
  },

  generateOnboardingVisual(type) {
    const svgNS = 'http://www.w3.org/2000/svg';

    switch(type) {
      case 'pulse':
        // Phosphor icon with animated pulse ring
        return `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 140px; height: 140px; margin: 0 auto;">
            <div style="position: absolute; width: 100px; height: 100px; border-radius: 50%; border: 1.5px solid rgba(116,90,255,0.4); animation: onboardPulse 2s ease-out infinite;"></div>
            <div style="position: absolute; width: 120px; height: 120px; border-radius: 50%; border: 1px solid rgba(116,90,255,0.2); animation: onboardPulse 2s ease-out infinite 0.4s;"></div>
            <div style="width: 72px; height: 72px; border-radius: 50%; background: rgba(116,90,255,0.15); border: 1.5px solid rgba(116,90,255,0.5); display: flex; align-items: center; justify-content: center;">
              <i class="ph ph-chart-line-up" style="font-size: 32px; color: #745AFF;"></i>
            </div>
          </div>
          <style>
            @keyframes onboardPulse {
              0% { transform: scale(0.8); opacity: 0.8; }
              100% { transform: scale(1.2); opacity: 0; }
            }
          </style>
        `;

      case 'dimensions':
        // Official Brand Fidelity wheel image
        return `
          <div style="display: flex; align-items: center; justify-content: center;">
            <img src="assets/images/fidelity-wheel.png" alt="Brand Fidelity Framework — Six Dimensions" style="max-width: 200px; width: 100%; height: auto; border-radius: 8px;">
          </div>
        `;

      case 'timeline':
        // Timeline dots (6AM → 9AM → 12PM → 3PM → 9PM → 11:45PM) evenly spaced
        return `
          <svg width="420" height="100" viewBox="0 0 420 100" fill="none">
            <line x1="30" y1="45" x2="390" y2="45" stroke="#745AFF" stroke-width="1.5" opacity="0.3"/>
            <circle cx="30" cy="45" r="5" fill="#745AFF" opacity="0.5"/>
            <circle cx="102" cy="45" r="5" fill="#745AFF" opacity="0.6"/>
            <circle cx="174" cy="45" r="5" fill="#745AFF" opacity="0.7"/>
            <circle cx="246" cy="45" r="5" fill="#745AFF" opacity="0.75"/>
            <circle cx="318" cy="45" r="5" fill="#745AFF" opacity="0.85"/>
            <circle cx="390" cy="45" r="6" fill="#745AFF"/>
            <text x="30" y="72" font-size="11" font-family="Inter" fill="#745AFF" text-anchor="middle" opacity="0.6">6 AM</text>
            <text x="102" y="72" font-size="11" font-family="Inter" fill="#745AFF" text-anchor="middle" opacity="0.6">9 AM</text>
            <text x="174" y="72" font-size="11" font-family="Inter" fill="#745AFF" text-anchor="middle" opacity="0.7">12 PM</text>
            <text x="246" y="72" font-size="11" font-family="Inter" fill="#745AFF" text-anchor="middle" opacity="0.7">3 PM</text>
            <text x="318" y="72" font-size="11" font-family="Inter" fill="#745AFF" text-anchor="middle" opacity="0.8">9 PM</text>
            <text x="390" y="72" font-size="11" font-family="Inter" fill="#745AFF" text-anchor="middle" opacity="0.9">11:45 PM</text>
          </svg>
        `;

      case 'analyst':
        // Purple circle with Phosphor plus icon and mode labels
        return `
          <svg width="220" height="140" viewBox="0 0 220 140" fill="none">
            <!-- Purple circle background -->
            <circle cx="110" cy="45" r="35" fill="#745AFF"/>
            
            <!-- Phosphor plus icon (white) -->
            <line x1="110" y1="25" x2="110" y2="65" stroke="white" stroke-width="3" stroke-linecap="round"/>
            <line x1="90" y1="45" x2="130" y2="45" stroke="white" stroke-width="3" stroke-linecap="round"/>

            <!-- Mode labels -->
            <g transform="translate(5, 80)">
              <rect x="0" y="0" width="100" height="36" rx="8" fill="rgba(129,140,248,0.15)" stroke="rgba(129,140,248,0.4)" stroke-width="1"/>
              <text x="50" y="18" font-size="11" font-family="Inter" fill="#818cf8" text-anchor="middle" font-weight="500" dominant-baseline="central">Socratic Guide</text>
            </g>

            <g transform="translate(115, 80)">
              <rect x="0" y="0" width="100" height="36" rx="8" fill="rgba(52,211,153,0.15)" stroke="rgba(52,211,153,0.4)" stroke-width="1"/>
              <text x="50" y="18" font-size="11" font-family="Inter" fill="#34d399" text-anchor="middle" font-weight="500" dominant-baseline="central">Guardian Data</text>
            </g>
          </svg>
        `;

      case 'arrow':
        // Arrow pointing left (toward nav)
        return `
          <svg width="180" height="120" viewBox="0 0 180 120" fill="none">
            <line x1="30" y1="60" x2="150" y2="60" stroke="#745AFF" stroke-width="2" opacity="0.3"/>
            <path d="M 30 60 L 50 45 M 30 60 L 50 75" stroke="#745AFF" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="50" cy="60" r="4" fill="#745AFF" opacity="0.6"/>
            <circle cx="90" cy="60" r="4" fill="#745AFF" opacity="0.7"/>
            <circle cx="130" cy="60" r="4" fill="#745AFF" opacity="0.8"/>
            <text x="90" y="105" font-size="10" fill="#745AFF" opacity="0.6" font-family="Inter" text-anchor="middle">Explore the sidebar</text>
          </svg>
        `;

      default:
        return '';
    }
  },

  /* ── Glass Box: Data Provenance System ── */
  glassBoxMeta: null,

  async initGlassBox() {
    // Fetch metadata, but toggles work regardless
    try {
      const resp = await fetch('data/signals-metadata.json');
      this.glassBoxMeta = await resp.json();
    } catch(e) {
      console.warn('Glass Box metadata not loaded');
    }

    // Wire up all "Show My Work" toggles — UNCONDITIONAL, always works
    document.querySelectorAll('.glass-box-toggle').forEach(toggle => {
      const targetId = toggle.dataset.target;
      const content = targetId ? document.getElementById(targetId) : toggle.closest('.glass-box-panel')?.querySelector('.glass-box-content');
      if (!content) return;

      toggle.setAttribute('aria-expanded', 'false');
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        content.classList.toggle('expanded', !expanded);

        // Update button text and chevron
        const chevron = toggle.querySelector('.chevron');
        if (!expanded) {
          // Expanding: show "Hide My Work ▴"
          toggle.innerHTML = 'Hide My Work <span class="chevron">▴</span>';
        } else {
          // Collapsing: show "Show My Work ▾"
          toggle.innerHTML = 'Show My Work <span class="chevron">▾</span>';
        }
      });
    });

    // Render Glass Box content into containers (graceful fail if metadata missing)
    this.renderGlassBoxPanels();

    // Add confidence halos to metric cards (graceful fail if metadata missing)
    this.applyConfidenceHalos();
  },

  renderGlassBoxPanels() {
    const meta = this.glassBoxMeta;
    if (!meta) return;

    // Render pipeline runs into any .glass-box-pipeline-container
    document.querySelectorAll('.glass-box-pipeline-container').forEach(container => {
      container.innerHTML = this.renderPipelineRuns(meta.pipelineRuns);
    });

    // Render source tiers into any .glass-box-tiers-container
    document.querySelectorAll('.glass-box-tiers-container').forEach(container => {
      container.innerHTML = this.renderSourceTiers(meta.sourceTiers);
    });

    // Render methodology into any .glass-box-methodology-container
    document.querySelectorAll('.glass-box-methodology-container').forEach(container => {
      const metricKey = container.dataset.metric || 'brandFidelity';
      const metric = meta.metrics[metricKey];
      if (metric?.composite) {
        container.innerHTML = this.renderMethodology(metric.composite);
      }
    });

    // Render assumptions into any .glass-box-assumptions-container
    document.querySelectorAll('.glass-box-assumptions-container').forEach(container => {
      const metricKey = container.dataset.metric || 'brandFidelity';
      const metric = meta.metrics[metricKey];
      if (metric?.composite?.assumptions) {
        container.innerHTML = this.renderAssumptions(metric.composite.assumptions);
      }
    });

    // Render last-updated timestamps
    document.querySelectorAll('.glass-box-timestamp-container').forEach(container => {
      const ts = meta.lastUpdated;
      container.innerHTML = this.renderLastUpdated(ts, meta.metrics.signalCounts.total);
    });
  },

  renderPipelineRuns(runs) {
    if (!runs || !runs.length) return '';
    return `
      <div class="glass-box-pipeline">
        <div class="glass-box-pipeline-label">Recent Pipeline Runs</div>
        ${runs.map(run => {
          const d = new Date(run.timestamp);
          const timeStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          return `
            <div class="glass-box-pipeline-run">
              <span class="pipeline-status ${run.status}">${run.status === 'success' ? '✓' : '✗'} ${run.status}</span>
              <span class="pipeline-timestamp">${timeStr}</span>
              <span class="pipeline-source">${run.source}</span>
              <span class="pipeline-counts">${run.validated} validated · ${run.stored} stored</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderSourceTiers(tiers) {
    if (!tiers) return '';
    const order = ['primary', 'secondary', 'tertiary', 'internal'];
    return `
      <div class="glass-box-tiers">
        <div class="glass-box-tiers-label">Data Source Tiers</div>
        ${order.map(key => {
          const tier = tiers[key];
          if (!tier) return '';
          return `
            <div class="glass-box-tier">
              <div class="glass-box-tier-header">
                <span>${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <span class="glass-box-tier-weight">${Math.round(tier.weight * 100)}%</span>
              </div>
              <div class="glass-box-tier-sources">
                ${tier.sources.map(src => {
                  const badge = src.type === 'ai-enriched' ? '<span class="data-status-badge ai-enriched">AI</span>' :
                                src.type === 'internal' ? '<span class="data-status-badge internal">INT</span>' :
                                '<span class="data-status-badge research">RES</span>';
                  const name = src.url ? `<a href="${src.url}" target="_blank">${src.name}</a>` : src.name;
                  return `<div class="glass-box-tier-source">${badge} ${name}</div>`;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderMethodology(composite) {
    if (!composite) return '';
    return `
      <div class="glass-box-methodology">
        <div class="glass-box-methodology-label">Calculation Methodology</div>
        ${composite.formula ? `<div class="glass-box-formula">${composite.formula}</div>` : ''}
        ${composite.approach ? `<div class="glass-box-approach">${composite.approach}</div>` : ''}
      </div>
    `;
  },

  renderAssumptions(assumptions) {
    if (!assumptions || !assumptions.length) return '';
    return `
      <div class="glass-box-assumptions">
        <div class="glass-box-assumptions-label">Assumptions</div>
        ${assumptions.map((a, i) => `
          <div class="glass-box-assumption">
            <span class="glass-box-assumption-number">${i + 1}.</span>
            <span>${a}</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderLastUpdated(timestamp, recordCount) {
    const d = new Date(timestamp);
    const timeStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `
      <div class="glass-box-timestamp">
        <span class="glass-box-timestamp-icon">⟳</span>
        <span class="glass-box-timestamp-label">Last Updated</span>
        <span>${timeStr}</span>
        <span class="glass-box-timestamp-value">${recordCount ? recordCount + ' signals' : ''}</span>
      </div>
    `;
  },

  applyConfidenceHalos() {
    const meta = this.glassBoxMeta;
    if (!meta?.metrics?.brandFidelity) return;

    // Confidence halo on composite section removed — too visually noisy

    // Apply data-status badges to dimension cards
    document.querySelectorAll('.cc-dimension').forEach(card => {
      const dimensionName = card.querySelector('.cc-dimension-header span')?.textContent?.trim().toLowerCase().replace(/\s+/g, '');
      if (!dimensionName) return;

      // Map display names to metric keys
      const keyMap = { 'userfriendly': 'userFriendly', 'personal': 'personal', 'accessible': 'accessible', 'dependable': 'dependable', 'meaningful': 'meaningful', 'salient': 'salient' };
      const key = keyMap[dimensionName];
      if (!key) return;

      const dimension = meta.metrics.brandFidelity.dimensions[key];
      if (!dimension) return;

      // Add confidence and data-status badges
      const existingBadges = card.querySelector('.dimension-badges');
      if (!existingBadges) {
        const badges = document.createElement('div');
        badges.className = 'dimension-badges';
        badges.style.cssText = 'display:flex;gap:4px;margin-top:4px;';
        badges.innerHTML = `
          <span class="confidence-badge ${dimension.confidence}">${dimension.confidence}</span>
          <span class="data-status-badge ${dimension.dataStatus}">${dimension.dataStatus === 'ai-enriched' ? 'AI-Enriched' : dimension.dataStatus}</span>
        `;
        card.appendChild(badges);
      }
    });
  },

  addHelpButton() {
    // Only add help button if not already present
    if (document.querySelector('.help-trigger')) return;

    const nav = document.querySelector('.nav');
    if (!nav) return;

    // Wrap nav content in a flex container if needed
    const helpBtn = document.createElement('button');
    helpBtn.className = 'help-trigger';
    helpBtn.textContent = '?';
    helpBtn.title = 'Replay onboarding wizard';
    helpBtn.setAttribute('aria-label', 'Help: replay onboarding');

    helpBtn.addEventListener('click', () => {
      localStorage.removeItem('bie-onboarded');
      location.reload();
    });

    // Add to nav footer
    nav.appendChild(helpBtn);
  }
};

/* ── Brand Fidelity Radar Chart Renderer ── */
function renderRadarChart(containerId, data, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Default options
  const {
    width = 600,
    height = 600,
    scale = 100,
    showCompetitor = true,
    competitorScore = 74,
    competitorLabel = 'Booking.com'
  } = options;

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.classList.add('bf-radar-svg');

  const center = { x: width / 2, y: height / 2 };
  const radius = Math.min(width, height) / 2.8;
  const levels = 5;
  const axes = 6;

  // Draw concentric gridlines (0, 20, 40, 60, 80, 100)
  for (let level = 1; level <= levels; level++) {
    const levelRadius = (radius / levels) * level;
    const points = [];
    for (let i = 0; i < axes; i++) {
      const angle = (i / axes) * Math.PI * 2 - Math.PI / 2;
      const x = center.x + levelRadius * Math.cos(angle);
      const y = center.y + levelRadius * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    const gridPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    gridPolygon.setAttribute('points', points.join(' '));
    gridPolygon.setAttribute('fill', 'none');
    gridPolygon.setAttribute('stroke', 'rgba(255, 255, 255, 0.08)');
    gridPolygon.setAttribute('stroke-width', '1');
    svg.appendChild(gridPolygon);

    // Add gridline labels (20, 40, 60, 80)
    if (level < levels) {
      const labelRadius = levelRadius;
      const angle = -Math.PI / 2;
      const x = center.x + labelRadius * Math.cos(angle);
      const y = center.y + labelRadius * Math.sin(angle) - 8;
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-family', 'var(--font-mono)');
      text.setAttribute('fill', 'rgba(255, 255, 255, 0.3)');
      text.textContent = (level / levels) * scale;
      svg.appendChild(text);
    }
  }

  // Draw axes (6 lines from center to outer edge)
  for (let i = 0; i < axes; i++) {
    const angle = (i / axes) * Math.PI * 2 - Math.PI / 2;
    const x = center.x + radius * Math.cos(angle);
    const y = center.y + radius * Math.sin(angle);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', center.x);
    line.setAttribute('y1', center.y);
    line.setAttribute('x2', x);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  }

  // Prepare dimension data: in the moment (0-2) + over time (3-5)
  const dimensions = [
    ...data.inTheMoment,
    ...data.overTime
  ];

  // Draw Stayworthy polygon
  const polygonPoints = [];
  dimensions.forEach((dimension, i) => {
    const angle = (i / axes) * Math.PI * 2 - Math.PI / 2;
    const value = dimension.score;
    const distance = (value / scale) * radius;
    const x = center.x + distance * Math.cos(angle);
    const y = center.y + distance * Math.sin(angle);
    polygonPoints.push(`${x},${y}`);
  });

  // Stayworthy fill area
  const stayorthyArea = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  stayorthyArea.setAttribute('points', polygonPoints.join(' '));
  stayorthyArea.setAttribute('fill', 'rgba(116, 90, 255, 0.2)');
  stayorthyArea.setAttribute('stroke', '#745AFF');
  stayorthyArea.setAttribute('stroke-width', '2');
  stayorthyArea.classList.add('bf-radar-polygon-primary');
  svg.appendChild(stayorthyArea);

  // Draw competitor overlay (Booking.com at 74)
  if (showCompetitor) {
    const competitorPoints = [];
    for (let i = 0; i < axes; i++) {
      const angle = (i / axes) * Math.PI * 2 - Math.PI / 2;
      const distance = (competitorScore / scale) * radius;
      const x = center.x + distance * Math.cos(angle);
      const y = center.y + distance * Math.sin(angle);
      competitorPoints.push(`${x},${y}`);
    }

    const competitorArea = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    competitorArea.setAttribute('points', competitorPoints.join(' '));
    competitorArea.setAttribute('fill', 'rgba(255, 255, 255, 0.1)');
    competitorArea.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
    competitorArea.setAttribute('stroke-width', '2');
    competitorArea.setAttribute('stroke-dasharray', '5,3');
    competitorArea.classList.add('bf-radar-polygon-competitor');
    svg.appendChild(competitorArea);
  }

  // Draw axis labels with scores and groupings
  dimensions.forEach((dimension, i) => {
    const angle = (i / axes) * Math.PI * 2 - Math.PI / 2;
    const labelDistance = radius * 1.12;
    const x = center.x + labelDistance * Math.cos(angle);
    const y = center.y + labelDistance * Math.sin(angle);

    // Determine group
    const isInTheMoment = i < 3;
    const groupLabel = isInTheMoment ? 'IN THE MOMENT' : 'OVER TIME';
    const groupColor = isInTheMoment ? 'rgba(100, 200, 255, 0.5)' : 'rgba(100, 255, 200, 0.5)';

    // Dimension name
    const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    nameText.setAttribute('x', x);
    nameText.setAttribute('y', y - 4);
    nameText.setAttribute('text-anchor', 'middle');
    nameText.setAttribute('font-size', '13');
    nameText.setAttribute('font-family', 'var(--font-body)');
    nameText.setAttribute('font-weight', '600');
    nameText.setAttribute('fill', '#f0f0f0');
    nameText.textContent = dimension.name;
    svg.appendChild(nameText);

    // Score value
    const scoreText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    scoreText.setAttribute('x', x);
    scoreText.setAttribute('y', y + 14);
    scoreText.setAttribute('text-anchor', 'middle');
    scoreText.setAttribute('font-size', '11');
    scoreText.setAttribute('font-family', 'var(--font-mono)');
    scoreText.setAttribute('fill', '#745AFF');
    scoreText.setAttribute('font-weight', '600');
    scoreText.textContent = `${dimension.score} (${dimension.delta > 0 ? '+' : ''}${dimension.delta})`;
    svg.appendChild(scoreText);
  });

  // Add legend
  const legend = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  legend.setAttribute('transform', `translate(${center.x - 120}, ${height - 40})`);

  // In the Moment badge
  const inTheMomentRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  inTheMomentRect.setAttribute('x', '0');
  inTheMomentRect.setAttribute('y', '0');
  inTheMomentRect.setAttribute('width', '110');
  inTheMomentRect.setAttribute('height', '24');
  inTheMomentRect.setAttribute('fill', 'rgba(100, 200, 255, 0.15)');
  inTheMomentRect.setAttribute('stroke', 'rgba(100, 200, 255, 0.3)');
  inTheMomentRect.setAttribute('stroke-width', '1');
  inTheMomentRect.setAttribute('rx', '3');
  legend.appendChild(inTheMomentRect);

  const inTheMomentText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  inTheMomentText.setAttribute('x', '55');
  inTheMomentText.setAttribute('y', '16');
  inTheMomentText.setAttribute('text-anchor', 'middle');
  inTheMomentText.setAttribute('font-size', '10');
  inTheMomentText.setAttribute('font-family', 'var(--font-mono)');
  inTheMomentText.setAttribute('fill', 'rgba(255, 255, 255, 0.6)');
  inTheMomentText.setAttribute('font-weight', '500');
  inTheMomentText.textContent = 'IN THE MOMENT';
  legend.appendChild(inTheMomentText);

  // Over Time badge
  const overTimeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  overTimeRect.setAttribute('x', '130');
  overTimeRect.setAttribute('y', '0');
  overTimeRect.setAttribute('width', '90');
  overTimeRect.setAttribute('height', '24');
  overTimeRect.setAttribute('fill', 'rgba(100, 255, 200, 0.15)');
  overTimeRect.setAttribute('stroke', 'rgba(100, 255, 200, 0.3)');
  overTimeRect.setAttribute('stroke-width', '1');
  overTimeRect.setAttribute('rx', '3');
  legend.appendChild(overTimeRect);

  const overTimeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  overTimeText.setAttribute('x', '175');
  overTimeText.setAttribute('y', '16');
  overTimeText.setAttribute('text-anchor', 'middle');
  overTimeText.setAttribute('font-size', '10');
  overTimeText.setAttribute('font-family', 'var(--font-mono)');
  overTimeText.setAttribute('fill', 'rgba(255, 255, 255, 0.6)');
  overTimeText.setAttribute('font-weight', '500');
  overTimeText.textContent = 'OVER TIME';
  legend.appendChild(overTimeText);

  svg.appendChild(legend);

  // Add to DOM and animate in
  container.appendChild(svg);
  // Use requestAnimationFrame to trigger reveal after paint
  requestAnimationFrame(() => {
    svg.classList.add('reveal');
    requestAnimationFrame(() => svg.classList.add('visible'));
  });
}

document.addEventListener('DOMContentLoaded', () => BIE.init());
