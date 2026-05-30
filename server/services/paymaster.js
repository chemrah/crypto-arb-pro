const { ethers } = require('ethers');

// ═══════════════════════════════════════════════════════════════
//  Biconomy Paymaster – ERC-4337 Account Abstraction
//  EntryPoint v0.6: 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
// ═══════════════════════════════════════════════════════════════

const ENTRY_POINT_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

const ENTRY_POINT_ABI = [
  'function getNonce(address sender, uint192 key) view returns (uint256)',
  'function getUserOpHash((address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
];

// Biconomy Smart Account Factory (v2)
const SMART_ACCOUNT_FACTORY = '0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5';
const SMART_ACCOUNT_IMPL = '0x0000002512019Dafb59528B82CB92D3c5D2423ac';

const SMART_ACCOUNT_ABI = [
  'function execute(address dest, uint256 value, bytes calldata func)',
  'function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func)',
];

class PaymasterService {
  constructor(config = {}) {
    this.biconomyApiKey = config.biconomyApiKey || process.env.BICONOMY_API_KEY;
    this.bundlerUrl = config.bundlerUrl || process.env.BUNDLER_URL;
    this.paymasterUrl = config.paymasterUrl || process.env.BICONOMY_PAYMASTER_URL;
    this.chainId = config.chainId || parseInt(process.env.NEXT_PUBLIC_CHAIN_ID) || 42161;
    this.provider = config.provider || null;
    this.entryPointAddress = ENTRY_POINT_ADDRESS;
  }

  setProvider(provider) {
    this.provider = provider;
  }

  setChainId(chainId) {
    this.chainId = chainId;
  }

  // ─── Build a complete UserOperation ────────────────────────
  async buildUserOp(smartAccountAddress, contractAddress, calldata, value = 0) {
    console.log('[Paymaster] Building UserOp for', smartAccountAddress);

    // 1. Get nonce from EntryPoint contract (NOT from bundler)
    const nonce = await this._getNonceFromEntryPoint(smartAccountAddress);

    // 2. Encode the inner call via Smart Account's execute()
    const innerCalldata = this._encodeSmartAccountCall(contractAddress, value, calldata);

    // 3. Check if the smart account is deployed, generate initCode if not
    const initCode = await this._getInitCode(smartAccountAddress);

    // 4. Build the raw UserOp with placeholder gas values
    const userOp = {
      sender: smartAccountAddress,
      nonce: ethers.toBeHex(nonce),
      initCode: initCode,
      callData: innerCalldata,
      callGasLimit: ethers.toBeHex(500_000),
      verificationGasLimit: ethers.toBeHex(initCode !== '0x' ? 500_000 : 300_000),
      preVerificationGas: ethers.toBeHex(100_000),
      maxFeePerGas: ethers.toBeHex(0),
      maxPriorityFeePerGas: ethers.toBeHex(0),
      paymasterAndData: '0x',
      signature: '0x' + '00'.repeat(65), // dummy signature for estimation
    };

    // 5. Get gas prices from the network
    await this._fillGasPrices(userOp);

    // 6. Estimate gas via bundler
    const gasEstimate = await this.estimateGas(userOp);
    if (gasEstimate) {
      userOp.callGasLimit = ethers.toBeHex(gasEstimate.callGasLimit);
      userOp.verificationGasLimit = ethers.toBeHex(gasEstimate.verificationGasLimit);
      userOp.preVerificationGas = ethers.toBeHex(gasEstimate.preVerificationGas);
    }

    // 7. Get paymaster sponsorship data
    const paymasterData = await this.getPaymasterData(userOp);
    if (paymasterData && paymasterData !== '0x') {
      userOp.paymasterAndData = paymasterData;
      // Re-apply gas limits if paymaster returned updated ones
      if (paymasterData.gasLimits) {
        userOp.callGasLimit = ethers.toBeHex(paymasterData.gasLimits.callGasLimit);
        userOp.verificationGasLimit = ethers.toBeHex(paymasterData.gasLimits.verificationGasLimit);
        userOp.preVerificationGas = ethers.toBeHex(paymasterData.gasLimits.preVerificationGas);
      }
    }

    console.log('[Paymaster] UserOp built, nonce:', nonce.toString());
    return userOp;
  }

