/* ═══════════════════════════════════════════════════════════
   Ingestion Orchestrator — Coordinates all source connectors,
   manages polling schedules, and reports pipeline health
   ═══════════════════════════════════════════════════════════ */

const cron = require('node-cron');
const { pollAllFeeds } = require('../sources/rss');
const { pollStocks } = require('../sources/finnhub');

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
  }

  /** Run initial ingestion then start cron schedules */
  async start() {
    console.log('[Ingestor] Starting signal pipeline...');

    // Initial fetch on startup
    await this.pollAll();

    // Schedule RSS polling
    const rssJob = cron.schedule(`*/${this.config.rssPollMinutes} * * * *`, async () => {
      console.log('[Ingestor] Scheduled RSS poll...');
      this.lastPollResults.rss = await pollAllFeeds(this.store);
    });
    this.jobs.push(rssJob);

    // Schedule stock polling (only during market hours: Mon-Fri 9:30-16:00 ET)
    // Simplified: every N minutes during weekdays
    if (this.config.finnhubKey && this.config.finnhubKey !== 'your_finnhub_key_here') {
      const stockJob = cron.schedule(`*/${this.config.stockPollMinutes} * * * 1-5`, async () => {
        console.log('[Ingestor] Scheduled stock poll...');
        this.lastPollResults.stocks = await pollStocks(this.store, this.config.finnhubKey);
      });
      this.jobs.push(stockJob);
    }

    console.log(`[Ingestor] Pipeline running — RSS every ${this.config.rssPollMinutes}m, Stocks every ${this.config.stockPollMinutes}m`);
  }

  /** One-time poll of all sources */
  async pollAll() {
    console.log('[Ingestor] Full poll starting...');
    const [rssResult, stockResult] = await Promise.allSettled([
      pollAllFeeds(this.store),
      pollStocks(this.store, this.config.finnhubKey)
    ]);

    this.lastPollResults.rss = rssResult.status === 'fulfilled' ? rssResult.value : { error: rssResult.reason?.message };
    this.lastPollResults.stocks = stockResult.status === 'fulfilled' ? stockResult.value : { error: stockResult.reason?.message };

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
        stocks: this.config.finnhubKey ? `every ${this.config.stockPollMinutes} minutes (weekdays)` : 'disabled (no API key)'
      }
    };
  }
}

module.exports = Ingestor;
