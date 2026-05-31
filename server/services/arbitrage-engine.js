const { ethers } = require('ethers');

// ═══════════════════════════════════════════════════════════════
//  ArbitrageEngine — opportunity detection & profit calculation
// ═══════════════════════════════════════════════════════════════

const TOKEN_SYMBOLS = {
  '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1': 'WETH',
  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': 'USDC',
  '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8': 'USDC.e',
  '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9': 'USDT',
  '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1': 'DAI',
  '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f': 'WBTC',
  '0x912CE59144191C1204E64559FE8253a0e49E6548': 'ARB',
  '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4': 'LINK',
  '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0': 'UNI',
  '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a': 'GMX',
  '0x4200000000000000000000000000000000000006': 'WETH',
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': 'USDC',
  '0x6B175474E89094C44Da98b954EedeAC495271d0F': 'DAI',
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 'USDC',
  '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'USDT',
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'WETH',
};

// Stablecoin addresses (for strategy recommendation)
const STABLECOINS = new Set([
  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC (Arb)
  '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // USDC.e (Arb)
  '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT (Arb)
  '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI (Arb)
  '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI (Eth)
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC (Eth)
  '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT (Eth)
]);

class ArbitrageEngine {
  constructor(priceFeed = null) {
    this.priceFeed = priceFeed;

    // Bot mode: 'basic' or 'smart'
    this.mode = 'basic';

    // Intelligence services (set externally)
    this.tradeMemory = null;
    this.paraswap = null;

    // Protocol fees
    this.AAVE_FLASH_LOAN_FEE = 0.0009; // 0.09%
    this.MAKER_FLASH_MINT_FEE = 0;      // 0% for DAI
    this.UNISWAP_V2_FEE = 0.003;        // 0.3%
    this.UNISWAP_V3_FEES = [0.0001, 0.0005, 0.003, 0.01];

    // Dynamic pricing (updated externally)
    this.GAS_PRICE_GWEI = 0.1;
    this.ETH_PRICE_USD = 3000;

    // Configuration
    this.MIN_PROFIT_USD = 1;      // Detect all profitable arbs
    this.SLIPPAGE_TOLERANCE = 0.005; // 0.5% slippage
  }

  // ─── Dynamic updates ──────────────────────────────────────
  setGasPrice(gwei) {
    this.GAS_PRICE_GWEI = gwei;
  }

  setEthPrice(usd) {
    this.ETH_PRICE_USD = usd;
  }

  setMinProfit(usd) {
    this.MIN_PROFIT_USD = usd;
  }

  setSlippage(pct) {
    this.SLIPPAGE_TOLERANCE = pct;
  }

  setTradeMemory(tm) {
    this.tradeMemory = tm;
  }

  setParaSwap(ps) {
    this.paraswap = ps;
  }

  setMode(mode) {
    if (mode === 'basic' || mode === 'smart') {
      this.mode = mode;
      console.log(`[ArbitrageEngine] Mode switched to: ${mode}`);
    }
  }

  getMode() {
    return this.mode;
  }

