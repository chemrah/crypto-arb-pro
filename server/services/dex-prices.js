const { ethers } = require('ethers');
const axios = require('axios');
const { DEX_CONFIG, TOKEN_LIST, ABIS } = require('../dex/abis');

class DexPriceAggregator {
  constructor() {
    this.providers = {};
    this.priceCache = new Map();
    this.cacheExpiry = 2000;
    this.lastUpdate = new Map();

    this._initProviders();
  }

  _initProviders() {
    const rpcUrls = {
      arbitrum: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
      base: process.env.BASE_RPC || 'https://mainnet.base.org',
      ethereum: process.env.ETH_RPC || 'https://eth.llamarpc.com',
    };

    for (const [chain, url] of Object.entries(rpcUrls)) {
      this.providers[chain] = new ethers.JsonRpcProvider(url);
    }
  }

  getSupportedDexes() {
    return Object.entries(DEX_CONFIG).map(([key, config]) => ({
      id: key,
      name: config.name,
      chain: config.chain,
      type: config.type,
      router: config.router,
      fee: config.fee,
      pairs: config.supportedPairs || 'all',
    }));
  }

  async getPrice(dexId, tokenIn, tokenOut, amountIn) {
    const cacheKey = `${dexId}:${tokenIn}:${tokenOut}:${amountIn}`;
    const cached = this.priceCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const dex = DEX_CONFIG[dexId];
      if (!dex) throw new Error(`DEX غير مدعوم: ${dexId}`);

      let price;

      switch (dex.type) {
        case 'v2':
          price = await this._getV2Price(dex, tokenIn, tokenOut, amountIn);
          break;
        case 'v3':
          price = await this._getV3Price(dex, tokenIn, tokenOut, amountIn);
          break;
        case 'curve':
          price = await this._getCurvePrice(dex, tokenIn, tokenOut, amountIn);
          break;
        case 'balancer':
          price = await this._getBalancerPrice(dex, tokenIn, tokenOut, amountIn);
          break;
        default:
          price = await this._getV2Price(dex, tokenIn, tokenOut, amountIn);
      }

      this.priceCache.set(cacheKey, { data: price, timestamp: Date.now() });
      return price;
    } catch (error) {
      console.error(`[Price] خطأ في ${dexId}:`, error.message);
      return null;
    }
  }

  async _getV2Price(dex, tokenIn, tokenOut, amountIn) {
    const provider = this.providers[dex.chain] || this.providers.arbitrum;
    const router = new ethers.Contract(dex.router, ABIS.UNISWAP_V2_ROUTER, provider);

    try {
      const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
      const tokenInDecimals = TOKEN_LIST[tokenIn]?.decimals || 18;
      const tokenOutDecimals = TOKEN_LIST[tokenOut]?.decimals || 18;

      const amountInFormatted = parseFloat(ethers.formatUnits(amounts[0], tokenInDecimals));
      const amountOutFormatted = parseFloat(ethers.formatUnits(amounts[1], tokenOutDecimals));

      return {
        dexId: dex.id || dex.name,
        tokenIn,
        tokenOut,
        amountIn: amounts[0].toString(),
        amountOut: amounts[1].toString(),
        amountInFormatted,
        amountOutFormatted,
        price: amountOutFormatted / amountInFormatted,
        gasEstimate: 150000,
        fee: dex.fee || 0.003,
        liquidity: 'high',
        timestamp: Date.now(),
      };
    } catch (e) {
      return null;
    }
  }

  async _getV3Price(dex, tokenIn, tokenOut, amountIn) {
    const provider = this.providers[dex.chain] || this.providers.arbitrum;

    const quoterAddress = dex.quoter || '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
    const quoter = new ethers.Contract(quoterAddress, ABIS.UNISWAP_V3_QUOTER, provider);

    const fees = [500, 3000, 10000];
    let bestQuote = null;

    for (const fee of fees) {
      try {
        const amountOut = await quoter.quoteExactInputSingle.staticCall(
          tokenIn,
          tokenOut,
          fee,
          amountIn,
          0
        );

        const tokenInDecimals = TOKEN_LIST[tokenIn]?.decimals || 18;
        const tokenOutDecimals = TOKEN_LIST[tokenOut]?.decimals || 18;
        const amountOutFormatted = parseFloat(ethers.formatUnits(amountOut, tokenOutDecimals));
        const amountInFormatted = parseFloat(ethers.formatUnits(amountIn, tokenInDecimals));

        const quote = {
          dexId: dex.id || dex.name,
          tokenIn,
          tokenOut,
          amountIn: amountIn.toString(),
          amountOut: amountOut.toString(),
          amountInFormatted,
          amountOutFormatted,
          price: amountOutFormatted / amountInFormatted,
          fee: fee / 1000000,
          gasEstimate: 180000,
          liquidity: 'high',
          timestamp: Date.now(),
        };

        if (!bestQuote || amountOut > BigInt(bestQuote.amountOut)) {
          bestQuote = quote;
        }
      } catch (e) {
        continue;
      }
    }

    return bestQuote;
  }

  async _getCurvePrice(dex, tokenIn, tokenOut, amountIn) {
    const provider = this.providers[dex.chain] || this.providers.ethereum;
    const pool = new ethers.Contract(dex.pool, ABIS.CURVE_POOL, provider);

    try {
      const tokenInIndex = dex.tokens.indexOf(tokenIn.toLowerCase());
      const tokenOutIndex = dex.tokens.indexOf(tokenOut.toLowerCase());

      if (tokenInIndex === -1 || tokenOutIndex === -1) return null;

      const amountOut = await pool.get_dy(tokenInIndex, tokenOutIndex, amountIn);
      const tokenOutDecimals = TOKEN_LIST[tokenOut]?.decimals || 18;
      const tokenInDecimals = TOKEN_LIST[tokenIn]?.decimals || 18;

      return {
        dexId: dex.id || 'curve',
        tokenIn,
        tokenOut,
        amountIn: amountIn.toString(),
        amountOut: amountOut.toString(),
        amountInFormatted: parseFloat(ethers.formatUnits(amountIn, tokenInDecimals)),
        amountOutFormatted: parseFloat(ethers.formatUnits(amountOut, tokenOutDecimals)),
        price: parseFloat(ethers.formatUnits(amountOut, tokenOutDecimals)) /
               parseFloat(ethers.formatUnits(amountIn, tokenInDecimals)),
        fee: dex.fee || 0.0004,
        gasEstimate: 200000,
        liquidity: 'high',
        timestamp: Date.now(),
      };
    } catch (e) {
      return null;
    }
  }

  async _getBalancerPrice(dex, tokenIn, tokenOut, amountIn) {
    return null;
  }

  async getAllPrices(tokenIn, tokenOut, amountIn) {
    const dexes = Object.keys(DEX_CONFIG);
    const results = await Promise.allSettled(
      dexes.map((dexId) => this.getPrice(dexId, tokenIn, tokenOut, amountIn))
    );

    return results
      .filter((r) => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value)
      .sort((a, b) => b.price - a.price);
  }

  async getMultiPairPrices(pairs, amountIn) {
    const allPrices = {};

    for (const pair of pairs) {
      const prices = await this.getAllPrices(pair.tokenA, pair.tokenB, amountIn);
      allPrices[`${pair.tokenA}-${pair.tokenB}`] = prices;
    }

    return allPrices;
  }

  clearCache() {
    this.priceCache.clear();
  }
}

module.exports = { DexPriceAggregator };
