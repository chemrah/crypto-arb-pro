const { ethers } = require('ethers');

// ═══════════════════════════════════════════════════════════════
//  LendingRouter — Smart lending source selection
//  Supports: Aave V3, Radiant V2, Spark, Compound V3
//  Auto-selects the cheapest source based on fees & liquidity
// ═══════════════════════════════════════════════════════════════

// ─── Protocol Addresses ──────────────────────────────────────

const LENDING_PROTOCOLS = {
  aave_v3: {
    name: 'Aave V3',
    fee: 0.0005, // 0.05%
    feeLabel: '0.05%',
    icon: '👻',
    addresses: {
      arbitrum: { pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' },
      ethereum: { pool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2' },
      polygon: { pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' },
      optimism: { pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' },
      base: { pool: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5' },
      bsc: { pool: '0x6807dc923806fE8Fd134338EABCA509979a7e0cB' },
    },
    supportedChains: ['arbitrum', 'ethereum', 'polygon', 'optimism', 'base', 'bsc'],
  },
  radiant_v2: {
    name: 'Radiant V2',
    fee: 0.0009, // 0.09%
    feeLabel: '0.09%',
    icon: '☀️',
    addresses: {
      arbitrum: { pool: '0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1' },
      bsc: { pool: '0xd50Cf00b6e600Dd036Ba8eF475677d816d6c4281' },
    },
    supportedChains: ['arbitrum', 'bsc'],
  },
  spark: {
    name: 'Spark Protocol',
    fee: 0, // 0% on DAI!
    feeLabel: '0% (DAI)',
    icon: '✨',
    addresses: {
      ethereum: { pool: '0xC13e21B648A5Ee794902342038FF3aDAB66BE987' },
    },
    supportedChains: ['ethereum'],
    // Spark has 0% fee only on DAI
    specialTokens: {
      '0x6B175474E89094C44Da98b954EedeAC495271d0F': 0, // DAI on Ethereum = 0%
    },
    defaultFee: 0.0005, // 0.05% for non-DAI tokens
  },
  compound_v3: {
    name: 'Compound V3',
    fee: 0, // No flash loan fee, but uses different mechanism
    feeLabel: '0%',
    icon: '🏛️',
    addresses: {
      arbitrum: {
        usdc_comet: '0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA',
        weth_comet: '0x6f7D514bbD4aFf3BcD1140B7344b32f063dEe486',
      },
      ethereum: {
        usdc_comet: '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
        weth_comet: '0xA17581A9E3356d9A858b789D68B4d866e593aE94',
      },
      polygon: {
        usdc_comet: '0xF25212E676D1F7F89Cd72fFEe66158f541246445',
      },
      base: {
        usdc_comet: '0xb125E6687d4313864e53df431d5425969c15Eb2F',
        weth_comet: '0x46e6b986B7bEA6740e5D286B6B09a1B7D8b1E5C3',
      },
    },
    supportedChains: ['arbitrum', 'ethereum', 'polygon', 'base'],
  },
};

// ─── ABIs ────────────────────────────────────────────────────

const POOL_ABI = [
  'function flashLoan(address receiverAddress, address[] calldata assets, uint256[] calldata amounts, uint256[] calldata interestRateModes, address onBehalfOf, bytes calldata params, uint16 referralCode) external',
  'function flashLoanSimple(address receiverAddress, address asset, uint256 amount, bytes calldata params, uint16 referralCode) external',
  'function getReserveData(address asset) view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowRate, uint128 currentVariableBorrowRate, uint128 stableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt))',
];

const COMET_ABI = [
  'function supply(address asset, uint amount) external',
  'function withdraw(address asset, uint amount) external',
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function baseToken() view returns (address)',
  'function getUtilization() view returns (uint)',
];

const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

class LendingRouter {
  constructor(rpcManager = null) {
    this.rpcManager = rpcManager;
    this.protocols = LENDING_PROTOCOLS;
    this.liquidityCache = new Map();
    this.cacheTTL = 60000; // 1 minute cache
  }

  // ─── Get the best lending source for a given token & chain ──
  async getBestLendingSource(tokenAddress, amount, chain = 'arbitrum', networkMode = 'mainnet') {
    const candidates = [];

    for (const [protocolId, protocol] of Object.entries(this.protocols)) {
      // Check if protocol supports this chain
      if (!protocol.supportedChains.includes(chain)) continue;

      // Calculate fee
      let fee = protocol.fee;
      if (protocol.specialTokens && protocol.specialTokens[tokenAddress] !== undefined) {
        fee = protocol.specialTokens[tokenAddress];
      } else if (protocol.defaultFee !== undefined) {
        fee = protocol.defaultFee;
      }

      const feeCost = parseFloat(ethers.formatEther(amount)) * fee;

      // Check liquidity (cached)
      let liquidity = null;
      try {
        liquidity = await this._checkLiquidity(protocolId, tokenAddress, chain, networkMode);
      } catch (e) {
        console.warn(`[LendingRouter] Cannot check liquidity for ${protocolId}:`, e.message);
      }

      const hasEnoughLiquidity = liquidity === null || liquidity >= parseFloat(ethers.formatEther(amount));

      candidates.push({
        protocolId,
        name: protocol.name,
        icon: protocol.icon,
        fee,
        feeLabel: protocol.feeLabel,
        feeCost,
        chain,
        hasLiquidity: hasEnoughLiquidity,
        liquidity,
        addresses: protocol.addresses[chain],
        priority: this._getPriority(protocolId, fee, hasEnoughLiquidity),
      });
    }

    // Sort by priority (lower = better)
    candidates.sort((a, b) => a.priority - b.priority);

    // Filter to only those with liquidity
    const viable = candidates.filter(c => c.hasLiquidity);

    return {
      best: viable[0] || candidates[0] || null,
      all: candidates,
      viable,
    };
  }

  // ─── Get all supported protocols for a chain ────────────────
  getSupportedProtocols(chain = 'arbitrum') {
    const supported = [];
    for (const [protocolId, protocol] of Object.entries(this.protocols)) {
      if (protocol.supportedChains.includes(chain)) {
        supported.push({
          id: protocolId,
          name: protocol.name,
          icon: protocol.icon,
          fee: protocol.fee,
          feeLabel: protocol.feeLabel,
          addresses: protocol.addresses[chain],
        });
      }
    }
    return supported;
  }

  // ─── Get all protocols with full info ───────────────────────
  getAllProtocols() {
    return Object.entries(this.protocols).map(([id, p]) => ({
      id,
      name: p.name,
      icon: p.icon,
      fee: p.fee,
      feeLabel: p.feeLabel,
      supportedChains: p.supportedChains,
    }));
  }

  // ─── Build flash loan calldata for a given protocol ─────────
  buildFlashLoanCalldata(protocolId, receiverAddress, tokenAddress, amount, params = '0x') {
    const protocol = this.protocols[protocolId];
    if (!protocol) throw new Error(`Unknown protocol: ${protocolId}`);

    const iface = new ethers.Interface(POOL_ABI);

    if (protocolId === 'compound_v3') {
      // Compound V3 uses a different mechanism (withdraw + supply in same tx)
      const cometIface = new ethers.Interface(COMET_ABI);
      return cometIface.encodeFunctionData('withdraw', [tokenAddress, amount]);
    }

    // Aave V3 / Radiant V2 / Spark all share the same flashLoanSimple interface
    return iface.encodeFunctionData('flashLoanSimple', [
      receiverAddress,
      tokenAddress,
      amount,
      params,
      0, // referralCode
    ]);
  }

  // ─── Get pool address for a protocol on a chain ─────────────
  getPoolAddress(protocolId, chain = 'arbitrum') {
    const protocol = this.protocols[protocolId];
    if (!protocol) return null;
    const addresses = protocol.addresses[chain];
    if (!addresses) return null;
    return addresses.pool || addresses.usdc_comet || Object.values(addresses)[0];
  }

  // ─── Private: Check liquidity ───────────────────────────────
  async _checkLiquidity(protocolId, tokenAddress, chain, networkMode) {
    const cacheKey = `${protocolId}:${tokenAddress}:${chain}`;
    const cached = this.liquidityCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.liquidity;
    }

    if (!this.rpcManager) return null;

    try {
      const provider = this.rpcManager.getProvider(chain, networkMode);
      if (!provider) return null;

      // Check the aToken/cToken balance = available liquidity
      const poolAddress = this.getPoolAddress(protocolId, chain);
      if (!poolAddress) return null;

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const balance = await tokenContract.balanceOf(poolAddress);
      const decimals = await tokenContract.decimals();
      const liquidity = parseFloat(ethers.formatUnits(balance, decimals));

      this.liquidityCache.set(cacheKey, { liquidity, timestamp: Date.now() });
      return liquidity;
    } catch (e) {
      return null; // Can't check, assume available
    }
  }

  // ─── Private: Get priority (lower = better) ─────────────────
  _getPriority(protocolId, fee, hasLiquidity) {
    if (!hasLiquidity) return 1000; // Deprioritize if no liquidity

    const basePriority = {
      spark: 1,       // 0% fee on DAI
      aave_v3: 2,     // 0.05%
      compound_v3: 3,  // 0% but complex
      radiant_v2: 4,   // 0.09%
    };

    return (basePriority[protocolId] || 5) + fee * 100;
  }
}

module.exports = { LendingRouter, LENDING_PROTOCOLS };
