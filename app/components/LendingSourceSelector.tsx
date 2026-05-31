'use client';

import { motion } from 'framer-motion';
import { sendWsMessage } from '@/lib/websocket';
import { useArbStore } from '@/lib/store';

const LENDING_SOURCES = [
  {
    id: 'aave_v3',
    name: 'Aave V3',
    icon: '👻',
    fee: '0.05%',
    chains: ['Arbitrum', 'Ethereum', 'Polygon', 'Optimism', 'Base'],
  },
  {
    id: 'radiant_v2',
    name: 'Radiant V2',
    icon: '☀️',
    fee: '0.09%',
    chains: ['Arbitrum', 'BSC'],
  },
  {
    id: 'spark',
    name: 'Spark',
    icon: '✨',
    fee: '0% DAI',
    chains: ['Ethereum'],
  },
  {
    id: 'compound_v3',
    name: 'Compound V3',
    icon: '🏛️',
    fee: '0%',
    chains: ['Ethereum', 'Arbitrum', 'Polygon', 'Base'],
  },
  {
    id: 'auto',
    name: 'تلقائي',
    icon: '🤖',
    fee: 'الأقل',
    chains: ['All'],
    description: 'البوت يختار الأرخص تلقائياً',
  },
];

const CHAIN_BADGE_COLORS: Record<string, string> = {
  Arbitrum: 'bg-blue-500/15 text-blue-400',
  Ethereum: 'bg-indigo-500/15 text-indigo-400',
  Polygon: 'bg-purple-500/15 text-purple-400',
  Optimism: 'bg-red-500/15 text-red-400',
  Base: 'bg-blue-600/15 text-blue-300',
  BSC: 'bg-yellow-500/15 text-yellow-400',
  All: 'bg-accent-cyan/15 text-accent-cyan',
};

export function LendingSourceSelector() {
  const { lendingSource } = useArbStore();

  const handleSelect = (sourceId: string) => {
    sendWsMessage('set_lending_source', { source: sourceId });
    useArbStore.getState().setLendingSource(sourceId);
  };

  const activeName = LENDING_SOURCES.find((s) => s.id === lendingSource)?.name || 'تلقائي';

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">💰</span>
        <h2 className="text-lg font-bold">مصدر القروض السريعة</h2>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-purple/20 text-accent-purple mr-auto">
          {activeName}
        </span>
      </div>

      {/* Protocol Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {LENDING_SOURCES.map((source, index) => {
          const isActive = lendingSource === source.id;
          return (
            <motion.button
              key={source.id}
              onClick={() => handleSelect(source.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative bg-dark-800/60 backdrop-blur border rounded-xl p-4 text-right transition-all ${
                isActive
                  ? 'border-accent-cyan shadow-lg shadow-accent-cyan/20 bg-accent-cyan/5'
                  : 'border-dark-500 hover:border-gray-500 hover:bg-dark-700/50'
              }`}
            >
              {isActive && (
                <div className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-accent-cyan animate-pulse" />
              )}

              <div className="flex items-start gap-3">
                <div className="text-3xl">{source.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm ${isActive ? 'text-accent-cyan' : 'text-white'}`}>
                    {source.name}
                  </div>
                  <div className="mt-1">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-accent-green/20 text-accent-green font-medium">
                      {source.fee}
                    </span>
                  </div>
                  {source.description && (
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">{source.description}</p>
                  )}
                </div>
              </div>

              {/* Chain Badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {source.chains.map((chain) => (
                  <span
                    key={chain}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      CHAIN_BADGE_COLORS[chain] || 'bg-dark-600 text-gray-400'
                    }`}
                  >
                    {chain}
                  </span>
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
