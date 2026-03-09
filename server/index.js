/* ═══════════════════════════════════════════════════════════
   BIE Signal Server — Brand Intelligence Engine
   Lightweight Express server for real-time signal ingestion

   Port: 3847 (847 signals!)
   ═══════════════════════════════════════════════════════════ */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const SignalStore = require('./lib/store');
const Ingestor = require('./lib/ingest');
const { seedStore } = require('./lib/seed');
const { validateSignal, VALID_LAYERS, VALID_SEVERITIES } = require('./lib/validate');

const app = express();
const PORT = process.env.PORT || 3847;
const MAX_SIGNALS = parseInt(process.env.MAX_SIGNALS) || 1000;

// ── Initialize store and ingestor ──
const store = new SignalStore(MAX_SIGNALS);
const ingestor = new Ingestor(store, {
  rssPollMinutes: parseInt(process.env.RSS_POLL_INTERVAL) || 15,
  stockPollMinutes: parseInt(process.env.STOCK_POLL_INTERVAL) || 30,
  finnhubKey: process.env.FINNHUB_API_KEY
});

// ── CORS: Allow GitHub Pages + localhost ──
app.use(cors({
  origin: [
    'https://carlton-material.github.io',
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/
  ],
  methods: ['GET'],
  optionsSuccessStatus: 200
}));

app.use(express.json());

// ── API ROUTES ──

/**
 * GET /api/signals
 * Returns paginated, filtered signals with provenance + consensus metadata
 *
 * Query params:
 *   layer     — filter by signal layer (human, behavioral, cultural)
 *   severity  — filter by severity (high, medium, low)
 *   brand     — filter by brand name (partial match)
 *   limit     — max results (default 50, max 200)
 *   offset    — pagination offset (default 0)
 */
app.get('/api/signals', (req, res) => {
  const { layer, severity, brand } = req.query;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;

  // Validate filter values
  if (layer && !VALID_LAYERS.includes(layer)) {
    return res.status(400).json({ error: `Invalid layer. Must be one of: ${VALID_LAYERS.join(', ')}` });
  }
  if (severity && !VALID_SEVERITIES.includes(severity)) {
    return res.status(400).json({ error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}` });
  }

  const result = store.getSignals({ layer, severity, brand, limit, offset });

  res.json({
    ...result,
    _meta: {
      schema: 'bie-signal-v1',
      glassBox: 'Each signal includes provenance and consensus metadata for full traceability'
    }
  });
});

/**
 * GET /api/signals/feed
 * Returns signals formatted for the feed ticker
 * Lightweight format: { source, text, time }
 */
app.get('/api/signals/feed', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const feed = store.getFeed(limit);

  res.json({
    items: feed,
    count: feed.length
  });
});

/**
 * GET /api/signals/stats
 * Returns signal counts by layer + source breakdown
 */
app.get('/api/signals/stats', (req, res) => {
  res.json(store.getStats());
});

/**
 * GET /api/signals/:id
 * Get a single signal by ID with full provenance + consensus detail
 * This is the Glass Box deep-link — every insight traces back here
 */
app.get('/api/signals/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const signal = store.signals.find(s => s.id === id);

  if (!signal) {
    return res.status(404).json({ error: 'Signal not found' });
  }

  res.json({
    signal,
    _glassBox: {
      provenance: signal.provenance || {},
      consensus: signal.consensus || {},
      linkout: signal.provenance?.sourceUrl || null,
      explanation: `This ${signal.layer} signal was ingested from ${signal.source} via the ${signal.provenance?.connector || 'unknown'} connector. Confidence: ${(signal.provenance?.confidence || 0.5) * 100}% (${signal.provenance?.tier || 'unknown'} tier). ${signal.consensus?.corroboratingCount || 0} corroborating signals detected.`
    }
  });
});

/**
 * GET /api/health
 * Pipeline health status — source connectivity, uptime, signal capacity
 */
app.get('/api/health', (req, res) => {
  const health = store.getHealth();
  const pipelineStatus = ingestor.getStatus();

  res.json({
    ...health,
    pipeline: pipelineStatus,
    version: '1.0.0',
    schema: 'bie-signal-v1'
  });
});

/**
 * GET /api/consensus
 * Returns signals grouped by consensus clusters
 * Surfaces converging insights across layers
 */
app.get('/api/consensus', (req, res) => {
  const signals = store.signals.filter(s => s.consensus && s.consensus.convergenceScore >= 0.3);

  // Group by brand
  const clusters = {};
  for (const s of signals) {
    const key = s.brand;
    if (!clusters[key]) {
      clusters[key] = { brand: key, signals: [], avgConvergence: 0 };
    }
    clusters[key].signals.push({
      id: s.id,
      layer: s.layer,
      text: s.text,
      source: s.source,
      convergence: s.consensus.convergenceScore,
      linkout: s.provenance?.sourceUrl
    });
  }

  // Calculate average convergence per cluster
  for (const cluster of Object.values(clusters)) {
    const sum = cluster.signals.reduce((a, s) => a + s.convergence, 0);
    cluster.avgConvergence = parseFloat((sum / cluster.signals.length).toFixed(2));
    cluster.signals.sort((a, b) => b.convergence - a.convergence);
  }

  // Sort clusters by avg convergence descending
  const sorted = Object.values(clusters).sort((a, b) => b.avgConvergence - a.avgConvergence);

  res.json({
    clusters: sorted,
    totalConvergingSignals: signals.length,
    _meta: {
      explanation: 'Consensus clusters group signals about the same brand that corroborate each other across layers and sources. Higher convergence = stronger signal.'
    }
  });
});

/**
 * POST /api/poll
 * Manually trigger a full poll of all sources (for testing)
 */
app.post('/api/poll', async (req, res) => {
  const results = await ingestor.pollAll();
  res.json({
    results,
    stats: store.getStats()
  });
});

// ── START SERVER ──
app.listen(PORT, async () => {
  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  BIE Signal Server running on port ${PORT}`);
  console.log(`  API: http://localhost:${PORT}/api/signals`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`═══════════════════════════════════════════════\n`);

  // Seed with demo signals (always available, even offline)
  seedStore(store);

  // Start live ingestion pipeline (RSS + Finnhub)
  await ingestor.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] Shutting down...');
  ingestor.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Server] Interrupted, shutting down...');
  ingestor.stop();
  process.exit(0);
});
