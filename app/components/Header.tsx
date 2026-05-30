'use client';

import { useState, useCallback } from 'react';
import { useArbStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';
import { NetworkSelector } from './NetworkSelector';

export function Header() {
  const store = useArbStore();
  const { isConnected, walletAddress, setWalletAddress } = store;
  const ethPrice = (store as any).ethPrice || 0;
  const executionMode = (store as any).executionMode || 'manual';
  const setExecutionMode = (store as any).setExecutionMode;
  const isWalletConnecting = (store as any).isWalletConnecting || false;
  const setIsWalletConnecting = (store as any).setIsWalletConnecting;

  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [chainBadge, setChainBadge] = useState<{ name: string; color: string } | null>(null);

  const handleConnect = useCallback(async () => {
    if (setIsWalletConnecting) setIsWalletConnecting(true);
    try {
      const { connectWallet, getChainName } = await import('@/lib/wallet');
      const result = await connectWallet();
      setWalletAddress(result.address);
      setChainBadge({
        name: getChainName(result.chainId),
        color: result.chainId === 42161 ? '#28A0F0' : result.chainId === 1 ? '#627EEA' : '#28A0F0',
      });
      // Try to get balance
      try {
        const balance = await result.provider.getBalance(result.address);
        const { formatEther } = await import('ethers');
        setEthBalance(parseFloat(formatEther(balance)).toFixed(4));
      } catch { /* ignore balance fetch failure */ }
    } catch (err) {
      console.error('Wallet connection failed:', err);
    } finally {
      if (setIsWalletConnecting) setIsWalletConnecting(false);
    }
  }, [setWalletAddress, setIsWalletConnecting]);

  const handleDisconnect = useCallback(async () => {
    try {
      const { disconnectWallet } = await import('@/lib/wallet');
      disconnectWallet();
    } catch { /* ignore */ }
    setWalletAddress('');
    setEthBalance(null);
    setChainBadge(null);
  }, [setWalletAddress]);

  const toggleExecutionMode = useCallback(() => {
    if (setExecutionMode) {
      setExecutionMode(executionMode === 'manual' ? 'auto' : 'manual');
    }
  }, [executionMode, setExecutionMode]);

  return (
    <header className="bg-dark-800/90 backdrop-blur-xl border-b border-dark-500/50 px-4 lg:px-6 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Logo + Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-xl font-bold shadow-lg shadow-accent-cyan/20"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              ⚡
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold gradient-text">Crypto Arbitrage Pro</h1>
              <p className="text-[10px] text-gray-500">Flash Loans • Zero Gas Fees</p>
            </div>
          </div>

          {/* WebSocket Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            isConnected
              ? 'bg-accent-green/10 text-accent-green border border-accent-green/30'
              : 'bg-accent-red/10 text-accent-red border border-accent-red/30'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isConnected ? 'bg-accent-green' : 'bg-accent-red'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isConnected ? 'bg-accent-green' : 'bg-accent-red'
              }`} />
            </span>
            <span className="hidden md:inline">{isConnected ? 'متصل' : 'غير متصل'}</span>
          </div>
        </div>

        {/* Center: Network + Mode + ETH Price */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Network Toggle */}
          <NetworkSelector compact />

          {/* Execution Mode Toggle */}
          <button
            onClick={toggleExecutionMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-300 ${
              executionMode === 'auto'
                ? 'bg-accent-purple/10 text-accent-purple border-accent-purple/30 hover:bg-accent-purple/20'
                : 'bg-dark-700 text-gray-400 border-dark-500 hover:border-gray-400'
            }`}
          >
            {executionMode === 'auto' ? '⚡ Auto' : '🎯 Manual'}
          </button>

          {/* Live ETH Price */}
          {ethPrice > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-700/50 border border-dark-500">
              <span className="text-sm">Ξ</span>
              <AnimatedNumber
                value={ethPrice}
                prefix="$"
                decimals={0}
                className="text-xs font-bold text-white"
              />
            </div>
          )}
        </div>

        {/* Right: Wallet */}
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {walletAddress ? (
              <motion.div
                key="connected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-700 border border-dark-500"
              >
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-xs">
                  🦊
                </div>

                {/* Address + Chain */}
                <div className="hidden sm:flex flex-col">
                  <span className="font-mono text-xs text-gray-300">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {chainBadge && (
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: chainBadge.color }}
                      >
                        {chainBadge.name}
                      </span>
                    )}
                    {ethBalance && (
                      <span className="text-[10px] text-gray-500 font-mono">
                        {ethBalance} ETH
                      </span>
                    )}
                  </div>
                </div>

                {/* Disconnect */}
                <button
                  onClick={handleDisconnect}
                  className="text-gray-500 hover:text-accent-red transition-colors ml-1 text-sm"
                >
                  ✕
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="connect"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleConnect}
                disabled={isWalletConnecting}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  isWalletConnecting
                    ? 'bg-dark-700 text-gray-400 border border-dark-500'
                    : 'bg-gradient-to-r from-accent-cyan to-accent-purple text-white shadow-lg shadow-accent-cyan/20 hover:shadow-accent-cyan/40'
                }`}
              >
                {isWalletConnecting ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block"
                    >
                      ⏳
                    </motion.span>
                    <span className="hidden sm:inline">Connecting...</span>
                  </>
                ) : (
                  <>
                    <span>🦊</span>
                    <span className="hidden sm:inline">Connect Wallet</span>
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
