'use client';

import { useState, useMemo } from 'react';
import { useArbStore } from '@/lib/store';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';

const DEX_COLORS: Record<string, string> = {
  uniswapV3_arb: '#ff007a',
  uniswapV2_arb: '#ff3399',
  sushiswap_arb: '#e05baa',
  camelot: '#f5a623',
  pancakeswapV3_arb: '#d1884f',
  traderjoe_arb: '#23b0e5',
  balancer_arb: '#1f5099',
  curve_arb: '#ff6b6b',
  gmx_v2: '#4082f5',
  ramses: '#c9a227',
  chronos: '#8b5cf6',
  zyberswap: '#06b6d4',
};

const PAIRS = [
  'WETH/USDC', 'WETH/USDT', 'WBTC/USDC', 'ARB/USDC', 'ARB/WETH',
  'LINK/USDC', 'UNI/USDC', 'GMX/WETH', 'USDC/USDC.e', 'USDC/USDT',
  'USDC/DAI', 'DAI/USDT',
];

const TIME_RANGES = [
  { id: '1m', label: '1 دقيقة', seconds: 60 },
  { id: '5m', label: '5 دقائق', seconds: 300 },
  { id: '15m', label: '15 دقيقة', seconds: 900 },
  { id: '1h', label: '1 ساعة', seconds: 3600 },
];

export function PriceChart() {
  const { priceHistory, opportunities } = useArbStore();
  const [selectedPair, setSelectedPair] = useState('WETH/USDC');
  const [timeRange, setTimeRange] = useState('5m');

  const chartData = useMemo(() => {
    const now = Date.now();
    const range = TIME_RANGES.find((r) => r.id === timeRange)?.seconds || 300;

    // Get recent price entries for selected pair
    const relevant = priceHistory
      .filter((p) => {
        const pairKey = Object.keys(p.prices || {}).find((k) => k.includes(selectedPair));
        return !!pairKey;
      })
      .slice(-50);

    return relevant.map((entry, i) => {
      const priceKey = Object.keys(entry.prices || {}).find((k) => k.includes(selectedPair));
      const prices = priceKey ? (entry.prices as any) : {};
      const dexPrices = Array.isArray(prices) ? prices : [];

      const point: any = {
        time: new Date(Date.now() - (relevant.length - i) * 3000).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        index: i,
      };

      if (Array.isArray(dexPrices)) {
        dexPrices.forEach((dp: any) => {
          if (dp && dp.dexId && dp.price) {
            point[dp.dexId] = dp.price;
          }
        });
      }

      return point;
    });
  }, [priceHistory, selectedPair, timeRange]);

  // Get unique DEXes from data
  const activeDexes = useMemo(() => {
    const dexSet = new Set<string>();
    chartData.forEach((point) => {
      Object.keys(point).forEach((key) => {
        if (key !== 'time' && key !== 'index') dexSet.add(key);
      });
    });
    return Array.from(dexSet);
  }, [chartData]);

  // Spread data
  const spreadData = useMemo(() => {
    return opportunities
      .filter((o) => o.pair === selectedPair)
      .slice(0, 20)
      .map((o, i) => ({
        time: new Date(o.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        spread: o.spreadPercent,
        profit: o.profit.usd,
      }))
      .reverse();
  }, [opportunities, selectedPair]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">📊 الرسوم البيانية</h2>
            <p className="text-sm text-gray-400">مقارنة الأسعار عبر المنصات في الوقت الحقيقي</p>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="px-3 py-2 rounded-lg bg-dark-700 border border-dark-500 text-sm focus:outline-none focus:border-accent-cyan"
            >
              {PAIRS.map((pair) => (
                <option key={pair} value={pair}>{pair}</option>
              ))}
            </select>
            <div className="flex bg-dark-700 rounded-lg border border-dark-500 overflow-hidden">
              {TIME_RANGES.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    timeRange === range.id
                      ? 'bg-accent-cyan/20 text-accent-cyan'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {range.id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-bold mb-4">سعر {selectedPair} عبر المنصات</h3>
        <div className="h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="time" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={10} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#999' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {activeDexes.map((dex) => (
                  <Line
                    key={dex}
                    type="monotone"
                    dataKey={dex}
                    stroke={DEX_COLORS[dex] || '#888'}
                    strokeWidth={2}
                    dot={false}
                    name={dex.replace(/_/g, ' ')}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-3">📊</div>
                <p>في انتظار بيانات الأسعار...</p>
                <p className="text-xs mt-1">سيتم عرض الرسم البياني بعد أول مسح</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spread Chart */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-bold mb-4">📈 انتشار السعر والربح — {selectedPair}</h3>
        <div className="h-60">
          {spreadData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spreadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="time" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="profit" stroke="#22c55e" fill="#22c55e20" name="الربح ($)" />
                <Area type="monotone" dataKey="spread" stroke="#22d3ee" fill="#22d3ee20" name="الانتشار (%)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-3xl mb-2">📈</div>
                <p className="text-sm">لا توجد بيانات انتشار بعد لـ {selectedPair}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
