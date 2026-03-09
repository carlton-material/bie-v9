/* ═══════════════════════════════════════════════════════════
   Seed Data — Populates the signal store with realistic signals
   when live feeds are unavailable (offline/demo mode)

   Each signal has full provenance + consensus metadata,
   identical to what the live pipeline produces.
   ═══════════════════════════════════════════════════════════ */

const { processSignal } = require('./validate');

const SEED_SIGNALS = [
  // ── HUMAN-EXPRESSIVE LAYER ──
  {
    signal: { time: '08:12', layer: 'human', severity: 'high', brand: 'Stayworthy', text: 'Guest satisfaction scores dropped 12% in loyalty segment — AI interview analysis flags "inconsistent experience" as top theme', source: 'AI Interview Analysis' },
    provenance: { url: 'https://skift.com/2026/03/hotel-guest-satisfaction', title: 'Hotel Guest Satisfaction Trends Q1 2026', connector: 'rss:skift', confidence: 0.85, tier: 'primary' }
  },
  {
    signal: { time: '08:34', layer: 'human', severity: 'medium', brand: 'Airbnb', text: 'Airbnb hosts report 23% increase in corporate booking requests — blended travel trend accelerating', source: 'PhocusWire' },
    provenance: { url: 'https://www.phocuswire.com/airbnb-corporate-travel-2026', title: 'Airbnb Corporate Travel Surge', connector: 'rss:phocuswire', confidence: 0.80, tier: 'primary' }
  },
  {
    signal: { time: '09:01', layer: 'human', severity: 'medium', brand: 'Marriott', text: 'Marriott Bonvoy members express frustration with dynamic pricing — social sentiment down 8pp MoM', source: 'Social Listening' },
    provenance: { url: 'https://skift.com/marriott-pricing-sentiment', title: 'Marriott Pricing Backlash', connector: 'rss:skift', confidence: 0.85, tier: 'primary' }
  },
  {
    signal: { time: '09:15', layer: 'human', severity: 'low', brand: 'Category', text: 'Travel review volume up 15% YoY across TripAdvisor — recovery signal for experiential travel', source: 'Hotel News Now' },
    provenance: { url: 'https://hotelnewsnow.com/review-volume-trends', title: 'Review Volume Recovery', connector: 'rss:hotel-news-now', confidence: 0.70, tier: 'secondary' }
  },
  {
    signal: { time: '09:45', layer: 'human', severity: 'high', brand: 'Stayworthy', text: 'Net Promoter Score declined from 42 to 36 — detractor verbatims cluster around "digital check-in friction"', source: 'AI Interview Analysis' },
    provenance: { url: null, title: 'NPS Analysis Wave 7', connector: 'internal:nps', confidence: 0.95, tier: 'primary' }
  },
  {
    signal: { time: '10:22', layer: 'human', severity: 'medium', brand: 'Hilton', text: 'Hilton Digital Key adoption reaches 40% — guest convenience scores improving in app-forward properties', source: 'PhocusWire' },
    provenance: { url: 'https://www.phocuswire.com/hilton-digital-key-2026', title: 'Hilton Digital Key Adoption', connector: 'rss:phocuswire', confidence: 0.80, tier: 'primary' }
  },
  {
    signal: { time: '11:05', layer: 'human', severity: 'low', brand: 'Category', text: 'Podcast mentions of "hotel loyalty" up 340% — cultural indicator of mainstream awareness shift', source: 'Cultural Monitor' },
    provenance: { url: 'https://hbr.org/podcast-trends-hospitality', title: 'Podcast Trend Analysis', connector: 'rss:hbr', confidence: 0.60, tier: 'tertiary' }
  },

  // ── BEHAVIORAL LAYER ──
  {
    signal: { time: '09:30', layer: 'behavioral', severity: 'high', brand: 'Airbnb', text: 'Airbnb ▲ +2.8% at $187.42 — behavioral signal from market activity following corporate travel partnership', source: 'Finnhub ABNB' },
    provenance: { url: 'https://finnhub.io/stock/ABNB', title: 'Airbnb (ABNB) Stock Quote', connector: 'finnhub:abnb', confidence: 0.90, tier: 'primary' }
  },
  {
    signal: { time: '09:30', layer: 'behavioral', severity: 'medium', brand: 'Marriott', text: 'Marriott ▼ -1.2% at $234.18 — market responding to pricing sentiment concerns', source: 'Finnhub MAR' },
    provenance: { url: 'https://finnhub.io/stock/MAR', title: 'Marriott (MAR) Stock Quote', connector: 'finnhub:mar', confidence: 0.90, tier: 'primary' }
  },
  {
    signal: { time: '10:00', layer: 'behavioral', severity: 'low', brand: 'Booking', text: 'Booking Holdings flat at $4,521.30 — consolidation pattern after Q4 earnings beat', source: 'Finnhub BKNG' },
    provenance: { url: 'https://finnhub.io/stock/BKNG', title: 'Booking Holdings (BKNG) Stock Quote', connector: 'finnhub:bkng', confidence: 0.90, tier: 'primary' }
  },
  {
    signal: { time: '10:30', layer: 'behavioral', severity: 'medium', brand: 'Stayworthy', text: 'Direct booking conversion rate declined 6% — funnel analysis shows abandonment spike at payment step', source: 'Behavioral Signal Pipeline' },
    provenance: { url: null, title: 'Conversion Funnel Analysis', connector: 'internal:analytics', confidence: 0.92, tier: 'primary' }
  },
  {
    signal: { time: '11:00', layer: 'behavioral', severity: 'high', brand: 'Expedia', text: 'Expedia ▲ +4.1% at $178.55 — surge following AI-powered trip planner launch announcement', source: 'Finnhub EXPE' },
    provenance: { url: 'https://finnhub.io/stock/EXPE', title: 'Expedia (EXPE) Stock Quote', connector: 'finnhub:expe', confidence: 0.80, tier: 'secondary' }
  },
  {
    signal: { time: '11:30', layer: 'behavioral', severity: 'low', brand: 'Hilton', text: 'Hilton ▲ +0.6% at $211.89 — steady performance aligned with sector average', source: 'Finnhub HLT' },
    provenance: { url: 'https://finnhub.io/stock/HLT', title: 'Hilton (HLT) Stock Quote', connector: 'finnhub:hlt', confidence: 0.90, tier: 'primary' }
  },
  {
    signal: { time: '12:15', layer: 'behavioral', severity: 'medium', brand: 'Category', text: 'OTA vs direct booking ratio shifting — direct bookings up 3pp across mid-tier segment', source: 'Behavioral Signal Pipeline' },
    provenance: { url: null, title: 'Channel Mix Analysis', connector: 'internal:analytics', confidence: 0.88, tier: 'primary' }
  },

  // ── CULTURAL LAYER ──
  {
    signal: { time: '07:45', layer: 'cultural', severity: 'high', brand: 'Category', text: 'EU Digital Services Act enforcement begins — hotel platforms must disclose algorithmic ranking criteria by Q3', source: 'EU Policy Monitor' },
    provenance: { url: 'https://www.reuters.com/business/eu-digital-services-act-hospitality', title: 'EU DSA Hospitality Impact', connector: 'rss:reuters', confidence: 0.90, tier: 'primary' }
  },
  {
    signal: { time: '08:30', layer: 'cultural', severity: 'medium', brand: 'Category', text: 'Gen Z travel spending overtakes Millennials for first time — experiential preference reshaping demand', source: 'CNBC Travel' },
    provenance: { url: 'https://www.cnbc.com/2026/03/gen-z-travel-spending', title: 'Gen Z Travel Spending Surpasses Millennials', connector: 'rss:cnbc-travel', confidence: 0.85, tier: 'primary' }
  },
  {
    signal: { time: '09:00', layer: 'cultural', severity: 'medium', brand: 'Category', text: 'Remote work policies tightening at major tech firms — corporate travel budgets expanding 18% for in-person meetings', source: 'HBR' },
    provenance: { url: 'https://hbr.org/2026/03/return-to-office-travel-impact', title: 'RTO and Corporate Travel', connector: 'rss:hbr', confidence: 0.75, tier: 'secondary' }
  },
  {
    signal: { time: '10:15', layer: 'cultural', severity: 'low', brand: 'Category', text: 'Sustainability certification demand rising — 67% of travelers say eco-credentials influence booking decisions', source: 'Adweek' },
    provenance: { url: 'https://www.adweek.com/sustainability-travel-2026', title: 'Sustainability in Travel Marketing', connector: 'rss:adweek', confidence: 0.70, tier: 'secondary' }
  },
  {
    signal: { time: '11:45', layer: 'cultural', severity: 'medium', brand: 'Category', text: 'AI-powered travel planning tools seeing 200% growth — Google, Expedia, and startups racing for share', source: 'TechCrunch' },
    provenance: { url: 'https://techcrunch.com/2026/03/ai-travel-planning-boom', title: 'AI Travel Planning Boom', connector: 'rss:techcrunch', confidence: 0.60, tier: 'tertiary' }
  },
  {
    signal: { time: '12:00', layer: 'cultural', severity: 'high', brand: 'Category', text: 'US-China visa reciprocity agreement signed — analysts project 40% increase in cross-Pacific travel demand', source: 'Reuters Business' },
    provenance: { url: 'https://www.reuters.com/us-china-visa-agreement', title: 'US-China Visa Deal', connector: 'rss:reuters', confidence: 0.90, tier: 'primary' }
  },

  // ── ADDITIONAL SIGNALS for density ──
  {
    signal: { time: '12:30', layer: 'human', severity: 'medium', brand: 'Stayworthy', text: 'Employee engagement survey: front-desk staff report "technology overwhelm" — training gap widening', source: 'Internal Survey' },
    provenance: { url: null, title: 'Employee Engagement Q1', connector: 'internal:survey', confidence: 0.95, tier: 'primary' }
  },
  {
    signal: { time: '13:00', layer: 'behavioral', severity: 'medium', brand: 'Stayworthy', text: 'Mobile app session duration dropped 22% — UX analytics flag onboarding flow as primary friction point', source: 'Behavioral Signal Pipeline' },
    provenance: { url: null, title: 'Mobile Analytics Dashboard', connector: 'internal:analytics', confidence: 0.92, tier: 'primary' }
  },
  {
    signal: { time: '13:30', layer: 'cultural', severity: 'low', brand: 'Category', text: 'Short-form video travel content reaches 2B monthly views on TikTok — "hotel room tours" genre dominates', source: 'Cultural Monitor' },
    provenance: { url: 'https://www.adweek.com/tiktok-hotel-tours', title: 'TikTok Hotel Content', connector: 'rss:adweek', confidence: 0.65, tier: 'tertiary' }
  },
  {
    signal: { time: '14:00', layer: 'human', severity: 'high', brand: 'Category', text: 'Luxury segment NPS reaches all-time high of 71 — experiential amenities driving promoter growth', source: 'Skift' },
    provenance: { url: 'https://skift.com/luxury-nps-record', title: 'Luxury Hotel NPS Record', connector: 'rss:skift', confidence: 0.85, tier: 'primary' }
  },
  {
    signal: { time: '14:30', layer: 'behavioral', severity: 'low', brand: 'TripAdvisor', text: 'TripAdvisor ▼ -0.3% at $24.78 — continued underperformance vs sector as AI search disrupts review model', source: 'Finnhub TRIP' },
    provenance: { url: 'https://finnhub.io/stock/TRIP', title: 'TripAdvisor (TRIP) Stock Quote', connector: 'finnhub:trip', confidence: 0.65, tier: 'tertiary' }
  }
];

/**
 * Seed the store with demo signals, running each through
 * the full validation + provenance + consensus pipeline
 */
function seedStore(store) {
  console.log(`[Seed] Loading ${SEED_SIGNALS.length} demo signals...`);

  let accepted = 0;
  let rejected = 0;

  for (const { signal, provenance } of SEED_SIGNALS) {
    const result = processSignal(signal, provenance, store.signals);
    if (result.accepted) {
      store.addSignal(result.signal);
      accepted++;
    } else {
      rejected++;
      console.warn(`[Seed] Rejected: ${result.errors.join(', ')}`);
    }
  }

  const stats = store.getStats();
  console.log(`[Seed] Done — ${accepted} accepted, ${rejected} rejected`);
  console.log(`[Seed] Store: ${stats.total} signals (${stats.human}H/${stats.behavioral}B/${stats.cultural}C)`);

  return { accepted, rejected };
}

module.exports = { seedStore, SEED_SIGNALS };
