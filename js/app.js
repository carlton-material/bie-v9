/* ═══════════════════════════════════════════════════════════
   BRAND INTELLIGENCE ENGINE v9 — App Core
   Shared state, navigation, scroll reveal, number animations,
   intelligence feed, Material Analyst panel
   ═══════════════════════════════════════════════════════════ */

const BIE = {
  brand: null,
  currentPage: null,

  analystMode: 'guide', // guide or guardian

  async init() {
    // Load brand config
    try {
      const resp = await fetch('data/stayworthy.json');
      this.brand = await resp.json();
    } catch(e) {
      console.warn('Brand config not loaded, using defaults');
      this.brand = { name: 'Stayworthy', composite: 72, delta: -4 };
    }

    this.currentPage = document.body.dataset.page;
    this.initNav();
    this.initScrollReveal();
    this.initCountUp();
    this.initAnalyst();
    this.initFeed();
    this.initSignalPulse();
    this.initRadarChart();
    this.initGlassBox();
    this.initOnboarding();

    document.body.classList.add('loaded');
  },

  initRadarChart() {
    const radarContainer = document.getElementById('bf-radar');
    if (!radarContainer || !this.brand) return;

    const drivers = this.brand.drivers;
    renderRadarChart('bf-radar', drivers, {
      width: 400,
      height: 400,
      showCompetitor: true,
      competitorScore: 74,
      competitorLabel: 'Booking.com'
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
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  },

  /* ── Count-Up Animation ── */
  initCountUp() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = 'true';
          const target = parseFloat(entry.target.dataset.value);
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
    }, { threshold: 0.5 });

    document.querySelectorAll('.count-up').forEach(el => observer.observe(el));
  },

  /* ── Material Analyst ── */
  initAnalyst() {
    const trigger = document.querySelector('.analyst-trigger');
    const panel = document.querySelector('.analyst-panel');
    if (!trigger || !panel) return;

    const closeBtn = panel.querySelector('.analyst-panel-close');
    const input = panel.querySelector('.analyst-panel-input input');
    const sendBtn = panel.querySelector('.analyst-panel-input button');
    const messages = panel.querySelector('.analyst-panel-messages');
    const modeToggle = panel.querySelector('.analyst-mode-toggle');

    let isOpen = false;

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
      modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          modeButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.analystMode = btn.dataset.mode;

          // Show mode description
          const description = this.getAnalystModeDescription(this.analystMode);
          if (description) {
            const descMsg = document.createElement('div');
            descMsg.className = 'analyst-msg system mode-description';
            descMsg.innerHTML = `<em>${description}</em>`;
            messages.appendChild(descMsg);
            messages.scrollTop = messages.scrollHeight;
          }
        });
      });
    }

    const contextMessages = {
      'strategic-brief': "You're reading the strategic brief. I can walk you through the market dynamics driving this transformation, or help you understand any specific section.",
      'how-it-works': "This is the architecture transparency layer. Ask me about any signal type, data source, or methodology — I'll show my work.",
      'command-center': "Welcome to your Command Center. I've flagged 3 signals that need your attention this morning. Want me to walk you through them?",
      'signal-terminal': "Signal Terminal active. I'm monitoring 847 signals across all three layers. Shall I surface the anomalies?",
      'guided-analysis': "Ready for guided analysis. Tell me what you're trying to understand and I'll ask the right questions to get us there.",
      'scenario-lab': "Scenario Lab loaded with 650 agents. Want to run a preset war game, or shall we design a custom scenario?",
      'day-in-the-life': "You're viewing the Day in the Life narrative. I can personalize this for your specific role and workflow."
    };

    // Initial context message
    if (messages && this.currentPage && contextMessages[this.currentPage]) {
      const msg = document.createElement('div');
      msg.className = 'analyst-msg system';
      msg.textContent = contextMessages[this.currentPage];
      messages.appendChild(msg);
    }

    // Preset questions (used by some surfaces)
    const presetBtns = document.querySelectorAll('[data-analyst-preset]');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!isOpen) toggle();
        const query = btn.dataset.analystPreset;
        setTimeout(() => this.sendAnalystMessage(query, messages, input), 300);
      });
    });

    // Send message
    const send = () => {
      if (!input || !input.value.trim()) return;
      this.sendAnalystMessage(input.value, messages, input);
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

    setTimeout(() => {
      const resp = document.createElement('div');
      resp.className = 'analyst-msg system';
      resp.innerHTML = this.generateAnalystResponse(query.toLowerCase());
      messages.appendChild(resp);
      messages.scrollTop = messages.scrollHeight;
    }, 800);
  },

  getAnalystModeDescription(mode) {
    const descriptions = {
      guide: "I'll help you discover insights through guided questions",
      guardian: "I'll deliver direct analysis with full data attribution"
    };
    return descriptions[mode] || '';
  },

  generateAnalystResponse(query) {
    const isGuide = this.analystMode === 'guide';

    const responses = {
      trust: {
        guide: "<strong>Question:</strong> You mentioned a 22-point gap between what users say and what they actually do with their bookings. What do you think that gap tells us about the functional vs. emotional dimensions of trust? And which driver might be at the root of that divergence?",
        guardian: "<strong>Diagnostic:</strong> Stayworthy's trust metrics show a 22-point gap between expressive sentiment (78%) and behavioral signals (56%). This gap has widened 4 points in 6 weeks — a leading indicator of churn.<br><br><strong>Attack:</strong> Deploy transparent pricing pilot in top 3 markets to close User Friendly gap.<br><strong>Defend:</strong> Maintain Salient advantage (74, +2) through consistent booking experience.<br><strong>Bridge:</strong> Partner with verified-review platforms to convert trust into behavioral loyalty.<br><br><span style='font-family:var(--font-mono);font-size:var(--text-nano);color:var(--text-muted)'>◆ Human-Expressive + Behavioral signal correlation · N=847 · Confidence: HIGH</span>"
      },
      competitor: {
        guide: "<strong>Question:</strong> Booking.com is leading at 74, but Stayworthy is closing the gap at 72. What do you notice about which drivers they're strong in vs. where your opportunity actually is? Personal and Meaningful are both underdeveloped in the category—why do you think that is?",
        guardian: "<strong>Diagnostic:</strong> Booking.com leads at 74 BF composite, driven by Dependable (+8 vs category) and User Friendly (+6). Stayworthy's opportunity lies in Meaningful and Personal — both underserved category-wide.<br><br><strong>Attack:</strong> Invest in Personal (64, -8) through ML-driven recommendation personalization.<br><strong>Defend:</strong> Protect Salient (74) through brand recall campaigns in peak booking season.<br><strong>Bridge:</strong> Meaningful (66, -3) bridges functional satisfaction to emotional loyalty.<br><br><span style='font-family:var(--font-mono);font-size:var(--text-nano);color:var(--text-muted)'>◆ Brand Fidelity Report 2026 · Travel Category · N=24,000 · Confidence: HIGH</span>"
      },
      'gen z': {
        guide: "<strong>Question:</strong> Gen Z engagement with peer-reviewed content is up 34% despite lower trust in brands. How does that paradox inform the Meaningful driver? What would it take to build a community-first experience that shifts their perception from transactional to belonging?",
        guardian: "<strong>Diagnostic:</strong> Gen Z trust in travel platforms declined 12% YoY, but engagement with peer-reviewed content is up 34%. They don't trust brands, but they trust communities hosted on brand platforms.<br><br><strong>Attack:</strong> Launch UGC-first booking experience with social proof at every decision point.<br><strong>Bridge:</strong> This is a Meaningful driver opportunity — make the platform a place Gen Z identifies with, not just transacts on.<br><br><span style='font-family:var(--font-mono);font-size:var(--text-nano);color:var(--text-muted)'>◆ Cultural + Behavioral signal cross-ref · TikTok, Reddit, Google Trends · Confidence: MEDIUM</span>"
      },
      scenario: {
        guide: "<strong>Question:</strong> If you ran a transparent pricing pilot and saw a 3.2-point composite lift, which driver would move first—User Friendly or one of the Over Time drivers? How do you expect that first mover to cascade into others?",
        guardian: "<strong>Recommendation:</strong> Start with 'Transparent Pricing' scenario — directly targets User Friendly (72, -4). Simulation: 3.2 point composite lift over 8 weeks at 78% confidence.<br><br>Alternative: 'Trust Recovery Campaign' produces 2.1 point lift with higher certainty (89%) but slower trajectory (12 weeks).<br><br><span style='font-family:var(--font-mono);font-size:var(--text-nano);color:var(--text-muted)'>◆ ABM simulation · 650 agents · 100 iterations · Bass diffusion + softmax utility · Confidence: HIGH</span>"
      },
      fidelity: {
        guide: "<strong>Question:</strong> Looking at the 6 drivers, Dependable is the crisis point at 58. It's an Over Time driver—which means it anchors long-term loyalty. What does a 6-point decline over 2 quarters tell you about the user experience? And why would fixing it matter more than improving Personal or Meaningful right now?",
        guardian: "<strong>Brand Fidelity's 6 Drivers:</strong><br>In the Moment: User Friendly (72, -4) · Personal (64, -8) · Accessible (71, +1)<br>Over Time: Dependable (58, -6) · Meaningful (66, -3) · Salient (74, +2)<br><br><strong>Key Insight:</strong> Dependable is the crisis driver at 58 (-6). It anchors long-term loyalty and is dragging the composite. Personal (-8) is the biggest single delta but operates at shorter time horizons.<br><br><span style='font-family:var(--font-mono);font-size:var(--text-nano);color:var(--text-muted)'>◆ M+ Brand Fidelity Framework · 2X advocacy, 2.5X profitability, 3X differentiation · Confidence: HIGH</span>"
      },
      meaningful: {
        guide: "<strong>Question:</strong> Meaningful sits at 66 with a -3 decline. It's the bridge between functional satisfaction and emotional loyalty. What would a 'Stories Worth Staying For' content program actually change about user behavior? How do you measure success beyond engagement?",
        guardian: "<strong>Diagnostic:</strong> Meaningful (66, -3) is the bridge between functional satisfaction and emotional loyalty. Brands with high Meaningful scores see 2.8X higher advocacy rates.<br><br><strong>Attack:</strong> Launch a \"Stories Worth Staying For\" content series — turn property stays into narratives.<br><strong>Defend:</strong> Don't let Meaningful erosion cascade into Dependable. Monitor monthly.<br><br><span style='font-family:var(--font-mono);font-size:var(--text-nano);color:var(--text-muted)'>◆ BF Report 2026 · Cross-category analysis · N=229 brands · Confidence: HIGH</span>"
      },
      dependable: {
        guide: "<strong>Question:</strong> Dependable is in critical territory at 58 (-6). The behavioral data says 73% of its decline correlates with post-booking experience. If you could fix just the top 3 operational pain points (cancellation friction, response time, billing), which would you tackle first and why? What's your theory on the root cause?",
        guardian: "<strong>Diagnostic:</strong> Dependable (58, -6) is in critical territory. This is the most influential Over Time driver — it defines whether customers return. A 6-point decline over 2 quarters signals systemic operational issues, not just perception.<br><br><strong>Attack:</strong> Audit and fix the top 5 operational pain points surfaced in behavioral signals (cancellation friction, response time, billing accuracy).<br><strong>Bridge:</strong> Behavioral data shows 73% of Dependable declines correlate with post-booking experience, not pre-booking perception.<br><br><span style='font-family:var(--font-mono);font-size:var(--text-nano);color:var(--text-muted)'>◆ Behavioral signal cluster analysis · Booking + post-stay data · N=312 signals · Confidence: HIGH</span>"
      }
    };

    for (const [key, responseObj] of Object.entries(responses)) {
      if (key !== 'default' && query.includes(key)) {
        return isGuide ? responseObj.guide : responseObj.guardian;
      }
    }

    const defaultGuide = "<strong>Analyzing...</strong> Let me ask you this: what pattern do you notice first when you look at these drivers? The Human-Expressive signals suggest one story, but Behavioral signals tell something different.<br><br><em>Try asking about: trust gap, competitors, Gen Z, scenarios, Brand Fidelity drivers, Meaningful, or Dependable.</em>";
    const defaultGuardian = "<strong>Analyzing...</strong> Cross-referencing all three signal layers. The Human-Expressive data suggests one pattern, but Behavioral signals tell a different story. Let me surface the specific data points and their confidence scores...<br><br><em>Try asking about: trust gap, competitors, Gen Z, scenarios, Brand Fidelity drivers, Meaningful, or Dependable.</em>";

    return isGuide ? defaultGuide : defaultGuardian;
  },

  /* ── RSS Intelligence Feed ── */
  initFeed() {
    const ticker = document.querySelector('.feed-ticker-track');
    if (!ticker) return;

    const items = [
      { source: 'Strategy+Business', text: 'AI-native analytics platforms projected to capture 40% of brand tracking spend by 2028', time: '2h' },
      { source: 'Adweek', text: 'Gen Z brand loyalty metrics show fundamental shift toward experience-over-product', time: '3h' },
      { source: 'CNBC', text: 'Airbnb reports 23% increase in long-stay bookings, signaling structural shift in travel behavior', time: '4h' },
      { source: 'HBR', text: 'Companies with real-time brand intelligence see 2.5x faster response to competitive threats', time: '5h' },
      { source: 'Skift', text: 'Barcelona announces plan to phase out all STR licenses by 2028 — regulatory wave accelerates', time: '5h' },
      { source: 'Marketing Week', text: 'Brand tracking industry faces disruption as AI synthesis replaces periodic survey models', time: '6h' },
      { source: 'TechCrunch', text: 'New study: multi-signal brand measurement outperforms single-source tracking by 340%', time: '7h' },
      { source: 'Bloomberg', text: 'Travel sector brand valuations diverge sharply as digital-native platforms gain trust edge', time: '8h' },
      { source: 'Phocuswire', text: 'Google Travel expanding AI trip planning — OTA disintermediation risk intensifies', time: '8h' },
      { source: 'Forrester', text: 'Real-time competitive intelligence now cited as top priority by 67% of CMOs surveyed', time: '9h' },
      { source: 'McKinsey', text: 'Predictive brand health models reduce customer churn intervention costs by 45%', time: '10h' },
      { source: 'Reuters', text: 'Hospitality sector sees record M&A activity driven by brand portfolio consolidation', time: '11h' },
      { source: 'WSJ', text: 'Consumer trust in AI-powered services reaches inflection point — 52% now comfortable with AI recommendations', time: '12h' },
      { source: 'Financial Times', text: 'Southeast Asian travel market surges 47% YoY — signaling next frontier for brand expansion', time: '13h' },
      { source: 'ESOMAR', text: 'Synthetic research methodologies gain credibility — 38% of research budgets shifting to AI-augmented approaches', time: '14h' },
      { source: 'Skift', text: 'Booking Holdings invests $500M in AI-driven loyalty personalization platform', time: '15h' },
      { source: 'Adweek', text: 'TikTok becomes #1 travel inspiration source for under-30 travelers — cultural signal shift', time: '16h' },
      { source: 'CNBC', text: 'Climate-conscious travel segment grows 63% — sustainability signals now material for brand health', time: '17h' },
      { source: 'HBR', text: 'The trust premium: brands with transparent pricing see 28% higher repeat booking rates', time: '18h' },
      { source: 'Bloomberg', text: 'Private equity exits in hospitality sector accelerate as brand valuations compress', time: '19h' },
    ];

    // Duplicate for seamless loop
    const allItems = [...items, ...items];
    ticker.innerHTML = allItems.map(item => `
      <span class="feed-item">
        <span class="feed-item-dot"></span>
        <span class="feed-item-source">${item.source}</span>
        <span>${item.text}</span>
        <span class="feed-item-time">${item.time}</span>
      </span>
    `).join('');
  },

  /* ── Signal Pulse (ambient activity indicator) ── */
  initSignalPulse() {
    const countEl = document.querySelector('.signal-count');
    if (!countEl) return;

    let count = 847;
    setInterval(() => {
      count += Math.random() > 0.5 ? 1 : 0;
      countEl.textContent = count;
    }, 5000);
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
        title: 'Welcome to the Brand Intelligence Engine',
        description: 'McKinsey-grade brand intelligence, always on. Seven surfaces that transform how you understand, monitor, and act on brand health.',
        visual: 'logo'
      },
      {
        title: 'Brand Fidelity Framework',
        description: 'Six drivers across two dimensions — In the Moment (User Friendly, Personal, Accessible) and Over Time (Dependable, Meaningful, Salient). The connective tissue of everything you see here.',
        visual: 'hexagon'
      },
      {
        title: 'A Day in the Life',
        description: 'Follow a CMO from dawn briefing to midnight signal processing. Each surface maps to a moment in the intelligence workflow.',
        visual: 'timeline'
      },
      {
        title: 'Your Material+ Analyst',
        description: 'Two modes: Guide asks probing questions to help you discover insights. Guardian delivers direct analysis with full attribution. Toggle anytime.',
        visual: 'analyst'
      },
      {
        title: 'Start Exploring',
        description: 'Navigate freely between surfaces. Every claim is attributed. Every metric is traceable. Welcome to the Glass Box.',
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
      title.textContent = step.title;
      description.textContent = step.description;

      // Update indicators
      const dots = card.querySelectorAll('.onboarding-dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentStep);
      });

      // Update visual
      visual.innerHTML = this.generateOnboardingVisual(step.visual);

      // Update button labels
      const prevBtn = actions.querySelector('.onboarding-btn-prev');
      const nextBtn = actions.querySelector('.onboarding-btn-next');

      if (currentStep === steps.length - 1) {
        nextBtn.textContent = 'Get Started';
      } else {
        nextBtn.textContent = 'Next';
      }

      prevBtn.style.display = currentStep === 0 ? 'none' : 'block';
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
      case 'logo':
        // Material+ Logo placeholder
        return `
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <rect x="20" y="20" width="80" height="80" rx="8" stroke="#745AFF" stroke-width="2"/>
            <circle cx="40" cy="40" r="8" fill="#745AFF"/>
            <circle cx="80" cy="40" r="8" fill="#745AFF"/>
            <circle cx="40" cy="80" r="8" fill="#745AFF"/>
            <circle cx="80" cy="80" r="8" fill="#745AFF"/>
          </svg>
        `;

      case 'hexagon':
        // 6-point star (Brand Fidelity drivers)
        return `
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
            <circle cx="70" cy="70" r="60" stroke="#745AFF" stroke-width="1.5" opacity="0.2"/>
            <circle cx="70" cy="70" r="40" stroke="#745AFF" stroke-width="1.5" opacity="0.3"/>
            <circle cx="70" cy="70" r="20" stroke="#745AFF" stroke-width="1.5" opacity="0.4"/>
            <circle cx="70" cy="20" r="6" fill="#745AFF"/>
            <circle cx="105" cy="35" r="6" fill="#8b6fff"/>
            <circle cx="105" cy="105" r="6" fill="#745AFF"/>
            <circle cx="70" cy="120" r="6" fill="#8b6fff"/>
            <circle cx="35" cy="105" r="6" fill="#745AFF"/>
            <circle cx="35" cy="35" r="6" fill="#8b6fff"/>
          </svg>
        `;

      case 'timeline':
        // Timeline dots
        return `
          <svg width="140" height="120" viewBox="0 0 140 120" fill="none">
            <line x1="20" y1="60" x2="120" y2="60" stroke="#745AFF" stroke-width="1.5" opacity="0.3"/>
            <circle cx="20" cy="60" r="5" fill="#745AFF" opacity="0.5"/>
            <circle cx="50" cy="60" r="5" fill="#745AFF" opacity="0.6"/>
            <circle cx="80" cy="60" r="5" fill="#745AFF" opacity="0.7"/>
            <circle cx="110" cy="60" r="6" fill="#745AFF"/>
            <text x="20" y="85" font-size="10" fill="#745AFF" text-anchor="middle" opacity="0.6">6 AM</text>
            <text x="50" y="85" font-size="10" fill="#745AFF" text-anchor="middle" opacity="0.6">12 PM</text>
            <text x="80" y="85" font-size="10" fill="#745AFF" text-anchor="middle" opacity="0.6">5 PM</text>
            <text x="110" y="85" font-size="10" fill="#745AFF" text-anchor="middle">11 PM</text>
          </svg>
        `;

      case 'analyst':
        // Split icon (guide / guardian)
        return `
          <svg width="140" height="120" viewBox="0 0 140 120" fill="none">
            <circle cx="45" cy="60" r="25" stroke="#745AFF" stroke-width="2" fill="none"/>
            <text x="45" y="68" font-size="30" fill="#745AFF" text-anchor="middle" opacity="0.8">?</text>
            <circle cx="95" cy="60" r="25" stroke="#745AFF" stroke-width="2" fill="none" opacity="0.5"/>
            <text x="95" y="68" font-size="30" fill="#745AFF" text-anchor="middle" opacity="0.5">!</text>
            <path d="M 65 50 L 75 60 L 65 70" stroke="#745AFF" stroke-width="1.5" fill="none"/>
          </svg>
        `;

      case 'arrow':
        // Arrow pointing right
        return `
          <svg width="140" height="120" viewBox="0 0 140 120" fill="none">
            <line x1="30" y1="60" x2="110" y2="60" stroke="#745AFF" stroke-width="2"/>
            <path d="M 110 60 L 95 50 M 110 60 L 95 70" stroke="#745AFF" stroke-width="2" fill="none"/>
            <circle cx="30" cy="60" r="4" fill="#745AFF" opacity="0.4"/>
            <circle cx="60" cy="60" r="4" fill="#745AFF" opacity="0.6"/>
            <circle cx="90" cy="60" r="4" fill="#745AFF"/>
          </svg>
        `;

      default:
        return '';
    }
  },

  /* ── Glass Box: Data Provenance System ── */
  glassBoxMeta: null,

  async initGlassBox() {
    try {
      const resp = await fetch('data/signals-metadata.json');
      this.glassBoxMeta = await resp.json();
    } catch(e) {
      console.warn('Glass Box metadata not loaded');
      return;
    }

    // Wire up all "Show My Work" toggles
    document.querySelectorAll('.glass-box-toggle').forEach(toggle => {
      const targetId = toggle.dataset.target;
      const content = targetId ? document.getElementById(targetId) : toggle.closest('.glass-box-panel')?.querySelector('.glass-box-content');
      if (!content) return;

      toggle.setAttribute('aria-expanded', 'false');
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        content.classList.toggle('expanded', !expanded);
      });
    });

    // Render Glass Box content into containers
    this.renderGlassBoxPanels();

    // Add confidence halos to metric cards
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

    // Render flash-frozen timestamps
    document.querySelectorAll('.glass-box-timestamp-container').forEach(container => {
      const ts = meta.lastUpdated;
      container.innerHTML = this.renderFlashFrozen(ts, meta.metrics.signalCounts.total);
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

  renderFlashFrozen(timestamp, recordCount) {
    const d = new Date(timestamp);
    const timeStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `
      <div class="glass-box-timestamp">
        <span class="glass-box-timestamp-icon">📌</span>
        <span class="glass-box-timestamp-label">Flash Frozen</span>
        <span>${timeStr}</span>
        <span class="glass-box-timestamp-value">${recordCount ? recordCount + ' records' : ''}</span>
      </div>
    `;
  },

  applyConfidenceHalos() {
    const meta = this.glassBoxMeta;
    if (!meta?.metrics?.brandFidelity) return;

    // Apply halo to BF composite section
    const compositeSection = document.querySelector('.cc-composite');
    if (compositeSection) {
      const conf = meta.metrics.brandFidelity.composite.confidence;
      compositeSection.classList.add(`confidence-halo-${conf}`);
    }

    // Apply data-status badges to driver cards
    document.querySelectorAll('.cc-driver').forEach(card => {
      const driverName = card.querySelector('.cc-driver-header span')?.textContent?.trim().toLowerCase().replace(/\s+/g, '');
      if (!driverName) return;

      // Map display names to metric keys
      const keyMap = { 'userfriendly': 'userFriendly', 'personal': 'personal', 'accessible': 'accessible', 'dependable': 'dependable', 'meaningful': 'meaningful', 'salient': 'salient' };
      const key = keyMap[driverName];
      if (!key) return;

      const driver = meta.metrics.brandFidelity.drivers[key];
      if (!driver) return;

      // Add confidence and data-status badges
      const existingBadges = card.querySelector('.driver-badges');
      if (!existingBadges) {
        const badges = document.createElement('div');
        badges.className = 'driver-badges';
        badges.style.cssText = 'display:flex;gap:4px;margin-top:4px;';
        badges.innerHTML = `
          <span class="confidence-badge ${driver.confidence}">${driver.confidence}</span>
          <span class="data-status-badge ${driver.dataStatus}">${driver.dataStatus === 'ai-enriched' ? 'AI-Enriched' : driver.dataStatus}</span>
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
    helpBtn.title = 'Replay onboarding';

    helpBtn.addEventListener('click', () => {
      localStorage.removeItem('bie-onboarded');
      location.reload();
    });

    document.body.appendChild(helpBtn);
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

  // Prepare driver data: in the moment (0-2) + over time (3-5)
  const drivers = [
    ...data.inTheMoment,
    ...data.overTime
  ];

  // Draw Stayworthy polygon
  const polygonPoints = [];
  drivers.forEach((driver, i) => {
    const angle = (i / axes) * Math.PI * 2 - Math.PI / 2;
    const value = driver.score;
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
  drivers.forEach((driver, i) => {
    const angle = (i / axes) * Math.PI * 2 - Math.PI / 2;
    const labelDistance = radius * 1.18;
    const x = center.x + labelDistance * Math.cos(angle);
    const y = center.y + labelDistance * Math.sin(angle);

    // Determine group
    const isInTheMoment = i < 3;
    const groupLabel = isInTheMoment ? 'IN THE MOMENT' : 'OVER TIME';
    const groupColor = isInTheMoment ? 'rgba(100, 200, 255, 0.5)' : 'rgba(100, 255, 200, 0.5)';

    // Driver name
    const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    nameText.setAttribute('x', x);
    nameText.setAttribute('y', y - 4);
    nameText.setAttribute('text-anchor', 'middle');
    nameText.setAttribute('font-size', '13');
    nameText.setAttribute('font-family', 'var(--font-body)');
    nameText.setAttribute('font-weight', '600');
    nameText.setAttribute('fill', '#f0f0f0');
    nameText.textContent = driver.name;
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
    scoreText.textContent = `${driver.score} (${driver.delta > 0 ? '+' : ''}${driver.delta})`;
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
