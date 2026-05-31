const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
//  TradeMemory — Statistical Intelligence (Level 1)
//  Learns from past trades to rank opportunities & blacklist bad pairs
// ═══════════════════════════════════════════════════════════════

const DATA_FILE = path.join(__dirname, '../../data/trade-memory.json');

class TradeMemory {
  constructor() {
    this.trades = [];           // All recorded trades
    this.dexStats = {};         // Per-DEX statistics
    this.pairStats = {};        // Per-pair statistics
    this.dexPairStats = {};     // Per-DEX+pair combined statistics
    this.blacklist = new Set(); // Blacklisted dex+pair combos
    this.maxTrades = 10000;     // Max trades to keep in memory
    this.blacklistThreshold = 10;  // Min trades before blacklisting
    this.blacklistFailRate = 0.85; // 85% fail rate = blacklisted

    this._load();
  }

  // ─── Record a trade result ──────────────────────────────────
  recordTrade(trade) {
    const {
      dex,
      pair,
      success,
      profit = 0,
      gasUsed = 0,
      strategy = 'flash_loan',
      chain = 'arbitrum',
      executionTimeMs = 0,
      error = null,
    } = trade;

    const record = {
      dex,
      pair,
      success,
      profit,
      gasUsed,
      strategy,
      chain,
      executionTimeMs,
      error,
      timestamp: Date.now(),
    };

    this.trades.push(record);

    // Trim old trades
    if (this.trades.length > this.maxTrades) {
      this.trades = this.trades.slice(-this.maxTrades);
    }

    // Update statistics
    this._updateStats(record);

    // Check blacklist
    this._checkBlacklist(dex, pair);

    // Save periodically (every 10 trades)
    if (this.trades.length % 10 === 0) {
      this._save();
    }

    return record;
  }

  // ─── Get success rate for a DEX ─────────────────────────────
  getDexSuccessRate(dex) {
    const stats = this.dexStats[dex];
    if (!stats || stats.total === 0) return { rate: 0.5, total: 0, confidence: 'low' };

    const rate = stats.success / stats.total;
    const confidence = stats.total >= 50 ? 'high' : stats.total >= 10 ? 'medium' : 'low';

    return { rate, total: stats.total, confidence };
  }

  // ─── Get success rate for a pair ────────────────────────────
  getPairSuccessRate(pair) {
    const stats = this.pairStats[pair];
    if (!stats || stats.total === 0) return { rate: 0.5, total: 0, confidence: 'low' };

    const rate = stats.success / stats.total;
    const confidence = stats.total >= 50 ? 'high' : stats.total >= 10 ? 'medium' : 'low';

    return { rate, total: stats.total, confidence };
  }

  // ─── Get combined DEX+pair score ────────────────────────────
  getDexPairScore(dex, pair) {
    const key = `${dex}::${pair}`;
    const stats = this.dexPairStats[key];
    if (!stats || stats.total === 0) {
      return { score: 50, successRate: 0.5, avgProfit: 0, total: 0, confidence: 'low' };
    }

    const successRate = stats.success / stats.total;
    const avgProfit = stats.totalProfit / Math.max(stats.success, 1);
    const avgGas = stats.totalGas / stats.total;
    const confidence = stats.total >= 30 ? 'high' : stats.total >= 5 ? 'medium' : 'low';

    // Score formula: weighted combination
    // 40% success rate + 30% avg profit + 20% speed + 10% recency
    const successScore = successRate * 40;
    const profitScore = Math.min(avgProfit / 100, 1) * 30; // cap at $100 avg profit
    const gasScore = (1 - Math.min(avgGas / 500000, 1)) * 20; // lower gas = better
    const recencyScore = this._getRecencyScore(stats.lastTrade) * 10;

    const score = Math.round(successScore + profitScore + gasScore + recencyScore);

    return { score, successRate, avgProfit, avgGas, total: stats.total, confidence, lastTrade: stats.lastTrade };
  }

