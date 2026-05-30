'use client';

import { useState } from 'react';
import { useArbStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

const CHAIN_INFO: Record<string, { name: string; icon: string; color: string; className: string }> = {
  'arbitrum': { name: 'Arbitrum', icon: '🔵', color: '#28A0F0', className: 'chain-arbitrum' },
  'ethereum': { name: 'Ethereum', icon: '🟣', color: '#627EEA', className: 'chain-ethereum' },
  'base': { name: 'Base', icon: '🔷', color: '#0052FF', className: 'chain-base' },
  'optimism': { name: 'Optimism', icon: '🔴', color: '#FF0420', className: 'chain-optimism' },
  'polygon': { name: 'Polygon', icon: '🟪', color: '#8247E5', className: 'chain-polygon' },
  'bsc': { name: 'BSC', icon: '🟡', color: '#F0B90B', className: 'chain-bsc' },
};

interface NetworkSelectorProps {
  compact?: boolean;
}

export function NetworkSelector({ compact = false }: NetworkSelectorProps) {
  const store = useArbStore();
  const networkMode = (store as any).networkMode || 'testnet';
  const setNetworkMode = (store as any).setNetworkMode;
  const chainId = (store as any).chainId || 421614;
  const [isAnimating, setIsAnimating] = useState(false);

  const isTestnet = networkMode === 'testnet';
  const currentChain = chainId === 42161 ? 'arbitrum' : chainId === 1 ? 'ethereum' : 'arbitrum';
  const chainInfo = CHAIN_INFO[currentChain] || CHAIN_INFO['arbitrum'];

  const handleToggle = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    const newMode = isTestnet ? 'mainnet' : 'testnet';
    
    try {
      const { switchNetwork } = await import('@/lib/websocket');
      if (typeof switchNetwork === 'function') {
        switchNetwork(newMode);
      }
    } catch {
      // websocket module not yet available
    }
    
    if (setNetworkMode) {
      setNetworkMode(newMode);
    }
    
    setTimeout(() => setIsAnimating(false), 500);
  };

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        disabled={isAnimating}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ${
          isTestnet
            ? 'bg-accent-orange/10 text-accent-orange border-accent-orange/30 hover:bg-accent-orange/20'
            : 'bg-accent-green/10 text-accent-green border-accent-green/30 hover:bg-accent-green/20'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${isTestnet ? 'bg-accent-orange' : 'bg-accent-green'} ${!isAnimating ? 'animate-pulse' : ''}`} />
        {isTestnet ? 'Testnet' : 'Mainnet'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Chain badge */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${chainInfo.className}`}>
        <span>{chainInfo.icon}</span>
        <span>{chainInfo.name}</span>
      </div>

      {/* Toggle switch */}
      <motion.button
        onClick={handleToggle}
        disabled={isAnimating}
        className={`relative flex items-center w-[140px] h-9 rounded-full p-1 transition-colors duration-300 ${
          isTestnet
            ? 'bg-accent-orange/15 border border-accent-orange/30'
            : 'bg-accent-green/15 border border-accent-green/30'
        }`}
        whileTap={{ scale: 0.97 }}
      >
        {/* Slider */}
        <motion.div
          className={`absolute h-7 w-[66px] rounded-full ${
            isTestnet
              ? 'bg-accent-orange/30'
              : 'bg-accent-green/30'
          }`}
          animate={{ x: isTestnet ? 2 : 68 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        />

        <span className={`flex-1 text-center text-xs font-bold z-10 transition-colors ${
          isTestnet ? 'text-accent-orange' : 'text-gray-500'
        }`}>
          Testnet
        </span>
        <span className={`flex-1 text-center text-xs font-bold z-10 transition-colors ${
          !isTestnet ? 'text-accent-green' : 'text-gray-500'
        }`}>
          Mainnet
        </span>
      </motion.button>

      {/* Testnet warning badge */}
      <AnimatePresence>
        {isTestnet && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="px-2 py-0.5 rounded text-[10px] bg-accent-orange/10 text-accent-orange border border-accent-orange/20"
          >
            شبكة تجريبية
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
