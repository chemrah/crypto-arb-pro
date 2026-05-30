# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x     | ✅ Active |
| 1.x     | ❌ EOL    |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue.

Instead, please report it responsibly:

1. **Email**: Send details to the repository maintainer
2. **Include**: Steps to reproduce, potential impact, and any suggested fixes
3. **Response Time**: We aim to respond within 48 hours

## Security Best Practices

### For Users

- ⚠️ **Never share your private key** — Store it only in `.env`, never commit to git
- 🧪 **Test on testnet first** — Always validate on Arbitrum Sepolia before mainnet
- 💰 **Use a dedicated wallet** — Don't use your main wallet for arbitrage bot operations
- 🔒 **Audit before deploying** — Review smart contracts before deploying to mainnet
- ⛽ **Set gas limits** — Configure `MAX_GAS_PRICE_GWEI` to prevent excessive gas spending
- 📊 **Start with small amounts** — Set `MIN_PROFIT_USD` conservatively at first

### Smart Contract Security

- All contracts use **OpenZeppelin** audited libraries
- **ReentrancyGuard** on all external functions
- **Access control** via `Ownable` — only operator can execute
- **Atomic transactions** — failed trades revert entirely (no partial losses)
- **Rescue functions** — owner can recover stuck tokens

### .gitignore

The following sensitive files are excluded from version control:
- `.env` — API keys and private keys
- `node_modules/` — Dependencies
- `artifacts/` — Compiled contracts
- `cache/` — Hardhat cache

## Disclaimer

This software is provided "as is" without warranty. DeFi arbitrage involves financial risk. Users are responsible for their own funds and should never risk more than they can afford to lose.