  // ─── Get overall DEX score (0-100) ──────────────────────────
  getDexScore(dex) {
    const stats = this.dexStats[dex];
    if (!stats || stats.total === 0) return 50; // neutral score

    const successRate = stats.success / stats.total;
    const avgProfit = stats.totalProfit / Math.max(stats.success, 1);

    // Simple weighted score
    const score = Math.round(
      successRate * 60 +
      Math.min(avgProfit / 50, 1) * 30 +
      this._getRecencyScore(stats.lastTrade) * 10
    );

    return Math.min(Math.max(score, 0), 100);
  }

  // ─── Rank opportunities using historical data ───────────────
  rankOpportunities(opportunities) {
    return opportunities
      .filter(opp => {
        // Remove blacklisted
        const buyKey = `${opp.buyDex}::${opp.pair}`;
        const sellKey = `${opp.sellDex}::${opp.pair}`;
        return !this.blacklist.has(buyKey) && !this.blacklist.has(sellKey);
      })
      .map(opp => {
        const buyScore = this.getDexPairScore(opp.buyDex, opp.pair);
        const sellScore = this.getDexPairScore(opp.sellDex, opp.pair);

        // Confidence score: average of buy and sell DEX scores
        const confidenceScore = Math.round((buyScore.score + sellScore.score) / 2);

        // Adjusted expected profit = profit * confidence
        const adjustedProfit = opp.profit.usd * (confidenceScore / 100);

        return {
          ...opp,
          intelligence: {
            confidenceScore,
            adjustedProfit,
            buyDexScore: buyScore,
            sellDexScore: sellScore,
            recommendation: confidenceScore >= 70 ? 'strong_buy' :
                           confidenceScore >= 50 ? 'buy' :
                           confidenceScore >= 30 ? 'caution' : 'avoid',
          },
        };
      })
      .sort((a, b) => {
        // Sort by adjusted profit (confidence * profit)
        return b.intelligence.adjustedProfit - a.intelligence.adjustedProfit;
      });
  }

  // ─── Get blacklist ──────────────────────────────────────────
  getBlacklist() {
    return Array.from(this.blacklist);
  }

  // ─── Remove from blacklist ──────────────────────────────────
  removeFromBlacklist(dex, pair) {
    this.blacklist.delete(`${dex}::${pair}`);
    this._save();
  }

  // ─── Clear all blacklist ────────────────────────────────────
  clearBlacklist() {
    this.blacklist.clear();
    this._save();
  }

