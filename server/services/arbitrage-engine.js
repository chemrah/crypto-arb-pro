const { ethers } = require('ethers');

class ArbitrageEngine {
  constructor() {
    this.AAVE_FLASH_LOAN_FEE = 0.0009;
    this.MAKER_FLASH_MINT_FEE = 0;
    this.UNISWAP_V2_FEE = 0.003;
    this.UNISWAP_V3_FEES = [0.0005, 0.003, 0.01];
    this.GAS_PRICE_GWEI = 0.1;
    this.ETH_PRICE_USD = 3000;
  }

  findOpportunities(prices, tokenIn, tokenOut, loanAmount) {
    const opportunities = [];

    for (let i = 0; i < prices.length; i++) {
      for (let j = 0; j < prices.length; j++) {
        if (i === j) continue;

        const buyPrice = prices[i];
        const sellPrice = prices[j];

        if (sellPrice.price > buyPrice.price) {
          const opportunity = this._calculateOpportunity(
            buyPrice,
            sellPrice,
            tokenIn,
            tokenOut,
            loanAmount
          );

          if (opportunity && opportunity.profit.usd > 0) {
            opportunities.push(opportunity);
          }
        }
      }
    }

    return opportunities.sort((a, b) => b.profit.usd - a.profit.usd);
  }