  // ─── Get paymaster sponsorship ─────────────────────────────
  async getPaymasterData(userOp) {
    if (!this.paymasterUrl) {
      console.warn('[Paymaster] No paymaster URL configured — user pays gas');
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
            this._formatUserOpForRpc(userOp),
            this.entryPointAddress,
            {
              mode: 'SPONSORED',
              calculateGasLimits: true,
              expiryDuration: 300,
              sponsorshipInfo: {
                webhookData: {},
                smartAccountInfo: {
                  name: 'BICONOMY',
                  version: '2.0.0',
                },
              },
            },
          ],
        }),
      });

      const data = await response.json();

      if (data.error) {
        console.error('[Paymaster] Sponsorship error:', data.error.message);
        return '0x';
      }

      if (data.result) {
        const result = data.result;
        console.log('[Paymaster] Sponsorship approved');

        // Biconomy returns paymasterAndData + optional gas limit overrides
        return {
          toString: () => result.paymasterAndData,
          paymasterAndData: result.paymasterAndData,
          gasLimits: result.callGasLimit ? {
            callGasLimit: BigInt(result.callGasLimit),
            verificationGasLimit: BigInt(result.verificationGasLimit),
            preVerificationGas: BigInt(result.preVerificationGas),
          } : null,
        };
      }

      return '0x';
    } catch (error) {
      console.error('[Paymaster] Request failed:', error.message);
      return '0x';
    }
  }

  // ─── Submit UserOp to bundler ──────────────────────────────
  async submitUserOp(userOp, signature) {
    // Apply the real signature
    const signedOp = { ...userOp };
    signedOp.signature = signature;

    // Unwrap paymasterAndData if it's a wrapper object
    if (typeof signedOp.paymasterAndData === 'object' && signedOp.paymasterAndData.paymasterAndData) {
      signedOp.paymasterAndData = signedOp.paymasterAndData.paymasterAndData;
    }

    if (!this.bundlerUrl) {
      return { success: false, error: 'No bundler URL configured' };
    }

    try {
      const response = await fetch(this.bundlerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_sendUserOperation',
          params: [
            this._formatUserOpForRpc(signedOp),
            this.entryPointAddress,
          ],
        }),
      });

      const data = await response.json();

      if (data.error) {
        console.error('[Bundler] Submit error:', data.error.message);
        return { success: false, error: data.error.message };
      }

      if (data.result) {
        console.log('[Bundler] UserOp submitted, hash:', data.result);
        return { success: true, userOpHash: data.result };
      }

      return { success: false, error: 'Unexpected bundler response' };
    } catch (error) {
      console.error('[Bundler] Request failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ─── Poll for UserOp receipt ───────────────────────────────
  async waitForUserOp(userOpHash, timeout = 120_000) {
    const start = Date.now();
    const pollInterval = 2000;

    console.log('[Bundler] Waiting for UserOp receipt:', userOpHash);

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
          const receipt = data.result;
          const success = receipt.success === true || receipt.success === 'true';

          console.log('[Bundler] Receipt:', success ? 'SUCCESS' : 'REVERTED');

          return {
            success,
            transactionHash: receipt.receipt?.transactionHash || receipt.transactionHash,
            gasUsed: receipt.actualGasUsed || receipt.receipt?.gasUsed,
            actualGasCost: receipt.actualGasCost,
            logs: receipt.logs || receipt.receipt?.logs || [],
            revertReason: receipt.reason || null,
          };
        }
      } catch {
        // continue polling
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    return { success: false, error: 'Timeout waiting for UserOp confirmation' };
  }

  // ─── Estimate gas via bundler ──────────────────────────────
  async estimateGas(userOp) {
    if (!this.bundlerUrl) return null;

    try {
      const response = await fetch(this.bundlerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_estimateUserOperationGas',
          params: [
            this._formatUserOpForRpc(userOp),
            this.entryPointAddress,
          ],
        }),
      });

      const data = await response.json();

      if (data.result) {
        return {
          callGasLimit: BigInt(data.result.callGasLimit),
          verificationGasLimit: BigInt(data.result.verificationGasLimit),
          preVerificationGas: BigInt(data.result.preVerificationGas),
        };
      }

      if (data.error) {
        console.warn('[Gas Estimate] Bundler error:', data.error.message);
      }
      return null;
    } catch (error) {
      console.warn('[Gas Estimate] Failed:', error.message);
      return null;
    }
  }

  // ─── Get UserOp hash for signing ──────────────────────────
  async getUserOpHash(userOp) {
    if (!this.provider) {
      throw new Error('Provider not set — cannot compute UserOp hash');
    }

    const entryPoint = new ethers.Contract(
      this.entryPointAddress,
      ENTRY_POINT_ABI,
      this.provider
    );

    const opTuple = [
      userOp.sender,
      userOp.nonce,
      userOp.initCode,
      userOp.callData,
      userOp.callGasLimit,
      userOp.verificationGasLimit,
      userOp.preVerificationGas,
      userOp.maxFeePerGas,
      userOp.maxPriorityFeePerGas,
      typeof userOp.paymasterAndData === 'object'
        ? userOp.paymasterAndData.paymasterAndData
        : userOp.paymasterAndData,
      userOp.signature,
    ];

    try {
      return await entryPoint.getUserOpHash(opTuple);
    } catch {
      // Fallback: compute off-chain
      return this._computeUserOpHashOffchain(userOp);
    }
  }

  // ─── Cost breakdown (informational) ────────────────────────
  getCostBreakdown(estimatedGas, gasPriceGwei, ethPriceUSD) {
    const gp = gasPriceGwei || 0.1;
    const ep = ethPriceUSD || 3000;

    const totalGas = Number(
      (estimatedGas.callGasLimit || 0n) +
      (estimatedGas.verificationGasLimit || 0n) +
      (estimatedGas.preVerificationGas || 0n)
    );

    const gasCostETH = (totalGas * gp) / 1e9;
    const gasCostUSD = gasCostETH * ep;

    return {
      totalGas,
      gasCostETH,
      gasCostUSD,
      paidBy: 'Paymaster (Biconomy)',
      costToUser: 0,
    };
  }

  // ═══ Internal helpers ═════════════════════════════════════

  _encodeSmartAccountCall(target, value, data) {
    const iface = new ethers.Interface(SMART_ACCOUNT_ABI);
    return iface.encodeFunctionData('execute', [target, value, data]);
  }

  async _getNonceFromEntryPoint(sender) {
    if (!this.provider) {
      console.warn('[Paymaster] No provider — using nonce 0');
      return 0n;
    }

    try {
      const entryPoint = new ethers.Contract(
        this.entryPointAddress,
        ENTRY_POINT_ABI,
        this.provider
      );

      // key = 0 for the default nonce space
      const nonce = await entryPoint.getNonce(sender, 0);
      return nonce;
    } catch (error) {
      console.warn('[Paymaster] EntryPoint nonce call failed:', error.message);
      return 0n;
    }
  }

  async _getInitCode(smartAccountAddress) {
    if (!this.provider) return '0x';

    try {
      const code = await this.provider.getCode(smartAccountAddress);
      if (code && code !== '0x') {
        // Account already deployed
        return '0x';
      }
    } catch {
      return '0x';
    }

    // Account not yet deployed — build initCode for Biconomy Smart Account v2
    // initCode = factoryAddress + encodedFactoryCall
    try {
      const factoryIface = new ethers.Interface([
        'function deployCounterFactualAccount(address moduleSetupContract, bytes calldata moduleSetupData, uint256 index) returns (address)',
      ]);

      const ecdsaModuleIface = new ethers.Interface([
        'function initForSmartAccount(address owner) returns (address)',
      ]);

      // This is a simplified placeholder. In production, you'd compute the
      // expected smart account address from the factory + owner + index.
      // For now, if the account is not deployed, return empty (user must
      // deploy their Smart Account via Biconomy SDK first).
      console.warn('[Paymaster] Smart Account not deployed. User must deploy via Biconomy dashboard.');
      return '0x';
    } catch {
      return '0x';
    }
  }

  async _fillGasPrices(userOp) {
    if (!this.provider) return;

    try {
      const feeData = await this.provider.getFeeData();
      if (feeData.maxFeePerGas) {
        userOp.maxFeePerGas = ethers.toBeHex(feeData.maxFeePerGas);
        userOp.maxPriorityFeePerGas = ethers.toBeHex(
          feeData.maxPriorityFeePerGas || feeData.maxFeePerGas
        );
      } else if (feeData.gasPrice) {
        userOp.maxFeePerGas = ethers.toBeHex(feeData.gasPrice);
        userOp.maxPriorityFeePerGas = ethers.toBeHex(feeData.gasPrice);
      }
    } catch {
      // keep defaults
    }
  }

  _formatUserOpForRpc(userOp) {
    const formatted = {};
    for (const [key, val] of Object.entries(userOp)) {
      if (typeof val === 'bigint') {
        formatted[key] = ethers.toBeHex(val);
      } else if (typeof val === 'number') {
        formatted[key] = ethers.toBeHex(val);
      } else if (typeof val === 'object' && val !== null && val.paymasterAndData) {
        formatted[key] = val.paymasterAndData;
      } else {
        formatted[key] = val;
      }
    }
    return formatted;
  }

  _computeUserOpHashOffchain(userOp) {
    const packed = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'uint256', 'bytes32', 'bytes32', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
      [
        userOp.sender,
        userOp.nonce,
        ethers.keccak256(userOp.initCode || '0x'),
        ethers.keccak256(userOp.callData || '0x'),
        userOp.callGasLimit,
        userOp.verificationGasLimit,
        userOp.preVerificationGas,
        userOp.maxFeePerGas,
        userOp.maxPriorityFeePerGas,
        ethers.keccak256(
          typeof userOp.paymasterAndData === 'object'
            ? userOp.paymasterAndData.paymasterAndData || '0x'
            : userOp.paymasterAndData || '0x'
        ),
      ]
    );

    const userOpHash = ethers.keccak256(packed);

    // Final hash = keccak256(abi.encode(userOpHash, entryPoint, chainId))
    return ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'address', 'uint256'],
        [userOpHash, this.entryPointAddress, this.chainId]
      )
    );
  }
}

module.exports = { PaymasterService, ENTRY_POINT_ADDRESS };
