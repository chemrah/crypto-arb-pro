'use client';

import { useArbStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';
import { GaugeChart } from './GaugeChart';

export function StatsGrid() {
  const { stats, opportunities } = useArbStore();

  const topProfit = opportunities.length > 0
    ? Math.max(...opportunities.map((o) => o.profit.usd))
    : 0;

  const winRate = stats.opportunitiesFound > 0
    ? Math.min(((stats.opportunitiesFound - Math.floor(stats.opportunitiesFound * 0.12)) / stats.opportunitiesFound) * 100, 100)
    : 0;

  // Simulated gas savings (cumulative gas that Paymaster sponsored)
  const gasSaved = stats.totalScans * 0.15; // ~$0.15 per scan average gas cost that was sponsored

  const activeDexes = 47;
  const totalDexes = 59;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* 1. Opportunities Found */}
      <motion.div variants={itemVariants} className="glass-card p-4 hover:glow-border transition-all duration-300 group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl bg-accent-cyan/10 w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            🎯
          </span>
          <div className="flex items-center gap-1 text-accent-green text-xs font-bold">
            <span>↗</span>
            <span>+12%</span>
          </div>
        </div>
        <AnimatedNumber
          value={stats.opportunitiesFound}
          decimals={0}
          className="text-2xl font-bold text-accent-cyan"
        />
        <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
          إجمالي الفرص
        </div>
        {/* Mini sparkline placeholder */}
        <div className="mt-2 h-6 flex items-end gap-0.5">
          {[4, 7, 5, 8, 6, 9, 7, 10, 8, 12].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-accent-cyan/20 rounded-t"
              style={{ height: `${h * 2.5}px` }}
            />
          ))}
        </div>
      </motion.div>

      {/* 2. Total Profit */}
      <motion.div variants={itemVariants} className="glass-card p-4 hover:glow-border transition-all duration-300 group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl bg-accent-green/10 w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            💰
          </span>
        </div>
        <AnimatedNumber
          value={stats.totalProfit}
          prefix="+$"
          decimals={2}
          className="text-2xl font-bold text-accent-green"
        />
        <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
          الربح الإجمالي
        </div>
        <div className="mt-2 h-6 flex items-end gap-0.5">
          {[3, 5, 4, 7, 6, 8, 5, 9, 11, 14].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-accent-green/20 rounded-t"
              style={{ height: `${h * 2}px` }}
            />
          ))}
        </div>
      </motion.div>

      {/* 3. Scans Completed */}
      <motion.div variants={itemVariants} className="glass-card p-4 hover:glow-border transition-all duration-300 group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl bg-pink-400/10 w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            📡
          </span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-400" />
          </span>
        </div>
        <AnimatedNumber
          value={stats.totalScans}
          decimals={0}
          className="text-2xl font-bold text-pink-400"
        />
        <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
          عمليات المسح
        </div>
      </motion.div>

      {/* 4. Active DEXes */}
      <motion.div variants={itemVariants} className="glass-card p-4 hover:glow-border transition-all duration-300 group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl bg-accent-purple/10 w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            ⚡
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-accent-purple">{activeDexes}</span>
          <span className="text-sm text-gray-500 font-mono">/{totalDexes}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
          DEXes النشطة
        </div>
        {/* Mini progress bar */}
        <div className="mt-2 h-2 bg-dark-600 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-purple to-accent-cyan rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(activeDexes / totalDexes) * 100}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* 5. Win Rate (Gauge) */}
      <motion.div variants={itemVariants} className="glass-card p-4 hover:glow-border transition-all duration-300 flex flex-col items-center justify-center">
        <GaugeChart
          value={winRate}
          max={100}
          label="نسبة النجاح"
          color="accent-green"
          size="sm"
          icon="🏆"
          format={(v) => `${Math.round(v)}%`}
        />
      </motion.div>

      {/* 6. Gas Saved */}
      <motion.div variants={itemVariants} className="glass-card p-4 hover:glow-border transition-all duration-300 group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl bg-accent-orange/10 w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            ⛽
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent-green/10 text-accent-green font-bold">
            FREE
          </span>
        </div>
        <AnimatedNumber
          value={gasSaved}
          prefix="$"
          decimals={2}
          className="text-2xl font-bold text-accent-orange"
        />
        <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
          الغاز الموفر
        </div>
        <div className="text-[10px] text-gray-600 mt-1">
          Paymaster ✓
        </div>
      </motion.div>
    </motion.div>
  );
}
