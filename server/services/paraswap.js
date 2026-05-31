// ═══════════════════════════════════════════════════════════════
//  ParaSwap V5 — DEX Aggregator for optimal sell routing
//  Gets best price across ALL DEXes with split routing
// ═══════════════════════════════════════════════════════════════

const PARASWAP_API = 'https://apiv5.paraswap.io';

const CHAIN_IDS = {
  ethereum: 1,
  arbitrum: 42161,
  polygon: 137,
  bsc: 56,
  optimism: 10,
  base: 8453,
};

// Augustus Swapper (ParaSwap main contract) addresses per chain
const AUGUSTUS_ADDRESSES = {
  1: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
  42161: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
  137: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
  56: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
  10: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
  8453: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
};

class ParaSwapService {
  constructor() {
    this.routeCache = new Map();
    this.cacheTTL = 30000; // 30 seconds cache
    this.enabled = true;
  }

  // ─── Get optimal route from ParaSwap ────────────────────────
  async getOptimalRoute(tokenIn, tokenOut, amount, chain = 'arbitrum', decimalsIn = 18, decimalsOut = 18) {
    if (!this.enabled) return null;

    const chainId = CHAIN_IDS[chain];
    if (!chainId) {
      console.warn(`[ParaSwap] Unsupported chain: ${chain}`);
      return null;
    }

    // Check cache
    const cacheKey = `${tokenIn}:${tokenOut}:${amount}:${chain}`;
    const cached = this.routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.route;
    }

    try {
      // Step 1: Get price quote
      const priceUrl = `${PARASWAP_API}/prices?` + new URLSearchParams({
        srcToken: tokenIn,
        destToken: tokenOut,
        amount: amount.toString(),
        srcDecimals: decimalsIn.toString(),
        destDecimals: decimalsOut.toString(),
        side: 'SELL',
        network: chainId.toString(),
        partner: 'cryptoarbpro',
      });

      const priceResponse = await fetch(priceUrl, {
        headers: { 'Accept': 'application/json' },
      });

      if (!priceResponse.ok) {
        const errText = await priceResponse.text();
        console.warn(`[ParaSwap] Price API error: ${priceResponse.status} — ${errText}`);
        return null;
      }

      const priceData = await priceResponse.json();

      if (!priceData.priceRoute) {
        console.warn('[ParaSwap] No route found');
        return null;
      }

      const route = {
        destAmount: priceData.priceRoute.destAmount,
        destAmountFormatted: parseFloat(priceData.priceRoute.destAmount) / (10 ** decimalsOut),
        srcAmount: priceData.priceRoute.srcAmount,
        gasCost: priceData.priceRoute.gasCost || '0',
        gasCostUSD: priceData.priceRoute.gasCostUSD || '0',
        bestRoute: priceData.priceRoute.bestRoute,
        contractAddress: AUGUSTUS_ADDRESSES[chainId],
        chainId,
        tokenIn,
        tokenOut,
        priceRoute: priceData.priceRoute,
      };

      // Cache the route
      this.routeCache.set(cacheKey, { route, timestamp: Date.now() });

      return route;
    } catch (error) {
      console.error('[ParaSwap] Error getting route:', error.message);
      return null;
    }
  }

  // ─── Build swap transaction from a route ────────────────────
  async buildSwapTx(route, userAddress, chain = 'arbitrum') {
    if (!route || !route.priceRoute) return null;

    const chainId = CHAIN_IDS[chain];

    try {
      const txUrl = `${PARASWAP_API}/transactions/${chainId}`;

      const txResponse = await fetch(txUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          srcToken: route.tokenIn,
          destToken: route.tokenOut,
          srcAmount: route.srcAmount,
          destAmount: route.destAmount,
          priceRoute: route.priceRoute,
          userAddress: userAddress,
          partner: 'cryptoarbpro',
          slippage: 100, // 1% slippage
          deadline: Math.floor(Date.now() / 1000) + 300, // 5 min deadline
        }),
      });

      if (!txResponse.ok) {
        const errText = await txResponse.text();
        console.warn(`[ParaSwap] Build TX error: ${txResponse.status} — ${errText}`);
        return null;
      }

      const txData = await txResponse.json();

      return {
        to: txData.to,
        data: txData.data,
        value: txData.value || '0',
        gasPrice: txData.gasPrice,
        chainId,
      };
    } catch (error) {
      console.error('[ParaSwap] Error building TX:', error.message);
      return null;
    }
  }

  // ─── Compare direct DEX price vs ParaSwap price ─────────────
  compareWithDirect(directAmountOut, paraswapAmountOut, decimalsOut = 18) {
    const directFormatted = parseFloat(directAmountOut) / (10 ** decimalsOut);
    const paraFormatted = parseFloat(paraswapAmountOut) / (10 ** decimalsOut);

    const improvement = paraFormatted - directFormatted;
    const improvementPercent = directFormatted > 0
      ? ((paraFormatted - directFormatted) / directFormatted) * 100
      : 0;

    return {
      directAmountOut: directFormatted,
      paraswapAmountOut: paraFormatted,
      improvement,
      improvementPercent,
      useParaSwap: improvement > 0,
      summary: improvement > 0
        ? `ParaSwap gives ${improvementPercent.toFixed(2)}% more (+${improvement.toFixed(6)} tokens)`
        : `Direct DEX is better by ${Math.abs(improvementPercent).toFixed(2)}%`,
    };
  }

  // ─── Get supported chains ───────────────────────────────────
  getSupportedChains() {
    return Object.keys(CHAIN_IDS);
  }

  // ─── Enable/Disable ParaSwap ────────────────────────────────
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`[ParaSwap] ${enabled ? '✅ Enabled' : '❌ Disabled'}`);
  }

  // ─── Clear cache ────────────────────────────────────────────
  clearCache() {
    this.routeCache.clear();
  }
}

module.exports = { ParaSwapService };
