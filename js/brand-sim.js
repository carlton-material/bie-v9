/**
 * Brand Sim Engine — Agent-Based Market Simulation
 * Port of skincare-abm(v2) to vanilla JS for BIE v9
 * 
 * 650 agents across 3 market tiers, 6 psychographic segments
 * Uses Bass diffusion (awareness) + Softmax utility (brand choice)
 */

class BrandSimulator {
  constructor(config) {
    this.brands = config.brands || [];
    this.segments = config.segments || [];
    this.tiers = config.tiers || [];
    this.agentCount = config.agentCount || 650;
    this.agents = [];
    this.step = 0;
    this.history = [];
    this.initialize();
  }

  initialize() {
    this.agents = [];
    this.step = 0;
    this.history = [];
    
    // Distribute agents across tiers and segments
    const tierShares = this.tiers.map(t => t.share);
    const segShares = this.segments.map(s => s.share);
    
    let id = 0;
    for (let ti = 0; ti < this.tiers.length; ti++) {
      const tierCount = Math.round(this.agentCount * tierShares[ti]);
      for (let si = 0; si < this.segments.length; si++) {
        const segCount = Math.round(tierCount * segShares[si]);
        for (let a = 0; a < segCount; a++) {
          this.agents.push({
            id: id++,
            tier: this.tiers[ti].name,
            segment: this.segments[si].name,
            weights: { ...this.segments[si].weights },
            currentBrand: null,
            awareness: {},
            loyalty: this.segments[si].loyaltyRate || 0.6,
            active: Math.random() > (this.tiers[ti].latentShare || 0.2)
          });
        }
      }
    }
    
    // Trim or pad to exact agent count
    while (this.agents.length > this.agentCount) this.agents.pop();
    while (this.agents.length < this.agentCount) {
      const last = this.agents[this.agents.length - 1];
      this.agents.push({ ...last, id: this.agents.length });
    }
    
    // Initialize awareness: each agent knows 1-3 brands in their tier
    this.agents.forEach(agent => {
      const tierBrands = this.brands.filter(b => b.tier === agent.tier);
      tierBrands.forEach(b => {
        agent.awareness[b.id] = Math.random() < (b.initialAwareness || 0.5) ? 1 : 0;
      });
      // Cross-tier awareness (lower probability)
      this.brands.filter(b => b.tier !== agent.tier).forEach(b => {
        agent.awareness[b.id] = Math.random() < 0.15 ? 1 : 0;
      });
    });
    
    // Initial brand choice for active agents
    this.agents.filter(a => a.active).forEach(a => this.chooseBrand(a));
    
    this.recordState();
  }

  // Bass diffusion: awareness spreads via innovation (ads) + imitation (word-of-mouth)
  spreadAwareness() {
    this.agents.forEach(agent => {
      this.brands.forEach(brand => {
        if (agent.awareness[brand.id]) return; // Already aware
        
        // p = innovation coefficient (advertising)
        const p = brand.bassP || 0.03;
        // q = imitation coefficient (word-of-mouth)
        const q = brand.bassQ || 0.38;
        
        // Count aware neighbors (agents in same segment)
        const neighbors = this.agents.filter(a => 
          a.segment === agent.segment && a.awareness[brand.id]
        );
        const awareRatio = neighbors.length / Math.max(1, 
          this.agents.filter(a => a.segment === agent.segment).length
        );
        
        const adoptProb = p + q * awareRatio;
        if (Math.random() < adoptProb) {
          agent.awareness[brand.id] = 1;
        }
      });
    });
  }

