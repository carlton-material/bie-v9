/* ═══════════════════════════════════════════════════════════
   Ingestion Orchestrator — Coordinates all source connectors,
   manages polling schedules, and reports pipeline health

   Zero-config: RSS feeds only, no API keys required.
   Finnhub stocks are optional if FINNHUB_API_KEY is set.
   ═══════════════════════════════════════════════════════════ */

const cron = require('node-cron');
const { pollAllFeeds } = require('../sources/rss');

// Optional: only load finnhub if configured
let pollStocks = null;
try { pollStocks = require('../sources/finnhub').pollStocks; } catch { /* optional */ }

class Ingestor {
  constructor(store, config = {}) {
    this.store = store;
    this.config = {
      rssPollMinutes: config.rssPollMinutes || 15,
      stockPollMinutes: config.stockPollMinutes || 30,
      finnhubKey: config.finnhubKey || null
    };
    this.jobs = [];
    this.lastPollResults = {};
    this._hasStocks = !!(pollStocks && this.config.finnhubKey && this.config.finnhubKey !== 'your_finnhub_key_here');
  }

  /** Run initial ingestion then start cron schedules */
  async start() {
    console.log('[Ingestor] Starting signal pipeline...');
    console.log(`[Ingestor] RSS feeds: enabled (${this.config.rssPollMinutes}m interval)`);
    console.log(`[Ingestor] Finnhub stocks: ${this._hasStocks ? 'enabled' : 'disabled (no key — optional)'}`);

    // Initial fetch on startup
    await this.pollAll();

    // Schedule RSS polling (the core — free, no keys)
    const rssJob = cron.schedule(`*/${this.config.rssPollMinutes} * * * *`, async () => {
      console.log('[Ingestor] Scheduled RSS poll...');
      this.lastPollResults.rss = await pollAllFeeds(this.store);
    });
    this.jobs.push(rssJob);

    // Optional: schedule stock polling if key is configured
    if (this._hasStocks) {
      const stockJob = cron.schedule(`*/${this.config.stockPollMinutes} * * * 1-5`, async () => {
        console.log('[Ingestor] Scheduled stock poll...');
        this.lastPollResults.stocks = await pollStocks(this.store, this.config.finnhubKey);
      });
      this.jobs.push(stockJob);
    }

    const stats = this.store.getStats();
    console.log(`[Ingestor] Pipeline live — ${stats.total} signals ready (${stats.human}H/${stats.behavioral}B/${stats.cultural}C)`);
  }

  /** One-time poll of all sources */
  async pollAll() {
    console.log('[Ingestor] Full poll starting...');

    // Always poll RSS
    let rssResult;
    try {
      rssResult = await pollAllFeeds(this.store);
    } catch (e) {
      rssResult = { error: e.message, totalAccepted: 0 };
    }
    this.lastPollResults.rss = rssResult;

    // Optional: poll stocks
    if (this._hasStocks) {
      try {
        this.lastPollResults.stocks = await pollStocks(this.store, this.config.finnhubKey);
      } catch (e) {
        this.lastPollResults.stocks = { error: e.message, totalAccepted: 0 };
      }
    }

    const stats = this.store.getStats();
    console.log(`[Ingestor] Full poll complete — ${stats.total} signals in store (${stats.human}H/${stats.behavioral}B/${stats.cultural}C)`);

    return this.lastPollResults;
  }

  /** Stop all cron jobs */
  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    console.log('[Ingestor] Pipeline stopped');
  }

  /** Get last poll results for health endpoint */
  getStatus() {
    return {
      lastPoll: this.lastPollResults,
      schedules: {
        rss: `every ${this.config.rssPollMinutes} minutes`,
        stocks: this._hasStocks ? `every ${this.config.stockPollMinutes} minutes (weekdays)` : 'disabled (no API key — optional)'
      }
    };
  }
}

module.exports = Ingestor;
