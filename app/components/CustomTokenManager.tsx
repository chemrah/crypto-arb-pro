'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendWsMessage } from '@/lib/websocket';
import { useArbStore } from '@/lib/store';

const CHAINS = ['Arbitrum', 'Ethereum', 'Polygon', 'BSC', 'Optimism', 'Base'];

interface TokenEntry {
  chain: string;
  symbol: string;
  address: string;
  decimals: number;
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function CustomTokenManager() {
  const { customTokens } = useArbStore();

  const [symbol, setSymbol] = useState('');
  const [address, setAddress] = useState('');
  const [decimals, setDecimals] = useState(18);
  const [chain, setChain] = useState('Arbitrum');
  const [error, setError] = useState('');

  // Convert customTokens to flat array for display
  const tokenList: TokenEntry[] = (() => {
    if (!customTokens) return [];
    if (Array.isArray(customTokens)) return customTokens;
    // If it's a Record<chain, tokens[]>
    return Object.entries(customTokens).flatMap(([chainKey, tokens]) => {
      if (Array.isArray(tokens)) {
        return tokens.map((t: any) => ({ ...t, chain: t.chain || chainKey }));
      }
      return [];
    });
  })();

  const handleAdd = () => {
    setError('');

    if (!symbol.trim()) {
      setError('يرجى إدخال رمز العملة');
      return;
    }

    if (!address.startsWith('0x') || address.length !== 42) {
      setError('العنوان يجب أن يبدأ بـ 0x ويكون 42 حرفاً');
      return;
    }

    sendWsMessage('add_custom_token', {
      chain,
      symbol: symbol.trim().toUpperCase(),
      address: address.trim(),
      decimals,
    });

    // Clear form
    setSymbol('');
    setAddress('');
    setDecimals(18);
    setError('');
  };

  const handleRemove = (tokenChain: string, tokenAddress: string) => {
    sendWsMessage('remove_custom_token', { chain: tokenChain, address: tokenAddress });
  };

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🪙</span>
        <h2 className="text-lg font-bold">إدارة العملات المخصصة</h2>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-green/20 text-accent-green mr-auto">
          {tokenList.length} عملة
        </span>
      </div>

      {/* Add Token Form */}
      <div className="bg-dark-800/40 backdrop-blur border border-dark-500 rounded-xl p-4">
        <h3 className="text-sm font-bold text-gray-300 mb-3">➕ إضافة عملة مخصصة</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Symbol */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">رمز العملة</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="مثال: MYTOKEN"
              className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-dark-500 text-sm focus:outline-none focus:border-accent-cyan transition-colors"
            />
          </div>

          {/* Contract Address */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">عنوان العقد</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              dir="ltr"
              className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-dark-500 text-sm focus:outline-none focus:border-accent-cyan transition-colors font-mono"
            />
          </div>

          {/* Decimals */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">الأرقام العشرية</label>
            <input
              type="number"
              value={decimals}
              onChange={(e) => setDecimals(Number(e.target.value))}
              min={0}
              max={18}
              className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-dark-500 text-sm focus:outline-none focus:border-accent-cyan transition-colors"
            />
          </div>

          {/* Chain */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">الشبكة</label>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-dark-500 text-sm focus:outline-none focus:border-accent-cyan transition-colors"
            >
              {CHAINS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-red-400 text-xs mt-3"
            >
              ⚠️ {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Add Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAdd}
            className="bg-accent-green/20 text-accent-green border border-accent-green/50 hover:bg-accent-green/30 px-6 py-2 rounded-lg font-medium text-sm transition-all active:scale-95"
          >
            إضافة عملة
          </button>
        </div>
      </div>

      {/* Token List */}
      <div className="mt-4">
        <h3 className="text-sm font-bold text-gray-300 mb-3">📋 العملات المخصصة</h3>

        {tokenList.length === 0 ? (
          <div className="text-center py-8 bg-dark-800/30 rounded-xl border border-dark-500/50">
            <div className="text-3xl mb-2">🪙</div>
            <p className="text-sm text-gray-500">لم تتم إضافة عملات مخصصة بعد</p>
            <p className="text-xs text-gray-600 mt-1">أضف عملة باستخدام النموذج أعلاه</p>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-gray-500 font-bold uppercase">
              <div className="col-span-2">الرمز</div>
              <div className="col-span-5">العنوان</div>
              <div className="col-span-2">العشرية</div>
              <div className="col-span-2">الشبكة</div>
              <div className="col-span-1"></div>
            </div>

            {/* Token Rows */}
            <AnimatePresence>
              {tokenList.map((token, idx) => (
                <motion.div
                  key={`${token.chain}-${token.address}-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="grid grid-cols-12 gap-2 items-center bg-dark-800/60 rounded-lg p-3 mb-2 hover:bg-dark-700/50 transition-colors"
                >
                  <div className="col-span-2 text-sm font-bold text-accent-cyan">{token.symbol}</div>
                  <div className="col-span-5 text-xs text-gray-400 font-mono" dir="ltr">
                    {truncateAddress(token.address)}
                  </div>
                  <div className="col-span-2 text-xs text-gray-400">{token.decimals}</div>
                  <div className="col-span-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-dark-600 text-gray-300">
                      {token.chain}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => handleRemove(token.chain, token.address)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"
                      title="حذف"
                    >
                      🗑️
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
