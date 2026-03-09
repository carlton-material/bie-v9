/* ═══════════════════════════════════════════════════════════
   Signal Store — In-memory signal database with FIFO eviction
   ═══════════════════════════════════════════════════════════ */

class SignalStore {
  constructor(maxSignals = 1000) {
    this.signals = [];
    this.maxSignals = maxSignals;
    this.nextId = 1;
    this.sourceHealth = {};   // { sourceName: { lastFetch, count, errors } }
    this.startTime = Date.now();
  }

  /** Add a normalized signal to the store */
  addSignal(signal) {
    const enriched = {
      ...signal,
      id: this.nextId++,
      ingested: new Date().toISOString()
    };
    this.signals.push(enriched);

    // FIFO eviction
    if (this.signals.length > this.maxSignals) {
      this.signals = this.signals.slice(-this.maxSignals);
    }

    return enriched;
  }

  /** Add multiple signals at once */
  addBatch(signals) {
    return signals.map(s => this.addSignal(s));
  }

  /** Get signals with optional filters */
  getSignals({ layer, severity, brand, limit = 50, offset = 0 } = {}) {
    let filtered = [...this.signals];

    if (layer) filtered = filtered.filter(s => s.layer === layer);
    if (severity) filtered = filtered.filter(s => s.severity === severity);
    if (brand) filtered = filtered.filter(s =>
      s.brand.toLowerCase().includes(brand.toLowerCase())
    );

    // Most recent first
    filtered.sort((a, b) => b.id - a.id);

    return {
      signals: filtered.slice(offset, offset + limit),
      total: filtered.length,
      offset,
      limit
    };
  }

  /** Get signals formatted for the feed ticker */
  getFeed(limit = 20) {
    const recent = [...this.signals]
      .sort((a, b) => b.id - a.id)
      .slice(0, limit);

    return recent.map(s => ({
      source: s.source,
      text: s.text,
      time: s.time
    }));
  }

  /** Get signal statistics by layer */
  getStats() {
    const stats = {
      total: this.signals.length,
      human: 0,
      behavioral: 0,
      cultural: 0,
      lastUpdated: null,
      bySource: {}
    };

    for (const s of this.signals) {
      if (s.layer === 'human') stats.human++;
      else if (s.layer === 'behavioral') stats.behavioral++;
      else if (s.layer === 'cultural') stats.cultural++;

      if (!stats.bySource[s.source]) stats.bySource[s.source] = 0;
      stats.bySource[s.source]++;
    }

    if (this.signals.length > 0) {
      stats.lastUpdated = this.signals[this.signals.length - 1].ingested;
    }

    return stats;
  }

  /** Pipeline health status */
  getHealth() {
    return {
      status: 'operational',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      signalCount: this.signals.length,
      maxCapacity: this.maxSignals,
      sources: this.sourceHealth,
      startedAt: new Date(this.startTime).toISOString()
    };
  }

  /** Update source health tracking */
  updateSourceHealth(sourceName, { count = 0, error = null } = {}) {
    if (!this.sourceHealth[sourceName]) {
      this.sourceHealth[sourceName] = { lastFetch: null, totalFetched: 0, errors: 0, lastError: null };
    }
    const h = this.sourceHealth[sourceName];
    h.lastFetch = new Date().toISOString();
    h.totalFetched += count;
    if (error) {
      h.errors++;
      h.lastError = error;
    }
  }
}

module.exports = SignalStore;
