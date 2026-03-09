/* ═══════════════════════════════════════════════════════════
   BIE Signal Client — Client-side signal pipeline
   Runs entirely in the browser on GitHub Pages.
   Fetches real RSS feeds via free CORS proxy, normalizes
   them into the BIE signal schema, and caches in memory.

   No backend, no API keys, no configuration needed.
   ═══════════════════════════════════════════════════════════ */

const BIEApi = {

  // ── State ──
  _signals: [],
  _feedCache: [],
  _lastFetch: 0,
  _fetchInterval: 10 * 60 * 1000,  // Refetch every 10 min
  _fetching: false,
  _nextId: 1,

  // ── CORS Proxies (free, no keys) — try in order, failover ──
  _proxies: [
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ],

  // ── RSS Feed Sources (free, unlimited) ──
  _feeds: [
    { name: 'Skift',       url: 'https://skift.com/feed/',     layer: 'human',    tier: 'primary',   confidence: 0.85 },
    { name: 'PhocusWire',  url: 'https://www.phocuswire.com/rss', layer: 'human', tier: 'primary',   confidence: 0.80 },
    { name: 'CNBC Travel', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000739', layer: 'cultural', tier: 'primary', confidence: 0.85 },
    { name: 'TechCrunch',  url: 'https://techcrunch.com/feed/', layer: 'cultural', tier: 'tertiary',  confidence: 0.60 },
    { name: 'Adweek',      url: 'https://www.adweek.com/feed/', layer: 'cultural', tier: 'secondary', confidence: 0.70 },
  ],

  // ── Brand detection keywords ──
  _brands: {
    'airbnb': 'Airbnb', 'abnb': 'Airbnb',
    'booking': 'Booking', 'booking.com': 'Booking',
    'marriott': 'Marriott', 'hilton': 'Hilton',
    'expedia': 'Expedia', 'hyatt': 'Hyatt',
    'wyndham': 'Wyndham', 'tripadvisor': 'TripAdvisor',
    'vrbo': 'VRBO', 'accor': 'Accor', 'ihg': 'IHG'
  },

  _highKeywords: ['crisis','lawsuit','recall','acquisition','surge','record','breaking','plunge','disruption','layoff','breach'],
  _medKeywords: ['analysis','trend','report','growth','decline','forecast','strategy','partnership','launch','expansion','earnings','revenue'],

  // ══════════════════════════════════════════════
  //  PUBLIC API — same interface as before
  // ══════════════════════════════════════════════

  /**
   * Fetch live RSS signals. Returns feed items for the ticker.
   * @param {number} limit
   * @returns {{ items: Array<{source,text,time}>, source: 'live'|'cache' }}
   */
  async getFeed(limit = 8) {
    await this._ensureFresh();
    const items = this._signals
      .sort((a, b) => b.id - a.id)
      .slice(0, limit)
      .map(s => ({ source: s.source, text: s.text, time: s.time }));
    return { items, source: items.length > 0 ? 'live' : 'none' };
  },

  /**
   * Get signal counts by layer.
   */
  async getStats() {
    await this._ensureFresh();
    const stats = { total: this._signals.length, human: 0, behavioral: 0, cultural: 0 };
    for (const s of this._signals) {
      if (s.layer === 'human') stats.human++;
      else if (s.layer === 'behavioral') stats.behavioral++;
      else if (s.layer === 'cultural') stats.cultural++;
    }
    return { ...stats, source: this._signals.length > 0 ? 'live' : 'static' };
  },

  /**
   * Get all cached signals, optionally filtered.
   */
  async getSignals({ layer, severity, limit = 50 } = {}) {
    await this._ensureFresh();
    let filtered = [...this._signals];
    if (layer) filtered = filtered.filter(s => s.layer === layer);
    if (severity) filtered = filtered.filter(s => s.severity === severity);
    filtered.sort((a, b) => b.id - a.id);
    return { signals: filtered.slice(0, limit), total: filtered.length, source: 'live' };
  },

  /**
   * Glass Box explanation for a signal.
   */
  buildGlassBoxExplanation(signal) {
    if (!signal?.provenance) return '';
    const p = signal.provenance;
    return `Live signal from ${signal.source} · ${Math.round(p.confidence * 100)}% confidence (${p.tier} tier)`;
  },

  getSourceLink(signal) {
    return signal?.provenance?.sourceUrl || null;
  },

  // ══════════════════════════════════════════════
  //  INTERNAL — RSS fetching + parsing
  // ══════════════════════════════════════════════

  async _ensureFresh() {
    const now = Date.now();
    if (this._fetching) return;
    if (this._signals.length > 0 && (now - this._lastFetch) < this._fetchInterval) return;

    this._fetching = true;
    try {
      await this._fetchAllFeeds();
      this._lastFetch = now;
    } catch (e) {
      console.warn('[BIEApi] RSS fetch failed:', e.message);
    }
    this._fetching = false;
  },

  async _fetchAllFeeds() {
    const results = await Promise.allSettled(
      this._feeds.map(feed => this._fetchFeed(feed))
    );

    let added = 0;
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value > 0) added += r.value;
    }
    if (added > 0) console.log(`[BIEApi] Ingested ${added} live signals from ${this._feeds.length} RSS feeds`);
  },

  async _fetchFeed(feedConfig) {
    const xml = await this._fetchWithProxy(feedConfig.url);
    if (!xml) return 0;

    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    // Handle both RSS <item> and Atom <entry>
    const items = doc.querySelectorAll('item, entry');
    let added = 0;

    for (let i = 0; i < Math.min(items.length, 6); i++) {
      const item = items[i];
      const title = item.querySelector('title')?.textContent?.trim() || '';
      const link = item.querySelector('link')?.textContent?.trim() ||
                   item.querySelector('link')?.getAttribute('href') || '';
      const pubDate = item.querySelector('pubDate, published, updated')?.textContent?.trim();
      const description = item.querySelector('description, summary, content')?.textContent?.trim() || '';

      if (!title) continue;

      // Dedup: skip if we already have this title
      const titleLower = title.toLowerCase();
      if (this._signals.some(s => s.text.toLowerCase() === titleLower)) continue;

      const combined = `${title} ${description}`;
      const signal = {
        id: this._nextId++,
        time: this._formatTime(pubDate),
        layer: feedConfig.layer,
        severity: this._detectSeverity(combined),
        brand: this._detectBrand(combined),
        text: this._truncate(title, 150),
        source: feedConfig.name,
        provenance: {
          sourceUrl: link,
          sourceTitle: title,
          connector: `rss:${feedConfig.name.toLowerCase().replace(/\s+/g, '-')}`,
          confidence: feedConfig.confidence,
          tier: feedConfig.tier,
          dataClass: 'raw',
          ingestedAt: new Date().toISOString()
        }
      };

      this._signals.push(signal);
      added++;
    }

    // Cap at 200 signals in memory
    if (this._signals.length > 200) {
      this._signals = this._signals.slice(-200);
    }

    return added;
  },

  /**
   * Try each CORS proxy in order until one works.
   */
  async _fetchWithProxy(url) {
    for (const proxyFn of this._proxies) {
      try {
        const proxyUrl = proxyFn(url);
        const resp = await fetch(proxyUrl, {
          signal: AbortSignal.timeout(8000),
          headers: { 'Accept': 'application/rss+xml, application/xml, text/xml, */*' }
        });
        if (resp.ok) {
          const text = await resp.text();
          // Basic check that it's actually XML
          if (text.includes('<') && (text.includes('<rss') || text.includes('<feed') || text.includes('<item'))) {
            return text;
          }
        }
      } catch {
        // Try next proxy
        continue;
      }
    }
    return null;
  },

  // ── Helpers ──

  _formatTime(dateStr) {
    if (!dateStr) {
      const n = new Date();
      return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const n = new Date();
      return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
    }
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  },

  _detectSeverity(text) {
    const lower = text.toLowerCase();
    if (this._highKeywords.some(k => lower.includes(k))) return 'high';
    if (this._medKeywords.some(k => lower.includes(k))) return 'medium';
    return 'low';
  },

  _detectBrand(text) {
    const lower = text.toLowerCase();
    for (const [keyword, brand] of Object.entries(this._brands)) {
      if (lower.includes(keyword)) return brand;
    }
    return 'Category';
  },

  _truncate(text, max = 150) {
    const clean = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return clean.length <= max ? clean : clean.slice(0, max - 3) + '...';
  }
};
