const { ethers } = require('ethers');
const { PaymasterService } = require('./paymaster');
const { ABIS, DEX_CONFIG, TOKEN_LIST } = require('../dex/abis');

// ═══════════════════════════════════════════════════════════════
//  Contract ABI fragments (matching Solidity structs exactly)
// ═══════════════════════════════════════════════════════════════

const FLASH_LOAN_ABI = [
  // SwapParams = (address router, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, bytes extraData)
  // ArbRoute   = (SwapParams[] swaps, address profitToken, uint256 minProfit)
  'function executeArbitrage(address asset, uint256 amount, (((address router, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, bytes extraData)[] swaps, address profitToken, uint256 minProfit)) route)',
];

const FLASH_SWAP_ABI = [
  'function initiateFlashSwap(address pair, address tokenBorrow, uint256 amountBorrow, bytes callbackData)',
];

const FLASH_MINT_ABI = [
  // FlashMintRoute = (address[] routers, address[][] paths, uint256[] minAmountsOut, uint256 minProfit)
  'function executeFlashMintArb(uint256 amount, ((address[] routers, address[][] paths, uint256[] minAmountsOut, uint256 minProfit)) route)',
];

// ═══════════════════════════════════════════════════════════════
//  Flashbots Service — MEV protection via private TX relay
// ═══════════════════════════════════════════════════════════════

class FlashbotsService {
  constructor(config = {}) {
    this.relayUrl = config.relayUrl || process.env.FLASHBOTS_RELAY || 'https://relay.flashbots.net';
    this.provider = config.provider;
    this.signer = config.signer;
  }

  setProvider(provider) { this.provider = provider; }
  setSigner(signer) { this.signer = signer; }

  async buildBundle(transactions, targetBlock) {
    const signedTxs = [];
    for (const tx of transactions) {
      const signedTx = await this.signer.signTransaction(tx);
      signedTxs.push(signedTx);
    }

    return {
      txs: signedTxs.map((tx) => ethers.hexlify(tx)),
      blockNumber: ethers.toQuantity(targetBlock),
      minTimestamp: 0,
      maxTimestamp: Math.floor(Date.now() / 1000) + 120,
    };
  }

