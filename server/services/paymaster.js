const { ethers } = require('ethers');

class PaymasterService {
  constructor(config) {
    this.biconomyApiKey = config.biconomyApiKey || process.env.BICONOMY_API_KEY;
    this.bundlerUrl = config.bundlerUrl || process.env.BUNDLER_URL;
    this.paymasterUrl = config.paymasterUrl || process.env.BICONOMY_PAYMASTER_URL;
    this.chainId = config.chainId || 42161;
  }

  async buildUserOp(walletAddress, contractAddress, calldata) {
    const userOp = {
      sender: walletAddress,
      nonce: await this._getNonce(walletAddress),
      initCode: '0x',
      callData: this._encodeCallData(contractAddress, calldata),
      callGasLimit: ethers.toBigInt(500000),
      verificationGasLimit: ethers.toBigInt(300000),
      preVerificationGas: ethers.toBigInt(100000),
      maxFeePerGas: ethers.toBigInt(150000000),
      maxPriorityFeePerGas: ethers.toBigInt(150000000),
      paymasterAndData: '0x',
      signature: '0x',
    };

    const paymasterData = await this.getPaymasterData(userOp);
    userOp.paymasterAndData = paymasterData;

    return userOp;
  }

  async getPaymasterData(userOp) {
    if (!this.paymasterUrl) {
      console.warn('[Paymaster] لا يوجد URL - سيتم استخدام الغاز العادي');
      return '0x';
    }

    try {
      const response = await fetch(this.paymasterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.biconomyApiKey,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'pm_sponsorUserOperation',
          params: [
            {
              sender: userOp.sender,
              nonce: userOp.nonce.toString(),
              initCode: userOp.initCode,
              callData: userOp.callData,
              callGasLimit: userOp.callGasLimit.toString(),
              verificationGasLimit: userOp.verificationGasLimit.toString(),
              preVerificationGas: userOp.preVerificationGas.toString(),
              maxFeePerGas: userOp.maxFeePerGas.toString(),
              maxPriorityFeePerGas: userOp.maxPriorityFeePerGas.toString(),
            },
            {
              mode: 'SPONSORED',
              calculateGasLimits: true,
              expiryDuration: 300,
              sponsorshipInfo: {
                webHookData: {},
              },
            },
          ],
        }),
      });

      const data = await response.json();

      if (data.result) {
        return data.result.paymasterAndData;
      }

      throw new Error(data.error?.message || 'Paymaster error');
    } catch (error) {
      console.error('[Paymaster] خطأ:', error.message);
      return '0x';
    }
  }

  async submitUserOp(userOp, signature) {
    userOp.signature = signature;

    try {
      const response = await fetch(this.bundlerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_sendUserOperation',
          params: [userOp, `0x${this.chainId.toString(16)}`],
        }),
      });

      const data = await response.json();

      if (data.result) {
        return { success: true, userOpHash: data.result };
      }

      throw new Error(data.error?.message || 'Bundler error');
    } catch (error) {
      console.error('[Bundler] خطأ:', error.message);
      return { success: false, error: error.message };
    }
  }

  async waitForUserOp(userOpHash, timeout = 60000) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      try {
        const response = await fetch(this.bundlerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getUserOperationReceipt',
            params: [userOpHash],
          }),
        });

        const data = await response.json();

        if (data.result) {
          return {
            success: data.result.success,
            transactionHash: data.result.receipt.transactionHash,
            gasUsed: data.result.receipt.gasUsed,
            actualGasCost: data.result.actualGasCost,
          };
        }
      } catch (e) {
        // continue polling
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return { success: false, error: 'Timeout waiting for UserOp' };
  }

  _encodeCallData(contractAddress, calldata) {
    const iface = new ethers.Interface([
      'function execute(address target, uint256 value, bytes data)',
    ]);

    return iface.encodeFunctionData('execute', [
      contractAddress,
      0,
      calldata,
    ]);
  }

  async _getNonce(walletAddress) {
    try {
      const response = await fetch(this.bundlerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getNonce',
          params: [walletAddress],
        }),
      });

      const data = await response.json();
      return data.result ? ethers.toBigInt(data.result) : ethers.toBigInt(0);
    } catch {
      return ethers.toBigInt(0);
    }
  }

  async estimateGas(userOp) {
    try {
      const response = await fetch(this.bundlerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_estimateUserOperationGas',
          params: [userOp],
        }),
      });

      const data = await response.json();

      if (data.result) {
        return {
          callGasLimit: ethers.toBigInt(data.result.callGasLimit),
          verificationGasLimit: ethers.toBigInt(data.result.verificationGasLimit),
          preVerificationGas: ethers.toBigInt(data.result.preVerificationGas),
        };
      }

      throw new Error(data.error?.message || 'Gas estimation failed');
    } catch (error) {
      console.error('[Gas Estimate] خطأ:', error.message);
      return null;
    }
  }

  getCostBreakdown(estimatedGas) {
    const gasPriceGwei = 0.1;
    const ethPriceUSD = 3000;

    const totalGas = Number(
      estimatedGas.callGasLimit +
      estimatedGas.verificationGasLimit +
      estimatedGas.preVerificationGas
    );

    const gasCostETH = (totalGas * gasPriceGwei) / 1e9;
    const gasCostUSD = gasCostETH * ethPriceUSD;

    return {
      totalGas,
      gasCostETH,
      gasCostUSD,
      paidBy: 'Paymaster (Biconomy)',
      costToUser: 0,
    };
  }
}

module.exports = { PaymasterService };
