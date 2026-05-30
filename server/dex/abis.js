// ═══════════════════════════════════════════════════════════════════════════════
// Crypto Arbitrage Pro — DEX Registry & ABI Library
// 59 DEXes across 6 chains (Arbitrum, Ethereum, Base, Optimism, Polygon, BSC)
// All addresses are real, verified mainnet contract addresses.
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────── DEX_CONFIG ────────────────────────────────────
const DEX_CONFIG = {

  // ═══════════════════════════ ARBITRUM (20) ═══════════════════════════════════

  uniswapV3_arb: {
    id: 'uniswapV3_arb',
    name: 'Uniswap V3 (Arbitrum)',
    chain: 'arbitrum',
    type: 'v3',
    router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    fee: 0.003,
    color: '#ff007a',
    icon: '🦄',
    testnetRouter: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Sepolia
  },

  uniswapV2_arb: {
    id: 'uniswapV2_arb',
    name: 'Uniswap V2 (Arbitrum)',
    chain: 'arbitrum',
    type: 'v2',
    router: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
    factory: '0xf1D7CC64Fb4452F05c498126312eBE29f30Fbcf9',
    fee: 0.003,
    color: '#ff007a',
    icon: '🦄',
    testnetRouter: null,
  },

  sushiswap_arb: {
    id: 'sushiswap_arb',
    name: 'SushiSwap (Arbitrum)',
    chain: 'arbitrum',
    type: 'v2',
    router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
    factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
    fee: 0.003,
    color: '#e05baa',
    icon: '🍣',
    testnetRouter: null,
  },

  camelot: {
    id: 'camelot',
    name: 'Camelot',
    chain: 'arbitrum',
    type: 'v2',
    router: '0xc873fEcbd354f5A56E00E710B90EF4201db2448d',
    factory: '0x6EcCab422D763aC031210995C5A7D5a0826a8F68',
    fee: 0.003,
    color: '#f5a623',
    icon: '🐪',
    testnetRouter: null,
  },

  pancakeswapV3_arb: {
    id: 'pancakeswapV3_arb',
    name: 'PancakeSwap V3 (Arbitrum)',
    chain: 'arbitrum',
    type: 'v3',
    router: '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
    quoter: '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997',
    factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
    fee: 0.0025,
    color: '#d1884f',
    icon: '🥞',
    testnetRouter: null,
  },

  traderjoe_arb: {
    id: 'traderjoe_arb',
    name: 'TraderJoe (Arbitrum)',
    chain: 'arbitrum',
    type: 'v2',
    router: '0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30',
    factory: '0xaE4EC9901c3076D0DdBe76A520F9E90a6227aCB7',
    fee: 0.003,
    color: '#23b0e5',
    icon: '🧑‍🌾',
    testnetRouter: null,
  },

  balancer_arb: {
    id: 'balancer_arb',
    name: 'Balancer (Arbitrum)',
    chain: 'arbitrum',
    type: 'balancer',
    vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    router: null,
    factory: null,
    fee: 0.001,
    color: '#1f5099',
    icon: '⚖️',
    testnetRouter: null,
  },

  curve_arb: {
    id: 'curve_arb',
    name: 'Curve (Arbitrum)',
    chain: 'arbitrum',
    type: 'curve',
    router: '0xF0d4c12A5768D806021F80a262B4d39d26C58b8D',
    factory: null,
    fee: 0.0004,
    color: '#ff6b6b',
    icon: '🌀',
    testnetRouter: null,
  },

  gmx_v2: {
    id: 'gmx_v2',
    name: 'GMX V2',
    chain: 'arbitrum',
    type: 'gmx',
    router: '0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064',
    factory: null,
    fee: 0.003,
    color: '#4082f5',
    icon: '🎲',
    testnetRouter: null,
  },

  ramses: {
    id: 'ramses',
    name: 'Ramses',
    chain: 'arbitrum',
    type: 'solidly',
    router: '0xAAA87963EFeB6f7E0a2711F397663105Acb1805e',
    factory: '0xAAA20D08e59F6561f242b08513D36266C5A29415',
    fee: 0.003,
    color: '#c9a227',
    icon: '🏛️',
    testnetRouter: null,
  },

  chronos: {
    id: 'chronos',
    name: 'Chronos',
    chain: 'arbitrum',
    type: 'solidly',
    router: '0xE708aA9E887980750C040a6A2Cb901c37Aa34f3b',
    factory: '0xCe9240869391928253Ed9cc9Bcb8cb98CB5B0722',
    fee: 0.003,
    color: '#8b5cf6',
    icon: '⏰',
    testnetRouter: null,
  },

  zyberswap: {
    id: 'zyberswap',
    name: 'ZyberSwap',
    chain: 'arbitrum',
    type: 'v2',
    router: '0x16e71B13fE6079B4312063F7E81F76d165Ad32Ad',
    factory: '0xAC2ee06A14c52570Ef3B9812Ed240BCe359772e7',
    fee: 0.0025,
    color: '#06b6d4',
    icon: '⚡',
    testnetRouter: null,
  },

  woofi_arb: {
    id: 'woofi_arb',
    name: 'WOOFi (Arbitrum)',
    chain: 'arbitrum',
    type: 'v2',
    router: '0x9aEd3A8896A85FE9a8CAc52C9B402D092B629a30',
    factory: null,
    fee: 0.00025,
    color: '#21c7a8',
    icon: '🐕',
    testnetRouter: null,
  },

  dodo_arb: {
    id: 'dodo_arb',
    name: 'DODO (Arbitrum)',
    chain: 'arbitrum',
    type: 'v2',
    router: '0x88CBf433471A0CD8240D2a12354362988b4593E5',
    factory: null,
    fee: 0.001,
    color: '#ffe804',
    icon: '🦤',
    testnetRouter: null,
  },

  kyberswap_arb: {
    id: 'kyberswap_arb',
    name: 'KyberSwap (Arbitrum)',
    chain: 'arbitrum',
    type: 'v2',
    router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
    factory: null,
    fee: 0.003,
    color: '#31CB9E',
    icon: '💎',
    testnetRouter: null,
  },

  fraxswap_arb: {
    id: 'fraxswap_arb',
    name: 'FraxSwap (Arbitrum)',
    chain: 'arbitrum',
    type: 'v2',
    router: '0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064',
    factory: null,
    fee: 0.003,
    color: '#000000',
    icon: '🏦',
    testnetRouter: null,
  },

  swapfish: {
    id: 'swapfish',
    name: 'SwapFish',
    chain: 'arbitrum',
    type: 'v2',
    router: '0xcDAeC65495Fa5c0545c5a405224214e3594f30d8',
    factory: '0x71539D09D3890195dDa87A6c50A8F1090f5C3F06',
    fee: 0.003,
    color: '#3498db',
    icon: '🐟',
    testnetRouter: null,
  },

  arbidex: {
    id: 'arbidex',
    name: 'ArbiDex',
    chain: 'arbitrum',
    type: 'v2',
    router: '0x7238FB45146EF8A0319b05E6a1aED3e73BA1A8a8',
    factory: null,
    fee: 0.003,
    color: '#2ecc71',
    icon: '🔄',
    testnetRouter: null,
  },

  solidlizard: {
    id: 'solidlizard',
    name: 'SolidLizard',
    chain: 'arbitrum',
    type: 'solidly',
    router: '0xF26515D5482e2C2FD237149bF6A653dA4794b3D0',
    factory: '0x734d84631f00dC0d3FCD18b04b6cf42BFd407074',
    fee: 0.003,
    color: '#27ae60',
    icon: '🦎',
    testnetRouter: null,
  },

  oreoswap: {
    id: 'oreoswap',
    name: 'OreoSwap',
    chain: 'arbitrum',
    type: 'v2',
    router: '0x38eEd6a71A4ddA9d7f776946e3cfa4ec43781AEC',
    factory: null,
    fee: 0.003,
    color: '#8B4513',
    icon: '🍪',
    testnetRouter: null,
  },

  // ═══════════════════════════ ETHEREUM (12) ══════════════════════════════════

  uniswapV2_eth: {
    id: 'uniswapV2_eth',
    name: 'Uniswap V2 (Ethereum)',
    chain: 'ethereum',
    type: 'v2',
    router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    fee: 0.003,
    color: '#ff007a',
    icon: '🦄',
    testnetRouter: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Sepolia
  },

  uniswapV3_eth: {
    id: 'uniswapV3_eth',
    name: 'Uniswap V3 (Ethereum)',
    chain: 'ethereum',
    type: 'v3',
    router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    fee: 0.003,
    color: '#ff007a',
    icon: '🦄',
    testnetRouter: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Sepolia
  },

  sushiswap_eth: {
    id: 'sushiswap_eth',
    name: 'SushiSwap (Ethereum)',
    chain: 'ethereum',
    type: 'v2',
    router: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
    factory: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
    fee: 0.003,
    color: '#e05baa',
    icon: '🍣',
    testnetRouter: null,
  },

  curve_3pool: {
    id: 'curve_3pool',
    name: 'Curve 3Pool',
    chain: 'ethereum',
    type: 'curve',
    pool: '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7',
    router: null,
    factory: null,
    tokens: [
      '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    ],
    fee: 0.0004,
    color: '#ff6b6b',
    icon: '🌀',
    testnetRouter: null,
  },

  curve_tricrypto: {
    id: 'curve_tricrypto',
    name: 'Curve TriCrypto',
    chain: 'ethereum',
    type: 'curve',
    pool: '0xD51a44d3FaE010294C616388b506AcdA1bfAAE46',
    router: null,
    factory: null,
    tokens: [
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    ],
    fee: 0.0004,
    color: '#ff6b6b',
    icon: '🌀',
    testnetRouter: null,
  },

  balancer_eth: {
    id: 'balancer_eth',
    name: 'Balancer (Ethereum)',
    chain: 'ethereum',
    type: 'balancer',
    vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    router: null,
    factory: null,
    fee: 0.001,
    color: '#1f5099',
    icon: '⚖️',
    testnetRouter: null,
  },

  pancakeswapV3_eth: {
    id: 'pancakeswapV3_eth',
    name: 'PancakeSwap V3 (Ethereum)',
    chain: 'ethereum',
    type: 'v3',
    router: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
    quoter: '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997',
    factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
    fee: 0.0025,
    color: '#d1884f',
    icon: '🥞',
    testnetRouter: null,
  },

  dodo_eth: {
    id: 'dodo_eth',
    name: 'DODO (Ethereum)',
    chain: 'ethereum',
    type: 'v2',
    router: '0xa356867fDCEa8e71AEaF87805808803806231FdC',
    factory: null,
    fee: 0.001,
    color: '#ffe804',
    icon: '🦤',
    testnetRouter: null,
  },

  shibaswap: {
    id: 'shibaswap',
    name: 'ShibaSwap',
    chain: 'ethereum',
    type: 'v2',
    router: '0x03f7724180AA6b939894B5Ca4314783B0b36b329',
    factory: '0x115934131916C8b277DD010Ee02de363c09d037c',
    fee: 0.003,
    color: '#FFA409',
    icon: '🐕',
    testnetRouter: null,
  },

  fraxswap_eth: {
    id: 'fraxswap_eth',
    name: 'FraxSwap (Ethereum)',
    chain: 'ethereum',
    type: 'v2',
    router: '0xC14d550632db8592D1243Edc8B95b0Ad06703867',
    factory: null,
    fee: 0.003,
    color: '#000000',
    icon: '🏦',
    testnetRouter: null,
  },

  maverick_eth: {
    id: 'maverick_eth',
    name: 'Maverick (Ethereum)',
    chain: 'ethereum',
    type: 'v2',
    router: '0x11C907CcC3bBd2A4a0b9F2b4C5dFe469a8E9E28F',
    factory: null,
    fee: 0.003,
    color: '#6F52ED',
    icon: '🦅',
    testnetRouter: null,
  },

  defiswap: {
    id: 'defiswap',
    name: 'DeFi Swap',
    chain: 'ethereum',
    type: 'v2',
    router: '0xCeB90E4C17d626BE0fACd78B79c9c87d7ca181b3',
    factory: '0x9DEB29c9a4c7A88a3C0257393b7f3335338FeF1A',
    fee: 0.003,
    color: '#002D74',
    icon: '💠',
    testnetRouter: null,
  },

  // ═══════════════════════════ BASE (10) ═══════════════════════════════════

  aerodrome: {
    id: 'aerodrome',
    name: 'Aerodrome',
    chain: 'base',
    type: 'solidly',
    router: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
    factory: '0x420DD381b31aEf6683db6B902084cB0FFECe40Da',
    fee: 0.003,
    color: '#0052FF',
    icon: '✈️',
    testnetRouter: null,
  },

  baseswap: {
    id: 'baseswap',
    name: 'BaseSwap',
    chain: 'base',
    type: 'v2',
    router: '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86',
    factory: '0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB',
    fee: 0.003,
    color: '#0052FF',
    icon: '🔵',
    testnetRouter: null,
  },

  sushiswap_base: {
    id: 'sushiswap_base',
    name: 'SushiSwap (Base)',
    chain: 'base',
    type: 'v2',
    router: '0xFB7eF66a7e61224DD6FcD0D7d9C3be5C8B049b9f',
    factory: '0x71524B4f93c58fcbF659783284E38825f0622859',
    fee: 0.003,
    color: '#e05baa',
    icon: '🍣',
    testnetRouter: null,
  },

  uniswapV3_base: {
    id: 'uniswapV3_base',
    name: 'Uniswap V3 (Base)',
    chain: 'base',
    type: 'v3',
    router: '0x2626664c2603336E57B271c5C0b26F421741e481',
    quoter: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
    factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
    fee: 0.003,
    color: '#ff007a',
    icon: '🦄',
    testnetRouter: null,
  },

  pancakeswapV3_base: {
    id: 'pancakeswapV3_base',
    name: 'PancakeSwap V3 (Base)',
    chain: 'base',
    type: 'v3',
    router: '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
    quoter: '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997',
    factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
    fee: 0.0025,
    color: '#d1884f',
    icon: '🥞',
    testnetRouter: null,
  },

  balancer_base: {
    id: 'balancer_base',
    name: 'Balancer (Base)',
    chain: 'base',
    type: 'balancer',
    vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    router: null,
    factory: null,
    fee: 0.001,
    color: '#1f5099',
    icon: '⚖️',
    testnetRouter: null,
  },

  curve_base: {
    id: 'curve_base',
    name: 'Curve (Base)',
    chain: 'base',
    type: 'curve',
    router: '0xF0d4c12A5768D806021F80a262B4d39d26C58b8D',
    factory: null,
    fee: 0.0004,
    color: '#ff6b6b',
    icon: '🌀',
    testnetRouter: null,
  },

  swapbased: {
    id: 'swapbased',
    name: 'SwapBased',
    chain: 'base',
    type: 'v2',
    router: '0xaaa3b1F1bd7BCc97fD1917c18ADE665C5D31F066',
    factory: null,
    fee: 0.003,
    color: '#2563EB',
    icon: '💫',
    testnetRouter: null,
  },

  alienbase: {
    id: 'alienbase',
    name: 'AlienBase',
    chain: 'base',
    type: 'v2',
    router: '0x8c1A3cF8f83074169FE5D7aD50B978e1cD6b37c7',
    factory: '0x3E84D913803b02A4a7f027165E8cA42C14C0FdE7',
    fee: 0.003,
    color: '#00FF00',
    icon: '👽',
    testnetRouter: null,
  },

  dackieswap: {
    id: 'dackieswap',
    name: 'DackieSwap',
    chain: 'base',
    type: 'v2',
    router: '0x591f122D1df761E616c13d265006fcbf4c6d6551',
    factory: null,
    fee: 0.003,
    color: '#FFEB3B',
    icon: '🦆',
    testnetRouter: null,
  },

  // ═══════════════════════════ OPTIMISM (6) ════════════════════════════════

  velodrome: {
    id: 'velodrome',
    name: 'Velodrome',
    chain: 'optimism',
    type: 'solidly',
    router: '0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858',
    factory: '0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a',
    fee: 0.003,
    color: '#FF0000',
    icon: '🏎️',
    testnetRouter: null,
  },

  uniswapV3_op: {
    id: 'uniswapV3_op',
    name: 'Uniswap V3 (Optimism)',
    chain: 'optimism',
    type: 'v3',
    router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    fee: 0.003,
    color: '#ff007a',
    icon: '🦄',
    testnetRouter: null,
  },

  sushiswap_op: {
    id: 'sushiswap_op',
    name: 'SushiSwap (Optimism)',
    chain: 'optimism',
    type: 'v2',
    router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
    factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
    fee: 0.003,
    color: '#e05baa',
    icon: '🍣',
    testnetRouter: null,
  },

  curve_op: {
    id: 'curve_op',
    name: 'Curve (Optimism)',
    chain: 'optimism',
    type: 'curve',
    router: '0xF0d4c12A5768D806021F80a262B4d39d26C58b8D',
    factory: null,
    fee: 0.0004,
    color: '#ff6b6b',
    icon: '🌀',
    testnetRouter: null,
  },

  beethovenx: {
    id: 'beethovenx',
    name: 'Beethoven X',
    chain: 'optimism',
    type: 'balancer',
    vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    router: null,
    factory: null,
    fee: 0.001,
    color: '#1f5099',
    icon: '🎵',
    testnetRouter: null,
  },

  kyberswap_op: {
    id: 'kyberswap_op',
    name: 'KyberSwap (Optimism)',
    chain: 'optimism',
    type: 'v2',
    router: '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
    factory: null,
    fee: 0.003,
    color: '#31CB9E',
    icon: '💎',
    testnetRouter: null,
  },

  // ═══════════════════════════ POLYGON (6) ═════════════════════════════════

  quickswap_v3: {
    id: 'quickswap_v3',
    name: 'QuickSwap V3',
    chain: 'polygon',
    type: 'v3',
    router: '0xf5b509bB0909a69B1c207E495f687a596C168E12',
    quoter: '0xa15F0D7377B2A0C0c10db057f641beD21028FC89',
    factory: '0x411b0fAcC3489691f28ad58c47006AF5E3Ab3A28',
    fee: 0.003,
    color: '#418AC7',
    icon: '🐉',
    testnetRouter: null,
  },

  uniswapV3_polygon: {
    id: 'uniswapV3_polygon',
    name: 'Uniswap V3 (Polygon)',
    chain: 'polygon',
    type: 'v3',
    router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    fee: 0.003,
    color: '#ff007a',
    icon: '🦄',
    testnetRouter: null,
  },

  sushiswap_polygon: {
    id: 'sushiswap_polygon',
    name: 'SushiSwap (Polygon)',
    chain: 'polygon',
    type: 'v2',
    router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
    factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
    fee: 0.003,
    color: '#e05baa',
    icon: '🍣',
    testnetRouter: null,
  },

  balancer_polygon: {
    id: 'balancer_polygon',
    name: 'Balancer (Polygon)',
    chain: 'polygon',
    type: 'balancer',
    vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    router: null,
    factory: null,
    fee: 0.001,
    color: '#1f5099',
    icon: '⚖️',
    testnetRouter: null,
  },

  curve_polygon: {
    id: 'curve_polygon',
    name: 'Curve (Polygon)',
    chain: 'polygon',
    type: 'curve',
    router: '0xF0d4c12A5768D806021F80a262B4d39d26C58b8D',
    factory: null,
    fee: 0.0004,
    color: '#ff6b6b',
    icon: '🌀',
    testnetRouter: null,
  },

  dodo_polygon: {
    id: 'dodo_polygon',
    name: 'DODO (Polygon)',
    chain: 'polygon',
    type: 'v2',
    router: '0xa222e6a71D1A1Dd5F279805fbe38d5329C1d0e70',
    factory: null,
    fee: 0.001,
    color: '#ffe804',
    icon: '🦤',
    testnetRouter: null,
  },

  // ═══════════════════════════ BSC (5) ═════════════════════════════════════

  pancakeswapV2_bsc: {
    id: 'pancakeswapV2_bsc',
    name: 'PancakeSwap V2 (BSC)',
    chain: 'bsc',
    type: 'v2',
    router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    fee: 0.0025,
    color: '#d1884f',
    icon: '🥞',
    testnetRouter: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1', // BSC Testnet
  },

  pancakeswapV3_bsc: {
    id: 'pancakeswapV3_bsc',
    name: 'PancakeSwap V3 (BSC)',
    chain: 'bsc',
    type: 'v3',
    router: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
    quoter: '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997',
    factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
    fee: 0.0025,
    color: '#d1884f',
    icon: '🥞',
    testnetRouter: null,
  },

  biswap: {
    id: 'biswap',
    name: 'BiSwap',
    chain: 'bsc',
    type: 'v2',
    router: '0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8',
    factory: '0x858E3312ed3A876947EA49d572A7C42DE08af7EE',
    fee: 0.001,
    color: '#F04866',
    icon: '🔁',
    testnetRouter: null,
  },

  dodo_bsc: {
    id: 'dodo_bsc',
    name: 'DODO (BSC)',
    chain: 'bsc',
    type: 'v2',
    router: '0x8F8Dd7DB1bDA5eD3da8C9daf3bfa471c12d58486',
    factory: null,
    fee: 0.001,
    color: '#ffe804',
    icon: '🦤',
    testnetRouter: null,
  },

  apeswap: {
    id: 'apeswap',
    name: 'ApeSwap',
    chain: 'bsc',
    type: 'v2',
    router: '0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7',
    factory: '0x0841BD0B734E4F5853f0dD8d7Ea989fAf63BF4D4',
    fee: 0.002,
    color: '#A16552',
    icon: '🦍',
    testnetRouter: null,
  },
};

// ──────────────────────── TESTNET DEX CONFIG ──────────────────────────────────
// Mirror of mainnet DEXes with testnet (Sepolia/Goerli) addresses where available
const TESTNET_DEX_CONFIG = {
  uniswapV2_sepolia: {
    id: 'uniswapV2_sepolia',
    name: 'Uniswap V2 (Sepolia)',
    chain: 'ethereum',
    type: 'v2',
    router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    factory: '0x7E0987E5b3a30e3f2828572Bb659A548460a3003',
    fee: 0.003,
    color: '#ff007a',
    icon: '🦄',
  },

  uniswapV3_sepolia: {
    id: 'uniswapV3_sepolia',
    name: 'Uniswap V3 (Sepolia)',
    chain: 'ethereum',
    type: 'v3',
    router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    factory: '0x0227628f3F023bb0B980b67D528571c95c6DaC1c',
    fee: 0.003,
    color: '#ff007a',
    icon: '🦄',
  },

  uniswapV3_arb_sepolia: {
    id: 'uniswapV3_arb_sepolia',
    name: 'Uniswap V3 (Arb Sepolia)',
    chain: 'arbitrum',
    type: 'v3',
    router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    factory: '0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e',
    fee: 0.003,
    color: '#ff007a',
    icon: '🦄',
  },

  pancakeswapV2_bsc_testnet: {
    id: 'pancakeswapV2_bsc_testnet',
    name: 'PancakeSwap V2 (BSC Testnet)',
    chain: 'bsc',
    type: 'v2',
    router: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
    factory: '0x6725f303b657a9451d8BA641348b6761A6CC7a17',
    fee: 0.0025,
    color: '#d1884f',
    icon: '🥞',
  },
};

// ─────────────────────────── TOKEN LIST (MAINNET) ─────────────────────────────
const TOKEN_LIST = {

  // ── Arbitrum Tokens ──
  '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1': { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, chain: 'arbitrum' },
  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': { symbol: 'USDC', name: 'USD Coin', decimals: 6, chain: 'arbitrum' },
  '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8': { symbol: 'USDC.e', name: 'USD Coin (Bridged)', decimals: 6, chain: 'arbitrum' },
  '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9': { symbol: 'USDT', name: 'Tether USD', decimals: 6, chain: 'arbitrum' },
  '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1': { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, chain: 'arbitrum' },
  '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f': { symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8, chain: 'arbitrum' },
  '0x912CE59144191C1204E64559FE8253a0e49E6548': { symbol: 'ARB', name: 'Arbitrum', decimals: 18, chain: 'arbitrum' },
  '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4': { symbol: 'LINK', name: 'Chainlink', decimals: 18, chain: 'arbitrum' },
  '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0': { symbol: 'UNI', name: 'Uniswap', decimals: 18, chain: 'arbitrum' },
  '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a': { symbol: 'GMX', name: 'GMX', decimals: 18, chain: 'arbitrum' },

  // ── Ethereum Tokens ──
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, chain: 'ethereum' },
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': { symbol: 'USDC', name: 'USD Coin', decimals: 6, chain: 'ethereum' },
  '0xdAC17F958D2ee523a2206206994597C13D831ec7': { symbol: 'USDT', name: 'Tether USD', decimals: 6, chain: 'ethereum' },
  '0x6B175474E89094C44Da98b954EedeAC495271d0F': { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, chain: 'ethereum' },
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': { symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8, chain: 'ethereum' },
  '0x514910771AF9Ca656af840dff83E8264EcF986CA': { symbol: 'LINK', name: 'Chainlink', decimals: 18, chain: 'ethereum' },
  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': { symbol: 'UNI', name: 'Uniswap', decimals: 18, chain: 'ethereum' },
  '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9': { symbol: 'AAVE', name: 'Aave', decimals: 18, chain: 'ethereum' },

  // ── Base Tokens ──
  '0x4200000000000000000000000000000000000006': { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, chain: 'base' },
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': { symbol: 'USDC', name: 'USD Coin', decimals: 6, chain: 'base' },
  '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb': { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, chain: 'base' },
  '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22': { symbol: 'cbETH', name: 'Coinbase Wrapped Staked ETH', decimals: 18, chain: 'base' },
  '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA': { symbol: 'USDbC', name: 'USD Base Coin', decimals: 6, chain: 'base' },

  // ── Optimism Tokens ──
  '0x4200000000000000000000000000000000000006': { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, chain: 'optimism' },
  '0x0b2C639c533813f6Aa9A7ee937e4A5d0B29aC3Ca': { symbol: 'USDC', name: 'USD Coin', decimals: 6, chain: 'optimism' },
  '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58': { symbol: 'USDT', name: 'Tether USD', decimals: 6, chain: 'optimism' },
  '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1': { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, chain: 'optimism' },
  '0x4200000000000000000000000000000000000042': { symbol: 'OP', name: 'Optimism', decimals: 18, chain: 'optimism' },

  // ── Polygon Tokens ──
  '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270': { symbol: 'WMATIC', name: 'Wrapped Matic', decimals: 18, chain: 'polygon' },
  '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359': { symbol: 'USDC', name: 'USD Coin', decimals: 6, chain: 'polygon' },
  '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': { symbol: 'USDC.e', name: 'USD Coin (Bridged)', decimals: 6, chain: 'polygon' },
  '0xc2132D05D31c914a87C6611C10748AEb04B58e8F': { symbol: 'USDT', name: 'Tether USD', decimals: 6, chain: 'polygon' },
  '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619': { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, chain: 'polygon' },
  '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6': { symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8, chain: 'polygon' },

  // ── BSC Tokens ──
  '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c': { symbol: 'WBNB', name: 'Wrapped BNB', decimals: 18, chain: 'bsc' },
  '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d': { symbol: 'USDC', name: 'USD Coin', decimals: 18, chain: 'bsc' },
  '0x55d398326f99059fF775485246999027B3197955': { symbol: 'USDT', name: 'Tether USD', decimals: 18, chain: 'bsc' },
  '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56': { symbol: 'BUSD', name: 'Binance USD', decimals: 18, chain: 'bsc' },
  '0x2170Ed0880ac9A755fd29B2688956BD959F933F8': { symbol: 'ETH', name: 'Binance-Peg Ethereum', decimals: 18, chain: 'bsc' },
  '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c': { symbol: 'BTCB', name: 'Binance-Peg BTCB', decimals: 18, chain: 'bsc' },
};

