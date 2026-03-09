/* ═══════════════════════════════════════════════════════════
   BIE API Client — Frontend bridge to the Signal Server

   Graceful fallback: if the server is unreachable (e.g., on
   GitHub Pages without a backend), falls back to static JSON.

   Glass Box: Every signal includes provenance + consensus
   metadata. Use getSignalDetail(id) for full linkout data.
   ═══════════════════════════════════════════════════════════ */

const BIEApi = {
  baseUrl: 'http://localhost:3847/api',
  _serverAvailable: null,   // null = unknown, true/false after first check
  _lastCheck: 0,
  _checkInterval: 30000,    // Re-check server availability every 30s

  /**
   * Check if the signal server is reachable.
   * Caches result for 30s to avoid hammering.
   */
  async isServerAvailable() {
    const now = Date.now();
    if (this._serverAvailable !== null && (now - this._lastCheck) < this._checkInterval) {
      return this._serverAvailable;
    }

    try {
      const resp = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(3000)
      });
      this._serverAvailable = resp.ok;
    } catch {
      this._serverAvailable = false;
    }
    this._lastCheck = now;
    return this._serverAvailable;
  },

  /**
   * Fetch from API with automatic fallback to static JSON.
   * Returns { data, source: 'api'|'static' }
   */
  async _fetch(endpoint, fallbackFn) {
    const available = await this.isServerAvailable();

    if (available) {
      try {
        const resp = await fetch(`${this.baseUrl}${endpoint}`, {
          signal: AbortSignal.timeout(5000)
        });
        if (resp.ok) {
          const data = await resp.json();
          return { data, source: 'api' };
        }
      } catch (e) {
        console.warn(`[BIEApi] API call failed, falling back to static: ${e.message}`);
      }
    }

    // Fallback to static JSON
    if (fallbackFn) {
      const data = await fallbackFn();
      return { data, source: 'static' };
    }

    return { data: null, source: 'none' };
  },

  /**
   * GET /api/signals — Paginated, filtered signal list
   * Each signal includes provenance (Glass Box) and consensus metadata.
   *
   * @param {Object} params - { layer, severity, brand, limit, offset }
   * @returns {{ signals: Array, total: number, source: string }}
   */
  async getSignals(params = {}) {
    const query = new URLSearchParams();
    if (params.layer) query.set('layer', params.layer);
    if (params.severity) query.set('severity', params.severity);
    if (params.brand) query.set('brand', params.brand);
    if (params.limit) query.set('limit', params.limit);
    if (params.offset) query.set('offset', params.offset);

    const qs = query.toString() ? `?${query}` : '';

    const result = await this._fetch(`/signals${qs}`, async () => {
      // Fallback: load from stayworthy.json
      const resp = await fetch('data/stayworthy.json');
      const data = await resp.json();
      let signals = data?.signals?.database || [];

      // Apply filters on static data
      if (params.layer) signals = signals.filter(s => s.layer === params.layer);
      if (params.severity) signals = signals.filter(s => s.severity === params.severity);

      return { signals, total: signals.length };
    });

    return { ...result.data, source: result.source };
  },

  /**
   * GET /api/signals/feed — Ticker-format feed items
   * Returns { source, text, time } objects for the feed bar.
   *
   * @param {number} limit - Max items (default 20)
   * @returns {{ items: Array, source: string }}
   */
  async getFeed(limit = 20) {
    const result = await this._fetch(`/signals/feed?limit=${limit}`, async () => {
      const resp = await fetch('data/stayworthy.json');
      const data = await resp.json();
      return { items: data?.feedItems || [], count: (data?.feedItems || []).length };
    });

    return { items: result.data?.items || [], source: result.source };
  },

  /**
   * GET /api/signals/stats — Signal counts by layer
   * @returns {{ total, human, behavioral, cultural, source }}
   */
  async getStats() {
    const result = await this._fetch('/signals/stats', async () => {
      // Fallback: return the metadata counts
      return { total: 847, human: 312, behavioral: 289, cultural: 246, lastUpdated: null };
    });

    return { ...result.data, source: result.source };
  },

  /**
   * GET /api/signals/:id — Single signal with full Glass Box detail
   * Returns provenance (source URL, connector, confidence, tier, dataClass)
   * and consensus (convergence score, corroborating sources).
   *
   * @param {number} id - Signal ID
   * @returns {Object} Signal with _glassBox metadata
   */
  async getSignalDetail(id) {
    const result = await this._fetch(`/signals/${id}`);
    return result.data;
  },

  /**
   * GET /api/consensus — Converging signal clusters
   * Groups signals by brand where multiple sources/layers agree.
   *
   * @returns {{ clusters: Array, source: string }}
   */
  async getConsensus() {
    const result = await this._fetch('/consensus');
    return { clusters: result.data?.clusters || [], source: result.source };
  },

  /**
   * GET /api/health — Pipeline health status
   * Shows source connectivity, uptime, signal capacity.
   */
  async getHealth() {
    const result = await this._fetch('/health');
    return result.data;
  },

  /**
   * Build a Glass Box explanation string for display in the UI.
   * Used by signal cards, command center, and analyst responses.
   *
   * @param {Object} signal - Signal with provenance + consensus
   * @returns {string} Human-readable Glass Box explanation
   */
  buildGlassBoxExplanation(signal) {
    if (!signal?.provenance) return 'No provenance data available.';

    const p = signal.provenance;
    const c = signal.consensus || {};

    const parts = [];

    // Data class label
    const classLabel = p.dataClass === 'raw' ? '📊 Raw signal' :
                       p.dataClass === 'enriched' ? '🤖 AI-enriched' :
                       p.dataClass === 'synthesized' ? '🔗 Synthesized' : '📊 Signal';
    parts.push(classLabel);

    // Source + connector
    parts.push(`from ${signal.source} via ${p.connector}`);

    // Confidence
    parts.push(`${Math.round(p.confidence * 100)}% confidence (${p.tier} tier)`);

    // Consensus
    if (c.corroboratingCount > 0) {
      parts.push(`${c.corroboratingCount} corroborating signal${c.corroboratingCount > 1 ? 's' : ''} (${c.level} convergence)`);
    }

    // Enrichment note
    if (p.enrichment) {
      parts.push(`Enriched: ${p.enrichment.reason} [${p.enrichment.method}]`);
    }

    return parts.join(' · ');
  },

  /**
   * Build a Glass Box linkout URL for a signal.
   * Returns the source URL if available, null otherwise.
   */
  getSourceLink(signal) {
    return signal?.provenance?.sourceUrl || null;
  }
};
