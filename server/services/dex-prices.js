const { ethers } = require('ethers');
const { DEX_CONFIG, TOKEN_LIST, ABIS } = require('../dex/abis');

// ═══════════════════════════════════════════════════════════════
//  DexPriceAggregator — multi-DEX price fetching with retry
//  Supports: v2, v3, curve, balancer, solidly, gmx
// ═══════════════════════════════════════════════════════════════

class DexPriceAggregator {
  constructor(rpcManager = null) {
    this.rpcManager = rpcManager;
    this.providers = {};
    this.priceCache = new Map();
    this.cacheExpiry = 2000; // 2 seconds
    this.maxRetries = 3;
    this.networkMode = 'mainnet';

    if (!rpcManager) {
      this._initDefaultProviders();
    }
  }

  // ─── Provider management ───────────────────────────────────
  _initDefaultProviders() {
    const rpcUrls = {
      arbitrum: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
      base: process.env.BASE_RPC || 'https://mainnet.base.org',
      ethereum: process.env.ETH_RPC || 'https://eth.llamarpc.com',
    };

    for (const [chain, url] of Object.entries(rpcUrls)) {
      this.providers[chain] = new ethers.JsonRpcProvider(url);
    }
  }

  _getProvider(chain = 'arbitrum') {
    if (this.rpcManager) {
      return this.rpcManager.getProvider(chain);
    }
    return this.providers[chain] || this.providers.arbitrum;
  }

  setNetworkMode(mode) {
    this.networkMode = mode;
    if (this.rpcManager) {
      this.rpcManager.setNetworkMode(mode);
    }
  }

  // ─── Public API ────────────────────────────────────────────
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

    const dex = DEX_CONFIG[dexId];
    if (!dex) {
      return this._makeError(dexId, `Unsupported DEX: ${dexId}`);
    }

