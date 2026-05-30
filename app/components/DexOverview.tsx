'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const ALL_DEXES = [
  // Arbitrum (20)
  { id: 'uniswapV3_arb', name: 'Uniswap V3', chain: 'Arbitrum', type: 'V3', icon: '🦄', color: '#ff007a' },
  { id: 'uniswapV2_arb', name: 'Uniswap V2', chain: 'Arbitrum', type: 'V2', icon: '🦄', color: '#ff007a' },
  { id: 'sushiswap_arb', name: 'SushiSwap', chain: 'Arbitrum', type: 'V2', icon: '🍣', color: '#e05baa' },
  { id: 'camelot', name: 'Camelot', chain: 'Arbitrum', type: 'V2', icon: '🐪', color: '#f5a623' },
  { id: 'pancakeswapV3_arb', name: 'PancakeSwap V3', chain: 'Arbitrum', type: 'V3', icon: '🥞', color: '#d1884f' },
  { id: 'traderjoe_arb', name: 'TraderJoe', chain: 'Arbitrum', type: 'V2.1', icon: '🧑‍🌾', color: '#23b0e5' },
  { id: 'balancer_arb', name: 'Balancer', chain: 'Arbitrum', type: 'Bal', icon: '⚖️', color: '#1f5099' },
  { id: 'curve_arb', name: 'Curve', chain: 'Arbitrum', type: 'Curve', icon: '🌀', color: '#ff6b6b' },
  { id: 'gmx_v2', name: 'GMX V2', chain: 'Arbitrum', type: 'Perp', icon: '🎲', color: '#4082f5' },
  { id: 'ramses', name: 'Ramses', chain: 'Arbitrum', type: 'V3', icon: '🏛️', color: '#c9a227' },
  { id: 'chronos', name: 'Chronos', chain: 'Arbitrum', type: 'V2', icon: '⏰', color: '#8b5cf6' },
  { id: 'zyberswap', name: 'ZyberSwap', chain: 'Arbitrum', type: 'V2', icon: '⚡', color: '#06b6d4' },
  { id: 'woofi_arb', name: 'WOOFi', chain: 'Arbitrum', type: 'PMM', icon: '🐺', color: '#00c2a8' },
  { id: 'dodo_arb', name: 'DODO', chain: 'Arbitrum', type: 'PMM', icon: '🦤', color: '#ffe804' },
  { id: 'kyberswap_arb', name: 'KyberSwap', chain: 'Arbitrum', type: 'V3', icon: '💎', color: '#31cb9e' },
  { id: 'fraxswap_arb', name: 'FraxSwap', chain: 'Arbitrum', type: 'V2', icon: '🔷', color: '#000000' },
  { id: 'swapfish', name: 'SwapFish', chain: 'Arbitrum', type: 'V2', icon: '🐟', color: '#4fc3f7' },
  { id: 'arbidex', name: 'ArbiDex', chain: 'Arbitrum', type: 'V2', icon: '🔵', color: '#28a0f0' },
  { id: 'solidlizard', name: 'SolidLizard', chain: 'Arbitrum', type: 'Solidly', icon: '🦎', color: '#4caf50' },
  { id: 'oreoswap', name: 'OreoSwap', chain: 'Arbitrum', type: 'V2', icon: '🍪', color: '#8d6e63' },
  // Ethereum (12)
  { id: 'uniswapV2_eth', name: 'Uniswap V2', chain: 'Ethereum', type: 'V2', icon: '🦄', color: '#ff007a' },
  { id: 'uniswapV3_eth', name: 'Uniswap V3', chain: 'Ethereum', type: 'V3', icon: '🦄', color: '#ff007a' },
  { id: 'sushiswap_eth', name: 'SushiSwap', chain: 'Ethereum', type: 'V2', icon: '🍣', color: '#e05baa' },
  { id: 'curve_3pool', name: 'Curve 3Pool', chain: 'Ethereum', type: 'Curve', icon: '🌀', color: '#ff6b6b' },
  { id: 'curve_tricrypto', name: 'Curve TriCrypto', chain: 'Ethereum', type: 'Curve', icon: '🌀', color: '#ff6b6b' },
  { id: 'balancer_eth', name: 'Balancer', chain: 'Ethereum', type: 'Bal', icon: '⚖️', color: '#1f5099' },
  { id: 'pancakeswapV3_eth', name: 'PancakeSwap V3', chain: 'Ethereum', type: 'V3', icon: '🥞', color: '#d1884f' },
  { id: 'dodo_eth', name: 'DODO', chain: 'Ethereum', type: 'PMM', icon: '🦤', color: '#ffe804' },
  { id: 'shibaswap', name: 'ShibaSwap', chain: 'Ethereum', type: 'V2', icon: '🐕', color: '#ffa409' },
  { id: 'fraxswap_eth', name: 'FraxSwap', chain: 'Ethereum', type: 'V2', icon: '🔷', color: '#000000' },
  { id: 'maverick_eth', name: 'Maverick', chain: 'Ethereum', type: 'V2', icon: '🤠', color: '#7b3fe4' },
  { id: 'defiswap', name: 'DefiSwap', chain: 'Ethereum', type: 'V2', icon: '💠', color: '#103f68' },
  // Base (10)
  { id: 'aerodrome', name: 'Aerodrome', chain: 'Base', type: 'Solidly', icon: '✈️', color: '#0052ff' },
  { id: 'baseswap', name: 'BaseSwap', chain: 'Base', type: 'V2', icon: '🔵', color: '#0052ff' },
  { id: 'sushiswap_base', name: 'SushiSwap', chain: 'Base', type: 'V2', icon: '🍣', color: '#e05baa' },
  { id: 'uniswapV3_base', name: 'Uniswap V3', chain: 'Base', type: 'V3', icon: '🦄', color: '#ff007a' },
  { id: 'pancakeswapV3_base', name: 'PancakeSwap V3', chain: 'Base', type: 'V3', icon: '🥞', color: '#d1884f' },
  { id: 'balancer_base', name: 'Balancer', chain: 'Base', type: 'Bal', icon: '⚖️', color: '#1f5099' },
  { id: 'curve_base', name: 'Curve', chain: 'Base', type: 'Curve', icon: '🌀', color: '#ff6b6b' },
  { id: 'swapbased', name: 'SwapBased', chain: 'Base', type: 'V2', icon: '🔄', color: '#0052ff' },
  { id: 'alienbase', name: 'AlienBase', chain: 'Base', type: 'V2', icon: '👽', color: '#00ff88' },
  { id: 'dackieswap', name: 'DackieSwap', chain: 'Base', type: 'V3', icon: '🦆', color: '#ffcc00' },
  // Optimism (6)
  { id: 'velodrome', name: 'Velodrome V2', chain: 'Optimism', type: 'Solidly', icon: '🏎️', color: '#ff0420' },
  { id: 'uniswapV3_op', name: 'Uniswap V3', chain: 'Optimism', type: 'V3', icon: '🦄', color: '#ff007a' },
  { id: 'sushiswap_op', name: 'SushiSwap', chain: 'Optimism', type: 'V2', icon: '🍣', color: '#e05baa' },
  { id: 'curve_op', name: 'Curve', chain: 'Optimism', type: 'Curve', icon: '🌀', color: '#ff6b6b' },
  { id: 'beethovenx', name: 'Beethoven X', chain: 'Optimism', type: 'Bal', icon: '🎵', color: '#1f5099' },
  { id: 'kyberswap_op', name: 'KyberSwap', chain: 'Optimism', type: 'V3', icon: '💎', color: '#31cb9e' },
  // Polygon (6)
  { id: 'quickswap_v3', name: 'QuickSwap V3', chain: 'Polygon', type: 'V3', icon: '⚡', color: '#418ac9' },
  { id: 'uniswapV3_polygon', name: 'Uniswap V3', chain: 'Polygon', type: 'V3', icon: '🦄', color: '#ff007a' },
  { id: 'sushiswap_polygon', name: 'SushiSwap', chain: 'Polygon', type: 'V2', icon: '🍣', color: '#e05baa' },
  { id: 'balancer_polygon', name: 'Balancer', chain: 'Polygon', type: 'Bal', icon: '⚖️', color: '#1f5099' },
  { id: 'curve_polygon', name: 'Curve', chain: 'Polygon', type: 'Curve', icon: '🌀', color: '#ff6b6b' },
  { id: 'dodo_polygon', name: 'DODO', chain: 'Polygon', type: 'PMM', icon: '🦤', color: '#ffe804' },
  // BSC (5)
  { id: 'pancakeswapV2_bsc', name: 'PancakeSwap V2', chain: 'BSC', type: 'V2', icon: '🥞', color: '#d1884f' },
  { id: 'pancakeswapV3_bsc', name: 'PancakeSwap V3', chain: 'BSC', type: 'V3', icon: '🥞', color: '#d1884f' },
  { id: 'biswap', name: 'BiSwap', chain: 'BSC', type: 'V2', icon: '🔄', color: '#1263f1' },
  { id: 'dodo_bsc', name: 'DODO', chain: 'BSC', type: 'PMM', icon: '🦤', color: '#ffe804' },
  { id: 'apeswap', name: 'ApeSwap', chain: 'BSC', type: 'V2', icon: '🦍', color: '#a16552' },
];

