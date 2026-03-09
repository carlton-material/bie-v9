/* ═══════════════════════════════════════════════════════════
   Finnhub Stock Connector — Behavioral signals from market data
   Free tier: 60 API calls/minute
   ═══════════════════════════════════════════════════════════ */

const { normalizeStock } = require('../lib/normalize');
const { processSignal } = require('../lib/validate');

// Hospitality sector tickers to track
const SYMBOLS = [
  { ticker: 'ABNB', name: 'Airbnb', tier: 'primary', confidence: 0.90 },
  { ticker: 'BKNG', name: 'Booking Holdings', tier: 'primary', confidence: 0.90 },
  { ticker: 'MAR',  name: 'Marriott', tier: 'primary', confidence: 0.90 },
  { ticker: 'HLT',  name: 'Hilton', tier: 'primary', confidence: 0.90 },
  { ticker: 'EXPE', name: 'Expedia', tier: 'secondary', confidence: 0.80 },
  { ticker: 'HYH',  name: 'Hyatt', tier: 'secondary', confidence: 0.75 },
  { ticker: 'WH',   name: 'Wyndham', tier: 'tertiary', confidence: 0.65 },
  { ticker: 'TRIP', name: 'TripAdvisor', tier: 'tertiary', confidence: 0.65 }
];

/**
 * Fetch a single stock quote from Finnhub
 */
async function fetchQuote(symbol, apiKey) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status}`);
  }

  const data = await response.json();

  // Finnhub returns { c: current, d: change, dp: percent_change, h: high, l: low, o: open, pc: prev_close, t: timestamp }
  if (!data.c || data.c === 0) {
    throw new Error(`No quote data for ${symbol}`);
  }

  return data;
}

/**
 * Poll all tracked symbols and generate behavioral signals
 */
async function pollStocks(store, apiKey) {
  if (!apiKey || apiKey === 'your_finnhub_key_here') {
    console.log('[Finnhub] No API key configured — skipping stock signals');
    return { totalAccepted: 0, totalRejected: 0, skipped: true };
  }

  console.log(`[Finnhub] Polling ${SYMBOLS.length} symbols...`);
  const startTime = Date.now();
  let totalAccepted = 0;
  let totalRejected = 0;

  for (const sym of SYMBOLS) {
    try {
      const quote = await fetchQuote(sym.ticker, apiKey);
      const normalized = normalizeStock(quote, sym.ticker);

      const provenance = {
        url: `https://finnhub.io/stock/${sym.ticker}`,
        title: `${sym.name} (${sym.ticker}) Stock Quote`,
        connector: `finnhub:${sym.ticker.toLowerCase()}`,
        confidence: sym.confidence,
        tier: sym.tier
      };

      const result = processSignal(normalized, provenance, store.signals);

      if (result.accepted) {
        store.addSignal(result.signal);
        totalAccepted++;
      } else {
        totalRejected++;
      }

      store.updateSourceHealth(`Finnhub ${sym.ticker}`, { count: result.accepted ? 1 : 0 });

      // Rate limit: small delay between calls to stay under 60/min
      await new Promise(r => setTimeout(r, 200));

    } catch (err) {
      store.updateSourceHealth(`Finnhub ${sym.ticker}`, { error: err.message });
      console.error(`[Finnhub] Error for ${sym.ticker}: ${err.message}`);
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`[Finnhub] Done in ${elapsed}ms — ${totalAccepted} accepted, ${totalRejected} rejected`);

  return { totalAccepted, totalRejected, elapsed };
}

module.exports = { pollStocks, fetchQuote, SYMBOLS };