    // Retry with exponential backoff
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        let price = null;

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
          case 'solidly':
            price = await this._getSolidlyPrice(dex, tokenIn, tokenOut, amountIn);
            break;
          case 'gmx':
            price = await this._getGmxPrice(dex, tokenIn, tokenOut, amountIn);
            break;
          default:
            price = await this._getV2Price(dex, tokenIn, tokenOut, amountIn);
        }

        if (price) {
          this.priceCache.set(cacheKey, { data: price, timestamp: Date.now() });
          return price;
        }

        return null;
      } catch (error) {
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 200; // 400ms, 800ms, 1600ms
          await this._sleep(delay);
          continue;
        }
        console.error(`[Price] ${dexId} failed after ${this.maxRetries} retries:`, error.message);
        return null;
      }
    }

    return null;
  }

  // ─── V2 Price (Uniswap V2, SushiSwap, Camelot, etc.) ─────
  async _getV2Price(dex, tokenIn, tokenOut, amountIn) {
    const provider = this._getProvider(dex.chain);
    const router = new ethers.Contract(dex.router, ABIS.UNISWAP_V2_ROUTER, provider);

    const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
    const tokenInDecimals = TOKEN_LIST[tokenIn]?.decimals || 18;
    const tokenOutDecimals = TOKEN_LIST[tokenOut]?.decimals || 18;

    const amountInFormatted = parseFloat(ethers.formatUnits(amounts[0], tokenInDecimals));
    const amountOutFormatted = parseFloat(ethers.formatUnits(amounts[1], tokenOutDecimals));

    if (amountInFormatted === 0) return null;

    return {
      dexId: dex.id || dex.name,
      dexName: dex.name,
      dexType: dex.type,
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
  }

  // ─── V3 Price (Uniswap V3, PancakeSwap V3, Ramses) ────────
  async _getV3Price(dex, tokenIn, tokenOut, amountIn) {
    const provider = this._getProvider(dex.chain);
    const quoterAddress = dex.quoter || '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
    const quoter = new ethers.Contract(quoterAddress, ABIS.UNISWAP_V3_QUOTER, provider);

    const fees = [500, 3000, 10000];
    let bestQuote = null;

    for (const fee of fees) {
      try {
        const amountOut = await quoter.quoteExactInputSingle.staticCall(
          tokenIn, tokenOut, fee, amountIn, 0
        );

        const tokenInDecimals = TOKEN_LIST[tokenIn]?.decimals || 18;
        const tokenOutDecimals = TOKEN_LIST[tokenOut]?.decimals || 18;
        const amountOutFormatted = parseFloat(ethers.formatUnits(amountOut, tokenOutDecimals));
        const amountInFormatted = parseFloat(ethers.formatUnits(amountIn, tokenInDecimals));

        if (amountInFormatted === 0) continue;

        const quote = {
          dexId: dex.id || dex.name,
          dexName: dex.name,
          dexType: 'v3',
          tokenIn,
          tokenOut,
          amountIn: amountIn.toString(),
          amountOut: amountOut.toString(),
          amountInFormatted,
          amountOutFormatted,
          price: amountOutFormatted / amountInFormatted,
          fee: fee / 1_000_000,
          v3Fee: fee,
          gasEstimate: 180000,
          liquidity: 'high',
          timestamp: Date.now(),
        };

        if (!bestQuote || amountOut > BigInt(bestQuote.amountOut)) {
          bestQuote = quote;
        }
      } catch {
        continue;
      }
    }

    return bestQuote;
  }

  // ─── Curve Price ───────────────────────────────────────────
  async _getCurvePrice(dex, tokenIn, tokenOut, amountIn) {
    const provider = this._getProvider(dex.chain);
    const pool = new ethers.Contract(dex.pool, ABIS.CURVE_POOL, provider);

    const tokenInIndex = dex.tokens.findIndex(
      (t) => t.toLowerCase() === tokenIn.toLowerCase()
    );
    const tokenOutIndex = dex.tokens.findIndex(
      (t) => t.toLowerCase() === tokenOut.toLowerCase()
    );

    if (tokenInIndex === -1 || tokenOutIndex === -1) return null;

    const amountOut = await pool.get_dy(tokenInIndex, tokenOutIndex, amountIn);
    const tokenInDecimals = TOKEN_LIST[tokenIn]?.decimals || 18;
    const tokenOutDecimals = TOKEN_LIST[tokenOut]?.decimals || 18;

    const amountInFormatted = parseFloat(ethers.formatUnits(amountIn, tokenInDecimals));
    const amountOutFormatted = parseFloat(ethers.formatUnits(amountOut, tokenOutDecimals));

    if (amountInFormatted === 0) return null;

    return {
      dexId: dex.id || 'curve',
      dexName: dex.name,
      dexType: 'curve',
      tokenIn,
      tokenOut,
      amountIn: amountIn.toString(),
      amountOut: amountOut.toString(),
      amountInFormatted,
      amountOutFormatted,
      price: amountOutFormatted / amountInFormatted,
      fee: dex.fee || 0.0004,
      gasEstimate: 200000,
      liquidity: 'high',
      timestamp: Date.now(),
    };
  }

  // ─── Balancer Price (via Vault queryBatchSwap) ─────────────
  async _getBalancerPrice(dex, tokenIn, tokenOut, amountIn) {
    const provider = this._getProvider(dex.chain);

    const BALANCER_VAULT_ABI = [
      'function queryBatchSwap(uint8 kind, (bytes32 poolId, uint256 assetInIndex, uint256 assetOutIndex, uint256 amount, bytes userData)[] swaps, address[] assets, (address sender, bool fromInternalBalance, address payable recipient, bool toInternalBalance) funds) view returns (int256[])',
      'function getPool(bytes32 poolId) view returns (address, uint8)',
    ];

    const vault = new ethers.Contract(
      dex.vault || '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      BALANCER_VAULT_ABI,
      provider
    );

    // Known Balancer pool IDs on Arbitrum for common pairs
    const poolId = this._getBalancerPoolId(tokenIn, tokenOut);
    if (!poolId) return null;

    try {
      const swaps = [{
        poolId,
        assetInIndex: 0,
        assetOutIndex: 1,
        amount: amountIn,
        userData: '0x',
      }];

      const assets = [tokenIn, tokenOut];
      const funds = {
        sender: ethers.ZeroAddress,
        fromInternalBalance: false,
        recipient: ethers.ZeroAddress,
        toInternalBalance: false,
      };

      // kind=0 = GIVEN_IN
      const deltas = await vault.queryBatchSwap(0, swaps, assets, funds);

      // deltas[0] = positive (amount of tokenIn going IN)
      // deltas[1] = negative (amount of tokenOut going OUT)
      const amountOut = deltas[1] < 0n ? -deltas[1] : deltas[1];

      const tokenInDecimals = TOKEN_LIST[tokenIn]?.decimals || 18;
      const tokenOutDecimals = TOKEN_LIST[tokenOut]?.decimals || 18;

      const amountInFormatted = parseFloat(ethers.formatUnits(amountIn, tokenInDecimals));
      const amountOutFormatted = parseFloat(ethers.formatUnits(amountOut, tokenOutDecimals));

      if (amountInFormatted === 0) return null;

      return {
        dexId: dex.id || 'balancer',
        dexName: dex.name,
        dexType: 'balancer',
        tokenIn,
        tokenOut,
        amountIn: amountIn.toString(),
        amountOut: amountOut.toString(),
        amountInFormatted,
        amountOutFormatted,
        price: amountOutFormatted / amountInFormatted,
        poolId,
        fee: dex.fee || 0.001,
        gasEstimate: 200000,
        liquidity: 'high',
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[Balancer] queryBatchSwap failed:', error.message);
      return null;
    }
  }

  // ─── Solidly Price (Velodrome, Aerodrome, SolidLizard) ─────
  async _getSolidlyPrice(dex, tokenIn, tokenOut, amountIn) {
    const provider = this._getProvider(dex.chain);

    const SOLIDLY_ROUTER_ABI = [
      'function getAmountOut(uint256 amountIn, address tokenIn, address tokenOut) view returns (uint256 amount, bool stable)',
      'function getAmountsOut(uint256 amountIn, (address from, address to, bool stable)[] routes) view returns (uint256[] amounts)',
    ];

    const router = new ethers.Contract(
      dex.router,
      SOLIDLY_ROUTER_ABI,
      provider
    );

    try {
      // Try both stable and volatile
      let bestAmount = 0n;
      let bestStable = false;

      for (const stable of [true, false]) {
        try {
          const [amount] = await router.getAmountOut(amountIn, tokenIn, tokenOut);
          if (amount > bestAmount) {
            bestAmount = amount;
            bestStable = stable;
          }
        } catch {
          continue;
        }
      }

      if (bestAmount === 0n) return null;

      const tokenInDecimals = TOKEN_LIST[tokenIn]?.decimals || 18;
      const tokenOutDecimals = TOKEN_LIST[tokenOut]?.decimals || 18;

      const amountInFormatted = parseFloat(ethers.formatUnits(amountIn, tokenInDecimals));
      const amountOutFormatted = parseFloat(ethers.formatUnits(bestAmount, tokenOutDecimals));

      if (amountInFormatted === 0) return null;

      return {
        dexId: dex.id || 'solidly',
        dexName: dex.name,
        dexType: 'solidly',
        tokenIn,
        tokenOut,
        amountIn: amountIn.toString(),
        amountOut: bestAmount.toString(),
        amountInFormatted,
        amountOutFormatted,
        price: amountOutFormatted / amountInFormatted,
        isStable: bestStable,
        fee: dex.fee || 0.003,
        gasEstimate: 170000,
        liquidity: 'medium',
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[Solidly] Price fetch failed:', error.message);
      return null;
    }
  }

  // ─── GMX Price (via Reader contract or Vault) ──────────────
  async _getGmxPrice(dex, tokenIn, tokenOut, amountIn) {
    // GMX uses its own Vault for pricing — we use the V2 router fallback
    // since GMX's router interface is V2-compatible for basic swaps
    try {
      return await this._getV2Price(dex, tokenIn, tokenOut, amountIn);
    } catch {
      return null;
    }
  }

  // ─── Get all prices for a token pair ───────────────────────
  async getAllPrices(tokenIn, tokenOut, amountIn) {
    if (!tokenIn || !tokenOut) return [];

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

  // ─── Helpers ───────────────────────────────────────────────
  _getBalancerPoolId(tokenIn, tokenOut) {
    // Known Balancer weighted pool IDs on Arbitrum
    const pools = {
      // WETH-USDC pool
      '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1-0xaf88d065e77c8cC2239327C5EDb3A432268e5831':
        '0x64541216bafffeec8ea535bb71fbc927831d0595000100000000000000000002f3',
      '0xaf88d065e77c8cC2239327C5EDb3A432268e5831-0x82aF49447D8a07e3bd95BD0d56f35241523fBab1':
        '0x64541216bafffeec8ea535bb71fbc927831d0595000100000000000000000002f3',
    };

    const key = `${tokenIn}-${tokenOut}`;
    return pools[key] || null;
  }

  _makeError(dexId, message) {
    return { dexId, error: message, timestamp: Date.now() };
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = { DexPriceAggregator };
