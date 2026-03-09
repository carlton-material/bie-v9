/* ═══════════════════════════════════════════════════════════
   Signal Normalizer — Transforms raw source data into
   the BIE signal schema
   ═══════════════════════════════════════════════════════════ */

// Keywords that boost severity to HIGH
const HIGH_KEYWORDS = [
  'crisis', 'lawsuit', 'recall', 'acquisition', 'bankrupt', 'layoff',
  'breach', 'investigation', 'scandal', 'plunge', 'surge', 'record',
  'breaking', 'urgent', 'exclusive', 'disruption', 'shutdown'
];

// Keywords that indicate MEDIUM severity
const MEDIUM_KEYWORDS = [
  'analysis', 'trend', 'report', 'growth', 'decline', 'forecast',
  'strategy', 'partnership', 'launch', 'expansion', 'earnings',
  'revenue', 'quarterly', 'annual', 'market share'
];

// Brand name mapping for hospitality sector
const BRAND_MAP = {
  'ABNB': 'Airbnb', 'airbnb': 'Airbnb',
  'BKNG': 'Booking', 'booking.com': 'Booking', 'booking': 'Booking',
  'MAR': 'Marriott', 'marriott': 'Marriott',
  'HLT': 'Hilton', 'hilton': 'Hilton',
  'EXPE': 'Expedia', 'expedia': 'Expedia',
  'hyatt': 'Hyatt', 'HYH': 'Hyatt',
  'ihg': 'IHG', 'intercontinental': 'IHG',
  'wyndham': 'Wyndham', 'WH': 'Wyndham',
  'tripadvisor': 'TripAdvisor', 'TRIP': 'TripAdvisor',
  'vrbo': 'VRBO'
};

function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function detectSeverity(text, pctChange = null) {
  const lower = text.toLowerCase();

  // Stock-specific: >3% move = high, 1-3% = medium
  if (pctChange !== null) {
    const abs = Math.abs(pctChange);
    if (abs > 3) return 'high';
    if (abs > 1) return 'medium';
    return 'low';
  }

  // Keyword-based for text signals
  if (HIGH_KEYWORDS.some(k => lower.includes(k))) return 'high';
  if (MEDIUM_KEYWORDS.some(k => lower.includes(k))) return 'medium';
  return 'low';
}

function detectBrand(text) {
  const lower = text.toLowerCase();
  for (const [keyword, brand] of Object.entries(BRAND_MAP)) {
    if (lower.includes(keyword.toLowerCase())) return brand;
  }
  return 'Category';
}

function truncateText(text, maxLen = 160) {
  if (!text) return '';
  const clean = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen - 3) + '...';
}

/** Normalize an RSS article into a signal */
function normalizeRSS(article, feedConfig) {
  const title = article.title || '';
  const description = article.contentSnippet || article.content || '';
  const combined = `${title} ${description}`;

  return {
    time: formatTime(article.pubDate || article.isoDate || new Date()),
    layer: feedConfig.layer || 'cultural',
    severity: detectSeverity(combined),
    brand: detectBrand(combined),
    text: truncateText(title || description),
    source: feedConfig.name || 'RSS'
  };
}

/** Normalize a Finnhub stock quote into a signal */
function normalizeStock(quote, symbol) {
  const brandName = BRAND_MAP[symbol] || symbol;
  const pctChange = quote.dp || 0;  // dp = percent change
  const price = quote.c || 0;       // c = current price
  const direction = pctChange >= 0 ? '▲' : '▼';
  const sign = pctChange >= 0 ? '+' : '';

  return {
    time: formatTime(new Date()),
    layer: 'behavioral',
    severity: detectSeverity('', pctChange),
    brand: brandName,
    text: `${brandName} ${direction} ${sign}${pctChange.toFixed(2)}% at $${price.toFixed(2)} — behavioral signal from market activity`,
    source: `Finnhub ${symbol}`
  };
}

/** Normalize a Reddit post into a signal */
function normalizeReddit(post) {
  return {
    time: formatTime(new Date(post.created_utc * 1000)),
    layer: 'human',
    severity: post.score > 100 ? 'high' : post.score > 20 ? 'medium' : 'low',
    brand: detectBrand(post.title || ''),
    text: truncateText(post.title || ''),
    source: `Reddit r/${post.subreddit}`
  };
}

module.exports = {
  normalizeRSS,
  normalizeStock,
  normalizeReddit,
  detectSeverity,
  detectBrand,
  formatTime,
  BRAND_MAP,
  HIGH_KEYWORDS,
  MEDIUM_KEYWORDS
};
