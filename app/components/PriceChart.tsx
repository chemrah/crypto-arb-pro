'use client';

import { useArbStore } from '@/lib/store';
import { useMemo } from 'react';

export function PriceChart() {
  const { priceHistory, opportunities } = useArbStore();

  const chartData = useMemo(() => {
    const pairData: Record<string, { dex: string; prices: number[]; timestamps: number[] }[]> = {};

    priceHistory.forEach((snapshot) => {
      if (!pairData[snapshot.pair]) {
        pairData[snapshot.pair] = [];
      }
      snapshot.prices.forEach((p) => {
        let dexData = pairData[snapshot.pair].find((d) => d.dex === p.dexId);
        if (!dexData) {
          dexData = { dex: p.dexId, prices: [], timestamps: [] };
          pairData[snapshot.pair].push(dexData);
        }
        dexData.prices.push(p.price);
        dexData.timestamps.push(p.timestamp);
      });
    });

    return pairData;
  }, [priceHistory]);

  const dexColors: Record<string, string> = {
    uniswapV2: '#ff007a',
    uniswapV3_arb: '#ff007a',
    sushiswap_arb: '#e05baa',
    camelot: '#f5a623',
    pancakeswap_arb: '#d1884f',
    traderjoe: '#23b0e5',
    curve_3pool: '#ff6b6b',
    balancer_arb: '#1f5099',
    gmx: '#4082f5',
    ramses: '#c9a227',
    chronos: '#8b5cf6',
    zyberswap: '#06b6d4',
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-4">
        <h2 className="text-lg font-bold mb-4">📊 فوارق الأسعار بين المنصات</h2>
        <p className="text-sm text-gray-400 mb-4">
          يعرض الرسم البياني فروق الأسعار لنفس الزوج عبر منصات DEX مختلفة. كلما زاد الفرق، زادت فرصة الـ Arbitrage.
        </p>

        {Object.keys(chartData).length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-3">📈</div>
              <p>جاري جمع بيانات الأسعار...</p>
              <p className="text-xs mt-1">ستظهر الرسوم البيانية قريباً</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(chartData).map(([pair, dexes]) => (
              <div key={pair} className="bg-dark-800 rounded-lg p-4">
                <h3 className="font-bold mb-3">{pair}</h3>
                <div className="flex flex-wrap gap-3 mb-3">
                  {dexes.map((d) => (
                    <div key={d.dex} className="flex items-center gap-2 text-xs">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: dexColors[d.dex] || '#666' }}
                      />
                      <span className="text-gray-400">{d.dex}</span>
                      <span className="font-mono text-white">
                        {d.prices.length > 0 ? d.prices[d.prices.length - 1].toFixed(4) : '-'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="h-32 relative">
                  <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                    {dexes.map((d, di) => {
                      if (d.prices.length < 2) return null;
                      const min = Math.min(...d.prices);
                      const max = Math.max(...d.prices);
                      const range = max - min || 1;
                      const points = d.prices.map((p, i) => {
                        const x = (i / (d.prices.length - 1)) * 400;
                        const y = 100 - ((p - min) / range) * 80 - 10;
                        return `${x},${y}`;
                      }).join(' ');
                      return (
                        <polyline
                          key={di}
                          points={points}
                          fill="none"
                          stroke={dexColors[d.dex] || '#666'}
                          strokeWidth="2"
                          opacity="0.8"
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card p-4">
        <h2 className="text-lg font-bold mb-4">📈 تاريخ الفرص</h2>
        <div className="h-48 relative">
          <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
            {opportunities.length > 1 && (
              <>
                {opportunities.slice(0, 50).reverse().map((opp, i, arr) => {
                  const x = (i / (arr.length - 1)) * 400;
                  const maxProfit = Math.max(...arr.map(o => o.profit.usd));
                  const y = 150 - (opp.profit.usd / maxProfit) * 130 - 10;
                  return (
                    <circle
                      key={opp.id}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={opp.profit.usd >= 50 ? '#00e676' : opp.profit.usd >= 10 ? '#00d4ff' : '#ffdd00'}
                      opacity="0.8"
                    />
                  );
                })}
              </>
            )}
          </svg>
          {opportunities.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              لا توجد فرص بعد
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
