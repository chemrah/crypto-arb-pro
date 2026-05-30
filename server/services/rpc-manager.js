const { ethers } = require('ethers');

// ═══════════════════════════════════════════════════════════════
//  RPCManager — manages providers per chain with failover
// ═══════════════════════════════════════════════════════════════

class RPCManager {
  constructor() {
    this.providers = {};
    this.chainIds = {};
    this.networkMode = process.env.NETWORK_MODE || 'mainnet';
    this._initProviders();
  }

  _initProviders() {
    const mainnetRpcs = {
      arbitrum: [
        process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
        'https://arbitrum-one-rpc.publicnode.com',
        'https://arb1.arbitrum.io/rpc',
      ],
      ethereum: [
        process.env.ETH_RPC || 'https://eth.llamarpc.com',
        'https://ethereum-rpc.publicnode.com',
      ],
      base: [
        process.env.BASE_RPC || 'https://mainnet.base.org',
        'https://base-rpc.publicnode.com',
      ],
      optimism: [
        process.env.OPTIMISM_RPC || 'https://mainnet.optimism.io',
      ],
    };

    const testnetRpcs = {
      arbitrum: [
        process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
      ],
      base: [
        process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
      ],
    };

    this.chainIds = {
      mainnet: { arbitrum: 42161, ethereum: 1, base: 8453, optimism: 10 },
      testnet: { arbitrum: 421614, base: 84532 },
    };

    const rpcs = this.networkMode === 'testnet' ? testnetRpcs : mainnetRpcs;

    for (const [chain, urls] of Object.entries(rpcs)) {
      this.providers[chain] = urls.map((url) => new ethers.JsonRpcProvider(url));
    }
  }

  getProvider(chain = 'arbitrum') {
    const list = this.providers[chain];
    if (!list || list.length === 0) {
      throw new Error(`No provider available for chain: ${chain}`);
    }
    return list[0];
  }

  async getProviderWithFallback(chain = 'arbitrum') {
    const list = this.providers[chain] || [];
    for (const provider of list) {
      try {
        await provider.getBlockNumber();
        return provider;
      } catch {
        continue;
      }
    }
    throw new Error(`All providers failed for chain: ${chain}`);
  }

  getChainId(chain = 'arbitrum') {
    const ids = this.chainIds[this.networkMode] || this.chainIds.mainnet;
    return ids[chain] || 42161;
  }

  setNetworkMode(mode) {
    this.networkMode = mode;
    this._initProviders();
  }

  getNetworkMode() {
    return this.networkMode;
  }

  getSupportedChains() {
    return Object.keys(this.providers);
  }
}

// ═══════════════════════════════════════════════════════════════
//  PriceFeed — fetches live ETH price
// ═══════════════════════════════════════════════════════════════

class PriceFeed {
  constructor() {
    this.ethPrice = 3000;
    this.gasPrice = 0.1; // gwei
    this.lastUpdate = 0;
    this.updateInterval = 60_000; // 1 minute
  }

  async fetchEthPrice() {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );
      const data = await response.json();
      if (data?.ethereum?.usd) {
        this.ethPrice = data.ethereum.usd;
        this.lastUpdate = Date.now();
      }
    } catch (error) {
      console.warn('[PriceFeed] CoinGecko fetch failed, using cached price:', this.ethPrice);
    }
    return this.ethPrice;
  }

  async fetchGasPrice(provider) {
    try {
      const feeData = await provider.getFeeData();
      if (feeData.gasPrice) {
        this.gasPrice = parseFloat(ethers.formatUnits(feeData.gasPrice, 'gwei'));
      }
    } catch {
      // keep cached
    }
    return this.gasPrice;
  }

  getEthPrice() {
    return this.ethPrice;
  }

  getGasPrice() {
    return this.gasPrice;
  }

  setEthPrice(usd) {
    this.ethPrice = usd;
  }

  setGasPrice(gwei) {
    this.gasPrice = gwei;
  }

  async startAutoUpdate(provider) {
    await this.fetchEthPrice();
    if (provider) await this.fetchGasPrice(provider);

    this._interval = setInterval(async () => {
      await this.fetchEthPrice();
      if (provider) await this.fetchGasPrice(provider);
    }, this.updateInterval);
  }

  stop() {
    if (this._interval) clearInterval(this._interval);
  }
}

module.exports = { RPCManager, PriceFeed };
