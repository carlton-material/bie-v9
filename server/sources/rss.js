/* ═══════════════════════════════════════════════════════════
   RSS Feed Connector — Ingests news/analysis from free RSS feeds
   Maps to Human-Expressive and Cultural signal layers
   ═══════════════════════════════════════════════════════════ */

const Parser = require('rss-parser');
const { normalizeRSS } = require('../lib/normalize');
const { processSignal } = require('../lib/validate');

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'BIE-Signal-Pipeline/1.0 (Brand Intelligence Engine)'
  }
});

// ── FEED CONFIGURATION ──
// Each feed maps to a signal layer with a source tier for confidence scoring
const FEEDS = [
  // Human-Expressive: What people say (hospitality/travel perspectives)
  {
    name: 'Skift',
    url: 'https://skift.com/feed/',
    layer: 'human',
    tier: 'primary',
    confidence: 0.85,
    description: 'Hospitality & travel industry analysis'
  },
  {
    name: 'PhocusWire',
    url: 'https://www.phocuswire.com/rss',
    layer: 'human',
    tier: 'primary',
    confidence: 0.80,
    description: 'Travel technology & innovation news'
  },
  {
    name: 'Hotel News Now',
    url: 'https://www.hotelnewsnow.com/rss',
    layer: 'human',
    tier: 'secondary',
    confidence: 0.70,
    description: 'Hotel industry performance & trends'
  },

  // Cultural: Market context (macro trends, regulation, business)
  {
    name: 'CNBC Travel',
    url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000739',
    layer: 'cultural',
    tier: 'primary',
    confidence: 0.85,
    description: 'Macro travel & economic trends'
  },
  {
    name: 'HBR',
    url: 'https://hbr.org/feed',
    layer: 'cultural',
    tier: 'secondary',
    confidence: 0.75,
    description: 'Business strategy & management trends'
  },
  {
    name: 'Adweek',
    url: 'https://www.adweek.com/feed/',
    layer: 'cultural',
    tier: 'secondary',
    confidence: 0.70,
    description: 'Marketing & brand strategy news'
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    layer: 'cultural',
    tier: 'tertiary',
    confidence: 0.60,
    description: 'Technology disruption signals'
  },
  {
    name: 'Reuters Business',
    url: 'https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best',
    layer: 'cultural',
    tier: 'primary',
    confidence: 0.90,
    description: 'Global business & financial news'
  }
];

/**
 * Fetch a single RSS feed and return normalized, validated signals
 */
async function fetchFeed(feedConfig, store) {
  try {
    const feed = await parser.parseURL(feedConfig.url);
    const articles = (feed.items || []).slice(0, 10); // Max 10 per feed per poll

    const results = { accepted: 0, rejected: 0, errors: [] };

    for (const article of articles) {
      // Normalize raw RSS → signal schema
      const normalized = normalizeRSS(article, feedConfig);

      // Provenance for Glass Box linkout
      const provenance = {
        url: article.link || article.guid || feedConfig.url,
        title: article.title || '',
        connector: `rss:${feedConfig.name.toLowerCase().replace(/\s+/g, '-')}`,
        confidence: feedConfig.confidence,
        tier: feedConfig.tier
      };

      // Validate + consensus + dedup
      const result = processSignal(normalized, provenance, store.signals);

      if (result.accepted) {
        store.addSignal(result.signal);
        results.accepted++;
      } else {
        results.rejected++;
        if (!result.errors.includes('Duplicate signal detected')) {
          results.errors.push(...result.errors);
        }
      }
    }

    store.updateSourceHealth(feedConfig.name, { count: results.accepted });
    return results;

  } catch (err) {
    store.updateSourceHealth(feedConfig.name, { error: err.message });
    console.error(`[RSS] Failed to fetch ${feedConfig.name}: ${err.message}`);
    return { accepted: 0, rejected: 0, errors: [err.message] };
  }
}

/**
 * Poll all RSS feeds and return aggregate results
 */
async function pollAllFeeds(store) {
  console.log(`[RSS] Polling ${FEEDS.length} feeds...`);
  const startTime = Date.now();

  const results = await Promise.allSettled(
    FEEDS.map(feed => fetchFeed(feed, store))
  );

  let totalAccepted = 0;
  let totalRejected = 0;

  for (const r of results) {
    if (r.status === 'fulfilled') {
      totalAccepted += r.value.accepted;
      totalRejected += r.value.rejected;
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`[RSS] Done in ${elapsed}ms — ${totalAccepted} accepted, ${totalRejected} rejected/dedup`);

  return { totalAccepted, totalRejected, elapsed };
}

module.exports = { pollAllFeeds, fetchFeed, FEEDS };
