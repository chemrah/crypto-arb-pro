'use client';

import { useState } from 'react';
import { useArbStore } from '@/lib/store';

export function Header() {
  const { isConnected, walletAddress, setWalletAddress } = useArbStore();
  const [address, setAddress] = useState('');

  const handleConnect = () => {
    if (address && address.startsWith('0x') && address.length === 42) {
      setWalletAddress(address);
    }
  };

  return (
    <header className="bg-dark-800 border-b border-dark-500 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-xl font-bold">
              ⚡
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">Crypto Arbitrage Pro</h1>
              <p className="text-xs text-gray-500">Flash Loans • Zero Gas Fees</p>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            isConnected
              ? 'bg-accent-green/10 text-accent-green border border-accent-green/30'
              : 'bg-accent-red/10 text-accent-red border border-accent-red/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent-green animate-pulse' : 'bg-accent-red'}`} />
            {isConnected ? 'متصل' : 'غير متصل'}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {walletAddress ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700 border border-dark-500">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple" />
              <span className="font-mono text-sm text-gray-300">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
              <button
                onClick={() => setWalletAddress('')}
                className="text-gray-500 hover:text-accent-red transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x... عنوان المحفظة"
                className="px-4 py-2 rounded-lg bg-dark-700 border border-dark-500 text-sm font-mono w-64 focus:outline-none focus:border-accent-cyan transition-colors"
                dir="ltr"
              />
              <button
                onClick={handleConnect}
                className="btn-primary whitespace-nowrap"
              >
                اتصال
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
