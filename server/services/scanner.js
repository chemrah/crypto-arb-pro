const EventEmitter = require('events');
const { ethers } = require('ethers');

class Scanner extends EventEmitter {
  constructor(dexAggregator, arbEngine, rpcManager, priceFeed) {
    super();
    this.dexAggregator = dexAggregator;
    this.arbEngine = arbEngine;
    this.rpcManager = rpcManager;
    this.priceFeed = priceFeed;
    this.trackedPairs = {};
    this.running = false;
    this.scanInterval = 3000;
    this.minProfitUSD = 1; // Detect ALL profitable arb including < $50
    this.networkMode = 'mainnet';
    this.recentOpportunities = new Map(); // For dedup
    this.dedupWindow = 10000; // 10 seconds
    this.loanAmounts = [
      ethers.parseUnits('1000', 18),
      ethers.parseUnits('5000', 18),
      ethers.parseUnits('10000', 18),
      ethers.parseUnits('50000', 18),
      ethers.parseUnits('100000', 18),
    ];

    this._initDefaultPairs();
  }

  _initDefaultPairs() {
    // Arbitrum pairs
    const ARB_TOKENS = {
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

    // Ethereum pairs
    const ETH_TOKENS = {
      WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    };

    // Base pairs
    const BASE_TOKENS = {
      WETH: '0x4200000000000000000000000000000000000006',
      USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    };

    this.trackedPairs = {
      arbitrum: [
        { tokenA: ARB_TOKENS.WETH, tokenB: ARB_TOKENS.USDC, symbol: 'WETH/USDC' },
        { tokenA: ARB_TOKENS.WETH, tokenB: ARB_TOKENS.USDT, symbol: 'WETH/USDT' },
        { tokenA: ARB_TOKENS.WBTC, tokenB: ARB_TOKENS.USDC, symbol: 'WBTC/USDC' },
        { tokenA: ARB_TOKENS.ARB, tokenB: ARB_TOKENS.USDC, symbol: 'ARB/USDC' },
        { tokenA: ARB_TOKENS.ARB, tokenB: ARB_TOKENS.WETH, symbol: 'ARB/WETH' },
        { tokenA: ARB_TOKENS.LINK, tokenB: ARB_TOKENS.USDC, symbol: 'LINK/USDC' },
        { tokenA: ARB_TOKENS.UNI, tokenB: ARB_TOKENS.USDC, symbol: 'UNI/USDC' },
        { tokenA: ARB_TOKENS.GMX, tokenB: ARB_TOKENS.WETH, symbol: 'GMX/WETH' },
        { tokenA: ARB_TOKENS.USDC, tokenB: ARB_TOKENS.USDCe, symbol: 'USDC/USDC.e' },
        { tokenA: ARB_TOKENS.USDC, tokenB: ARB_TOKENS.USDT, symbol: 'USDC/USDT' },
        { tokenA: ARB_TOKENS.USDC, tokenB: ARB_TOKENS.DAI, symbol: 'USDC/DAI' },
        { tokenA: ARB_TOKENS.DAI, tokenB: ARB_TOKENS.USDT, symbol: 'DAI/USDT' },
      ],
      ethereum: [
        { tokenA: ETH_TOKENS.WETH, tokenB: ETH_TOKENS.USDC, symbol: 'WETH/USDC' },
        { tokenA: ETH_TOKENS.WETH, tokenB: ETH_TOKENS.USDT, symbol: 'WETH/USDT' },
        { tokenA: ETH_TOKENS.WBTC, tokenB: ETH_TOKENS.USDC, symbol: 'WBTC/USDC' },
        { tokenA: ETH_TOKENS.USDC, tokenB: ETH_TOKENS.DAI, symbol: 'USDC/DAI' },
        { tokenA: ETH_TOKENS.USDC, tokenB: ETH_TOKENS.USDT, symbol: 'USDC/USDT' },
      ],
      base: [
        { tokenA: BASE_TOKENS.WETH, tokenB: BASE_TOKENS.USDC, symbol: 'WETH/USDC' },
        { tokenA: BASE_TOKENS.USDC, tokenB: BASE_TOKENS.USDbC, symbol: 'USDC/USDbC' },
      ],
    };
  }

  setNetworkMode(mode) {
    this.networkMode = mode;
    console.log(`[Scanner] تبديل الشبكة إلى: ${mode}`);
    this.recentOpportunities.clear();
  }

  addPair(tokenA, tokenB, chain = 'arbitrum') {
    if (!this.trackedPairs[chain]) this.trackedPairs[chain] = [];
    const exists = this.trackedPairs[chain].find(
      (p) => (p.tokenA === tokenA && p.tokenB === tokenB) ||
             (p.tokenA === tokenB && p.tokenB === tokenA)
    );
    if (!exists) {
      this.trackedPairs[chain].push({
        tokenA, tokenB,
        symbol: `${tokenA.slice(0, 6)}/${tokenB.slice(0, 6)}`,
      });
    }
  }

  removePair(tokenA, tokenB, chain = 'arbitrum') {
    if (!this.trackedPairs[chain]) return;
    this.trackedPairs[chain] = this.trackedPairs[chain].filter(
      (p) => !((p.tokenA === tokenA && p.tokenB === tokenB) ||
               (p.tokenA === tokenB && p.tokenB === tokenA))
    );
  }

  getTrackedPairs() {
    const all = [];
    for (const [chain, pairs] of Object.entries(this.trackedPairs)) {
      pairs.forEach((p) => all.push({ ...p, chain }));
    }
    return all;
  }

  getTotalPairCount() {
    return Object.values(this.trackedPairs).reduce((sum, pairs) => sum + pairs.length, 0);
  }

  async start() {
    this.running = true;
    console.log(`[Scanner] بدء المسح - ${this.getTotalPairCount()} زوج عبر ${Object.keys(this.trackedPairs).length} شبكات`);
    this._scanLoop();
  }

  stop() {
    this.running = false;
    console.log('[Scanner] توقف المسح');
  }

  async _scanLoop() {
    while (this.running) {
      try {
        // Update live prices
        if (this.priceFeed) {
          const ethPrice = await this.priceFeed.getEthPrice();
          if (this.arbEngine.setEthPrice) this.arbEngine.setEthPrice(ethPrice);

          // Update gas price per chain
          for (const chain of Object.keys(this.trackedPairs)) {
            try {
              const provider = this.rpcManager?.getProvider(chain, this.networkMode);
              if (provider) {
                const gasPrice = await this.priceFeed.getGasPrice(chain, provider);
                if (this.arbEngine.setGasPrice) this.arbEngine.setGasPrice(gasPrice);
              }
            } catch (e) { /* skip */ }
          }

          // Broadcast price update
          this.emit('eth_price_update', {
            ethPrice: await this.priceFeed.getEthPrice(),
            gasPrice: this.arbEngine.GAS_PRICE_GWEI || 0.1,
          });
        }

        await this._performScan();
      } catch (error) {
        console.error('[Scanner] خطأ في المسح:', error.message);
      }

      // Adaptive scan interval
      await this._sleep(this.scanInterval);
    }
  }

  async _performScan() {
    const allPrices = {};
    const allOpportunities = [];
    let totalPairsScanned = 0;

    // Clean expired dedup entries
    const now = Date.now();
    for (const [key, timestamp] of this.recentOpportunities) {
      if (now - timestamp > this.dedupWindow) {
        this.recentOpportunities.delete(key);
      }
    }

    for (const [chain, pairs] of Object.entries(this.trackedPairs)) {
      // Get chain-specific DEXes
      const chainDexes = this.dexAggregator.getDexesForChain
        ? this.dexAggregator.getDexesForChain(chain)
        : null;

      for (const pair of pairs) {
        for (const loanAmount of this.loanAmounts) {
          try {
            const prices = await this.dexAggregator.getAllPrices(
              pair.tokenA, pair.tokenB, loanAmount
            );

            const pairKey = `${chain}:${pair.symbol}`;
            allPrices[pairKey] = prices;
            totalPairsScanned++;

            if (prices.length >= 2) {
              const opportunities = this.arbEngine.findOpportunities(
                prices, pair.tokenA, pair.tokenB, loanAmount
              );

              for (const opp of opportunities) {
                if (opp.profit.usd >= this.minProfitUSD) {
                  // Dedup check
                  const dedupKey = `${opp.buyDex}:${opp.sellDex}:${pair.symbol}`;
                  if (!this.recentOpportunities.has(dedupKey)) {
                    this.recentOpportunities.set(dedupKey, Date.now());
                    opp.chain = chain;
                    allOpportunities.push(opp);
                    this.emit('opportunity', opp);
                  }
                }
              }
            }
          } catch (e) {
            continue;
          }
        }
      }
    }

    this.emit('scan_complete', {
      pairsScanned: totalPairsScanned,
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
    this.minProfitUSD = Math.max(0.01, usd);
  }
}

module.exports = { Scanner };