  async sendBundle(bundle) {
    try {
      const response = await fetch(this.relayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_sendBundle',
          params: [bundle],
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      return { success: true, bundleHash: data.result?.bundleHash };
    } catch (error) {
      console.error('[Flashbots] Send error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async simulateBundle(bundle) {
    try {
      const response = await fetch(this.relayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_callBundle',
          params: [bundle],
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      return {
        success: true,
        totalGasUsed: data.result?.totalGasUsed,
        results: data.result?.results,
        coinbaseDiff: data.result?.coinbaseDiff,
      };
    } catch (error) {
      console.error('[Flashbots Sim] Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  calculateBribe(profitUSD, ethPriceUSD, gasUsed) {
    const profitETH = profitUSD / ethPriceUSD;
    const gasCostETH = (gasUsed * 0.1) / 1e9;
    const availableForBribe = profitETH - gasCostETH;
    const bribePercent = 0.8;
    const bribe = Math.max(0, availableForBribe * bribePercent);

    return {
      bribeETH: bribe,
      bribeUSD: bribe * ethPriceUSD,
      userProfitETH: Math.max(0, availableForBribe - bribe),
      userProfitUSD: Math.max(0, (availableForBribe - bribe) * ethPriceUSD),
      gasCostETH,
      gasCostUSD: gasCostETH * ethPriceUSD,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
//  GaslessExecutor — real transaction building & submission
// ═══════════════════════════════════════════════════════════════

class GaslessExecutor {
  constructor(config = {}) {
    this.provider = config.provider || null;
    this.signer = config.signer || null;
    this.contracts = config.contracts || {};
    this.priceFeed = config.priceFeed || null;

    this.paymaster = new PaymasterService({
      biconomyApiKey: config.biconomyApiKey,
      bundlerUrl: config.bundlerUrl,
      paymasterUrl: config.paymasterUrl,
      chainId: config.chainId,
      provider: this.provider,
    });

    this.flashbots = new FlashbotsService({
      relayUrl: config.flashbotsRelay,
      provider: this.provider,
      signer: this.signer,
    });

    this.chainId = config.chainId || 42161;
  }

  setProvider(provider) {
    this.provider = provider;
    this.paymaster.setProvider(provider);
    this.flashbots.setProvider(provider);
  }

  setSigner(signer) {
    this.signer = signer;
    this.flashbots.setSigner(signer);
  }

  setChainId(chainId) {
    this.chainId = chainId;
    this.paymaster.setChainId(chainId);
  }

  // ═══════════════════════════════════════════════════════════
  //  executeArbitrage — gasless via Biconomy paymaster
  // ═══════════════════════════════════════════════════════════
  async executeArbitrage(opportunity, walletAddress, strategy = 'flash_loan') {
    console.log(`[Executor] Starting ${strategy} execution for ${opportunity.pair}`);
    const startTime = Date.now();

    try {
      // 1. Build calldata for the target contract
      const contractAddress = this._getContractAddress(strategy);
      const calldata = this._buildCalldata(opportunity, strategy);

      console.log('[Executor] Contract:', contractAddress);
      console.log('[Executor] Calldata length:', calldata.length);

      // 2. Build UserOp with paymaster sponsorship
      const userOp = await this.paymaster.buildUserOp(
        walletAddress,
        contractAddress,
        calldata
      );

      // 3. Get the UserOp hash for signing
      const userOpHash = await this.paymaster.getUserOpHash(userOp);

      // 4. Sign the UserOp hash
      if (!this.signer) {
        return { success: false, error: 'No signer configured for server-side execution' };
      }
      const signature = await this.signer.signMessage(ethers.getBytes(userOpHash));

      // 5. Submit via bundler
      const submitResult = await this.paymaster.submitUserOp(userOp, signature);
      if (!submitResult.success) {
        // Fallback: try direct submission
        console.warn('[Executor] Paymaster failed, falling back to direct submission');
        return await this._fallbackDirectSubmit(contractAddress, calldata, opportunity);
      }

      console.log('[Executor] UserOp submitted:', submitResult.userOpHash);

      // 6. Wait for confirmation
      const receipt = await this.paymaster.waitForUserOp(submitResult.userOpHash);

      const ethPrice = this.priceFeed ? this.priceFeed.getEthPrice() : 3000;
      const gasGwei = this.priceFeed ? this.priceFeed.getGasPrice() : 0.1;

      return {
        success: receipt.success,
        userOpHash: submitResult.userOpHash,
        transactionHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed,
        gasCost: {
          paidBy: 'Biconomy Paymaster',
          costToUser: 0,
        },
        profit: opportunity.profit,
        strategy,
        pair: opportunity.pair,
        executionTime: Date.now() - startTime,
        revertReason: receipt.revertReason,
      };
    } catch (error) {
      console.error('[Executor] Execution failed:', error.message);
      return {
        success: false,
        error: error.message,
        strategy,
        pair: opportunity.pair,
        executionTime: Date.now() - startTime,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  simulateExecution — eth_call dry-run, no submission
  // ═══════════════════════════════════════════════════════════
  async simulateExecution(opportunity, strategy = 'flash_loan') {
    console.log(`[Executor] Simulating ${strategy} for ${opportunity.pair}`);

    try {
      const contractAddress = this._getContractAddress(strategy);
      const calldata = this._buildCalldata(opportunity, strategy);

      if (!this.provider) {
        return { success: false, error: 'No provider configured' };
      }

      // eth_call simulation
      const result = await this.provider.call({
        to: contractAddress,
        data: calldata,
        // from: operator address if needed
      });

      return {
        success: true,
        result,
        strategy,
        pair: opportunity.pair,
        contractAddress,
        calldataLength: calldata.length,
        estimatedProfit: opportunity.profit,
      };
    } catch (error) {
      // Parse revert reason
      let revertReason = error.message;
      if (error.data) {
        try {
          revertReason = ethers.toUtf8String('0x' + error.data.slice(138));
        } catch {
          revertReason = error.data;
        }
      }

      return {
        success: false,
        reverted: true,
        revertReason,
        strategy,
        pair: opportunity.pair,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  executeDirectly — user has their own gas, no paymaster
  // ═══════════════════════════════════════════════════════════
  async executeDirectly(opportunity, strategy = 'flash_loan', useFlashbots = false) {
    console.log(`[Executor] Direct execution ${strategy} for ${opportunity.pair}`);

    try {
      const contractAddress = this._getContractAddress(strategy);
      const calldata = this._buildCalldata(opportunity, strategy);

      if (!this.signer) {
        return { success: false, error: 'No signer configured' };
      }

      const tx = {
        to: contractAddress,
        data: calldata,
        gasLimit: 800_000,
        type: 2,
        chainId: this.chainId,
      };

      // Populate gas prices
      const feeData = await this.provider.getFeeData();
      tx.maxFeePerGas = feeData.maxFeePerGas;
      tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || feeData.maxFeePerGas;

      if (useFlashbots && this.flashbots) {
        // Submit via Flashbots private relay
        const currentBlock = await this.provider.getBlockNumber();
        const bundle = await this.flashbots.buildBundle([tx], currentBlock + 1);

        const simulation = await this.flashbots.simulateBundle(bundle);
        if (!simulation.success) {
          return { success: false, error: 'Flashbots simulation failed: ' + simulation.error };
        }

        const result = await this.flashbots.sendBundle(bundle);
        return {
          success: result.success,
          bundleHash: result.bundleHash,
          simulation,
          strategy,
          pair: opportunity.pair,
        };
      }

      // Standard submission
      const txResponse = await this.signer.sendTransaction(tx);
      console.log('[Executor] TX sent:', txResponse.hash);

      const receipt = await txResponse.wait();

      return {
        success: receipt.status === 1,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: receipt.gasPrice?.toString(),
        blockNumber: receipt.blockNumber,
        strategy,
        pair: opportunity.pair,
        profit: opportunity.profit,
      };
    } catch (error) {
      console.error('[Executor] Direct execution failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  Calldata builders — real ABI encoding per strategy
  // ═══════════════════════════════════════════════════════════

  _buildCalldata(opportunity, strategy) {
    switch (strategy) {
      case 'flash_loan':
        return this._buildFlashLoanCalldata(opportunity);
      case 'flash_swap':
        return this._buildFlashSwapCalldata(opportunity);
      case 'flash_mint':
        return this._buildFlashMintCalldata(opportunity);
      default:
        return this._buildFlashLoanCalldata(opportunity);
    }
  }

  /**
   * FlashLoanArbitrage.executeArbitrage(address asset, uint256 amount, ArbRoute route)
   * ArbRoute = { SwapParams[] swaps, address profitToken, uint256 minProfit }
   * SwapParams = { address router, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, bytes extraData }
   */
  _buildFlashLoanCalldata(opportunity) {
    const iface = new ethers.Interface(FLASH_LOAN_ABI);

    const asset = opportunity.tokenIn;
    const tokenInDecimals = TOKEN_LIST[asset]?.decimals || 18;
    const tokenOutDecimals = TOKEN_LIST[opportunity.tokenOut]?.decimals || 18;
    const amount = ethers.parseUnits(opportunity.loanAmount.toString(), tokenInDecimals);

    // Build swap params
    const swaps = this._buildSwapParams(opportunity, amount, tokenInDecimals, tokenOutDecimals);

    // Min profit with slippage buffer (10% less than expected)
    const minProfitRaw = Math.max(0, opportunity.profit.net * 0.9);
    const minProfit = ethers.parseUnits(minProfitRaw.toFixed(tokenInDecimals), tokenInDecimals);

    const route = {
      swaps,
      profitToken: asset,
      minProfit,
    };

    return iface.encodeFunctionData('executeArbitrage', [asset, amount, route]);
  }

  /**
   * FlashSwapArbitrage.initiateFlashSwap(address pair, address tokenBorrow, uint256 amountBorrow, bytes callbackData)
   */
  _buildFlashSwapCalldata(opportunity) {
    const iface = new ethers.Interface(FLASH_SWAP_ABI);

    const tokenBorrow = opportunity.tokenIn;
    const tokenInDecimals = TOKEN_LIST[tokenBorrow]?.decimals || 18;
    const amountBorrow = ethers.parseUnits(opportunity.loanAmount.toString(), tokenInDecimals);

    // Find the pair address from buy DEX config
    const buyDex = DEX_CONFIG[opportunity.buyDex] || {};
    const pairAddress = opportunity.pairAddress || buyDex.factory || ethers.ZeroAddress;

    // Encode callback data: (address operator, address sellRouter, address unused, address[] sellPath, address[] unused, uint256 minProfit, bool isTriangular)
    const sellDex = DEX_CONFIG[opportunity.sellDex] || {};
    const sellRouter = sellDex.router || ethers.ZeroAddress;
    const minProfit = ethers.parseUnits(
      Math.max(0, opportunity.profit.net * 0.9).toFixed(tokenInDecimals),
      tokenInDecimals
    );

    const callbackData = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'address', 'address', 'address[]', 'address[]', 'uint256', 'bool'],
      [
        ethers.ZeroAddress, // operator placeholder
        sellRouter,
        sellRouter,
        [opportunity.tokenIn, opportunity.tokenOut], // path2
        [opportunity.tokenOut, opportunity.tokenIn], // path3 (back to original)
        minProfit,
        false, // isTriangular
      ]
    );

    return iface.encodeFunctionData('initiateFlashSwap', [
      pairAddress,
      tokenBorrow,
      amountBorrow,
      callbackData,
    ]);
  }

  /**
   * FlashMintArbitrage.executeFlashMintArb(uint256 amount, FlashMintRoute route)
   * FlashMintRoute = { address[] routers, address[][] paths, uint256[] minAmountsOut, uint256 minProfit }
   */
  _buildFlashMintCalldata(opportunity) {
    const iface = new ethers.Interface(FLASH_MINT_ABI);

    // Flash mint is always in DAI (18 decimals)
    const amount = ethers.parseUnits(opportunity.loanAmount.toString(), 18);

    const buyDex = DEX_CONFIG[opportunity.buyDex] || {};
    const sellDex = DEX_CONFIG[opportunity.sellDex] || {};
    const buyRouter = buyDex.router || ethers.ZeroAddress;
    const sellRouter = sellDex.router || ethers.ZeroAddress;

    // Path 1: DAI → tokenOut (buy on cheaper DEX)
    // Path 2: tokenOut → DAI (sell on expensive DEX)
    const DAI = '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1';
    const path1 = [DAI, opportunity.tokenOut];
    const path2 = [opportunity.tokenOut, DAI];

    const minProfit = ethers.parseUnits(
      Math.max(0, opportunity.profit.net * 0.9).toFixed(18),
      18
    );

    const route = {
      routers: [buyRouter, sellRouter],
      paths: [path1, path2],
      minAmountsOut: [0n, 0n], // 0 = no minimum per step (overall minProfit enforced)
      minProfit,
    };

    return iface.encodeFunctionData('executeFlashMintArb', [amount, route]);
  }

  // ─── Build swap params array for flash loan strategy ───────
  _buildSwapParams(opportunity, amount, tokenInDecimals, tokenOutDecimals) {
    const buyDex = DEX_CONFIG[opportunity.buyDex] || {};
    const sellDex = DEX_CONFIG[opportunity.sellDex] || {};

    const buyRouter = buyDex.router || ethers.ZeroAddress;
    const sellRouter = sellDex.router || ethers.ZeroAddress;

    // Slippage: 0.5% tolerance
    const slippage = 0.995;

    // Calculate expected amounts
    const amountInFormatted = parseFloat(ethers.formatUnits(amount, tokenInDecimals));
    const tokensReceived = amountInFormatted * (opportunity.buyPrice || 1);
    const minTokensReceived = tokensReceived * slippage;
    const sellProceeds = tokensReceived * (opportunity.sellPrice || 1);
    const minSellProceeds = sellProceeds * slippage;

    // Swap 1: Buy tokenOut on cheaper DEX
    const swap1ExtraData = this._encodeRouterCall(
      buyDex,
      opportunity.tokenIn,
      opportunity.tokenOut,
      amount,
      ethers.parseUnits(minTokensReceived.toFixed(tokenOutDecimals), tokenOutDecimals)
    );

    const swap1 = {
      router: buyRouter,
      tokenIn: opportunity.tokenIn,
      tokenOut: opportunity.tokenOut,
      amountIn: amount,
      minAmountOut: ethers.parseUnits(
        minTokensReceived.toFixed(tokenOutDecimals),
        tokenOutDecimals
      ),
      extraData: swap1ExtraData,
    };

    // Swap 2: Sell tokenOut back on expensive DEX
    const intermediateAmount = ethers.parseUnits(
      tokensReceived.toFixed(tokenOutDecimals),
      tokenOutDecimals
    );

    const swap2ExtraData = this._encodeRouterCall(
      sellDex,
      opportunity.tokenOut,
      opportunity.tokenIn,
      intermediateAmount,
      ethers.parseUnits(minSellProceeds.toFixed(tokenInDecimals), tokenInDecimals)
    );

    const swap2 = {
      router: sellRouter,
      tokenIn: opportunity.tokenOut,
      tokenOut: opportunity.tokenIn,
      amountIn: intermediateAmount,
      minAmountOut: ethers.parseUnits(
        minSellProceeds.toFixed(tokenInDecimals),
        tokenInDecimals
      ),
      extraData: swap2ExtraData,
    };

    return [swap1, swap2];
  }

  // ─── Encode the raw router call for extraData ──────────────
  _encodeRouterCall(dex, tokenIn, tokenOut, amountIn, minAmountOut) {
    if (!dex.router || dex.router === ethers.ZeroAddress) {
      return '0x';
    }

    if (dex.type === 'v3') {
      // Uniswap V3 exactInputSingle
      const v3Iface = new ethers.Interface(ABIS.UNISWAP_V3_ROUTER);
      return v3Iface.encodeFunctionData('exactInputSingle', [{
        tokenIn,
        tokenOut,
        fee: Math.round((dex.fee || 0.003) * 1_000_000), // e.g. 3000
        recipient: ethers.ZeroAddress, // will be overridden by the arb contract (address(this))
        deadline: Math.floor(Date.now() / 1000) + 300,
        amountIn,
        amountOutMinimum: minAmountOut,
        sqrtPriceLimitX96: 0,
      }]);
    }

    // Default: Uniswap V2 swapExactTokensForTokens
    const v2Iface = new ethers.Interface(ABIS.UNISWAP_V2_ROUTER);
    return v2Iface.encodeFunctionData('swapExactTokensForTokens', [
      amountIn,
      minAmountOut,
      [tokenIn, tokenOut],
      ethers.ZeroAddress, // recipient overridden by arb contract
      Math.floor(Date.now() / 1000) + 300,
    ]);
  }

  // ─── Contract address resolution ───────────────────────────
  _getContractAddress(strategy) {
    const addresses = {
      flash_loan: this.contracts.flashLoan || process.env.FLASH_LOAN_CONTRACT,
      flash_swap: this.contracts.flashSwap || process.env.ARB_CONTRACT_ADDRESS || process.env.FLASH_SWAP_CONTRACT,
      flash_mint: this.contracts.flashMint || process.env.FLASH_MINT_CONTRACT,
    };

    const addr = addresses[strategy] || addresses.flash_loan;
    if (!addr || addr === '0x...') {
      console.warn(`[Executor] No contract address for strategy: ${strategy}`);
    }
    return addr || ethers.ZeroAddress;
  }

  // ─── Fallback direct submission ────────────────────────────
  async _fallbackDirectSubmit(contractAddress, calldata, opportunity) {
    console.log('[Executor] Attempting direct fallback submission');

    if (!this.signer) {
      return { success: false, error: 'No signer for fallback' };
    }

    try {
      const tx = await this.signer.sendTransaction({
        to: contractAddress,
        data: calldata,
        gasLimit: 800_000,
        type: 2,
        chainId: this.chainId,
      });

      const receipt = await tx.wait();

      return {
        success: receipt.status === 1,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        fallback: true,
        profit: opportunity.profit,
      };
    } catch (error) {
      return { success: false, error: 'Fallback also failed: ' + error.message };
    }
  }
}

module.exports = { FlashbotsService, GaslessExecutor };