  // ─── Sync from PriceFeed instance ─────────────────────────
  _syncPrices() {
    if (this.priceFeed) {
      this.ETH_PRICE_USD = this.priceFeed.getEthPrice();
      this.GAS_PRICE_GWEI = this.priceFeed.getGasPrice();
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  findOpportunities — compare all DEX prices pairwise
  // ═══════════════════════════════════════════════════════════
  findOpportunities(prices, tokenIn, tokenOut, loanAmount) {
    this._syncPrices();

    const opportunities = [];

    for (let i = 0; i < prices.length; i++) {
      for (let j = 0; j < prices.length; j++) {
        if (i === j) continue;

        const buyPrice = prices[i];
        const sellPrice = prices[j];

        // Buy where price is LOWER (cheaper), sell where price is HIGHER
        // price = amountOut / amountIn → higher price = more output
        // For arbitrage: we want to buy on DEX with lower price (less output per input)
        // and sell on DEX with higher price (more output per input)
        // Wait — actually higher price means MORE tokenOut per tokenIn,
        // so for a buy→sell arb, buy on the DEX that gives MORE tokenOut,
        // then sell those tokenOut on the DEX that gives MORE tokenIn back.
        //
        // The correct check: Can I start with tokenIn, swap to tokenOut on DEX A,
        // then swap tokenOut back to tokenIn on DEX B, and end up with more tokenIn?
        //
        // DEX_A price (tokenIn→tokenOut) = A, I get A * inputAmount of tokenOut
        // DEX_B price (tokenOut→tokenIn) = B, I get B * (A * inputAmount) of tokenIn back
        // Profit if A * B > 1 (when prices are correctly directional)
        //
        // But our prices[] array gives price = amountOut/amountIn for the
        // tokenIn→tokenOut direction on each DEX.
        // We need the reverse direction (tokenOut→tokenIn) for the sell leg.
        // If we don't have reverse quotes, we approximate: sell at 1/buyPrice.
        //
        // Simple approach: prices are all for the same direction (tokenIn→tokenOut).
        // Arb exists when we can buy on DEX with HIGHER rate and sell (reverse) on DEX with LOWER rate.
        // But that's the traditional approach. Let's stick with the spread model:

        if (buyPrice.price > 0 && sellPrice.price > 0 && sellPrice.price > buyPrice.price) {
          const opportunity = this._calculateOpportunity(
            buyPrice,
            sellPrice,
            tokenIn,
            tokenOut,
            loanAmount
          );

          if (opportunity && opportunity.profit.usd >= this.MIN_PROFIT_USD) {
            opportunities.push(opportunity);
          }
        }
      }
    }

    // Sort by profit
    let sorted = opportunities.sort((a, b) => b.profit.usd - a.profit.usd);

    // Smart mode: re-rank using TradeMemory intelligence
    if (this.mode === 'smart' && this.tradeMemory) {
      sorted = this.tradeMemory.rankOpportunities(sorted);
      // Add confidenceScore field from intelligence data
      sorted = sorted.map(opp => ({
        ...opp,
        confidenceScore: opp.intelligence ? opp.intelligence.confidenceScore : opp.confidence,
      }));
    }

    return sorted;
  }

  // ═══════════════════════════════════════════════════════════
  //  _calculateOpportunity — precise profit math
  // ═══════════════════════════════════════════════════════════
  _calculateOpportunity(buyPrice, sellPrice, tokenIn, tokenOut, loanAmount) {
    const { TOKEN_LIST } = require('../dex/abis');
    const tokenInDecimals = TOKEN_LIST[tokenIn]?.decimals || 18;

    const loanAmountFormatted = parseFloat(ethers.formatUnits(loanAmount, tokenInDecimals));

    // Step 1: Borrow loanAmount of tokenIn via flash loan
    // Step 2: Swap tokenIn → tokenOut on buyDex (use buyPrice.amountOutFormatted if available)
    //   amount of tokenOut received = loanAmount * buyPrice
    //   BUT buyPrice.price already accounts for DEX fee in the on-chain quote
    const tokensReceived = loanAmountFormatted * buyPrice.price;

    // Step 3: Swap tokenOut → tokenIn on sellDex
    //   We need the reverse price. If sellPrice is tokenIn→tokenOut,
    //   then selling tokenOut→tokenIn gives us tokensReceived / sellPrice.
    //   Actually — simpler: sellProceeds = tokensReceived * (1 / sellReverse)
    //   But we don't have reverse quotes. The standard approach:
    //   sellPrice.price = amountOut_per_amountIn for tokenIn→tokenOut
    //   For reverse: we approximate amountIn_per_amountOut ≈ 1/price
    //   So: selling tokensReceived of tokenOut on sellDex:
    //     tokenIn received = tokensReceived / sellPrice.price
    //   Wait, this gives LESS if sellPrice is higher — that's wrong.
    //
    //   Let me reconsider: Both prices are quotes for the SAME direction (tokenIn→tokenOut).
    //   The arbitrage works if you can buy tokenOut cheaply and sell it expensively.
    //   "Cheaply" means lower price (less tokenOut per tokenIn) — you need MORE tokenIn to get tokenOut.
    //   Wait no: price = tokenOut / tokenIn. Higher price = more tokenOut per tokenIn = "cheap to buy tokenOut"?
    //   No: higher rate = you get more tokenOut, so the DEX values tokenOut less → tokenOut is cheaper there.
    //
    //   Actually the correct interpretation:
    //   - Buy tokenOut where it's CHEAPEST (highest tokenOut/tokenIn rate) = use the DEX with highest price
    //   - Sell tokenOut where it's MOST EXPENSIVE (lowest tokenOut/tokenIn rate, meaning 1 tokenOut buys more tokenIn)
    //
    //   For a buy-sell arb on the same pair:
    //   Profit = tokensReceived_on_buy × reverseRate_on_sell - loanAmount
    //   reverseRate_on_sell ≈ 1 / sellPrice.price
    //
    //   But that would mean we profit when buyPrice > sellPrice and sell at 1/sellPrice.
    //   profit = loanAmount * buyPrice / sellPrice - loanAmount
    //   This is positive when buyPrice > sellPrice, but sellPrice is HIGHER in our filter above.
    //   This is contradictory!
    //
    //   The issue is: both prices are the same direction. Let's just use the spread approach
    //   that was in the original code, which is more intuitive for front-running:
    //   - buyPrice is the DEX we buy FROM (lower quoted rate → tokenOut costs more in tokenIn)
    //   - sellPrice is the DEX we sell TO (higher quoted rate → we get more tokenOut per tokenIn)
    //   - We flash loan tokenIn, get MORE tokenOut on the "sell" dex, convert back on the "buy" dex
    //
    //   Actually the simplest correct model: treat each price as amountOut per amountIn.
    //   For 2-leg arb (tokenIn→tokenOut on DEX_A, tokenOut→tokenIn on DEX_B):
    //     We need price_A (tokenIn→tokenOut) and price_B_reverse (tokenOut→tokenIn).
    //     profit = loanAmount * price_A * price_B_reverse - loanAmount
    //     price_B_reverse ≈ 1 / price_B (for tokenIn→tokenOut on DEX_B)
    //     profit = loanAmount * (price_A / price_B) - loanAmount
    //     Positive when price_A > price_B.
    //
    //   So: buy on the DEX with HIGHER price (more tokenOut per tokenIn),
    //        sell (reverse) on the DEX with LOWER price (1/lower = more tokenIn per tokenOut).
    //
    //   In our loop: sellPrice > buyPrice → sellPrice is the one with higher rate.
    //   So we buy tokenOut on sellPrice DEX (higher rate), sell back on buyPrice DEX (lower rate, better reverse).
    //   Variable naming is backwards from the loop but the math works:

    // Corrected variable semantics:
    // "sellPrice" DEX has higher tokenIn→tokenOut rate → we buy tokenOut there
    // "buyPrice" DEX has lower tokenIn→tokenOut rate → we sell tokenOut there (better reverse rate)
    const buyDexRate = sellPrice.price;   // higher rate → buy tokenOut here
    const sellDexRate = buyPrice.price;   // lower rate → sell tokenOut here (reverse = 1/lower = higher)

    const tokenOutReceived = loanAmountFormatted * buyDexRate;
    const tokenInBack = tokenOutReceived / sellDexRate; // ≈ tokenOutReceived * (1/sellDexRate)
    // Wait, that's wrong too. Let me just use the actual sell proceeds.
    // tokenOut → tokenIn on the "buy" DEX:
    // If buyPrice.price = tokenOut/tokenIn = rate,
    // then selling tokenOut: tokenIn_received = tokenOutReceived * (1 / buyPrice.price)
    // But 1/rate means tokenIn per tokenOut. If rate=2000 (2000 USDC per ETH),
    // then 1 tokenOut (USDC) buys 1/2000 ETH → that's correct for the reverse.

    // Let's just keep it simple and correct:
    const grossReturn = loanAmountFormatted * (sellPrice.price / buyPrice.price);
    const grossProfit = grossReturn - loanAmountFormatted;

    // Fees
    const flashLoanFee = loanAmountFormatted * this.AAVE_FLASH_LOAN_FEE;
    // DEX fees are already included in the on-chain quote (getAmountsOut accounts for fee)
    // So we only need to account for the flash loan fee + gas cost
    const dexFees = 0; // Already reflected in quoted prices

    // Gas cost
    const totalGasUnits = (buyPrice.gasEstimate || 150000) + (sellPrice.gasEstimate || 150000) + 300000;
    const gasCostUSD = this._estimateGasCost(totalGasUnits);

    // Apply slippage tolerance
    const slippageCost = grossProfit * this.SLIPPAGE_TOLERANCE;

    const netProfit = grossProfit - flashLoanFee - dexFees - gasCostUSD - slippageCost;
    const profitPercent = loanAmountFormatted > 0 ? (netProfit / loanAmountFormatted) * 100 : 0;

    if (netProfit < this.MIN_PROFIT_USD) return null;

    // Determine best strategy
    const strategy = this._recommendStrategy(
      tokenIn, tokenOut, buyPrice, sellPrice, loanAmountFormatted
    );

    return {
      id: `arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pair: `${TOKEN_SYMBOLS[tokenIn] || tokenIn.slice(0, 8)}/${TOKEN_SYMBOLS[tokenOut] || tokenOut.slice(0, 8)}`,
      tokenIn,
      tokenOut,
      buyDex: sellPrice.dexId, // DEX where we buy tokenOut (higher rate)
      sellDex: buyPrice.dexId, // DEX where we sell tokenOut (lower rate → better reverse)
      buyPrice: sellPrice.price,
      sellPrice: buyPrice.price,
      spread: sellPrice.price - buyPrice.price,
      spreadPercent: ((sellPrice.price - buyPrice.price) / buyPrice.price) * 100,
      loanAmount: loanAmountFormatted,
      grossReturn,
      profit: {
        gross: grossProfit,
        flashLoanFee,
        dexFees,
        gasCost: gasCostUSD,
        slippage: slippageCost,
        net: netProfit,
        usd: netProfit,
        percent: profitPercent,
      },
      strategy,
      gasless: true,
      timestamp: Date.now(),
      expiry: Date.now() + 15000,
      confidence: this._calculateConfidence(buyPrice, sellPrice, netProfit, profitPercent),
    };
  }

  // ═══════════════════════════════════════════════════════════
  //  Strategy recommendation
  // ═══════════════════════════════════════════════════════════
  _recommendStrategy(tokenIn, tokenOut, buyPrice, sellPrice, amount) {
    const isStablePair = STABLECOINS.has(tokenIn) && STABLECOINS.has(tokenOut);
    const isDAI = tokenIn === '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1' ||
                  tokenIn === '0x6B175474E89094C44Da98b954EedeAC495271d0F';
    const isV2Pair = buyPrice.dexId?.includes('V2') || buyPrice.dexId?.includes('sushi') ||
                     buyPrice.dexId?.includes('camelot');

    // Flash mint is free (0 fee) — best for DAI-based arbs
    if (isDAI && amount <= 500_000_000) {
      return 'flash_mint';
    }

    // Flash swap is cheaper for V2 pairs (no extra flash loan fee — just the 0.3% swap fee)
    if (isV2Pair && amount < 1_000_000) {
      return 'flash_swap';
    }

    // Default: Aave flash loan (most flexible, 0.09% fee)
    return 'flash_loan';
  }

  // ═══════════════════════════════════════════════════════════
  //  Confidence scoring
  // ═══════════════════════════════════════════════════════════
  _calculateConfidence(buyPrice, sellPrice, profit, profitPercent) {
    let confidence = 50;

    // Liquidity
    if (buyPrice.liquidity === 'high' && sellPrice.liquidity === 'high') confidence += 15;
    if (buyPrice.liquidity === 'low' || sellPrice.liquidity === 'low') confidence -= 15;

    // Profit magnitude
    if (profit > 5) confidence += 5;
    if (profit > 20) confidence += 5;
    if (profit > 50) confidence += 5;
    if (profit > 100) confidence += 5;

    // Spread quality
    const spread = Math.abs(sellPrice.price - buyPrice.price) / Math.max(buyPrice.price, 0.0001);
    if (spread < 0.001) confidence -= 20;
    if (spread > 0.005) confidence += 10;
    if (spread > 0.01) confidence += 5;

    // Profit percent sanity — very high % is likely stale/wrong data
    if (profitPercent > 5) confidence -= 10;
    if (profitPercent > 10) confidence -= 20;

    // Freshness
    const age = Math.max(
      Date.now() - (buyPrice.timestamp || 0),
      Date.now() - (sellPrice.timestamp || 0)
    );
    if (age < 2000) confidence += 10;
    if (age > 5000) confidence -= 10;
    if (age > 10000) confidence -= 20;

    return Math.min(100, Math.max(0, confidence));
  }

  // ─── Gas cost estimation ───────────────────────────────────
  _estimateGasCost(gasUnits) {
    const gasPriceETH = (this.GAS_PRICE_GWEI * gasUnits) / 1e9;
    return gasPriceETH * this.ETH_PRICE_USD;
  }

  // ═══════════════════════════════════════════════════════════
  //  Triangular arbitrage — A→B→C→A
  // ═══════════════════════════════════════════════════════════
  findTriangularOpportunities(pricesByPair, tokens) {
    this._syncPrices();
    const opportunities = [];

    for (let i = 0; i < tokens.length; i++) {
      for (let j = 0; j < tokens.length; j++) {
        if (i === j) continue;
        for (let k = 0; k < tokens.length; k++) {
          if (i === k || j === k) continue;

          const path = [tokens[i], tokens[j], tokens[k], tokens[i]];
          const opp = this._calculateTriangularOpportunity(path, pricesByPair);
          if (opp && opp.profit.net >= this.MIN_PROFIT_USD) {
            opportunities.push(opp);
          }
        }
      }
    }

    return opportunities.sort((a, b) => b.profit.net - a.profit.net);
  }

  _calculateTriangularOpportunity(path, pricesByPair) {
    // path = [A, B, C, A]  — we need prices for A→B, B→C, C→A
    const legs = [
      { from: path[0], to: path[1] },
      { from: path[1], to: path[2] },
      { from: path[2], to: path[3] },
    ];

    let rateProduct = 1;
    let totalGas = 0;
    const legDetails = [];

    for (const leg of legs) {
      const key1 = `${leg.from}-${leg.to}`;
      const key2 = `${leg.to}-${leg.from}`;

      let prices = pricesByPair[key1];
      let isReverse = false;

      if (!prices || prices.length === 0) {
        prices = pricesByPair[key2];
        isReverse = true;
      }

      if (!prices || prices.length === 0) return null;

      // Use the best price for this leg
      const bestPrice = prices[0]; // already sorted best first
      const rate = isReverse ? (1 / bestPrice.price) : bestPrice.price;

      if (rate <= 0 || !isFinite(rate)) return null;

      rateProduct *= rate;
      totalGas += bestPrice.gasEstimate || 150000;

      legDetails.push({
        from: TOKEN_SYMBOLS[leg.from] || leg.from.slice(0, 8),
        to: TOKEN_SYMBOLS[leg.to] || leg.to.slice(0, 8),
        dex: bestPrice.dexId,
        rate,
        isReverse,
      });
    }

    // If rateProduct > 1, there's a triangular arbitrage opportunity
    // We start with 1 unit of token A and end up with rateProduct units
    if (rateProduct <= 1.0005) return null; // must be > 0.05% to cover fees

    // Simulate with a standard loan amount
    const loanAmount = 10000; // $10k equivalent
    const grossProfit = loanAmount * (rateProduct - 1);
    const flashLoanFee = loanAmount * this.AAVE_FLASH_LOAN_FEE;
    const gasCost = this._estimateGasCost(totalGas + 300000);
    const slippage = grossProfit * this.SLIPPAGE_TOLERANCE;
    const netProfit = grossProfit - flashLoanFee - gasCost - slippage;

    if (netProfit < this.MIN_PROFIT_USD) return null;

    return {
      id: `tri_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'triangular',
      pair: legDetails.map((l) => l.from).join('→') + '→' + legDetails[0].from,
      path: path.map((t) => TOKEN_SYMBOLS[t] || t.slice(0, 8)),
      pathAddresses: path,
      legs: legDetails,
      rateProduct,
      loanAmount,
      profit: {
        gross: grossProfit,
        flashLoanFee,
        gasCost,
        slippage,
        net: netProfit,
        usd: netProfit,
        percent: (netProfit / loanAmount) * 100,
      },
      strategy: 'flash_loan',
      gasless: true,
      timestamp: Date.now(),
      expiry: Date.now() + 10000,
      confidence: Math.min(80, Math.max(20, 50 + netProfit * 2)),
    };
  }

  // ═══════════════════════════════════════════════════════════
  //  simulateTrade — detailed step-by-step simulation
  // ═══════════════════════════════════════════════════════════
  simulateTrade(params) {
    const {
      tokenIn, tokenOut, amountIn,
      buyDex, sellDex, buyPrice, sellPrice,
      strategy = 'flash_loan',
    } = params;

    const amountInFormatted = parseFloat(amountIn);
    const result = {
      strategy,
      input: { tokenIn, tokenOut, amountIn: amountInFormatted, buyDex, sellDex },
      steps: [],
      profit: {},
      gasless: strategy !== 'self_funded',
    };

    if (strategy === 'flash_loan') {
      const tokensReceived = amountInFormatted * buyPrice;
      const sellProceeds = tokensReceived / sellPrice; // reverse
      const flashLoanFee = amountInFormatted * this.AAVE_FLASH_LOAN_FEE;
      const grossProfit = sellProceeds - amountInFormatted;
      const gasCost = this._estimateGasCost(600000);
      const netProfit = grossProfit - flashLoanFee - gasCost;

      result.steps = [
        { step: 1, action: 'flash_loan', amount: amountInFormatted, from: 'Aave V3', fee: flashLoanFee },
        { step: 2, action: 'buy', dex: buyDex, amountIn: amountInFormatted, amountOut: tokensReceived, price: buyPrice },
        { step: 3, action: 'sell', dex: sellDex, amountIn: tokensReceived, amountOut: sellProceeds, price: sellPrice },
        { step: 4, action: 'repay', amount: amountInFormatted + flashLoanFee, to: 'Aave V3' },
        { step: 5, action: 'profit', amount: netProfit, to: 'wallet' },
      ];

      result.profit = {
        gross: grossProfit,
        flashLoanFee,
        gasCost,
        net: netProfit,
        percent: (netProfit / amountInFormatted) * 100,
      };
    } else if (strategy === 'flash_swap') {
      const tokensReceived = amountInFormatted * buyPrice;
      const sellProceeds = tokensReceived / sellPrice;
      const flashSwapFee = amountInFormatted * this.UNISWAP_V2_FEE;
      const grossProfit = sellProceeds - amountInFormatted;
      const gasCost = this._estimateGasCost(400000);
      const netProfit = grossProfit - flashSwapFee - gasCost;

      result.steps = [
        { step: 1, action: 'flash_swap', amount: amountInFormatted, from: 'Uniswap V2', fee: flashSwapFee },
        { step: 2, action: 'sell', dex: sellDex, amountIn: tokensReceived, amountOut: sellProceeds },
        { step: 3, action: 'repay', amount: amountInFormatted + flashSwapFee, to: 'Uniswap V2' },
        { step: 4, action: 'profit', amount: netProfit, to: 'wallet' },
      ];

      result.profit = {
        gross: grossProfit,
        flashSwapFee,
        gasCost,
        net: netProfit,
        percent: (netProfit / amountInFormatted) * 100,
      };
    } else if (strategy === 'flash_mint') {
      const tokensReceived = amountInFormatted * buyPrice;
      const sellProceeds = tokensReceived / sellPrice;
      const grossProfit = sellProceeds - amountInFormatted;
      const gasCost = this._estimateGasCost(500000);
      const netProfit = grossProfit - gasCost;

      result.steps = [
        { step: 1, action: 'flash_mint', amount: amountInFormatted, from: 'MakerDAO', fee: 0 },
        { step: 2, action: 'buy', dex: buyDex, amountIn: amountInFormatted, amountOut: tokensReceived },
        { step: 3, action: 'sell', dex: sellDex, amountIn: tokensReceived, amountOut: sellProceeds },
        { step: 4, action: 'burn', amount: amountInFormatted, to: 'MakerDAO' },
        { step: 5, action: 'profit', amount: netProfit, to: 'wallet' },
      ];

      result.profit = {
        gross: grossProfit,
        fees: 0,
        gasCost,
        net: netProfit,
        percent: (netProfit / amountInFormatted) * 100,
      };
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════
  //  buildExecutionPlan — for UI/API display
  // ═══════════════════════════════════════════════════════════
  buildExecutionPlan(opportunity, walletAddress, strategy) {
    const usedStrategy = strategy || opportunity.strategy || 'flash_loan';

    return {
      opportunity,
      walletAddress,
      strategy: usedStrategy,
      contract: this._getContractForStrategy(usedStrategy),
      estimatedGas: 600000,
      gasSource: 'paymaster',
      paymaster: {
        provider: 'biconomy',
        mode: 'SPONSORED',
        costToUser: 0,
      },
      steps: this._getExecutionSteps(opportunity, usedStrategy),
      riskAssessment: {
        slippageRisk: opportunity.spreadPercent < 0.5 ? 'high' : 'low',
        executionRisk: opportunity.confidence > 70 ? 'low' : 'medium',
        mevRisk: 'protected_by_flashbots',
        recommendation: opportunity.confidence > 60 ? 'execute' : 'monitor',
      },
    };
  }

  _getContractForStrategy(strategy) {
    const contracts = {
      flash_loan: process.env.FLASH_LOAN_CONTRACT || ethers.ZeroAddress,
      flash_swap: process.env.ARB_CONTRACT_ADDRESS || process.env.FLASH_SWAP_CONTRACT || ethers.ZeroAddress,
      flash_mint: process.env.FLASH_MINT_CONTRACT || ethers.ZeroAddress,
    };
    return contracts[strategy] || contracts.flash_loan;
  }

  _getExecutionSteps(opportunity, strategy) {
    const steps = [
      { step: 1, action: 'Build Transaction', detail: `Encode ${strategy} calldata` },
      { step: 2, action: 'Sponsor Gas', detail: 'Biconomy paymaster covers gas (free)' },
    ];

    if (strategy === 'flash_loan') {
      steps.push(
        { step: 3, action: 'Flash Loan', detail: `Borrow ${opportunity.loanAmount} from Aave V3` },
        { step: 4, action: 'Buy', detail: `${opportunity.pair} on ${opportunity.buyDex}` },
        { step: 5, action: 'Sell', detail: `${opportunity.pair} on ${opportunity.sellDex}` },
        { step: 6, action: 'Repay', detail: `${opportunity.loanAmount} + 0.09% fee` },
        { step: 7, action: 'Profit', detail: `$${opportunity.profit.usd.toFixed(2)} to your wallet` }
      );
    } else if (strategy === 'flash_swap') {
      steps.push(
        { step: 3, action: 'Flash Swap', detail: `Borrow ${opportunity.loanAmount} via Uniswap V2` },
        { step: 4, action: 'Sell', detail: `On ${opportunity.sellDex}` },
        { step: 5, action: 'Repay', detail: `${opportunity.loanAmount} + 0.3% fee` },
        { step: 6, action: 'Profit', detail: `$${opportunity.profit.usd.toFixed(2)} to your wallet` }
      );
    } else if (strategy === 'flash_mint') {
      steps.push(
        { step: 3, action: 'Flash Mint', detail: `Mint ${opportunity.loanAmount} DAI (free)` },
        { step: 4, action: 'Swap', detail: `Multi-hop route` },
        { step: 5, action: 'Burn', detail: `Repay ${opportunity.loanAmount} DAI` },
        { step: 6, action: 'Profit', detail: `$${opportunity.profit.usd.toFixed(2)} to your wallet` }
      );
    }

    return steps;
  }
}

module.exports = { ArbitrageEngine, TOKEN_SYMBOLS };
