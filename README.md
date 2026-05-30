<div align="center">

# ⚡ Crypto Arbitrage Pro

### Advanced DeFi Arbitrage Platform with Flash Loans, Flash Swaps & Flash Mint

**Detect and execute profitable arbitrage opportunities across 59 DEXes on 6 chains — with zero upfront capital and zero gas fees.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Arbitrum](https://img.shields.io/badge/Arbitrum-One-28A0F0?logo=arbitrum)](https://arbitrum.io/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Mainnet-627EEA?logo=ethereum)](https://ethereum.org/)

<p align="center">
  <strong>🏦 Flash Loans (Aave V3)</strong> · <strong>🦄 Flash Swaps (Uniswap V2)</strong> · <strong>🏛️ Flash Mint (MakerDAO)</strong> · <strong>⛽ Gasless (Biconomy)</strong>
</p>

---

**[📖 Quick Start](#-quick-start)** · **[🏗️ Architecture](#%EF%B8%8F-architecture)** · **[💡 How It Works](#-how-it-works)** · **[🔧 Configuration](#-configuration)** · **[🚀 Deployment](#-deployment)**

</div>

---

## 🎯 What Is This?

Crypto Arbitrage Pro is a **production-grade** DeFi arbitrage platform that automatically detects price discrepancies across decentralized exchanges and executes atomic trades to capture risk-free profit.

### Key Features

| Feature | Description |
|---------|-------------|
| 🔍 **Real-Time Scanner** | Continuously scans 59 DEXes across 6 chains for price discrepancies |
| ⚡ **Flash Loan Execution** | Borrows up to $100M from Aave V3 with zero collateral — repaid in the same transaction |
| 🦄 **Flash Swap Execution** | Uses Uniswap V2 flash swaps — borrow tokens, arbitrage, repay with 0.3% fee |
| 🏛️ **Flash Mint Execution** | Mints up to 500M DAI from MakerDAO with zero fees — the cheapest flash loan |
| ⛽ **Zero Gas Fees** | All gas costs sponsored by Biconomy Paymaster (ERC-4337 Account Abstraction) |
| 🤖 **Auto-Execute Mode** | Server bot automatically executes profitable opportunities above your threshold |
| 🎯 **Manual Mode** | Select and execute specific opportunities with one click |
| 🌐 **Multi-Chain** | Arbitrum, Ethereum, Base, Optimism, Polygon, BSC |
| 🧪 **Testnet Support** | Toggle between testnet and mainnet directly in the UI |
| 🛡️ **MEV Protection** | Flashbots integration for private transaction submission |
| 📊 **Advanced Dashboard** | Real-time gauges, charts, profit calculator, execution history |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ MetaMask │ │ Dashboard│ │  Charts  │ │   Profit      │  │
│  │ Wallet   │ │ + Gauges │ │ + Spread │ │   Calculator  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬───────┘  │
│       └─────────────┼───────────┼────────────────┘          │
│                     ▼                                        │
│              Zustand Store + WebSocket                        │
└──────────────────────┬──────────────────────────────────────┘
                       │ WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                 Backend (Express + WS)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Multi-Chain   │  │  Arbitrage   │  │  Gasless         │  │
│  │ Scanner       │──│  Engine      │──│  Executor        │  │
│  │ (59 DEXes)   │  │ (Live Prices)│  │ (Biconomy)       │  │
│  └──────┬───────┘  └──────────────┘  └────────┬─────────┘  │
│         │                                      │             │
│  ┌──────▼───────┐  ┌──────────────┐  ┌────────▼─────────┐  │
│  │ RPC Manager  │  │  Price Feed  │  │  Flashbots       │  │
│  │ Alchemy +    │  │  CoinGecko   │  │  MEV Protection  │  │
│  │ Infura       │  │  Live Prices │  │                   │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ On-Chain Transactions
┌──────────────────────▼──────────────────────────────────────┐
│                    Smart Contracts                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ FlashLoan    │ │ FlashSwap    │ │ FlashMint            │ │
│  │ Arbitrage    │ │ Arbitrage    │ │ Arbitrage            │ │
│  │ (Aave V3)   │ │ (Uni V2)     │ │ (MakerDAO)           │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              MultiHopRouter (V2 + V3 + Curve)          │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 How It Works

### The Arbitrage Flow (All in One Transaction)

```
1. 🏦 BORROW     →  Flash Loan $100,000 USDC from Aave V3 (0.09% fee)
2. 🛒 BUY        →  Buy ETH on SushiSwap at $3,000.50
3. 💱 SELL       →  Sell ETH on Uniswap V3 at $3,005.20
4. 🔄 REPAY      →  Repay $100,090 to Aave V3
5. 💰 PROFIT     →  Keep $380 profit (after all fees)
   ⛽ GAS        →  $0.00 — Biconomy Paymaster pays gas
```

> **Key Insight**: The entire flow happens **atomically in a single transaction**. If any step fails (e.g., the price moved and there's no profit), the entire transaction **reverts** — you lose nothing except the gas, which Biconomy pays.

### Three Execution Strategies

| Strategy | Source | Fee | Best For |
|----------|--------|-----|----------|
| **Flash Loan** | Aave V3 | 0.09% | Large trades ($10K+), any token |
| **Flash Swap** | Uniswap V2 | 0.3% | Medium trades, direct pairs |
| **Flash Mint** | MakerDAO | **0%** | DAI-based arb, stablecoin pairs |

---

## 🌐 Supported DEXes (59)

<details>
<summary><strong>🔵 Arbitrum (20 DEXes)</strong></summary>

| DEX | Type | Fee |
|-----|------|-----|
| Uniswap V3 | V3 | 0.05-1% |
| Uniswap V2 | V2 | 0.3% |
| SushiSwap | V2 | 0.3% |
| Camelot | V2 | 0.3% |
| PancakeSwap V3 | V3 | 0.25% |
| TraderJoe V2.1 | V2 | 0.3% |
| Balancer V2 | Weighted | 0.1% |
| Curve | StableSwap | 0.04% |
| GMX V2 | Oracle | 0.3% |
| Ramses V2 | V3 | 0.3% |
| Chronos | V2 | 0.3% |
| ZyberSwap | V2 | 0.25% |
| WOOFi | PMM | 0.025% |
| DODO V2 | PMM | 0.1% |
| KyberSwap | V3 | 0.3% |
| FraxSwap | V2 | 0.3% |
| SwapFish | V2 | 0.3% |
| ArbiDex | V2 | 0.3% |
| SolidLizard | Solidly | 0.3% |
| OreoSwap | V2 | 0.3% |

</details>

<details>
<summary><strong>💎 Ethereum (12 DEXes)</strong></summary>

Uniswap V2, Uniswap V3, SushiSwap, Curve 3Pool, Curve TriCrypto, Balancer V2, PancakeSwap V3, DODO, ShibaSwap, FraxSwap, Maverick, DefiSwap

</details>

<details>
<summary><strong>🔷 Base (10 DEXes)</strong></summary>

Aerodrome, BaseSwap, SushiSwap, Uniswap V3, PancakeSwap V3, Balancer, Curve, SwapBased, AlienBase, DackieSwap

</details>

<details>
<summary><strong>🔴 Optimism (6 DEXes)</strong></summary>

Velodrome V2, Uniswap V3, SushiSwap, Curve, Beethoven X, KyberSwap

</details>

<details>
<summary><strong>🟣 Polygon (6 DEXes)</strong></summary>

QuickSwap V3, Uniswap V3, SushiSwap, Balancer V2, Curve, DODO

</details>

<details>
<summary><strong>🟡 BSC (5 DEXes)</strong></summary>

PancakeSwap V2, PancakeSwap V3, BiSwap, DODO, ApeSwap

</details>

---

## 📖 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **MetaMask** browser extension
- **Alchemy** or **Infura** API key (free tier works)
- **Biconomy** account for gasless execution (optional but recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/crypto-arb-pro.git
cd crypto-arb-pro
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
# Required
ALCHEMY_API_KEY=your_alchemy_key
PRIVATE_KEY=your_wallet_private_key

# Recommended
INFURA_API_KEY=your_infura_key
BICONOMY_API_KEY=your_biconomy_key

# Start with testnet
NETWORK_MODE=testnet
AUTO_EXECUTE=false
MIN_PROFIT_USD=1
```

### 4. Deploy Smart Contracts (Testnet)

```bash
npx hardhat run scripts/deploy.js --network arbitrumSepolia
```

Copy the deployed addresses into your `.env` file.

### 5. Run

```bash
# Terminal 1 — Backend (scanner + executor)
npm run server

# Terminal 2 — Frontend (dashboard)
npm run dev
```

### 6. Open Dashboard

Navigate to **http://localhost:3000** in your browser.

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ALCHEMY_API_KEY` | ✅ | Alchemy API key for reliable RPC |
| `PRIVATE_KEY` | ✅ | Wallet private key (for contract deployment and execution) |
| `INFURA_API_KEY` | ⚡ | Infura API key (fallback RPC) |
| `BICONOMY_API_KEY` | ⚡ | Biconomy Paymaster key (for gasless execution) |
| `BICONOMY_PAYMASTER_URL` | ⚡ | Biconomy Paymaster URL |
| `BUNDLER_URL` | ⚡ | Biconomy Bundler URL |
| `NETWORK_MODE` | - | `testnet` or `mainnet` (default: `testnet`) |
| `AUTO_EXECUTE` | - | `true` or `false` (default: `false`) |
| `MIN_PROFIT_USD` | - | Minimum profit threshold (default: `1`) |
| `SLIPPAGE_TOLERANCE` | - | Slippage tolerance, e.g., `0.005` for 0.5% |
| `MAX_GAS_PRICE_GWEI` | - | Max gas price safety limit (default: `0.5`) |
| `FLASHBOTS_RELAY` | - | Flashbots relay URL for MEV protection |

### Execution Modes

| Mode | Description | Config |
|------|-------------|--------|
| **Manual** | You select opportunities and click Execute | `AUTO_EXECUTE=false` |
| **Auto** | Server bot executes any opportunity above threshold | `AUTO_EXECUTE=true` + `MIN_PROFIT_USD=5` |

### Network Modes

| Mode | Description | Config |
|------|-------------|--------|
| **Testnet** | Uses Arbitrum Sepolia, no real funds at risk | `NETWORK_MODE=testnet` |
| **Mainnet** | Real execution on Arbitrum One | `NETWORK_MODE=mainnet` |

Both can be toggled live in the UI without restarting.

---

## 🚀 Deployment

### Deploy to Arbitrum Mainnet

```bash
# 1. Set NETWORK_MODE=mainnet in .env
# 2. Ensure you have ETH on Arbitrum for deployment gas

npx hardhat run scripts/deploy.js --network arbitrumOne

# 3. Verify contracts on Arbiscan
npx hardhat verify --network arbitrumOne DEPLOYED_ADDRESS "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb"
```

### Set Up Biconomy Paymaster

1. Go to [dashboard.biconomy.io](https://dashboard.biconomy.io)
2. Create a new Paymaster on **Arbitrum (Chain ID: 42161)**
3. **Whitelist** your deployed contract addresses
4. **Fund** the Paymaster with gas credits (ETH)
5. Copy the API Key and Paymaster URL to your `.env`

### Production Server

```bash
# Build frontend
npm run build

# Run production
npm run start     # Frontend (port 3000)
npm run server    # Backend (port 3001)
```

---

## 📊 Dashboard Features

### 🎯 Live Opportunities
Real-time arbitrage opportunity detection with profit estimates, confidence scores, and one-click execution.

### 📈 Price Charts
Multi-DEX price comparison with spread visualization, time range selectors, and real-time updates.

### 🧮 Profit Calculator
Interactive profit calculator — input loan amount and spread to see fee breakdown and estimated profit.

### 📜 Execution History
Searchable, filterable history of all executed trades with TX links, profit tracking, and CSV export.

### ⚡ Execution Panel
Step-by-step execution progress with real-time status updates, TX confirmation, and auto-execute configuration.

### 🏦 DEX Overview
All 59 DEXes displayed with chain grouping, search/filter, type badges, and status indicators.

---

## 🛡️ Security

### Smart Contract Safety

- **Atomic Transactions**: All arbitrage happens in a single transaction. If unprofitable, it reverts — no funds lost.
- **Access Control**: Only the contract owner/operator can execute arbitrage.
- **Reentrancy Protection**: All contracts use OpenZeppelin's `ReentrancyGuard`.
- **Rescue Functions**: Owner can recover stuck tokens/ETH.
- **Pause Mechanism**: Emergency pause to stop all execution.

### Operational Safety

- **Private Key**: Stored in `.env`, never committed to git.
- **MEV Protection**: Flashbots integration prevents sandwich attacks.
- **Slippage Protection**: Configurable slippage tolerance on all swaps.
- **Min Profit Threshold**: Only executes if profit exceeds minimum after all fees.

> ⚠️ **IMPORTANT**: Always test on testnet first. Never use this software with funds you cannot afford to lose. DeFi arbitrage involves risks including smart contract bugs, oracle manipulation, and rapid price movements.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript, TailwindCSS |
| **State** | Zustand |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **Backend** | Node.js, Express, WebSocket (ws) |
| **Blockchain** | ethers.js v6, Hardhat |
| **Smart Contracts** | Solidity 0.8.20, OpenZeppelin |
| **Gasless** | Biconomy Paymaster (ERC-4337) |
| **MEV Protection** | Flashbots |
| **RPC** | Alchemy, Infura (with failover) |
| **Prices** | CoinGecko API (free) |

---

## 📁 Project Structure

```
crypto-arb-pro/
├── app/                          # Next.js frontend
│   ├── components/               # UI components (16 components)
│   │   ├── AnimatedNumber.tsx    # Smooth number transitions
│   │   ├── DexOverview.tsx       # 59 DEXes with chain grouping
│   │   ├── ExecutionHistory.tsx  # Searchable trade history
│   │   ├── ExecutionPanel.tsx    # Real execution + auto config
│   │   ├── GaugeChart.tsx        # SVG circular gauge
│   │   ├── Header.tsx            # MetaMask + network toggle
│   │   ├── NetworkSelector.tsx   # Testnet/Mainnet switch
│   │   ├── OpportunityDetail.tsx # Trade details + execute
│   │   ├── OpportunityTable.tsx  # Live opportunities list
│   │   ├── PriceChart.tsx        # Multi-DEX price charts
│   │   ├── ProfitCalculator.tsx  # Interactive calculator
│   │   └── StatsGrid.tsx         # Animated stat cards
│   ├── globals.css               # Design system + animations
│   ├── layout.tsx                # Root layout with fonts
│   └── page.tsx                  # Main page with 6 tabs
├── contracts/                    # Solidity smart contracts
│   ├── FlashLoanArbitrage.sol    # Aave V3 flash loan arb
│   ├── FlashSwapArbitrage.sol    # Uniswap V2 flash swap arb
│   ├── FlashMintArbitrage.sol    # MakerDAO DAI flash mint arb
│   └── MultiHopRouter.sol        # Multi-step swap router
├── lib/                          # Frontend libraries
│   ├── store.ts                  # Zustand state management
│   ├── wallet.ts                 # MetaMask connection
│   └── websocket.ts              # Real-time communication
├── server/                       # Backend server
│   ├── dex/
│   │   └── abis.js               # 59 DEX configs + ABIs
│   ├── services/
│   │   ├── arbitrage-engine.js   # Opportunity detection
│   │   ├── dex-prices.js         # On-chain price fetching
│   │   ├── executor.js           # Transaction execution
│   │   ├── paymaster.js          # Biconomy gas sponsorship
│   │   ├── price-feed.js         # CoinGecko live prices
│   │   ├── rpc-manager.js        # Multi-RPC with failover
│   │   └── scanner.js            # Multi-chain scanner
│   └── index.js                  # Express + WebSocket server
├── scripts/
│   └── deploy.js                 # Contract deployment
├── .env.example                  # Environment template
├── hardhat.config.js             # Hardhat configuration
└── package.json                  # Dependencies
```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ⚡ for the DeFi community**

*Flash Loans • Flash Swaps • Flash Mint • Zero Gas Fees*

</div>