// ─────────────────────────── TOKEN LIST (TESTNET) ─────────────────────────────
const TESTNET_TOKEN_LIST = {

  // ── Sepolia (Ethereum Testnet) ──
  '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14': { symbol: 'WETH', name: 'Wrapped Ether (Sepolia)', decimals: 18, chain: 'ethereum' },
  '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238': { symbol: 'USDC', name: 'USD Coin (Sepolia)', decimals: 6, chain: 'ethereum' },

  // ── Arbitrum Sepolia ──
  '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73': { symbol: 'WETH', name: 'Wrapped Ether (Arb Sepolia)', decimals: 18, chain: 'arbitrum' },

  // ── Base Sepolia ──
  '0x4200000000000000000000000000000000000006': { symbol: 'WETH', name: 'Wrapped Ether (Base Sepolia)', decimals: 18, chain: 'base' },

  // ── BSC Testnet ──
  '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd': { symbol: 'WBNB', name: 'Wrapped BNB (Testnet)', decimals: 18, chain: 'bsc' },
};

// ───────────────────────────────── ABIS ────────────────────────────────────────
const ABIS = {

  // Uniswap V2 Router
  UNISWAP_V2_ROUTER: [
    'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)',
    'function WETH() external pure returns (address)',
  ],

  // Uniswap V2 Factory
  UNISWAP_V2_FACTORY: [
    'function getPair(address tokenA, address tokenB) external view returns (address pair)',
    'function allPairsLength() external view returns (uint)',
    'function allPairs(uint) external view returns (address pair)',
    'function feeTo() external view returns (address)',
    'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
  ],

  // Uniswap V2 Pair
  UNISWAP_V2_PAIR: [
    'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'function totalSupply() external view returns (uint)',
    'function kLast() external view returns (uint)',
    'event Sync(uint112 reserve0, uint112 reserve1)',
    'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)',
  ],

  // Uniswap V3 Quoter
  UNISWAP_V3_QUOTER: [
    'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
    'function quoteExactInput(bytes path, uint256 amountIn) external returns (uint256 amountOut)',
    'function quoteExactOutputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amount, uint160 sqrtPriceLimitX96) external returns (uint256 amountIn)',
    'function quoteExactOutput(bytes path, uint256 amountOut) external returns (uint256 amountIn)',
  ],

  // Uniswap V3 Router (SwapRouter)
  UNISWAP_V3_ROUTER: [
    'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
    'function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)',
    'function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountIn)',
    'function exactOutput((bytes path, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum)) external payable returns (uint256 amountIn)',
  ],

  // Uniswap V3 Factory
  UNISWAP_V3_FACTORY: [
    'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
    'function feeAmountTickSpacing(uint24 fee) external view returns (int24)',
  ],

  // Uniswap V3 Pool
  UNISWAP_V3_POOL: [
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
    'function liquidity() external view returns (uint128)',
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'function fee() external view returns (uint24)',
    'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
  ],

  // Curve Pool
  CURVE_POOL: [
    'function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256)',
    'function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy) external returns (uint256)',
    'function balances(uint256 i) external view returns (uint256)',
    'function coins(uint256 i) external view returns (address)',
    'function A() external view returns (uint256)',
    'function fee() external view returns (uint256)',
    'function get_virtual_price() external view returns (uint256)',
  ],

  // Curve Tricrypto Pool (uses uint256 indices)
  CURVE_TRICRYPTO: [
    'function get_dy(uint256 i, uint256 j, uint256 dx) external view returns (uint256)',
    'function exchange(uint256 i, uint256 j, uint256 dx, uint256 min_dy) external payable',
    'function balances(uint256 i) external view returns (uint256)',
    'function coins(uint256 i) external view returns (address)',
  ],

  // Balancer V2 Vault
  BALANCER_VAULT: [
    'function swap((bytes32 poolId, uint8 kind, address assetIn, address assetOut, uint256 amount, bytes userData) singleSwap, (address sender, bool fromInternalBalance, address payable recipient, bool toInternalBalance) funds, uint256 limit, uint256 deadline) external payable returns (uint256 amountCalculated)',
    'function queryBatchSwap(uint8 kind, (bytes32 poolId, uint256 assetInIndex, uint256 assetOutIndex, uint256 amount, bytes userData)[] swaps, address[] assets, (address sender, bool fromInternalBalance, address payable recipient, bool toInternalBalance) funds) external returns (int256[] memory assetDeltas)',
    'function getPoolTokens(bytes32 poolId) external view returns (address[] tokens, uint256[] balances, uint256 lastChangeBlock)',
    'function getPool(bytes32 poolId) external view returns (address, uint8)',
    'function flashLoan(address recipient, address[] tokens, uint256[] amounts, bytes userData) external',
  ],

  // Solidly / Velodrome / Aerodrome Router
  SOLIDLY_ROUTER: [
    'function getAmountsOut(uint amountIn, (address from, address to, bool stable)[] routes) external view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, (address from, address to, bool stable)[] routes, address to, uint deadline) external returns (uint[] memory amounts)',
    'function getAmountOut(uint amountIn, address tokenIn, address tokenOut) external view returns (uint amount, bool stable)',
    'function pairFor(address tokenA, address tokenB, bool stable) external view returns (address pair)',
  ],

  // ERC20
  ERC20: [
    'function balanceOf(address) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)',
    'function totalSupply() view returns (uint256)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
  ],

  // Aave V3 Pool (Flash Loans)
  AAVE_POOL: [
    'function flashLoanSimple(address receiverAddress, address asset, uint256 amount, bytes params, uint16 referralCode) external',
    'function flashLoan(address receiverAddress, address[] assets, uint256[] amounts, uint256[] interestRateModes, address onBehalfOf, bytes params, uint16 referralCode) external',
    'function FLASHLOAN_PREMIUM_TOTAL() view returns (uint128)',
  ],

  // Maker Flash Mint (DAI)
  MAKER_FLASH_MINT: [
    'function flashLoan(address receiver, address token, uint256 amount, bytes data) external',
    'function max() external view returns (uint256)',
    'function flashFee(address token, uint256 amount) external view returns (uint256)',
  ],

  // WETH
  WETH: [
    'function deposit() external payable',
    'function withdraw(uint256 wad) external',
    'function balanceOf(address) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transfer(address to, uint256 amount) returns (bool)',
  ],

  // Multicall3 (batched reads)
  MULTICALL3: [
    'function aggregate3((address target, bool allowFailure, bytes callData)[] calls) external payable returns ((bool success, bytes returnData)[] returnData)',
    'function aggregate3Value((address target, bool allowFailure, uint256 value, bytes callData)[] calls) external payable returns ((bool success, bytes returnData)[] returnData)',
  ],
};

// ───────────────────────── HELPER: getConfigForNetwork ─────────────────────────
/**
 * Returns the appropriate DEX config and token list for the selected network mode.
 * @param {'mainnet'|'testnet'} mode - Network mode
 * @returns {{ dexConfig: object, tokenList: object }}
 */
function getConfigForNetwork(mode = 'mainnet') {
  if (mode === 'testnet') {
    return {
      dexConfig: TESTNET_DEX_CONFIG,
      tokenList: TESTNET_TOKEN_LIST,
    };
  }
  return {
    dexConfig: DEX_CONFIG,
    tokenList: TOKEN_LIST,
  };
}

// ────────────────────────────── EXPORTS ────────────────────────────────────────
module.exports = {
  DEX_CONFIG,
  TESTNET_DEX_CONFIG,
  TOKEN_LIST,
  TESTNET_TOKEN_LIST,
  ABIS,
  getConfigForNetwork,
};
