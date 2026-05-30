'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useArbStore } from '@/lib/store';
import { AnimatedNumber } from './AnimatedNumber';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface ExecutionRecord {
  id: string;
  date: string;
  timestamp: number;
  pair: string;
  strategy: string;
  buyDex: string;
  sellDex: string;
  profit: number;
  txHash: string;
  status: 'success' | 'failed' | 'pending';
  loanAmount: number;
}

// Demo data for display
const DEMO_HISTORY: ExecutionRecord[] = [
  { id: '1', date: '2024-03-15 14:32', timestamp: Date.now() - 3600000, pair: 'WETH/USDC', strategy: 'Flash Loan', buyDex: 'Uniswap V3', sellDex: 'SushiSwap', profit: 47.82, txHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890', status: 'success', loanAmount: 50000 },
  { id: '2', date: '2024-03-15 14:28', timestamp: Date.now() - 7200000, pair: 'WBTC/WETH', strategy: 'Flash Swap', buyDex: 'Camelot', sellDex: 'Uniswap V3', profit: 123.45, txHash: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567891', status: 'success', loanAmount: 100000 },
  { id: '3', date: '2024-03-15 14:15', timestamp: Date.now() - 10800000, pair: 'USDC/USDT', strategy: 'Flash Mint', buyDex: 'Curve', sellDex: 'Balancer', profit: 8.91, txHash: '0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567892', status: 'success', loanAmount: 200000 },
  { id: '4', date: '2024-03-15 14:05', timestamp: Date.now() - 14400000, pair: 'ARB/USDC', strategy: 'Flash Loan', buyDex: 'SushiSwap', sellDex: 'Camelot', profit: -0, txHash: '0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567893', status: 'failed', loanAmount: 25000 },
  { id: '5', date: '2024-03-15 13:50', timestamp: Date.now() - 18000000, pair: 'WETH/DAI', strategy: 'Flash Loan', buyDex: 'PancakeSwap', sellDex: 'Uniswap V3', profit: 67.33, txHash: '0x5e6f7890abcdef1234567890abcdef1234567890abcdef1234567894', status: 'success', loanAmount: 75000 },
];

const STATUS_MAP = {
  success: { icon: '✅', label: 'ناجح', color: 'text-accent-green', bg: 'bg-accent-green/10' },
  failed: { icon: '❌', label: 'فشل', color: 'text-accent-red', bg: 'bg-accent-red/10' },
  pending: { icon: '⏳', label: 'قيد التنفيذ', color: 'text-accent-orange', bg: 'bg-accent-orange/10' },
};

const ITEMS_PER_PAGE = 10;

export function ExecutionHistory() {
  const { executionHistory } = useArbStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Merge demo data with real execution history
  const allRecords: ExecutionRecord[] = useMemo(() => {
    const realRecords = executionHistory.map((exec: any, i: number) => ({
      id: `real-${i}`,
      date: exec.timestamp || new Date().toISOString(),
      timestamp: Date.now() - i * 3600000,
      pair: exec.pair || 'Unknown',
      strategy: exec.strategy || 'Flash Loan',
      buyDex: exec.buyDex || 'Unknown',
      sellDex: exec.sellDex || 'Unknown',
      profit: exec.profit || 0,
      txHash: exec.txHash || '0x...',
      status: exec.success ? 'success' : 'failed',
      loanAmount: exec.loanAmount || 0,
    })) as ExecutionRecord[];
    
    return [...realRecords, ...DEMO_HISTORY];
  }, [executionHistory]);

  const filtered = useMemo(() => {
    return allRecords.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.pair.toLowerCase().includes(q) ||
          r.strategy.toLowerCase().includes(q) ||
          r.buyDex.toLowerCase().includes(q) ||
          r.sellDex.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allRecords, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    const successful = allRecords.filter((r) => r.status === 'success');
    const totalProfit = successful.reduce((sum, r) => sum + r.profit, 0);
    const winRate = allRecords.length > 0 ? (successful.length / allRecords.length) * 100 : 0;
    const avgProfit = successful.length > 0 ? totalProfit / successful.length : 0;
    const bestTrade = successful.length > 0 ? Math.max(...successful.map((r) => r.profit)) : 0;
    return { totalProfit, winRate, avgProfit, bestTrade, total: allRecords.length };
  }, [allRecords]);

  const chartData = useMemo(() => {
    let cumProfit = 0;
    return allRecords
      .filter((r) => r.status === 'success')
      .reverse()
      .map((r, i) => {
        cumProfit += r.profit;
        return { name: `#${i + 1}`, profit: r.profit, cumProfit };
      });
  }, [allRecords]);

  const handleExportCSV = () => {
    const headers = 'Date,Pair,Strategy,Buy DEX,Sell DEX,Profit,TX Hash,Status\n';
    const rows = allRecords
      .map((r) => `${r.date},${r.pair},${r.strategy},${r.buyDex},${r.sellDex},${r.profit},${r.txHash},${r.status}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arbitrage-history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الربح', value: stats.totalProfit, prefix: '$', color: 'text-accent-green', icon: '💰' },
          { label: 'نسبة النجاح', value: stats.winRate, suffix: '%', color: 'text-accent-cyan', icon: '🏆' },
          { label: 'متوسط الربح', value: stats.avgProfit, prefix: '$', color: 'text-accent-purple', icon: '📊' },
          { label: 'أفضل صفقة', value: stats.bestTrade, prefix: '$', color: 'text-accent-orange', icon: '🎯' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</span>
            </div>
            <AnimatedNumber
              value={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
              decimals={2}
              className={`text-xl font-bold ${stat.color}`}
            />
          </motion.div>
        ))}
      </div>

      {/* Mini profit chart */}
      {chartData.length > 1 && (
        <div className="glass-card p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <span>📈</span> الأرباح التراكمية
          </h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e676" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,53,72,0.5)" />
                <XAxis dataKey="name" tick={{ fill: '#5a6b82', fontSize: 10 }} />
                <YAxis tick={{ fill: '#5a6b82', fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#131b2b',
                    border: '1px solid #2a3548',
                    borderRadius: '8px',
                    color: '#e0e6f0',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                />
                <Area
                  type="monotone"
                  dataKey="cumProfit"
                  stroke="#00e676"
                  fill="url(#profitGrad)"
                  strokeWidth={2}
                  name="الربح التراكمي"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {/* Header / Filters */}
        <div className="p-4 border-b border-dark-500">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">📜 سجل التنفيذ</h2>
              <span className="px-2 py-0.5 rounded-full text-xs bg-dark-600 text-gray-400">
                {filtered.length} عملية
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="🔍 بحث..."
                className="px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-500 text-sm focus:outline-none focus:border-accent-cyan w-40"
              />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-500 text-sm focus:outline-none focus:border-accent-cyan appearance-none cursor-pointer"
              >
                <option value="all">الكل</option>
                <option value="success">✅ ناجح</option>
                <option value="failed">❌ فشل</option>
                <option value="pending">⏳ قيد التنفيذ</option>
              </select>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg bg-dark-700 border border-dark-500 text-xs text-gray-400 hover:text-white hover:border-accent-cyan transition-all"
              >
                📥 CSV
              </button>
            </div>
          </div>
        </div>

        {/* Table body */}
        {paginated.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4 animate-float">📋</div>
            <p className="text-gray-400 text-lg">لا توجد عمليات</p>
            <p className="text-xs text-gray-600 mt-2">ستظهر هنا جميع عمليات الـ Arbitrage المنفذة</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-dark-800">
                <tr className="text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-right p-3">التاريخ</th>
                  <th className="text-right p-3">الزوج</th>
                  <th className="text-right p-3">الاستراتيجية</th>
                  <th className="text-right p-3">شراء DEX</th>
                  <th className="text-right p-3">بيع DEX</th>
                  <th className="text-right p-3">الربح</th>
                  <th className="text-right p-3">TX Hash</th>
                  <th className="text-right p-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginated.map((record, i) => {
                    const statusInfo = STATUS_MAP[record.status];
                    return (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-t border-dark-500/50 hover:bg-dark-700/50 transition-colors"
                      >
                        <td className="p-3">
                          <span className="text-gray-400 text-xs font-mono">{record.date}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-white">{record.pair}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-xs bg-dark-600 text-gray-300">
                            {record.strategy}
                          </span>
                        </td>
                        <td className="p-3 text-gray-300 text-xs">{record.buyDex}</td>
                        <td className="p-3 text-gray-300 text-xs">{record.sellDex}</td>
                        <td className="p-3">
                          <span className={`font-mono font-bold ${
                            record.profit > 0 ? 'text-accent-green' : record.profit < 0 ? 'text-accent-red' : 'text-gray-500'
                          }`}>
                            {record.profit > 0 ? '+' : ''}${record.profit.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3">
                          <a
                            href={`https://arbiscan.io/tx/${record.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent-cyan text-xs font-mono hover:underline"
                          >
                            {record.txHash.slice(0, 6)}...{record.txHash.slice(-4)}
                          </a>
                        </td>
                        <td className="p-3">
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                            {statusInfo.icon} {statusInfo.label}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-dark-500 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded text-xs bg-dark-700 text-gray-400 hover:text-white disabled:opacity-30 transition-all"
            >
              ← السابق
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                  currentPage === i + 1
                    ? 'bg-accent-cyan/20 text-accent-cyan'
                    : 'bg-dark-700 text-gray-400 hover:text-white'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded text-xs bg-dark-700 text-gray-400 hover:text-white disabled:opacity-30 transition-all"
            >
              التالي →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
