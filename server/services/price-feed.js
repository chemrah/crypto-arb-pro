const { ethers } = require('ethers');

class PriceFeed {
  constructor() {
    this.prices = {
      ethereum: 3000,
      bitcoin: 60000,
      arbitrum: 1.2,
      'matic-network': 0.7,
      binancecoin: 600,
      optimism: 2.5,
    };
    this.gasPrices = {};
    this.lastUpdate = 0;
    this.cacheExpiry = 60000; // 60 seconds
    this.updating = false;

    // Auto-refresh
    this.refreshPrices();
    this._interval = setInterval(() => this.refreshPrices(), this.cacheExpiry);
  }

  async getEthPrice() {
    if (Date.now() - this.lastUpdate > this.cacheExpiry) {
      await this.refreshPrices();
    }
    return this.prices.ethereum || 3000;
  }

  async getTokenPrice(symbol) {
    if (Date.now() - this.lastUpdate > this.cacheExpiry) {
      await this.refreshPrices();
    }

    const symbolMap = {
      ETH: 'ethereum',
      WETH: 'ethereum',
      BTC: 'bitcoin',
      WBTC: 'bitcoin',
      ARB: 'arbitrum',
      MATIC: 'matic-network',
      POL: 'matic-network',
      BNB: 'binancecoin',
      OP: 'optimism',
      USDC: null,
      USDT: null,
      DAI: null,
    };

    const id = symbolMap[symbol.toUpperCase()];
    if (id === null) return 1.0; // Stablecoins
    if (id === undefined) return null;
    return this.prices[id] || null;
  }

  async getGasPrice(chain, provider) {
    try {
      const feeData = await provider.getFeeData();
      const gasPriceGwei = parseFloat(ethers.formatUnits(feeData.gasPrice || 0n, 'gwei'));
      this.gasPrices[chain] = gasPriceGwei;
      return gasPriceGwei;
    } catch (e) {
      return this.gasPrices[chain] || 0.1;
    }
  }

  async refreshPrices() {
    if (this.updating) return;
    this.updating = true;

    try {
      const ids = Object.keys(this.prices).join(',');
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`CoinGecko HTTP ${response.status}`);

      const data = await response.json();

      for (const [id, priceData] of Object.entries(data)) {
        if (priceData && priceData.usd) {
          this.prices[id] = priceData.usd;
        }
      }

      this.lastUpdate = Date.now();
      console.log(`[PriceFeed] تحديث الأسعار: ETH=$${this.prices.ethereum}, BTC=$${this.prices.bitcoin}, ARB=$${this.prices.arbitrum}`);
    } catch (error) {
      console.warn('[PriceFeed] خطأ في تحديث الأسعار، استخدام آخر سعر معروف:', error.message);
    } finally {
      this.updating = false;
    }
  }

  getAllPrices() {
    return { ...this.prices };
  }

  destroy() {
    if (this._interval) clearInterval(this._interval);
  }
}

// Singleton
const priceFeed = new PriceFeed();

module.exports = { PriceFeed, priceFeed };
