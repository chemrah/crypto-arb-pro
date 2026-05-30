'use client';

import { useArbStore, Opportunity } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const DEX_ICONS: Record<string, string> = {
  uniswapV2: '🦄',
  uniswapV3_arb: '🦄',
  sushiswap_arb: '🍣',
  camelot: '🐪',
  pancakeswap_arb: '🥞',
  traderjoe: '🧑‍🌾',
  curve_3pool: '🌀',
  balancer_arb: '⚖️',
  gmx: '🎲',
  ramses: '🏛️',
  chronos: '⏰',
  zyberswap: '⚡',
};

const DEX_NAMES: Record<string, string> = {
  uniswapV2: 'Uniswap V2',
  uniswapV3_arb: 'Uniswap V3',
  sushiswap_arb: 'SushiSwap',
  camelot: 'Camelot',
  pancakeswap_arb: 'PancakeSwap',
  traderjoe: 'TraderJoe',
  curve_3pool: 'Curve',
  balancer_arb: 'Balancer',
  gmx: 'GMX',
  ramses: 'Ramses',
  chronos: 'Chronos',
  zyberswap: 'ZyberSwap',
};

export function OpportunityTable() {
  const { opportunities, setSelectedOpportunity, selectedOpportunity } = useArbStore();

  const getTimeAgo = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ar });
    } catch {
      return 'الآن';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-accent-green';
    if (confidence >= 60) return 'text-accent-orange';
    return 'text-accent-red';
  };

  const getProfitColor = (profit: number) => {
    if (profit >= 50) return 'text-accent-green';
    if (profit >= 10) return 'text-emerald-400';
    if (profit > 0) return 'text-yellow-400';
    return 'text-gray-500';
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-dark-500 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">🎯 فرص Arbitrage الحية</h2>
          <span className="px-2 py-0.5 rounded-full text-xs bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30">
            {opportunities.length} فرصة
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="pulse-dot" />
          <span className="text-xs text-gray-400">تحديث مباشر</span>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin max-h-[600px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-dark-800 z-10">
            <tr className="text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-right p-3">الزوج</th>
              <th className="text-right p-3">المسار</th>
              <th className="text-right p-3">الفرق</th>
              <th className="text-right p-3">الربح</th>
              <th className="text-right p-3">القرض</th>
              <th className="text-right p-3">الثقة</th>
              <th className="text-right p-3">الوقت</th>
              <th className="text-right p-3">الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-gray-400">جاري البحث عن فرص...</p>
                  <p className="text-xs text-gray-600 mt-1">يتم مسح جميع المنصات كل 3 ثوانٍ</p>
                </td>
              </tr>
            ) : (
              opportunities.map((opp) => (
                <tr
                  key={opp.id}
                  onClick={() => setSelectedOpportunity(opp)}
                  className={`border-t border-dark-500/50 hover:bg-dark-700/50 cursor-pointer transition-colors animate-slide-in ${
                    selectedOpportunity?.id === opp.id ? 'bg-accent-cyan/5 border-r-2 border-r-accent-cyan' : ''
                  }`}
                >
                  <td className="p-3">
                    <div className="font-bold text-white">{opp.pair}</div>
                    <div className="text-xs text-gray-500 font-mono">
                      {opp.strategy}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-lg">{DEX_ICONS[opp.buyDex] || '📍'}</span>
                      <span className="text-accent-green text-xs">←</span>
                      <span className="text-lg">{DEX_ICONS[opp.sellDex] || '📍'}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {DEX_NAMES[opp.buyDex] || opp.buyDex} → {DEX_NAMES[opp.sellDex] || opp.sellDex}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-accent-cyan font-mono font-bold">
                      {opp.spreadPercent.toFixed(3)}%
                    </span>
                  </td>
                  <td className="p-3">
                    <div className={`font-mono font-bold ${getProfitColor(opp.profit.usd)}`}>
                      ${opp.profit.usd.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {opp.profit.percent.toFixed(3)}%
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-mono text-sm text-gray-300">
                      ${opp.loanAmount.toLocaleString()}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className={`font-mono font-bold ${getConfidenceColor(opp.confidence)}`}>
                      {opp.confidence}%
                    </div>
                    <div className="w-16 h-1.5 bg-dark-500 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          opp.confidence >= 80 ? 'bg-accent-green' :
                          opp.confidence >= 60 ? 'bg-accent-orange' : 'bg-accent-red'
                        }`}
                        style={{ width: `${opp.confidence}%` }}
                      />
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-xs text-gray-400">
                      {getTimeAgo(opp.timestamp)}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {opp.gasless && (
                        <span className="px-2 py-0.5 rounded text-xs bg-accent-green/10 text-accent-green border border-accent-green/30">
                          بدون غاز
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