  // ─── Get top performing DEXes ───────────────────────────────
  getTopDexes(limit = 10) {
    return Object.entries(this.dexStats)
      .map(([dex, stats]) => ({
        dex,
        score: this.getDexScore(dex),
        successRate: stats.total > 0 ? (stats.success / stats.total) : 0,
        totalTrades: stats.total,
        totalProfit: stats.totalProfit,
        avgProfit: stats.success > 0 ? stats.totalProfit / stats.success : 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // ─── Get full statistics summary ────────────────────────────
  getStats() {
    const totalTrades = this.trades.length;
    const successfulTrades = this.trades.filter(t => t.success).length;
    const totalProfit = this.trades.filter(t => t.success).reduce((sum, t) => sum + t.profit, 0);
    const last24h = this.trades.filter(t => Date.now() - t.timestamp < 86400000);
    const last24hSuccess = last24h.filter(t => t.success).length;

    return {
      totalTrades,
      successfulTrades,
      failedTrades: totalTrades - successfulTrades,
      overallSuccessRate: totalTrades > 0 ? (successfulTrades / totalTrades) : 0,
      totalProfit,
      avgProfitPerTrade: successfulTrades > 0 ? totalProfit / successfulTrades : 0,
      last24h: {
        trades: last24h.length,
        success: last24hSuccess,
        successRate: last24h.length > 0 ? last24hSuccess / last24h.length : 0,
        profit: last24h.filter(t => t.success).reduce((sum, t) => sum + t.profit, 0),
      },
      topDexes: this.getTopDexes(5),
      blacklistCount: this.blacklist.size,
      blacklist: this.getBlacklist(),
    };
  }

  // ─── Private: Update statistics ─────────────────────────────
  _updateStats(record) {
    const { dex, pair, success, profit, gasUsed } = record;

    // DEX stats
    if (!this.dexStats[dex]) {
      this.dexStats[dex] = { total: 0, success: 0, totalProfit: 0, totalGas: 0, lastTrade: 0 };
    }
    this.dexStats[dex].total++;
    if (success) {
      this.dexStats[dex].success++;
      this.dexStats[dex].totalProfit += profit;
    }
    this.dexStats[dex].totalGas += gasUsed;
    this.dexStats[dex].lastTrade = Date.now();

    // Pair stats
    if (!this.pairStats[pair]) {
      this.pairStats[pair] = { total: 0, success: 0, totalProfit: 0, totalGas: 0, lastTrade: 0 };
    }
    this.pairStats[pair].total++;
    if (success) {
      this.pairStats[pair].success++;
      this.pairStats[pair].totalProfit += profit;
    }
    this.pairStats[pair].totalGas += gasUsed;
    this.pairStats[pair].lastTrade = Date.now();

    // DEX+Pair combined stats
    const key = `${dex}::${pair}`;
    if (!this.dexPairStats[key]) {
      this.dexPairStats[key] = { total: 0, success: 0, totalProfit: 0, totalGas: 0, lastTrade: 0 };
    }
    this.dexPairStats[key].total++;
    if (success) {
      this.dexPairStats[key].success++;
      this.dexPairStats[key].totalProfit += profit;
    }
    this.dexPairStats[key].totalGas += gasUsed;
    this.dexPairStats[key].lastTrade = Date.now();
  }

  // ─── Private: Check blacklist ───────────────────────────────
  _checkBlacklist(dex, pair) {
    const key = `${dex}::${pair}`;
    const stats = this.dexPairStats[key];
    if (!stats || stats.total < this.blacklistThreshold) return;

    const failRate = 1 - (stats.success / stats.total);
    if (failRate >= this.blacklistFailRate) {
      this.blacklist.add(key);
      console.log(`[TradeMemory] ⛔ Blacklisted: ${key} (fail rate: ${(failRate * 100).toFixed(1)}%)`);
    }
  }

  // ─── Private: Recency score (0-1) ──────────────────────────
  _getRecencyScore(lastTrade) {
    if (!lastTrade) return 0;
    const ageMs = Date.now() - lastTrade;
    const ageHours = ageMs / (1000 * 60 * 60);
    // Recent = high score, old = low score (decay over 24h)
    return Math.max(0, 1 - (ageHours / 24));
  }

  // ─── Private: Load from disk ────────────────────────────────
  _load() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(raw);
        this.trades = data.trades || [];
        this.dexStats = data.dexStats || {};
        this.pairStats = data.pairStats || {};
        this.dexPairStats = data.dexPairStats || {};
        this.blacklist = new Set(data.blacklist || []);
        console.log(`[TradeMemory] 📂 Loaded ${this.trades.length} trades, ${this.blacklist.size} blacklisted`);
      }
    } catch (e) {
      console.warn('[TradeMemory] Could not load data:', e.message);
    }
  }

  // ─── Private: Save to disk ──────────────────────────────────
  _save() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const data = {
        trades: this.trades,
        dexStats: this.dexStats,
        pairStats: this.pairStats,
        dexPairStats: this.dexPairStats,
        blacklist: Array.from(this.blacklist),
        savedAt: new Date().toISOString(),
      };

      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('[TradeMemory] Save error:', e.message);
    }
  }
}

module.exports = { TradeMemory };
