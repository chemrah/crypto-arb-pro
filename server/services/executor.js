const { ethers } = require('ethers');
const { PaymasterService } = require('./paymaster');

class FlashbotsService {
  constructor(config) {
    this.relayUrl = config.relayUrl || process.env.FLASHBOTS_RELAY || 'https://relay.flashbots.net';
    this.provider = config.provider;
    this.signer = config.signer;
  }

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
      const body = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_sendBundle',
        params: [bundle],
      });

      const response = await fetch(this.relayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return {
        success: true,
        bundleHash: data.result?.bundleHash,
      };
    } catch (error) {
      console.error('[Flashbots] خطأ:', error.message);
      return { success: false, error: error.message };
    }
  }

  async simulateBundle(bundle) {
    try {
      const body = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_callBundle',
        params: [bundle],
      });

      const response = await fetch(this.relayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return {
        success: true,
        totalGasUsed: data.result?.totalGasUsed,
        results: data.result?.results,
        coinbaseDiff: data.result?.coinbaseDiff,
      };
    } catch (error) {
      console.error('[Flashbots Simulation] خطأ:', error.message);
      return { success: false, error: error.message };
    }
  }

  calculateBribe(profitUSD, ethPriceUSD, gasUsed) {
    const profitETH = profitUSD / ethPriceUSD;
    const gasCostETH = (gasUsed * 0.1) / 1e9;

    const availableForBribe = profitETH - gasCostETH;
    const bribePercent = 0.8;
    const bribe = availableForBribe * bribePercent;

    return {
      bribeETH: bribe,
      bribeUSD: bribe * ethPriceUSD,
      userProfitETH: availableForBribe - bribe,
      userProfitUSD: (availableForBribe - bribe) * ethPriceUSD,
      gasCostETH: gasCostETH,
      gasCostUSD: gasCostETH * ethPriceUSD,
    };
  }
}

class GaslessExecutor {
  constructor(config) {
    this.paymaster = new PaymasterService(config);
    this.flashbots = new FlashbotsService(config);
    this.provider = config.provider;
    this.signer = config.signer;
    this.contracts = config.contracts || {};
  }

  async executeArbitrage(opportunity, walletAddress, strategy = 'flash_loan') {
    console.log(`[Executor] بدء تنفيذ ${strategy} لـ ${opportunity.pair}`);

    const contractAddress = this._getContractAddress(strategy);
    const calldata = this._buildCalldata(opportunity, strategy);

    const userOp = await this.paymaster.buildUserOp(
      walletAddress,
      contractAddress,
      calldata
    );

    const gasEstimate = await this.paymaster.estimateGas(userOp);
    if (!gasEstimate) {
      return { success: false, error: 'فشل تقدير الغاز' };
    }

    const costBreakdown = this.paymaster.getCostBreakdown(gasEstimate);
    console.log('[Executor] تكلفة الغاز:', costBreakdown);

    const signature = await this.signer.signMessage(
      ethers.getBytes(ethers.keccak256(userOp.callData))
    );

    const result = await this.paymaster.submitUserOp(userOp, signature);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    console.log('[Executor] UserOp مرسل:', result.userOpHash);

    const receipt = await this.paymaster.waitForUserOp(result.userOpHash);

    return {
      success: receipt.success,
      userOpHash: result.userOpHash,
      transactionHash: receipt.transactionHash,
      gasUsed: receipt.gasUsed,
      gasCost: costBreakdown,
      profit: opportunity.profit,
    };
  }

  async executeWithFlashbots(opportunity, walletAddress) {
    const currentBlock = await this.provider.getBlockNumber();
    const targetBlock = currentBlock + 1;

    const flashLoanTx = await this._buildFlashLoanTx(opportunity);
    const arbTx = await this._buildArbTx(opportunity);

    const bundle = await this.flashbots.buildBundle(
      [flashLoanTx, arbTx],
      targetBlock
    );

    const simulation = await this.flashbots.simulateBundle(bundle);

    if (!simulation.success) {
      return { success: false, error: 'فشلت المحاكاة: ' + simulation.error };
    }

    const bribe = this.flashbots.calculateBribe(
      opportunity.profit.usd,
      3000,
      simulation.totalGasUsed
    );

    console.log('[Flashbots] الربح بعد العمولة:', bribe);

    if (bribe.userProfitUSD <= 0) {
      return { success: false, error: 'الربح لا يغطي التكاليف' };
    }

    const result = await this.flashbots.sendBundle(bundle);

    return {
      ...result,
      bribe,
      simulation,
    };
  }

  _getContractAddress(strategy) {
    const addresses = {
      flash_loan: this.contracts.flashLoan || process.env.FLASH_LOAN_CONTRACT,
      flash_swap: this.contracts.flashSwap || process.env.FLASH_SWAP_CONTRACT,
      flash_mint: this.contracts.flashMint || process.env.FLASH_MINT_CONTRACT,
    };
    return addresses[strategy] || addresses.flash_loan;
  }

  _buildCalldata(opportunity, strategy) {
    const iface = new ethers.Interface([
      'function executeArbitrage(address asset, uint256 amount, (address router, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, bytes extraData)[] swaps, address profitToken, uint256 minProfit)',
    ]);

    return iface.encodeFunctionData('executeArbitrage', [
      opportunity.tokenIn,
      ethers.parseUnits(opportunity.loanAmount.toString(), 18),
      [],
      opportunity.tokenIn,
      ethers.parseUnits((opportunity.profit.net * 0.9).toString(), 18),
    ]);
  }

  async _buildFlashLoanTx(opportunity) {
    return {
      to: this._getContractAddress('flash_loan'),
      data: this._buildCalldata(opportunity, 'flash_loan'),
      gasLimit: 500000,
      maxFeePerGas: ethers.parseUnits('0.1', 'gwei'),
      maxPriorityFeePerGas: ethers.parseUnits('0.1', 'gwei'),
      type: 2,
      chainId: 42161,
    };
  }

  async _buildArbTx(opportunity) {
    return {
      to: this._getContractAddress('flash_loan'),
      data: '0x',
      gasLimit: 300000,
      maxFeePerGas: ethers.parseUnits('0.1', 'gwei'),
      maxPriorityFeePerGas: ethers.parseUnits('0.1', 'gwei'),
      type: 2,
      chainId: 42161,
    };
  }
}

module.exports = { FlashbotsService, GaslessExecutor };