  // Softmax utility: each brand gets a score, probability proportional to exp(utility)
  chooseBrand(agent) {
    const knownBrands = this.brands.filter(b => agent.awareness[b.id]);
    if (knownBrands.length === 0) {
      agent.currentBrand = null;
      return;
    }
    
    // Loyalty: stick with current brand with some probability
    if (agent.currentBrand && Math.random() < agent.loyalty) return;
    
    // Calculate utility for each known brand
    const utilities = knownBrands.map(b => {
      const w = agent.weights;
      // Normalize price to 0-1 (lower price = higher score)
      const priceScore = 1 - (b.price || 0.5);
      const utility = (
        priceScore * (w.price || 0.3) +
        (b.equity || 0.5) * (w.equity || 0.3) +
        (b.innovation || 0.5) * (w.innovation || 0.2) +
        (b.distribution || 0.5) * (w.distribution || 0.2)
      );
      return { brand: b, utility };
    });
    
    // Softmax selection
    const temperature = 3.0; // Higher = more deterministic
    const maxU = Math.max(...utilities.map(u => u.utility));
    const expUtils = utilities.map(u => ({
      brand: u.brand,
      exp: Math.exp(temperature * (u.utility - maxU))
    }));
    const sumExp = expUtils.reduce((s, u) => s + u.exp, 0);
    
    let rand = Math.random();
    for (const u of expUtils) {
      rand -= u.exp / sumExp;
      if (rand <= 0) {
        agent.currentBrand = u.brand.id;
        return;
      }
    }
    agent.currentBrand = expUtils[expUtils.length - 1].brand.id;
  }

  // Category dynamics: agents enter/exit market
  categoryDynamics() {
    this.agents.forEach(agent => {
      const tier = this.tiers.find(t => t.name === agent.tier);
      if (!tier) return;
      
      if (agent.active) {
        // Exit: active agents may leave
        if (Math.random() < (tier.exitRate || 0.01)) {
          agent.active = false;
          agent.currentBrand = null;
        }
      } else {
        // Entry: latent agents may enter
        if (Math.random() < (tier.entryRate || 0.03)) {
          agent.active = true;
          this.chooseBrand(agent);
        }
      }
    });
  }

  // Run one simulation step
  tick() {
    this.step++;
    this.categoryDynamics();
    this.spreadAwareness();
    this.agents.filter(a => a.active).forEach(a => this.chooseBrand(a));
    this.recordState();
  }

  // Record current state for history
  recordState() {
    const active = this.agents.filter(a => a.active);
    const shares = {};
    this.brands.forEach(b => {
      shares[b.id] = active.filter(a => a.currentBrand === b.id).length / Math.max(1, active.length);
    });
    
    const tierDist = {};
    this.tiers.forEach(t => {
      tierDist[t.name] = {
        active: this.agents.filter(a => a.tier === t.name && a.active).length,
        total: this.agents.filter(a => a.tier === t.name).length
      };
    });
    
    this.history.push({
      step: this.step,
      shares: { ...shares },
      tiers: JSON.parse(JSON.stringify(tierDist)),
      activeCount: active.length,
      totalCount: this.agents.length
    });
  }

  // Apply scenario modifiers (from Claude or presets)
  applyScenario(modifiers) {
    if (modifiers.brandModifiers) {
      Object.entries(modifiers.brandModifiers).forEach(([brandId, mods]) => {
        const brand = this.brands.find(b => b.id === brandId);
        if (!brand) return;
        Object.entries(mods).forEach(([key, val]) => {
          if (typeof val === 'number') {
            brand[key] = Math.max(0, Math.min(1, (brand[key] || 0.5) + val));
          }
        });
      });
    }
    if (modifiers.tierModifiers) {
      Object.entries(modifiers.tierModifiers).forEach(([tierName, mods]) => {
        const tier = this.tiers.find(t => t.name === tierName);
        if (!tier) return;
        Object.entries(mods).forEach(([key, val]) => {
          tier[key] = val;
        });
      });
    }
  }

  // Get current brand shares
  getShares() {
    return this.history.length > 0 ? this.history[this.history.length - 1].shares : {};
  }

  // Get full history for charting
  getHistory() {
    return this.history;
  }

  // Reset to initial state
  reset() {
    // Reset brand attributes to defaults
    this.brands.forEach(b => {
      if (b._defaults) Object.assign(b, b._defaults);
    });
    this.initialize();
  }
}

// Export for use in app
window.BrandSimulator = BrandSimulator;