  _calculateOpportunity(buyPrice, sellPrice, tokenIn, tokenOut, loanAmount) {
    const loanAmountFormatted = parseFloat(ethers.formatUnits(loanAmount, 18));

    const tokensReceived = loanAmountFormatted * buyPrice.price;
    const sellProceeds = tokensReceived * sellPrice.price;

    const flashLoanFee = loanAmountFormatted * this.AAVE_FLASH_LOAN_FEE;
    const buyFee = loanAmountFormatted * (buyPrice.fee || 0.003);
    const sellFee = tokensReceived * sellPrice.price * (sellPrice.fee || 0.003);

    const gasCostUSD = this._estimateGasCost(
      buyPrice.gasEstimate + sellPrice.gasEstimate + 300000
    );

    const grossProfit = sellProceeds - loanAmountFormatted;
    const totalFees = flashLoanFee + buyFee + sellFee;
    const netProfit = grossProfit - totalFees - gasCostUSD;

    const profitPercent = (netProfit / loanAmountFormatted) * 100;

    if (netProfit <= 0) return null;

    return {
      id: `arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pair: `${TOKEN_SYMBOLS[tokenIn] || '???'}/${TOKEN_SYMBOLS[tokenOut] || '???'}`,
      tokenIn,
      tokenOut,
      buyDex: buyPrice.dexId,
      sellDex: sellPrice.dexId,
      buyPrice: buyPrice.price,
      sellPrice: sellPrice.price,
      spread: sellPrice.price - buyPrice.price,
      spreadPercent: ((sellPrice.price - buyPrice.price) / buyPrice.price) * 100,
      loanAmount: loanAmountFormatted,
      tokensReceived,
      sellProceeds,
      profit: {
        gross: grossProfit,
        flashLoanFee,
        dexFees: buyFee + sellFee,
        gasCost: gasCostUSD,
        net: netProfit,
        usd: netProfit,
        percent: profitPercent,
      },
      strategy: this._determineStrategy(buyPrice, sellPrice),
      gasless: true,
      timestamp: Date.now(),
      expiry: Date.now() + 15000,
      confidence: this._calculateConfidence(buyPrice, sellPrice, netProfit),
    };
  }

  _determineStrategy(buyPrice, sellPrice) {
    if (buyPrice.dexId.includes('uniswap') && sellPrice.dexId.includes('sushi')) {
      return 'dex_dex';
    }
    if (buyPrice.dexId.includes('curve')) {
      return 'stablecoin_arb';
    }
    if (buyPrice.tokenIn === buyPrice.tokenOut) {
      return 'triangular';
    }
    return 'simple_arb';
  }

  _calculateConfidence(buyPrice, sellPrice, profit) {
    let confidence = 50;

    if (buyPrice.liquidity === 'high' && sellPrice.liquidity === 'high') confidence += 20;
    if (profit > 10) confidence += 10;
    if (profit > 50) confidence += 10;

    const spread = Math.abs(sellPrice.price - buyPrice.price) / buyPrice.price;
    if (spread < 0.001) confidence -= 20;
    if (spread > 0.01) confidence += 10;

    return Math.min(100, Math.max(0, confidence));
  }

  _estimateGasCost(gasUnits) {
    const gasPriceETH = (this.GAS_PRICE_GWEI * gasUnits) / 1e9;
    return gasPriceETH * this.ETH_PRICE_USD;
  }

  simulateTrade(params) {
    const {
      tokenIn,
      tokenOut,
      amountIn,
      buyDex,
      sellDex,
      buyPrice,
      sellPrice,
      strategy = 'flash_loan',
    } = params;

    const amountInFormatted = parseFloat(amountIn);

    let result = {
      strategy,
      input: {
        tokenIn,
        tokenOut,
        amountIn: amountInFormatted,
        buyDex,
        sellDex,
      },
      steps: [],
      profit: {},
      gasless: strategy !== 'self_funded',
    };

    if (strategy === 'flash_loan') {
      const tokensReceived = amountInFormatted * buyPrice;
      const sellProceeds = tokensReceived * sellPrice;
      const flashLoanFee = amountInFormatted * this.AAVE_FLASH_LOAN_FEE;
      const grossProfit = sellProceeds - amountInFormatted;
      const netProfit = grossProfit - flashLoanFee;

      result.steps = [
        { action: 'flash_loan', amount: amountInFormatted, from: 'Aave V3', fee: flashLoanFee },
        { action: 'buy', dex: buyDex, amountIn: amountInFormatted, amountOut: tokensReceived, price: buyPrice },
        { action: 'sell', dex: sellDex, amountIn: tokensReceived, amountOut: sellProceeds, price: sellPrice },
        { action: 'repay', amount: amountInFormatted + flashLoanFee, to: 'Aave V3' },
        { action: 'profit', amount: netProfit, to: 'wallet' },
      ];

      result.profit = {
        gross: grossProfit,
        fees: flashLoanFee,
        net: netProfit,
        percent: (netProfit / amountInFormatted) * 100,
      };
    } else if (strategy === 'flash_swap') {
      const tokensReceived = amountInFormatted * buyPrice;
      const sellProceeds = tokensReceived * sellPrice;
      const flashSwapFee = amountInFormatted * 0.003;
      const grossProfit = sellProceeds - amountInFormatted;
      const netProfit = grossProfit - flashSwapFee;

      result.steps = [
        { action: 'flash_swap', amount: amountInFormatted, from: 'Uniswap V2', fee: flashSwapFee },
        { action: 'sell', dex: sellDex, amountIn: tokensReceived, amountOut: sellProceeds, price: sellPrice },
        { action: 'repay', amount: amountInFormatted + flashSwapFee, to: 'Uniswap V2' },
        { action: 'profit', amount: netProfit, to: 'wallet' },
      ];

      result.profit = {
        gross: grossProfit,
        fees: flashSwapFee,
        net: netProfit,
        percent: (netProfit / amountInFormatted) * 100,
      };
    } else if (strategy === 'flash_mint') {
      const tokensReceived = amountInFormatted * buyPrice;
      const sellProceeds = tokensReceived * sellPrice;
      const grossProfit = sellProceeds - amountInFormatted;

      result.steps = [
        { action: 'flash_mint', amount: amountInFormatted, from: 'MakerDAO', fee: 0 },
        { action: 'buy', dex: buyDex, amountIn: amountInFormatted, amountOut: tokensReceived, price: buyPrice },
        { action: 'sell', dex: sellDex, amountIn: tokensReceived, amountOut: sellProceeds, price: sellPrice },
        { action: 'burn', amount: amountInFormatted, to: 'MakerDAO' },
        { action: 'profit', amount: grossProfit, to: 'wallet' },
      ];

      result.profit = {
        gross: grossProfit,
        fees: 0,
        net: grossProfit,
        percent: (grossProfit / amountInFormatted) * 100,
      };
    }

    return result;
  }

  buildExecutionPlan(opportunity, walletAddress, strategy = 'flash_loan') {
    return {
      opportunity,
      walletAddress,
      strategy,
      contract: this._getContractForStrategy(strategy),
      calldata: this._buildCalldata(opportunity, strategy),
      estimatedGas: 0,
      gasSource: 'paymaster',
      paymaster: {
        provider: 'biconomy',
        mode: 'SPONSORED',
        costToUser: 0,
      },
      steps: this._getExecutionSteps(opportunity, strategy),
      riskAssessment: {
        slippageRisk: opportunity.spreadPercent < 0.5 ? 'high' : 'low',
        executionRisk: 'low',
        mevRisk: 'medium',
        recommendation: opportunity.confidence > 70 ? 'execute' : 'monitor',
      },
    };
  }

  _getContractForStrategy(strategy) {
    const contracts = {
      flash_loan: process.env.FLASH_LOAN_CONTRACT || '0x0000000000000000000000000000000000000000',
      flash_swap: process.env.FLASH_SWAP_CONTRACT || '0x0000000000000000000000000000000000000000',
      flash_mint: process.env.FLASH_MINT_CONTRACT || '0x0000000000000000000000000000000000000000',
    };
    return contracts[strategy] || contracts.flash_loan;
  }

  _buildCalldata(opportunity, strategy) {
    return {
      function: 'executeArbitrage',
      params: {
        asset: opportunity.tokenIn,
        amount: ethers.parseUnits(opportunity.loanAmount.toString(), 18).toString(),
        buyRouter: opportunity.buyDex,
        sellRouter: opportunity.sellDex,
        minProfit: ethers.parseUnits((opportunity.profit.net * 0.9).toString(), 18).toString(),
      },
    };
  }

  _getExecutionSteps(opportunity, strategy) {
    return [
      { step: 1, action: 'طلب Flash Loan', detail: `${opportunity.loanAmount} من Aave V3` },
      { step: 2, action: 'شراء', detail: `${opportunity.pair} من ${opportunity.buyDex}` },
      { step: 3, action: 'بيع', detail: `${opportunity.pair} على ${opportunity.sellDex}` },
      { step: 4, action: 'سداد القرض', detail: `${opportunity.loanAmount} + الرسوم` },
      { step: 5, action: 'تحويل الربح', detail: `$${opportunity.profit.usd.toFixed(2)} إلى محفظتك` },
    ];
  }

  findTriangularOpportunities(prices, tokens) {
    const opportunities = [];

    for (let i = 0; i < tokens.length; i++) {
      for (let j = 0; j < tokens.length; j++) {
        for (let k = 0; k < tokens.length; k++) {
          if (i === j || j === k || i === k) continue;

          const path = [tokens[i], tokens[j], tokens[k], tokens[i]];
          const opp = this._calculateTriangularOpportunity(path, prices);
          if (opp && opp.profit.net > 0) {
            opportunities.push(opp);
          }
        }
      }
    }

    return opportunities.sort((a, b) => b.profit.net - a.profit.net);
  }

  _calculateTriangularOpportunity(path, prices) {
    return {
      type: 'triangular',
      path,
      profit: { net: 0, gross: 0, fees: 0 },
    };
  }
}

const TOKEN_SYMBOLS = {
  '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1': 'WETH',
  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': 'USDC',
  '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8': 'USDC.e',
  '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9': 'USDT',
  '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1': 'DAI',
  '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f': 'WBTC',
  '0x912CE59144191C1204E64559FE8253a0e49E6548': 'ARB',
  '0x4200000000000000000000000000000000000006': 'WETH',
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': 'USDC',
};

module.exports = { ArbitrageEngine };
