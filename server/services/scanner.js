const EventEmitter = require('events');
const { ethers } = require('ethers');

class Scanner extends EventEmitter {
  constructor(dexAggregator, arbEngine) {
    super();
    this.dexAggregator = dexAggregator;
    this.arbEngine = arbEngine;
    this.trackedPairs = [];
    this.running = false;
    this.scanInterval = 3000;
    this.minProfitUSD = 1;
    this.loanAmounts = [
      ethers.parseUnits('1000', 18),
      ethers.parseUnits('10000', 18),
      ethers.parseUnits('50000', 18),
      ethers.parseUnits('100000', 18),
    ];

    this._initDefaultPairs();
  }

  _initDefaultPairs() {
    const ARBITRUM_TOKENS = {
      WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      USDCe: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      WBTC: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      ARB: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      LINK: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
      UNI: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
      GMX: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a',
    };

    const pairs = [
      { tokenA: ARBITRUM_TOKENS.WETH, tokenB: ARBITRUM_TOKENS.USDC, symbol: 'WETH/USDC' },
      { tokenA: ARBITRUM_TOKENS.WETH, tokenB: ARBITRUM_TOKENS.USDT, symbol: 'WETH/USDT' },
      { tokenA: ARBITRUM_TOKENS.WBTC, tokenB: ARBITRUM_TOKENS.USDC, symbol: 'WBTC/USDC' },
      { tokenA: ARBITRUM_TOKENS.ARB, tokenB: ARBITRUM_TOKENS.USDC, symbol: 'ARB/USDC' },
      { tokenA: ARBITRUM_TOKENS.ARB, tokenB: ARBITRUM_TOKENS.WETH, symbol: 'ARB/WETH' },
      { tokenA: ARBITRUM_TOKENS.LINK, tokenB: ARBITRUM_TOKENS.USDC, symbol: 'LINK/USDC' },
      { tokenA: ARBITRUM_TOKENS.UNI, tokenB: ARBITRUM_TOKENS.USDC, symbol: 'UNI/USDC' },
      { tokenA: ARBITRUM_TOKENS.GMX, tokenB: ARBITRUM_TOKENS.WETH, symbol: 'GMX/WETH' },
      { tokenA: ARBITRUM_TOKENS.USDC, tokenB: ARBITRUM_TOKENS.USDCe, symbol: 'USDC/USDC.e' },
      { tokenA: ARBITRUM_TOKENS.USDC, tokenB: ARBITRUM_TOKENS.USDT, symbol: 'USDC/USDT' },
      { tokenA: ARBITRUM_TOKENS.USDC, tokenB: ARBITRUM_TOKENS.DAI, symbol: 'USDC/DAI' },
      { tokenA: ARBITRUM_TOKENS.DAI, tokenB: ARBITRUM_TOKENS.USDT, symbol: 'DAI/USDT' },
    ];

    this.trackedPairs = pairs;
  }

  addPair(tokenA, tokenB) {
    const exists = this.trackedPairs.find(
      (p) => (p.tokenA === tokenA && p.tokenB === tokenB) ||
             (p.tokenA === tokenB && p.tokenB === tokenA)
    );
    if (!exists) {
      this.trackedPairs.push({ tokenA, tokenB, symbol: `${tokenA.slice(0, 6)}/${tokenB.slice(0, 6)}` });
    }
  }

  removePair(tokenA, tokenB) {
    this.trackedPairs = this.trackedPairs.filter(
      (p) => !((p.tokenA === tokenA && p.tokenB === tokenB) ||
               (p.tokenA === tokenB && p.tokenB === tokenA))
    );
  }

  getTrackedPairs() {
    return this.trackedPairs;
  }

  async start() {
    this.running = true;
    console.log(`[Scanner] بدء المسح - ${this.trackedPairs.length} زوج`);
    this._scanLoop();
  }

  stop() {
    this.running = false;
    console.log('[Scanner] توقف المسح');
  }

  async _scanLoop() {
    while (this.running) {
      try {
        await this._performScan();
      } catch (error) {
        console.error('[Scanner] خطأ في المسح:', error.message);
      }

      await this._sleep(this.scanInterval);
    }
  }

  async _performScan() {
    const allPrices = {};
    const allOpportunities = [];

    for (const pair of this.trackedPairs) {
      for (const loanAmount of this.loanAmounts) {
        try {
          const prices = await this.dexAggregator.getAllPrices(
            pair.tokenA,
            pair.tokenB,
            loanAmount
          );

          const pairKey = pair.symbol;
          allPrices[pairKey] = prices;

          if (prices.length >= 2) {
            const opportunities = this.arbEngine.findOpportunities(
              prices,
              pair.tokenA,
              pair.tokenB,
              loanAmount
            );

            for (const opp of opportunities) {
              if (opp.profit.usd >= this.minProfitUSD) {
                allOpportunities.push(opp);
                this.emit('opportunity', opp);
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
    }

    this.emit('scan_complete', {
      pairsScanned: this.trackedPairs.length,
      prices: allPrices,
      opportunities: allOpportunities.length,
      timestamp: Date.now(),
    });

    this.emit('price_update', {
      prices: allPrices,
      timestamp: Date.now(),
    });
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  setScanInterval(ms) {
    this.scanInterval = Math.max(1000, ms);
  }

  setMinProfit(usd) {
    this.minProfitUSD = usd;
  }
}

module.exports = { Scanner };
