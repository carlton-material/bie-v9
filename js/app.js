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

    // ── Conversation State Tracking ──
    self._conversationDepth = 0;
    self._lastTopics = [];
    self._usedPills = new Set();

    // ── Tiered Suggestion System ──
    // Tier 0 (opening): broad orientation questions
    // Tier 1 (after 1-2 exchanges): focused diagnostic questions
    // Tier 2 (after 3+ exchanges): deep strategic questions
    const suggestedQuestions = {
      guide: {
        'strategic-brief': {
          0: ["What's the headline story in this brief?", "Walk me through the trust dynamics", "How should I read these dimension scores?"],
          1: ["Why is the trust gap widening?", "Which segment should worry us most?", "What would you prioritize fixing?"],
          2: ["What's the 90-day play here?", "How does this connect to our scenario planning?", "What aren't we seeing?"]
        },
        'command-center': {
          0: ["What needs my attention this morning?", "Walk me through today's signals", "How's brand health trending?"],
          1: ["Why is Dependable flagged critical?", "What connects these anomalies?", "Show me the week-over-week shift"],
          2: ["What intervention would you recommend?", "How do these signals predict next quarter?", "What's the competitive read?"]
        },
        'signal-terminal': {
          0: ["What's the most important signal right now?", "How do the three layers interact?", "What pattern should I watch?"],
          1: ["Why might Human and Behavioral signals diverge?", "Which signals have the highest confidence?", "What's new in the last 48 hours?"],
          2: ["What hypothesis would you form from this data?", "Where are the blind spots in coverage?", "What signal would change our strategy?"]
        },
        'guided-analysis': {
          0: ["Help me understand the dimension landscape", "Where should we start this analysis?", "What's the most pressing question?"],
          1: ["Walk me through the competitive positioning", "Which dimension has the most momentum?", "Where's the hidden opportunity?"],
          2: ["Build me a 3-point strategic brief", "What should we present to the board?", "What assumption needs challenging?"]
        },
        'scenario-lab': {
          0: ["What can I simulate here?", "Which scenario mode should I try first?", "How do the 650 agents work?"],
          1: ["What scenario feels most realistic?", "Which dimensions would cascade first?", "What risk are we not modeling?"],
          2: ["How confident are these projections?", "What would a competitor war game reveal?", "Design a scenario that tests our biggest assumption"]
        },
        'brand-fidelity': {
          0: ["Explain these 6 dimensions to me", "Why two time horizons?", "What does a 72 composite really mean?"],
          1: ["Why does Dependable matter most right now?", "How do In-Moment dimensions feed Over Time?", "What would move this score fastest?"],
          2: ["If we could only fix one dimension, which one?", "What does the trajectory look like in 6 months?", "How do we compare to category leaders?"]
        },
        'day-in-the-life': {
          0: ["Walk me through a typical morning briefing", "How does a strategist use this differently than an analyst?", "What's the most valuable workflow?"],
          1: ["Where does BIE save the most time?", "What workflow gap should we fill?", "How does this change the Monday review?"],
          2: ["Design an ideal daily intelligence routine for my role", "What workflow would make the biggest board impression?", "Where does AI take over vs. where do humans stay?"]
        },
        'how-it-works': {
          0: ["Why three signal layers instead of one?", "What makes this different from traditional tracking?", "How do you ensure data quality?"],
          1: ["How does convergence scoring work?", "What's the weakest link in the pipeline?", "How often does the data refresh?"],
          2: ["How would this scale to 10 brands?", "What's the build vs. buy decision here?", "How does the headless architecture enable new use cases?"]
        },
        'default': {
          0: ["What should I explore first?", "Give me the 60-second orientation", "What's the most interesting thing on this page?"],
          1: ["What pattern stands out to you?", "What question should we ask first?", "What's your hypothesis?"],
          2: ["What's the strategic implication?", "What would you present to leadership?", "What's the unconventional take?"]
        }
      },
      guardian: {
        'strategic-brief': {
          0: ["Diagnose the trust gap", "Show the competitive landscape", "Surface top 3 risk indicators"],
          1: ["Deep dive: Dependable crisis", "Segment-level breakdown", "Show signal source attribution"],
          2: ["Generate executive action brief", "Predictive model: 6-month trajectory", "Cross-reference with competitive intelligence"]
        },
        'command-center': {
          0: ["What needs attention today?", "Surface anomalous signals", "Show market shift indicators"],
          1: ["Drill into the Dependable alert", "Week-over-week delta analysis", "Priority intervention list"],
          2: ["Generate morning briefing summary", "Cross-surface correlation report", "Forecast this week's critical moments"]
        },
        'signal-terminal': {
          0: ["Show trending signals", "High-confidence findings only", "Where do layers converge?"],
          1: ["Filter: behavioral signals diverging from expressive", "Source diversity audit", "Show leading indicators"],
          2: ["Generate signal intelligence brief", "Identify emerging narrative threads", "Map signal clusters to dimensions"]
        },
        'guided-analysis': {
          0: ["Run full dimension diagnostic", "Identify biggest opportunity", "Show competitive dimension gaps"],
          1: ["Sensitivity analysis on Dependable", "Category benchmark comparison", "Dimension interdependency map"],
          2: ["Generate strategic recommendations", "Build intervention priority matrix", "Model ROI of top 3 interventions"]
        },
        'scenario-lab': {
          0: ["Best ROI scenario?", "Confidence levels on projections", "Model dimension cascade effects"],
          1: ["Stress test: worst-case competitive move", "Compare all scenario outcomes", "Agent behavior distribution analysis"],
          2: ["Generate board-ready scenario comparison", "Optimal intervention sequence", "Digital twin projection: 12 months"]
        },
        'brand-fidelity': {
          0: ["Full dimension diagnostic", "Which dimension moves composite most?", "Show competitive comparison"],
          1: ["Dimension correlation matrix", "Trend trajectory: 6-month", "Benchmark vs. category mean"],
          2: ["Composite impact model", "Generate Brand Score presentation summary", "Identify leading indicator dimensions"]
        },
        'day-in-the-life': {
          0: ["Key insights for a strategist", "ROI of each BIE surface", "Time-to-insight metrics"],
          1: ["Surface usage optimization", "Compare role-based workflows", "Integration efficiency audit"],
          2: ["Generate role-optimized workflow guide", "Quantify intelligence advantage", "Design executive dashboard view"]
        },
        'how-it-works': {
          0: ["Explain signal processing pipeline", "Show confidence methodology", "Data source coverage audit"],
          1: ["Pipeline latency and freshness stats", "Signal quality benchmarks", "Coverage gap analysis"],
          2: ["Architecture scalability assessment", "Cost-per-signal economics", "Competitive methodology comparison"]
        },
        'default': {
          0: ["Surface the key insights", "Which dimensions need attention?", "Show me the data"],
          1: ["Go deeper on the top finding", "Show confidence scores", "What's the data source?"],
          2: ["Generate an intelligence brief", "Priority action matrix", "What would you recommend?"]
        }
      }
    };

    // ── Example Conversation Trees ──
    // Shown on first panel open to demonstrate how Ask vs Explore work
    const exampleConversations = {
      guide: {
        'strategic-brief': {
          userQ: "What's the headline story?",
          analystA: "The brief reveals a **trust paradox** — high expressive sentiment (`78%`) but declining behavioral loyalty (`56%`). That 22-point gap is the story. *What do you think is driving the disconnect between what people say and what they do?*"
        },
        'command-center': {
          userQ: "What needs my attention this morning?",
          analystA: "Three signals converged overnight around **Dependable** — all pointing to post-booking friction. But here's what's interesting: the Cultural layer shows positive sentiment around your sustainability messaging. *Which signal would you prioritize: the fire to fight, or the momentum to build?*"
        },
        'signal-terminal': {
          userQ: "What pattern should I watch?",
          analystA: "There's a divergence forming — Human-Expressive signals trending up while Behavioral signals trend down. That gap usually predicts a **loyalty correction** in 6-8 weeks. *What do you think could explain why people are saying good things but changing their behavior?*"
        },
        'guided-analysis': {
          userQ: "Where should we start?",
          analystA: "Let's start with what's *changing fastest*. **Personal** dropped 8 points — the biggest single-dimension delta. But I'd argue **Dependable** at `-6` matters more because it anchors long-term loyalty. *Which one would you investigate first, and why?*"
        },
        'scenario-lab': {
          userQ: "What can I simulate here?",
          analystA: "You have five modes to play with — but **War Gaming** is where the magic happens. Pick a competitive scenario, watch how 650 simulated consumers respond across all 6 dimensions. *What strategic question keeps you up at night? Let's model it.*"
        },
        'brand-fidelity': {
          userQ: "What does a 72 composite mean?",
          analystA: "`72` places you **4th in category** — competitive but not leading. The real story is the `-4` delta: you're trending down while the category average holds steady. Two dimensions are driving the drag: Dependable and Personal. *If you had budget to fix one, which would give you more lift?*"
        },
        'day-in-the-life': {
          userQ: "Walk me through the morning briefing",
          analystA: "By 7 AM, BIE has already scanned overnight signals and flagged anomalies. Your **Command Center** shows 3 items needing attention. The AI digest tells you what changed since yesterday in plain language. *What would make your morning intelligence routine more useful?*"
        },
        'how-it-works': {
          userQ: "Why three signal layers?",
          analystA: "Single-source measurement misses the whole picture. **Human-Expressive** captures what people say. **Behavioral** captures what they do. **Cultural** captures the environment shaping both. When all three converge on the same signal, confidence is HIGH. *Can you think of a brand situation where what people say and do completely diverge?*"
        }
      },
      guardian: {
        'strategic-brief': {
          userQ: "Diagnose the trust gap",
          analystA: "### Diagnostic\n\n**22-point trust gap** between expressive (`78%`) and behavioral (`56%`) signals. Gap widened 4 points in 6 weeks.\n\n### Root Cause\n\n73% of behavioral decline correlates with post-booking experience — cancellation friction, response time, billing accuracy.\n\n### Recommended Action\n\nDeploy transparent pricing pilot in top 3 markets. Projected lift: `3.2 points` over 8 weeks.\n\n◆ Human-Expressive + Behavioral correlation · N=847 · Confidence: HIGH"
        },
        'command-center': {
          userQ: "Surface anomalous signals",
          analystA: "### 3 Anomalies Detected\n\n- **Dependable** dropped below 60 threshold (`58, -6`) — triggers strategic alert\n- **Behavioral-Cultural divergence** in Gen Z segment: +34% engagement, -12% trust\n- **Competitive shift**: Category leader gained +3 on User Friendly this week\n\n### Priority\n\nDependable is the fire. Gen Z is the opportunity. Competitive shift is context.\n\n◆ Cross-layer anomaly detection · 847 signals · Last 48h · Confidence: HIGH"
        },
        'signal-terminal': {
          userQ: "High-confidence findings only",
          analystA: "### HIGH Confidence Signals (3-layer convergence)\n\n- **Post-booking friction** increasing: behavioral churn signals + expressive complaints + cultural narrative shift toward competitor alternatives\n- **Sustainability messaging** resonating: expressive sentiment +18%, behavioral engagement +12%, cultural alignment with Gen Z values\n\n### MEDIUM Confidence\n\n- Pricing perception shift in European markets (2-layer convergence only)\n\n◆ Convergence filter applied · 847→12 high-confidence signals · Confidence: HIGH"
        },
        'guided-analysis': {
          userQ: "Run full dimension diagnostic",
          analystA: "### Brand Score Diagnostic — All 6 Dimensions\n\n**In the Moment:**\n- User Friendly: `72 (-4)` — declining, driven by booking friction\n- Personal: `64 (-8)` — largest delta, recommendation engine underperforming\n- Accessible: `71 (+1)` — stable, not a priority\n\n**Over Time:**\n- Dependable: `58 (-6)` — CRITICAL, anchors long-term loyalty\n- Meaningful: `66 (-3)` — erosion risk, bridge between functional and emotional\n- Salient: `74 (+2)` — strength, maintain through brand recall investment\n\n◆ M+ Brand Score Framework · Composite: 72 (-4) · Confidence: HIGH"
        },
        'scenario-lab': {
          userQ: "Best ROI scenario?",
          analystA: "### Scenario Comparison — ROI Ranked\n\n1. **Transparent Pricing**: `3.2 pt` lift, 8 weeks, 78% confidence — *best ceiling, fastest payoff*\n2. **Trust Recovery Campaign**: `2.1 pt` lift, 12 weeks, 89% confidence — *highest certainty, slower*\n3. **Personalization Engine**: `1.8 pt` lift, 16 weeks, 72% confidence — *long-term play, compounding*\n\n### Recommendation\n\nSequence: Transparent Pricing → Trust Recovery → Personalization. Each builds on the last.\n\n◆ 650-agent simulation · 100 iterations · Bass diffusion + softmax · Confidence: HIGH"
        },
        'brand-fidelity': {
          userQ: "Which dimension moves composite most?",
          analystA: "### Composite Impact Analysis\n\n| Dimension | Weight | Current | If +5 pts | Composite Impact |\n|---|---|---|---|---|\n| Dependable | 22% | 58 | 63 | +1.1 pts |\n| User Friendly | 20% | 72 | 77 | +1.0 pts |\n| Personal | 18% | 64 | 69 | +0.9 pts |\n| Meaningful | 16% | 66 | 71 | +0.8 pts |\n| Salient | 14% | 74 | 79 | +0.7 pts |\n| Accessible | 10% | 71 | 76 | +0.5 pts |\n\n**Dependable** moves the composite most per point gained. Fix it first.\n\n◆ Weighted composite model · Sensitivity analysis · Confidence: HIGH"
        },
        'day-in-the-life': {
          userQ: "Time-to-insight metrics",
          analystA: "### BIE vs. Traditional Tracking — Speed Comparison\n\n- **Morning signal scan**: 3 min (vs. waiting for monthly report)\n- **Anomaly detection**: real-time (vs. 2-4 week survey lag)\n- **Competitive read**: same-day (vs. quarterly competitive review)\n- **Scenario modeling**: 10 min per scenario (vs. 2-week agency turnaround)\n- **Board-ready insight**: 1 hour (vs. 1-2 weeks of analysis)\n\n### Net Impact\n\n**90% faster time-to-insight** on average across all intelligence workflows.\n\n◆ BIE workflow benchmarking · N=12 enterprise deployments · Confidence: HIGH"
        },
        'how-it-works': {
          userQ: "Data source coverage audit",
          analystA: "### Signal Source Coverage\n\n**Human-Expressive** (312 signals)\n- Social listening: Twitter, Reddit, TikTok, Instagram\n- Review platforms: TrustPilot, Google, Booking reviews\n- Survey panel: N=2,400 monthly\n\n**Behavioral** (289 signals)\n- Booking flow analytics, search behavior, price sensitivity\n- App engagement, repeat booking rates, cancellation patterns\n\n**Cultural** (246 signals)\n- Google Trends, Reddit discourse, TikTok travel content\n- News/media sentiment, regulatory monitoring, competitor moves\n\n### Coverage Gaps\n\nWeakest: offline behavioral data, B2B travel segment\n\n◆ Source inventory · Last updated: 48h ago · Confidence: HIGH"
        }
      }
    };

    const toggle = () => {
      isOpen = !isOpen;
      panel.classList.toggle('open', isOpen);
      trigger.style.display = isOpen ? 'none' : 'flex';
      if (isOpen) {
        if (input) input.focus();
        // Show example conversation on first open if messages area only has the context message
        if (messages && messages.children.length <= 1 && !self._exampleShown) {
          self._exampleShown = true;
          showExampleConversation();
        }
      }
    };

    // ── Example Conversation Display ──
    const showExampleConversation = () => {
      const page = self.currentPage || 'default';
      const mode = self.analystMode || 'guide';
      const examples = exampleConversations[mode];
      const example = examples?.[page] || examples?.['strategic-brief'];
      if (!example) return;

      // Label
      const label = document.createElement('div');
      label.className = 'analyst-msg system example-label';
      label.innerHTML = `<small style="opacity:0.5;text-transform:uppercase;letter-spacing:0.08em;font-size:0.65rem">Example — ${mode === 'guide' ? 'Ask' : 'Explore'} mode</small>`;
      messages.appendChild(label);

      // Example user message
      const userMsg = document.createElement('div');
      userMsg.className = 'analyst-msg user example-msg';
      userMsg.textContent = example.userQ;
      messages.appendChild(userMsg);

      // Example analyst response
      const analystMsg = document.createElement('div');
      const modeClass = mode === 'guide' ? 'mode-guide' : 'mode-guardian';
      analystMsg.className = `analyst-msg system ${modeClass} example-msg`;
      analystMsg.innerHTML = self.parseAnalystResponse(example.analystA);
      messages.appendChild(analystMsg);

      // Divider
      const divider = document.createElement('div');
      divider.className = 'analyst-msg system example-label';
      divider.innerHTML = '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:0.5rem 0"><small style="opacity:0.4;font-size:0.6rem">Your turn — ask anything or pick a suggestion below</small>';
      messages.appendChild(divider);

      messages.scrollTop = messages.scrollHeight;
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

          // Reset conversation depth on mode switch and re-render
          self._conversationDepth = 0;
          self._usedPills = new Set();
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
      'strategic-brief': "You're looking at the strategic brief — the big-picture narrative of brand health. I can help you unpack market dynamics, dimension trajectories, or competitive positioning.",
      'how-it-works': "This is the architecture transparency layer — how every signal gets collected, scored, and surfaced. Ask me about methodology, data sources, or the confidence model.",
      'command-center': "Welcome to your Command Center — daily operational intelligence at a glance. I've flagged `3 signals` that need attention. The Dependable dimension is in critical territory.",
      'signal-terminal': "Signal Terminal active — monitoring `847 signals` across Human-Expressive, Behavioral, and Cultural layers. I can surface anomalies, convergences, or drill into any source.",
      'guided-analysis': "Ready for guided analysis. Tell me what you're investigating — a dimension, a competitive question, an audience segment — and I'll help you build a structured brief.",
      'scenario-lab': "Scenario Lab loaded — `650 agents`, 5 simulation modes. War Gaming, Brand Score LIVE, focus groups, insight generation, or signal nexus. What strategy question are you testing?",
      'brand-fidelity': "Brand Score dashboard — 6 dimensions across two time horizons. Composite at `72` with a `-4` delta. I can diagnose any dimension, compare competitive positions, or explain the framework.",
      'day-in-the-life': "Day in the Life — see how BIE fits into real workflows. I can personalize this narrative for your specific role: strategist, analyst, or executive."
    };

    // Initial context message (render only once to prevent duplicates)
    if (messages && this.currentPage && contextMessages[this.currentPage] && messages.children.length === 0) {
      const msg = document.createElement('div');
      msg.className = 'analyst-msg system mode-guide';
      msg.innerHTML = this.parseAnalystResponse(contextMessages[this.currentPage]);
      messages.appendChild(msg);
    }

    // ── Render Tiered Suggestions ──
    const renderSuggestions = () => {
      if (!suggestionsContainer) return;
      const mode = self.analystMode || 'guide';
      const page = self.currentPage || 'default';
      const depth = self._conversationDepth || 0;

      // Pick the right tier (0, 1, or 2)
      const tier = depth >= 3 ? 2 : depth >= 1 ? 1 : 0;
      const modeQuestions = suggestedQuestions[mode] || suggestedQuestions.guide;
      const pageQuestions = modeQuestions[page] || modeQuestions['default'];
      let questions = pageQuestions[tier] || pageQuestions[0];

      // Filter out already-used pills to avoid repetition
      questions = questions.filter(q => !self._usedPills.has(q));

      // If all pills at this tier are used, try adjacent tiers
      if (questions.length === 0) {
        const altTier = tier < 2 ? tier + 1 : tier - 1;
        questions = (pageQuestions[altTier] || []).filter(q => !self._usedPills.has(q));
      }

      // Final fallback: reset used pills if everything's been used
      if (questions.length === 0) {
        self._usedPills.clear();
        questions = pageQuestions[tier] || pageQuestions[0];
      }

      suggestionsContainer.innerHTML = '';
      questions.forEach(q => {
        const pill = document.createElement('div');
        pill.className = 'analyst-suggestion-pill';
        pill.textContent = q;
        pill.addEventListener('click', () => {
          self._usedPills.add(q);
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
    // Track conversation depth
    this._conversationDepth = (this._conversationDepth || 0) + 1;

    // Track topics for contextual follow-ups
    const topicKeywords = ['trust', 'competitor', 'gen z', 'scenario', 'fidelity', 'score', 'meaningful', 'dependable', 'personal', 'salient', 'accessible', 'user friendly', 'signal', 'dimension', 'segment', 'roi', 'pricing', 'campaign', 'war game', 'simulation', 'anomaly', 'trend'];
    const queryLower = query.toLowerCase();
    const detectedTopics = topicKeywords.filter(kw => queryLower.includes(kw));
    if (detectedTopics.length > 0) {
      this._lastTopics = detectedTopics;
    }

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

    // Re-render contextual follow-up suggestions after response
    if (suggestionsContainer) {
      setTimeout(() => {
        suggestionsContainer.innerHTML = '';
        const followUps = self._getContextualFollowUps();
        followUps.forEach(q => {
          const pill = document.createElement('div');
          pill.className = 'analyst-suggestion-pill';
          pill.textContent = q;
          pill.addEventListener('click', () => {
            self._usedPills.add(q);
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

  // ── Contextual Follow-Up Generator ──
  // Picks follow-up pills based on conversation depth, last topics, and current page
  _getContextualFollowUps() {
    const mode = this.analystMode || 'guide';
    const page = this.currentPage || 'default';
    const depth = this._conversationDepth || 0;
    const lastTopics = this._lastTopics || [];
    const isGuide = mode === 'guide';

    // Topic-aware follow-ups: if we detected topics in the last query, offer relevant deepeners
    const topicFollowUps = {
      guide: {
        trust:       ["What's driving the gap between words and actions?", "Which segment has the widest trust gap?", "Is this fixable in one quarter?"],
        competitor:  ["Where's the whitespace neither brand owns?", "What would a disruptive new entrant do?", "Which competitive move should worry us?"],
        dependable:  ["Is this a perception problem or an operational one?", "What would 5 points of improvement change?", "How do other industries solve this?"],
        meaningful:  ["What would make someone *proud* to use this brand?", "How do you build meaning in a transactional category?", "Which audience cares most about meaning?"],
        personal:    ["Where does personalization feel broken?", "What's the difference between creepy and helpful?", "What data do we need to get Personal right?"],
        signal:      ["Which signal layer do you trust most?", "When signals disagree, what's the tiebreaker?", "What signal are we missing entirely?"],
        scenario:    ["What assumption makes this scenario break?", "How would competitors respond?", "What's the worst-case version of this?"],
        simulation:  ["How do agent decisions map to real consumers?", "What would 2,500 agents reveal that 650 wouldn't?", "Which parameter is most sensitive?"],
        'gen z':     ["Is Gen Z fundamentally different or just earlier?", "What platform shift matters most?", "How do you build trust with people who distrust brands?"],
        dimension:   ["Which dimensions are most correlated?", "What moves the composite fastest?", "Which dimension is most predictive of growth?"],
        pricing:     ["Does transparent pricing erode margins or build them?", "What's the elasticity on trust?", "How fast would pricing changes show up in signals?"],
        roi:         ["What's the cost of inaction?", "Which investment has the shortest payback?", "How do we measure intelligence ROI?"],
        anomaly:     ["Is this anomaly a signal or noise?", "How often do anomalies predict real shifts?", "What threshold triggers an alert?"],
        trend:       ["Is this trend accelerating or decelerating?", "What would reverse this trend?", "How does this compare to industry?"]
      },
      guardian: {
        trust:       ["Show trust gap by segment", "Signal source breakdown for trust metrics", "Projected trust trajectory: 6 months"],
        competitor:  ["Dimension-by-dimension competitive comparison", "Show competitive share of voice data", "Identify competitor vulnerability"],
        dependable:  ["Root cause analysis: top 5 behavioral signals", "Dependable vs. category benchmark", "Intervention impact model"],
        meaningful:  ["Meaningful dimension: driver analysis", "Category-level Meaningful benchmarks", "Content engagement × Meaningful correlation"],
        personal:    ["Personal dimension: behavioral signal audit", "Recommendation engine performance data", "Personalization coverage gap analysis"],
        signal:      ["Cross-layer convergence report", "Signal confidence distribution", "Source coverage and freshness audit"],
        scenario:    ["Compare all scenario outcomes side by side", "Stress test current scenario", "Run inverse scenario: what breaks?"],
        simulation:  ["Agent behavior distribution chart", "Sensitivity analysis: top 3 parameters", "Simulation confidence intervals"],
        'gen z':     ["Gen Z behavioral vs. expressive delta", "Platform-level signal breakdown for Gen Z", "Gen Z cohort vs. Millennial comparison"],
        dimension:   ["Full 6-dimension diagnostic with deltas", "Dimension correlation matrix", "Composite sensitivity by dimension weight"],
        pricing:     ["Pricing signal cluster analysis", "Price elasticity from behavioral data", "Competitive pricing intelligence"],
        roi:         ["ROI model: per-dimension investment", "Time-to-impact by intervention type", "Cost of brand health decline model"],
        anomaly:     ["Full anomaly report with confidence", "Historical anomaly pattern matching", "Anomaly → dimension impact mapping"],
        trend:       ["Trend analysis: all dimensions 12-month", "Trend acceleration/deceleration flags", "Category trend comparison"]
      }
    };

    // Check if any last topics match our follow-up library
    const modeFollowUps = topicFollowUps[mode] || topicFollowUps.guide;
    for (const topic of lastTopics) {
      if (modeFollowUps[topic]) {
        const candidates = modeFollowUps[topic].filter(q => !this._usedPills.has(q));
        if (candidates.length >= 2) return candidates.slice(0, 3);
      }
    }

    // Depth-aware fallbacks when no specific topic detected
    const depthFollowUps = {
      guide: {
        shallow: ["What pattern catches your eye?", "What would you investigate first?", "What's your initial hypothesis?"],
        mid:     ["How does this connect to what we discussed?", "What assumption should we challenge?", "What would you present to leadership?"],
        deep:    ["What's the unconventional read here?", "If you had to bet on one dimension, which?", "What's the 30-second board pitch?"]
      },
      guardian: {
        shallow: ["Show me the key data points", "Which dimensions need attention?", "Surface the top 3 findings"],
        mid:     ["Cross-reference with previous findings", "Show confidence intervals", "Run deeper diagnostic"],
        deep:    ["Generate executive intelligence brief", "Priority action matrix", "Strategic recommendation with evidence"]
      }
    };

    const tier = depth <= 2 ? 'shallow' : depth <= 4 ? 'mid' : 'deep';
    const fallbacks = depthFollowUps[mode]?.[tier] || depthFollowUps.guide.shallow;
    return fallbacks.filter(q => !this._usedPills.has(q));
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
        guardian: `### Diagnostic\n\n${competitorName} leads at \`74\` BF composite, driven by Dependable (+8 vs category) and User Friendly (+6). ${brandName}'s opportunity lies in **Meaningful** and **Personal**, both underserved category-wide.\n\n### Attack\n\nInvest in Personal (\`64, -8\`) through ML-driven recommendation personalization.\n\n### Defend\n\nProtect Salient (\`74\`) through brand recall campaigns in peak booking season.\n\n### Bridge\n\nMeaningful (\`66, -3\`) bridges functional satisfaction to emotional loyalty.\n\n◆ Brand Score Report 2026 · Travel Category · N=24,000 · Confidence: HIGH`
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
        guardian: `### Diagnostic\n\n**Brand Score — 6 Dimensions:**\n\n- In the Moment: User Friendly (\`72, -4\`) · Personal (\`64, -8\`) · Accessible (\`71, +1\`)\n- Over Time: Dependable (\`58, -6\`) · Meaningful (\`66, -3\`) · Salient (\`74, +2\`)\n\n### Key Insight\n\nDependable is the crisis dimension at \`58 (-6)\`. It anchors long-term loyalty and is dragging the composite. Personal (-8) is the biggest single delta but operates at shorter time horizons.\n\n◆ M+ Brand Score Framework · 2X advocacy, 2.5X profitability, 3X differentiation · Confidence: HIGH`
      },
      meaningful: {
        guide: `### What would make the brand *meaningful* — not just useful?\n\nMeaningful sits at \`66\` with a **-3 decline**. It's the bridge between functional satisfaction and emotional loyalty.\n\n- What would a "Stories Worth Staying For" content program change about behavior?\n- How do you measure success beyond engagement metrics?\n- Can you create belonging, not just transactions?\n\n> Brands with high Meaningful dimension scores see 2.8X higher advocacy rates. What's the fastest path to making your brand mean something beyond its utility?`,
        guardian: `### Diagnostic\n\nMeaningful (\`66, -3\`) is the bridge between functional satisfaction and emotional loyalty. Brands with high Meaningful scores see **2.8X** higher advocacy rates.\n\n### Attack\n\nLaunch a "Stories Worth Staying For" content series. Turn property stays into narratives.\n\n### Defend\n\nDon't let Meaningful erosion cascade into Dependable. Monitor monthly.\n\n◆ BF Report 2026 · Cross-category analysis · N=229 brands · Confidence: HIGH`
      },
      dependable: {
        guide: `### What's breaking the Dependable promise?\n\nDependable is in critical territory at \`58 (-6)\`. The behavioral data says **73%** of its decline correlates with post-booking experience.\n\n- If you could fix just the top 3 operational pain points — cancellation friction, response time, billing — which comes first?\n- What's your theory on the root cause?\n- Is this perception or reality?\n\n> Behavioral signals don't lie. If 73% of the decline is post-booking, is the brand problem actually a product problem?`,
        guardian: `### Diagnostic\n\nDependable (\`58, -6\`) is in critical territory. This is the most influential Over Time dimension. A 6-point decline over 2 quarters signals **systemic operational issues**, not just perception.\n\n### Attack\n\nAudit and fix the top 5 operational pain points surfaced in behavioral signals:\n\n- Cancellation friction\n- Response time\n- Billing accuracy\n\n### Bridge\n\nBehavioral data shows **73%** of Dependable declines correlate with post-booking experience, not pre-booking perception.\n\n◆ Behavioral signal cluster analysis · Booking + post-stay data · N=312 signals · Confidence: HIGH`
      },
      personal: {
        guide: `### Why is Personal the biggest mover — and should it be?\n\n**Personal** dropped 8 points to \`64\`. That's the largest single-dimension delta across the board. But here's the nuance: Personal is an In-the-Moment dimension. It measures *right now* experience.\n\n- The decline likely reflects recommendation engine changes, not brand positioning\n- Personal is the easiest to move *and* the easiest to lose\n- Compare this to Dependable's slower, stickier decline\n\n> If you had to choose: fix the quick-win Personal dimension or the strategic Dependable dimension? What's your reasoning?`,
        guardian: `### Diagnostic\n\nPersonal (\`64, -8\`) is the largest single-dimension delta. As an In-the-Moment dimension, it reflects real-time experience quality — specifically recommendation relevance and interface personalization.\n\n### Root Cause\n\nBehavioral signals show **recommendation click-through rates** dropped 23% after the last platform update. The algorithm change correlates directly with Personal erosion.\n\n### Attack\n\nA/B test reverting recommendation logic in top 3 markets. Projected recovery: \`5-6 points\` in 4 weeks.\n\n### Bridge\n\nPersonal moves fast but doesn't anchor loyalty. Fix it to stop the bleeding, but Dependable is the strategic priority.\n\n◆ Behavioral signal analysis · Platform analytics + survey overlay · N=4,200 · Confidence: HIGH`
      },
      salient: {
        guide: `### Salient is your bright spot — how do you protect it?\n\n**Salient** is the only Over Time dimension trending positive at \`74 (+2)\`. That means brand recall and distinctiveness are actually improving.\n\n- What's driving the positive momentum? Is it organic or paid?\n- How vulnerable is Salient to competitor spend?\n- If you lost 5 points of Salient, what would the cascade effect be?\n\n> Salient is the dimension most influenced by marketing spend. Are you buying awareness, or earning it?`,
        guardian: `### Diagnostic\n\nSalient (\`74, +2\`) is ${brandName}'s strongest dimension and only positive mover. Driven by **brand recall campaigns** and organic social mentions in travel communities.\n\n### Defend\n\nProtect this advantage:\n- Maintain media spend at current levels through peak season\n- Monitor competitor share-of-voice for signs of challenge\n- Salient erosion would compound Dependable weakness\n\n### Opportunity\n\nSalient provides air cover while operational dimensions (Dependable, Personal) are being repaired.\n\n◆ Cross-signal salience index · Social + Search + Survey · N=847 · Confidence: HIGH`
      },
      accessible: {
        guide: `### Accessible is stable — but is stable good enough?\n\n**Accessible** sits at \`71 (+1)\` — the steadiest dimension in the portfolio. It's doing its job but not moving the needle.\n\n- Accessible measures availability, ease of access, and channel presence\n- Stability here means you're not losing ground — but competitors aren't standing still\n- What would a breakthrough in accessibility look like for a travel brand?\n\n> When everything else is declining, a flat line can feel like success. But is "not losing" the same as winning?`,
        guardian: `### Diagnostic\n\nAccessible (\`71, +1\`) is stable and within category norms. No intervention needed.\n\n### Context\n\n- Category average: 69 (${brandName} is +2 above)\n- Driven by multi-channel presence and booking availability\n- Low correlation with composite movement — not a lever for growth\n\n### Recommendation\n\nMaintain current levels. Redirect investment to Dependable and Personal where ROI is higher.\n\n◆ Dimension stability analysis · 4-quarter trend · Confidence: HIGH`
      },
      'user friendly': {
        guide: `### User Friendly is slipping — is it the product or the perception?\n\n**User Friendly** dropped to \`72 (-4)\`. For a digital-first brand, this is the dimension most tightly linked to product experience.\n\n- The decline correlates with 3 specific behavioral signals: checkout abandonment, app session length, and support ticket volume\n- But Cultural signals show positive sentiment about the app redesign\n- So users *like* the direction but are still experiencing friction\n\n> There's a gap between design intent and user reality. Where do you think the friction lives — and how would you test that hypothesis?`,
        guardian: `### Diagnostic\n\nUser Friendly (\`72, -4\`) declining. Direct product experience dimension. The 4-point drop correlates with:\n\n- Checkout abandonment: +12% in 6 weeks\n- App session length: -8% average\n- Support ticket volume: +15%\n\n### Attack\n\nTargeted UX audit on the 3 highest-friction user flows. Quick wins: streamline cancellation, reduce checkout steps, improve error messaging.\n\n### Bridge\n\nCultural signals show positive sentiment about design direction — the brand intent is right, execution needs catching up.\n\n◆ Behavioral signal cluster · App analytics + Support data · N=156 signals · Confidence: HIGH`
      },
      signal: {
        guide: `### How do three signal layers tell a better story than one?\n\nTraditional brand tracking asks people what they think. BIE asks three questions simultaneously:\n\n- **Human-Expressive**: What do people *say*? (surveys, reviews, social posts)\n- **Behavioral**: What do people *do*? (booking patterns, search behavior, churn rates)\n- **Cultural**: What's the *environment*? (media trends, competitor moves, regulatory shifts)\n\nWhen all three layers agree, confidence is HIGH. When they diverge, that's where the real insight lives.\n\n> Think of a recent brand decision — would you have made a different call if you'd seen all three layers instead of just one?`,
        guardian: `### Signal Layer Report\n\n**Human-Expressive** — 312 signals\n- Net sentiment: Positive (63%)\n- Trending: Sustainability messaging resonating\n- Risk: Trust language declining in reviews\n\n**Behavioral** — 289 signals\n- Booking velocity: -4% WoW\n- Repeat rate: Declining in <35 segment\n- Strength: Long-stay bookings +23%\n\n**Cultural** — 246 signals\n- Regulatory pressure: Barcelona STR phase-out\n- Competitor: Booking.com AI investment\n- Opportunity: Climate-conscious travel +63%\n\n◆ Full signal inventory · 847 total · Last 48h refresh · Confidence: MIXED`
      },
      anomaly: {
        guide: `### Anomalies are where the real stories hide.\n\nAn anomaly isn't just a data point that looks different — it's a signal that the model of reality is shifting.\n\n- The biggest current anomaly: Gen Z engagement is *up* while trust is *down*\n- Second: Behavioral signals diverging from Cultural signals in European markets\n- Third: Salient improving while most other dimensions decline\n\n> Which of these anomalies do you think tells the most important story? And does it change your strategy?`,
        guardian: `### Anomaly Detection Report\n\n**Critical (3-layer divergence):**\n- Gen Z: Engagement +34%, Trust -12% — signals misaligned\n- Post-booking friction: Behavioral alarms not yet reflected in Cultural layer\n\n**Watch (2-layer divergence):**\n- European pricing perception shifting — Behavioral down, Expressive stable\n- Sustainability messaging: Cultural strong, Behavioral not yet responding\n\n**Resolved:**\n- App redesign concern (Q1) — Expressive now aligning with positive Cultural\n\n◆ Cross-layer anomaly detection · 847 signals · 48h window · Confidence: HIGH`
      },
      roi: {
        guide: `### How do you measure the ROI of intelligence?\n\nThe hardest question in brand intelligence: what's the return on knowing sooner?\n\n- A 2-week faster response to competitive threats = estimated **$2.4M** in preserved brand equity\n- Avoiding one wrong intervention = saved **$800K** in misdirected spend\n- But the biggest ROI might be *confidence* — knowing the data behind a board recommendation\n\n> How would you make the case that real-time intelligence pays for itself? What metric would convince your CFO?`,
        guardian: `### Intelligence ROI Model\n\n**Direct Value:**\n- Early anomaly detection: Avg \`14 days\` faster than quarterly tracking\n- Intervention targeting: \`45%\` reduction in misdirected brand spend\n- Competitive response: \`2.5X\` faster time-to-action\n\n**Projected Annual Impact:**\n- Preserved brand equity: \`$2.4M\` (based on category avg decline rate)\n- Avoided waste: \`$800K\` (redirected from low-ROI interventions)\n- Net intelligence advantage: \`$3.2M\` annually\n\n◆ ROI benchmark model · N=12 enterprise deployments · Confidence: MEDIUM`
      },
      board: {
        guide: `### What's the 30-second board pitch?\n\nIf you had half a minute in front of the board, here's the structure that works:\n\n1. **The headline**: Brand health at 72, trending down 4 points — not crisis but not comfortable\n2. **The why**: Dependable dimension in critical territory, driven by post-booking friction\n3. **The opportunity**: Three tested scenarios with projected lifts and confidence levels\n4. **The ask**: Budget for transparent pricing pilot with 3.2-point projected composite lift\n\n> What's the one data point that would make your board lean forward? And how would you frame it as an opportunity, not a problem?`,
        guardian: `### Board-Ready Intelligence Summary\n\n**Headline**: Composite \`72 (-4)\` — competitive but declining\n\n**Key Finding**: Dependable dimension crisis (\`58, -6\`) driven by post-booking operational friction. 73% of behavioral signals point to product, not perception.\n\n**Recommended Action**: Transparent Pricing pilot\n- Projected lift: \`3.2 points\` over 8 weeks\n- Confidence: 78%\n- Investment required: $150K pilot\n\n**Competitive Context**: Category leader at 74, gap closing. Window for intervention: 6-8 weeks.\n\n◆ Executive intelligence brief · BIE v9 · Full signal synthesis · Confidence: HIGH`
      },
      trend: {
        guide: `### What's the trajectory telling you?\n\nThe composite has declined 4 points over 2 quarters. But not all dimensions are moving the same direction:\n\n- **Declining**: Dependable (-6), Personal (-8), User Friendly (-4), Meaningful (-3)\n- **Stable**: Accessible (+1)\n- **Growing**: Salient (+2)\n\nThe pattern suggests a brand that's *visible* but not *delivering*. People know you, but the experience isn't matching the promise.\n\n> If the trend continues at this rate, where does the composite land in 6 months? And what's the intervention that bends the curve?`,
        guardian: `### Trend Analysis — 6-Month Trajectory\n\n**Current trajectory (no intervention):**\n- Composite: 72 → projected \`68\` in 6 months\n- Dependable: 58 → projected \`54\` (critical threshold breach)\n- Personal: 64 → projected \`60\`\n\n**With recommended interventions:**\n- Composite: 72 → projected \`74\` (transparent pricing + trust campaign)\n- Dependable: 58 → projected \`63\` (operational fixes)\n\n**Delta**: \`6 points\` difference between action and inaction over 6 months.\n\n◆ Trend projection model · Linear + seasonal adjustment · Confidence: MEDIUM`
      },
      pricing: {
        guide: `### Does transparent pricing actually build trust?\n\nThe data suggests yes — but with nuance. Brands with transparent pricing see **28% higher repeat booking rates**. But the effect isn't instant.\n\n- Short-term: User Friendly improves first (people appreciate the clarity)\n- Medium-term: Dependable follows (consistent pricing builds reliability perception)\n- Long-term: Meaningful can benefit if pricing transparency becomes part of the brand story\n\n> Here's the tension: transparent pricing might lower per-transaction revenue. How do you weigh that against the loyalty gains?`,
        guardian: `### Pricing Intervention Analysis\n\n**Transparent Pricing Pilot:**\n- Target dimension: User Friendly (\`72, -4\`)\n- Secondary impact: Dependable (\`58, -6\`)\n- Projected composite lift: \`3.2 points\` over 8 weeks\n- Confidence: 78%\n\n**Evidence Base:**\n- Cross-category data: 28% higher repeat rates with transparent pricing\n- Category-specific: 2 competitors saw +4-5 on User Friendly after pricing changes\n- Risk: 3-5% per-transaction revenue dip in month 1\n\n### Recommendation\n\nPilot in top 3 markets. Measure User Friendly delta at 4 weeks.\n\n◆ Pricing signal analysis · Behavioral + Competitive data · N=24,000 · Confidence: HIGH`
      },
      campaign: {
        guide: `### When does a campaign actually move brand health?\n\nNot all campaigns move all dimensions. The key is matching intervention type to dimension:\n\n- **Awareness campaigns** → Salient (fastest mover, 2-4 weeks)\n- **Experience improvements** → User Friendly, Personal (4-8 weeks)\n- **Content/storytelling** → Meaningful (8-12 weeks)\n- **Operational fixes** → Dependable (12+ weeks, but most durable)\n\n> Given where the scores are right now, which type of campaign would give you the most strategic leverage?`,
        guardian: `### Campaign Impact Model by Dimension\n\n| Campaign Type | Primary Dimension | Expected Lift | Time to Impact | Confidence |\n|---|---|---|---|---|\n| Trust Recovery | Dependable | +2.1 pts | 12 weeks | 89% |\n| Transparent Pricing | User Friendly | +3.2 pts | 8 weeks | 78% |\n| Personalization Engine | Personal | +1.8 pts | 16 weeks | 72% |\n| Stories Worth Staying | Meaningful | +1.5 pts | 12 weeks | 65% |\n| Brand Recall Burst | Salient | +1.2 pts | 4 weeks | 91% |\n\n### Optimal Sequence\n\nTransparent Pricing → Trust Recovery → Personalization (compound effects)\n\n◆ Campaign impact benchmarking · Cross-category · N=229 brands · Confidence: HIGH`
      }
    };

    for (const [key, responseObj] of Object.entries(responses)) {
      if (key !== 'default' && query.includes(key)) {
        const raw = isGuide ? responseObj.guide : responseObj.guardian;
        return this.parseAnalystResponse(raw);
      }
    }

    // Page-specific defaults when no topic keyword is matched
    const pageDefaults = {
      guide: {
        'strategic-brief': "### What catches your eye in this brief?\n\nThe strategic brief is the narrative layer — it connects data points into a story. Look at the dimension scores, the competitive positioning, and the trend lines.\n\n- What's the biggest surprise?\n- What confirms what you already suspected?\n- What would you want to investigate further?\n\n> The best strategic insights come from noticing what *doesn't* fit the pattern.",
        'command-center': "### Your daily intelligence, at a glance.\n\nThe Command Center prioritizes what needs your attention today. Three questions to start:\n\n- Which alert would you action first?\n- What's changed since yesterday?\n- What signal would change your plan for the week?\n\n> Think of this as your morning intelligence briefing — what's the one thing you need to know?",
        'signal-terminal': "### 847 signals. Which one matters most?\n\nThe Signal Terminal shows everything BIE is monitoring in real time. But volume isn't insight. The art is filtering.\n\n- Try filtering by confidence level to see what's HIGH certainty\n- Look for convergence — where two or three layers agree\n- Watch for divergence — that's where the story is hiding\n\n> If you could only see three signals today, which three would tell you the most?",
        'guided-analysis': "### Let's build an analysis together.\n\nGuided analysis works best when you come with a question:\n\n- A dimension you want to understand\n- A competitive question you want answered\n- An audience segment you want to explore\n\n> What's the question that's been on your mind? Let's structure an answer.",
        'scenario-lab': "### Test a strategy before you commit.\n\nThe Scenario Lab lets you model interventions with 650 simulated consumers. Five modes:\n\n- **War Gaming**: Competitive scenario planning\n- **Brand Score LIVE**: Dimension manipulation\n- **Focus Groups**: Synthetic audience reactions\n- **Insight Generation**: AI-driven discovery\n- **Signal Nexus**: Multi-source synthesis\n\n> What strategy question would be most valuable to test right now?",
        'brand-fidelity': "### Six dimensions. One composite. What's the story?\n\nThe Brand Score framework measures brand health across two time horizons:\n\n- **In the Moment**: User Friendly, Personal, Accessible — how the brand feels *right now*\n- **Over Time**: Dependable, Meaningful, Salient — what anchors *long-term loyalty*\n\n> Which dimension do you think matters most for your brand's next 12 months?",
        'default': "### What are you curious about?\n\nI can help you explore brand health from any angle — dimensions, competitors, segments, scenarios, or signals. In Ask mode, I'll help you think through the data rather than just presenting it.\n\n> Start with what's on your mind, or try one of the suggestions below."
      },
      guardian: {
        'strategic-brief': "### Strategic Brief — Quick Diagnostic\n\nComposite: \`72 (-4)\` · 4 of 6 dimensions declining · 1 critical (Dependable at 58)\n\nHuman-Expressive signals: Net positive but weakening\nBehavioral signals: Diverging from expressive — action gap widening\nCultural signals: Mixed — sustainability positive, regulatory risk emerging\n\n◆ Full brief synthesis · 847 signals · Confidence: HIGH",
        'command-center': "### Today's Intelligence Summary\n\n**3 items flagged for attention:**\n\n1. Dependable dimension breach: below 60 threshold\n2. Gen Z engagement anomaly: +34% engagement, -12% trust\n3. Competitor movement: Category leader +3 on User Friendly\n\n**Recommended priority**: Dependable — systemic risk if unaddressed\n\n◆ Command Center digest · Cross-signal prioritization · Confidence: HIGH",
        'signal-terminal': "### Signal Terminal Status\n\n- **Total active signals**: 847\n- **HIGH confidence**: 12 (3-layer convergence)\n- **MEDIUM confidence**: 89 (2-layer convergence)\n- **Monitoring**: 746 (single-layer or emerging)\n\n**Top convergence**: Post-booking friction → Dependable erosion\n**Top divergence**: Gen Z engagement ↑ vs. trust ↓\n\n◆ Real-time signal inventory · Updated: 2h ago · Confidence: HIGH",
        'default': "### Cross-referencing signal layers...\n\nI can surface diagnostics on any dimension, run competitive comparisons, analyze signal patterns, or generate briefings.\n\nSpecify what you need: a dimension, a segment, a competitor, or a timeframe — and I'll pull the data.\n\n◆ Explore mode: structured diagnostics with data attribution"
      }
    };

    const pageDefault = pageDefaults[isGuide ? 'guide' : 'guardian']?.[this.currentPage] || pageDefaults[isGuide ? 'guide' : 'guardian']?.['default'];
    const defaultGuide = pageDefault || "### What are you curious about?\n\nI can help you explore any dimension, competitor, signal pattern, or scenario. In Ask mode, I'll guide your thinking with questions rather than just handing you answers.\n\n> Start with what's on your mind — there are no wrong questions here.";
    const defaultGuardian = pageDefault || "### Ready for your query.\n\nSpecify a dimension, competitor, segment, or timeframe and I'll surface the relevant data with confidence scores and source attribution.\n\n◆ Explore mode active · 847 signals available · All dimensions queryable";

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
        title: 'Brand Score: Six Dimensions of Brand Score',
        description: 'Every insight maps to six measurable dimensions: three "In the Moment" (User Friendly, Personal, Accessible) and three "Over Time" (Dependable, Meaningful, Salient). Together, they reveal the full picture.',
        visual: 'dimensions'
      },
      {
        title: 'Intelligence That Moves With Your Day',
        description: 'From your morning briefing to midnight autonomous scans, BIE surfaces the right insight at the right moment. Every surface connects through the Brand Score thread.',
        visual: 'timeline'
      },
      {
        title: 'Meet Your M+ Intelligence Partner',
        description: 'Two modes, one goal: clarity. Socratic Guide asks the questions that sharpen your thinking. Guardian of Data delivers precise, attributed answers. Toggle between them anytime.',
        visual: 'analyst'
      },
      {
        title: 'Explore at Your Own Pace',
        description: 'The system reveals itself as you go — think fog-of-war, not firehose. Start with the Strategic Brief for the big picture, or dive into Day in the Life to see it in action. Each surface unlocks a new layer of intelligence.',
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
        // Official Brand Score wheel image
        return `
          <div style="display: flex; align-items: center; justify-content: center;">
            <img src="assets/images/fidelity-wheel.png" alt="Brand Score Framework — Six Dimensions" style="max-width: 200px; width: 100%; height: auto; border-radius: 8px;">
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

    const helpBtn = document.createElement('button');
    helpBtn.className = 'help-trigger';
    helpBtn.textContent = '?';
    helpBtn.title = 'Replay onboarding guide';
    helpBtn.setAttribute('aria-label', 'Help: replay onboarding');

    helpBtn.addEventListener('click', () => {
      localStorage.removeItem('bie-onboarded');
      location.reload();
    });

    // Append inline with Signal Activity label row
    const pulseLabel = document.querySelector('.nav-pulse-label');
    if (pulseLabel) {
      pulseLabel.appendChild(helpBtn);
    } else {
      const nav = document.querySelector('.nav');
      if (nav) nav.appendChild(helpBtn);
      else document.body.appendChild(helpBtn);
    }
    requestAnimationFrame(() => helpBtn.style.display = 'flex');
  }
};

/* ── Brand Score Radar Chart Renderer ── */
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

document.addEventListener('DOMContentLoaded', () => {
  BIE.init();
  // Safety net: ensure help button renders even if init chain has issues
  setTimeout(() => { try { BIE.addHelpButton(); } catch(e) {} }, 2000);
});