const CHAIN_COLORS: Record<string, string> = {
  Arbitrum: '#28A0F0',
  Ethereum: '#627EEA',
  Base: '#0052FF',
  Optimism: '#FF0420',
  Polygon: '#8247E5',
  BSC: '#F0B90B',
};

const CHAIN_ICONS: Record<string, string> = {
  Arbitrum: '🔵',
  Ethereum: '💎',
  Base: '🔷',
  Optimism: '🔴',
  Polygon: '🟣',
  BSC: '🟡',
};

export function DexOverview() {
  const [search, setSearch] = useState('');
  const [selectedChain, setSelectedChain] = useState<string>('all');

  const chains = [...new Set(ALL_DEXES.map((d) => d.chain))];

  const filtered = ALL_DEXES.filter((dex) => {
    const matchesSearch = dex.name.toLowerCase().includes(search.toLowerCase()) ||
                         dex.chain.toLowerCase().includes(search.toLowerCase());
    const matchesChain = selectedChain === 'all' || dex.chain === selectedChain;
    return matchesSearch && matchesChain;
  });

  const grouped = chains.reduce((acc, chain) => {
    acc[chain] = filtered.filter((d) => d.chain === chain);
    return acc;
  }, {} as Record<string, typeof ALL_DEXES>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">🏦 المنصات اللامركزية</h2>
            <p className="text-sm text-gray-400 mt-1">
              <span className="text-accent-cyan font-bold text-lg">{ALL_DEXES.length}</span> منصة نشطة عبر{' '}
              <span className="text-accent-purple font-bold">{chains.length}</span> شبكات
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 بحث..."
              className="flex-1 sm:w-48 px-3 py-2 rounded-lg bg-dark-700 border border-dark-500 text-sm focus:outline-none focus:border-accent-cyan"
            />
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="px-3 py-2 rounded-lg bg-dark-700 border border-dark-500 text-sm focus:outline-none focus:border-accent-cyan"
            >
              <option value="all">كل الشبكات</option>
              {chains.map((chain) => (
                <option key={chain} value={chain}>{chain}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Chain pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setSelectedChain('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedChain === 'all' ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/50' : 'bg-dark-700 text-gray-400 hover:text-white'
            }`}
          >
            الكل ({ALL_DEXES.length})
          </button>
          {chains.map((chain) => {
            const count = ALL_DEXES.filter((d) => d.chain === chain).length;
            return (
              <button
                key={chain}
                onClick={() => setSelectedChain(chain)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                  selectedChain === chain
                    ? 'border text-white'
                    : 'bg-dark-700 text-gray-400 hover:text-white'
                }`}
                style={selectedChain === chain ? { borderColor: CHAIN_COLORS[chain], backgroundColor: `${CHAIN_COLORS[chain]}20`, color: CHAIN_COLORS[chain] } : {}}
              >
                {CHAIN_ICONS[chain]} {chain} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* DEX Cards grouped by chain */}
      {Object.entries(grouped)
        .filter(([, dexes]) => dexes.length > 0)
        .map(([chain, dexes]) => (
          <div key={chain}>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CHAIN_COLORS[chain] }}
              />
              <h3 className="text-sm font-bold text-gray-300">{CHAIN_ICONS[chain]} {chain}</h3>
              <span className="text-xs text-gray-500">({dexes.length})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {dexes.map((dex, index) => (
                <motion.div
                  key={dex.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-dark-800/60 backdrop-blur border border-dark-500 rounded-xl p-4 hover:border-gray-500 transition-all hover:bg-dark-700/50 group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${dex.color}15` }}
                    >
                      {dex.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate group-hover:text-white transition-colors">{dex.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                          style={{ backgroundColor: `${dex.color}20`, color: dex.color }}
                        >
                          {dex.type}
                        </span>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" title="Active" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
