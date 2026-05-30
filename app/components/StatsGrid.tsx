'use client';

import { useArbStore } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export function StatsGrid() {
  const { stats, opportunities } = useArbStore();

  const topProfit = opportunities.length > 0
    ? Math.max(...opportunities.map(o => o.profit.usd))
    : 0;

  const avgSpread = opportunities.length > 0
    ? opportunities.reduce((sum, o) => sum + o.spreadPercent, 0) / opportunities.length
    : 0;

  const statCards = [
    {
      label: 'إجمالي الفرص',
      value: stats.opportunitiesFound.toLocaleString(),
      icon: '🎯',
      color: 'text-accent-cyan',
      bgColor: 'bg-accent-cyan/10',
    },
    {
      label: 'الربح الإجمالي',
      value: `$${stats.totalProfit.toFixed(2)}`,
      icon: '💰',
      color: 'text-accent-green',
      bgColor: 'bg-accent-green/10',
    },
    {
      label: 'أعلى ربح',
      value: `$${topProfit.toFixed(2)}`,
      icon: '🏆',
      color: 'text-accent-orange',
      bgColor: 'bg-accent-orange/10',
    },
    {
      label: 'متوسط الفرق',
      value: `${avgSpread.toFixed(3)}%`,
      icon: '📊',
      color: 'text-accent-purple',
      bgColor: 'bg-accent-purple/10',
    },
    {
      label: 'الأزواج النشطة',
      value: stats.activePairs.toString(),
      icon: '🔄',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      label: 'عمليات المسح',
      value: stats.totalScans.toLocaleString(),
      icon: '🔍',
      color: 'text-pink-400',
      bgColor: 'bg-pink-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((card, i) => (
        <div key={i} className="glass-card p-4 hover:glow-border transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-2xl ${card.bgColor} w-10 h-10 rounded-lg flex items-center justify-center`}>
              {card.icon}
            </span>
          </div>
          <div className={`text-2xl font-bold font-mono ${card.color}`}>
            {card.value}
          </div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
