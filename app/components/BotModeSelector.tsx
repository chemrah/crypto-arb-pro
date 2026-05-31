'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendWsMessage } from '@/lib/websocket';
import { useArbStore } from '@/lib/store';

const MODES = [
  {
    id: 'basic' as const,
    icon: '⚙️',
    name: 'أساسي',
    description: 'تداول آلي بسيط بدون تحليل متقدم',
  },
  {
    id: 'smart' as const,
    icon: '🧠',
    name: 'ذكي',
    description: 'تحليل ذكي مع تصنيف المنصات والتعلم',
  },
];

function CircularProgress({ value, size = 80 }: { value: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="rgba(255,255,255,0.05)"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="var(--accent-green, #22c55e)"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-accent-green">{value}%</span>
      </div>
    </div>
  );
}

const BAR_COLORS = [
  'from-cyan-400 to-blue-500',
  'from-green-400 to-emerald-500',
  'from-purple-400 to-violet-500',
  'from-amber-400 to-orange-500',
  'from-pink-400 to-rose-500',
];

export function BotModeSelector() {
  const { botMode, tradeStats } = useArbStore();
  const [showBlacklist, setShowBlacklist] = useState(false);

  const handleModeChange = (mode: 'basic' | 'smart') => {
    sendWsMessage('switch_bot_mode', { mode });
    useArbStore.getState().setBotMode(mode);
  };

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🤖</span>
        <h2 className="text-lg font-bold">وضع البوت</h2>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-cyan/20 text-accent-cyan mr-auto">
          {botMode === 'smart' ? 'ذكي' : 'أساسي'}
        </span>
      </div>

      {/* Mode Cards */}
      <div className="grid grid-cols-2 gap-4">
        {MODES.map((mode) => {
          const isActive = botMode === mode.id;
          return (
            <motion.button
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative bg-dark-800/60 backdrop-blur border rounded-xl p-5 text-right transition-all ${
                isActive
                  ? 'border-accent-cyan shadow-lg shadow-accent-cyan/20 bg-accent-cyan/5'
                  : 'border-dark-500 hover:border-gray-500 hover:bg-dark-700/50'
              }`}
            >
              {isActive && (
                <div className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-accent-cyan animate-pulse" />
              )}
              <div className="text-3xl mb-3">{mode.icon}</div>
              <div className={`font-bold text-base mb-1 ${isActive ? 'text-accent-cyan' : 'text-white'}`}>
                {mode.name}
              </div>
              <div className="text-xs text-gray-400 leading-relaxed">{mode.description}</div>
            </motion.button>
          );
        })}
      </div>

      {/* Smart Mode Stats Panel */}
      <AnimatePresence>
        {botMode === 'smart' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-dark-800/40 backdrop-blur border border-dark-500 rounded-xl p-4 mt-4">
              <h3 className="text-sm font-bold text-gray-300 mb-4">📊 إحصائيات التداول الذكي</h3>

              {!tradeStats ? (
                <div className="text-center py-6">
                  <div className="text-2xl mb-2 animate-spin-slow">⏳</div>
                  <p className="text-sm text-gray-500">جاري تحميل الإحصائيات...</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Success Rate */}
                  <div className="flex items-center gap-4">
                    <CircularProgress value={tradeStats.successRate || 0} />
                    <div>
                      <div className="text-sm font-medium text-gray-300">نسبة النجاح الكلية</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {tradeStats.totalTrades || 0} صفقة منفذة
                      </div>
                    </div>
                  </div>

                  {/* Top DEXes */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 mb-3">🏆 أفضل المنصات</h4>
                    <div className="space-y-2">
                      {(tradeStats.topDexes || []).slice(0, 5).map((dex: any, index: number) => (
                        <div key={dex.name || index} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-4 text-center font-bold">
                            {index + 1}
                          </span>
                          <span className="text-xs text-gray-300 w-24 truncate">{dex.name}</span>
                          <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${BAR_COLORS[index % BAR_COLORS.length]}`}
                              style={{ width: `${Math.min(dex.score || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 w-10 text-left">
                            {dex.score?.toFixed(0) || 0}%
                          </span>
                        </div>
                      ))}
                      {(!tradeStats.topDexes || tradeStats.topDexes.length === 0) && (
                        <p className="text-xs text-gray-600 text-center py-2">لا توجد بيانات بعد</p>
                      )}
                    </div>
                  </div>

                  {/* Blacklist */}
                  <div>
                    <button
                      onClick={() => setShowBlacklist(!showBlacklist)}
                      className="flex items-center gap-2 w-full text-right text-xs font-bold text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <span>🚫 القائمة السوداء</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                        {tradeStats.blacklist?.length || 0}
                      </span>
                      <span className={`mr-auto transition-transform ${showBlacklist ? 'rotate-180' : ''}`}>
                        ▾
                      </span>
                    </button>

                    <AnimatePresence>
                      {showBlacklist && tradeStats.blacklist && tradeStats.blacklist.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mt-2"
                        >
                          <div className="space-y-1">
                            {tradeStats.blacklist.map((item: string, idx: number) => (
                              <div
                                key={idx}
                                className="text-[10px] text-red-400/70 bg-red-500/5 rounded px-2 py-1 font-mono"
                                dir="ltr"
                              >
                                {item}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
