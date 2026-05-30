# Contributing to Crypto Arbitrage Pro

Thank you for your interest in contributing! This project is an open-source DeFi arbitrage platform, and we welcome contributions of all kinds.

## 🚀 Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/crypto-arb-pro.git
   cd crypto-arb-pro
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Create** a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📋 Development Guidelines

### Code Style

- **JavaScript/TypeScript**: Follow ESLint rules, use 2-space indentation
- **Solidity**: Follow Solhint rules, use NatSpec documentation
- **CSS**: Use TailwindCSS utility classes, follow existing design system
- **Comments**: Write code comments in English, UI text in Arabic (matching existing codebase)

### Commit Messages

Use conventional commits:
```
feat: add new DEX integration for Trader Joe
fix: correct price calculation in arbitrage engine
docs: update deployment guide
refactor: simplify scanner deduplication logic
test: add flash loan integration tests
```

### Pull Request Process

1. Update the README.md with details of your changes if applicable
2. Ensure all tests pass: `npx hardhat test`
3. Ensure the app builds: `npm run build`
4. Request a review from a maintainer

## 🏗️ Project Areas

### Adding a New DEX

1. Add DEX config to `server/dex/abis.js`:
   ```js
   { id: 'newdex_chain', name: 'NewDex', chain: 'arbitrum', type: 'v2', router: '0x...', factory: '0x...', fee: 0.003 }
   ```
2. If the DEX uses a non-standard AMM (not V2/V3/Curve/Balancer), add a pricing handler in `server/services/dex-prices.js`
3. Add the DEX to the UI in `app/components/DexOverview.tsx`

### Adding a New Chain

1. Add RPC endpoints to `server/services/rpc-manager.js`
2. Add chain config to `lib/wallet.ts` (SUPPORTED_CHAINS and CHAIN_PARAMS)
3. Add token addresses for the chain in `server/dex/abis.js`
4. Add chain color and icon to `app/globals.css` and component color maps

### Smart Contract Changes

1. Make changes in `contracts/`
2. Write tests in `test/`
3. Run tests: `npx hardhat test`
4. Deploy to testnet first: `npx hardhat run scripts/deploy.js --network arbitrumSepolia`

## ⚠️ Security

- **Never** commit private keys or API keys
- **Always** test on testnet before mainnet
- Report security vulnerabilities via email (not public issues)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
