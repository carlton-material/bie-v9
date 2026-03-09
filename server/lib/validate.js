/* ═══════════════════════════════════════════════════════════
   Signal Validator — Schema validation + Glass Box provenance

   Every signal must pass validation before entering the store.
   Every signal carries provenance metadata for Glass Box linkouts.
   ═══════════════════════════════════════════════════════════ */

// Required fields in the BIE signal schema
const REQUIRED_FIELDS = ['time', 'layer', 'severity', 'brand', 'text', 'source'];
const VALID_LAYERS = ['human', 'behavioral', 'cultural'];
const VALID_SEVERITIES = ['high', 'medium', 'low'];
const TIME_REGEX = /^\d{2}:\d{2}$/;

/**
 * Validate a signal against the BIE schema.
 * Returns { valid: boolean, errors: string[], signal: enrichedSignal }
 */
function validateSignal(signal) {
  const errors = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!signal[field] && signal[field] !== 0) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate layer enum
  if (signal.layer && !VALID_LAYERS.includes(signal.layer)) {
    errors.push(`Invalid layer "${signal.layer}" — must be one of: ${VALID_LAYERS.join(', ')}`);
  }

  // Validate severity enum
  if (signal.severity && !VALID_SEVERITIES.includes(signal.severity)) {
    errors.push(`Invalid severity "${signal.severity}" — must be one of: ${VALID_SEVERITIES.join(', ')}`);
  }

  // Validate time format
  if (signal.time && !TIME_REGEX.test(signal.time)) {
    errors.push(`Invalid time format "${signal.time}" — must be HH:MM`);
  }

  // Text length check
  if (signal.text && signal.text.length > 300) {
    errors.push(`Signal text too long (${signal.text.length} chars) — max 300`);
  }

  // Source must be non-empty string
  if (signal.source && typeof signal.source !== 'string') {
    errors.push('Source must be a string');
  }

  return {
    valid: errors.length === 0,
    errors,
    signal
  };
}

/**
 * Enrich a signal with Glass Box provenance metadata.
 * This is the traceability layer — every insight links back to its source.
 */
function addProvenance(signal, provenanceData) {
  return {
    ...signal,
    provenance: {
      // Raw source URL (for Glass Box linkout)
      sourceUrl: provenanceData.url || null,
      // Original source title/headline
      sourceTitle: provenanceData.title || null,
      // Ingestion timestamp
      ingestedAt: new Date().toISOString(),
      // Source connector that produced this signal
      connector: provenanceData.connector || 'unknown',
      // Confidence score (0-1) based on source tier
      confidence: provenanceData.confidence || 0.5,
      // Source tier (primary=0.9, secondary=0.7, tertiary=0.5, internal=0.3)
      tier: provenanceData.tier || 'tertiary',

      // ── DATA LINEAGE: Raw vs Enriched ──
      // dataClass: 'raw' = direct from source, 'enriched' = LLM/AI processed, 'synthesized' = derived from multiple signals
      dataClass: provenanceData.dataClass || 'raw',
      // If enriched: what enrichment was applied and why
      enrichment: provenanceData.enrichment || null,
      // Example enrichment object:
      // { method: 'llm-summary', model: 'claude-haiku-4.5', reason: 'TL;DR from 3 corroborating signals', rawInputIds: [12, 15, 23] }

      // Hash of raw input for dedup
      inputHash: hashString(JSON.stringify({
        text: signal.text,
        source: signal.source,
        time: signal.time
      }))
    }
  };
}

/**
 * Simple string hash for dedup detection
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit int
  }
  return Math.abs(hash).toString(36);
}

/**
 * Consensus agent — checks if a signal has corroborating signals.
 * Returns a consensus object with convergence score.
 *
 * A signal gains consensus when:
 * 1. Multiple layers report similar findings (cross-layer convergence)
 * 2. Multiple sources within the same layer agree (within-layer convergence)
 * 3. Temporal proximity: signals within 24h of each other cluster together
 */
function checkConsensus(signal, existingSignals) {
  const now = new Date();
  const recent = existingSignals.filter(s => {
    const ingested = new Date(s.ingested || s.provenance?.ingestedAt || now);
    return (now - ingested) < 24 * 60 * 60 * 1000; // 24h window
  });

  // Find corroborating signals (same brand, different source)
  const corroborating = recent.filter(s =>
    s.brand === signal.brand &&
    s.source !== signal.source &&
    s.text !== signal.text
  );

  // Cross-layer convergence: signals about same brand from different layers
  const crossLayer = corroborating.filter(s => s.layer !== signal.layer);

  // Within-layer convergence: same layer, different sources
  const withinLayer = corroborating.filter(s => s.layer === signal.layer);

  // Convergence score (0-1)
  let convergenceScore = 0;
  if (crossLayer.length > 0) convergenceScore += 0.4;
  if (crossLayer.length > 2) convergenceScore += 0.2;
  if (withinLayer.length > 0) convergenceScore += 0.2;
  if (withinLayer.length > 2) convergenceScore += 0.1;
  if (signal.severity === 'high') convergenceScore += 0.1;

  convergenceScore = Math.min(convergenceScore, 1);

  // Consensus level
  let level = 'low';
  if (convergenceScore >= 0.6) level = 'high';
  else if (convergenceScore >= 0.3) level = 'medium';

  return {
    convergenceScore: parseFloat(convergenceScore.toFixed(2)),
    level,
    corroboratingCount: corroborating.length,
    crossLayerCount: crossLayer.length,
    withinLayerCount: withinLayer.length,
    corroboratingSources: corroborating.map(s => s.source).slice(0, 5)
  };
}

/**
 * Full validation pipeline: validate → provenance → consensus → store-ready
 */
function processSignal(rawSignal, provenanceData, existingSignals = []) {
  // Step 1: Schema validation
  const validation = validateSignal(rawSignal);
  if (!validation.valid) {
    return { accepted: false, errors: validation.errors, signal: null };
  }

  // Step 2: Add provenance (Glass Box traceability)
  const withProvenance = addProvenance(rawSignal, provenanceData);

  // Step 3: Check consensus against existing signals
  const consensus = checkConsensus(rawSignal, existingSignals);
  withProvenance.consensus = consensus;

  // Step 4: Dedup check — reject if identical hash exists
  const existingHashes = existingSignals
    .filter(s => s.provenance?.inputHash)
    .map(s => s.provenance.inputHash);

  if (existingHashes.includes(withProvenance.provenance.inputHash)) {
    return { accepted: false, errors: ['Duplicate signal detected'], signal: null };
  }

  return { accepted: true, errors: [], signal: withProvenance };
}

module.exports = {
  validateSignal,
  addProvenance,
  checkConsensus,
  processSignal,
  REQUIRED_FIELDS,
  VALID_LAYERS,
  VALID_SEVERITIES
};
