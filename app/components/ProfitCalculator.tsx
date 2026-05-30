'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GaugeChart } from './GaugeChart';
import { AnimatedNumber } from './AnimatedNumber';

type Strategy = 'flash_loan' | 'flash_swap' | 'flash_mint';

const STRATEGIES: { id: Strategy; label: string; icon: string; fee: number; feeLabel: string; source: string }[] = [
  { id: 'flash_loan', label: 'Flash Loan', icon: '⚡', fee: 0.0009, feeLabel: '0.09%', source: 'Aave V3' },
  { id: 'flash_swap', label: 'Flash Swap', icon: '🦄', fee: 0.003, feeLabel: '0.3%', source: 'Uniswap' },
  { id: 'flash_mint', label: 'Flash Mint', icon: '🏛️', fee: 0, feeLabel: '0%', source: 'MakerDAO' },
];

const PRESET_AMOUNTS = [1000, 10000, 50000, 100000, 500000, 1000000];

export function ProfitCalculator() {
  const [loanAmount, setLoanAmount] = useState(10000);
  const [spread, setSpread] = useState(0.5);
  const [strategy, setStrategy] = useState<Strategy>('flash_loan');
  const [showFlow, setShowFlow] = useState(true);

  const selectedStrategy = STRATEGIES.find((s) => s.id === strategy)!;

  const calculation = useMemo(() => {
    const grossProfit = loanAmount * (spread / 100);
    const flashLoanFee = loanAmount * selectedStrategy.fee;
    const dexFeeRate = 0.003;
    const buyDexFee = loanAmount * dexFeeRate;
    const sellDexFee = (loanAmount + grossProfit) * dexFeeRate;
    const totalDexFees = buyDexFee + sellDexFee;
    const gasCost = 0;
    const netProfit = grossProfit - flashLoanFee - totalDexFees - gasCost;
    const roi = (netProfit / loanAmount) * 100;

    const flowSteps = [
      { icon: '🏦', label: 'اقتراض', amount: loanAmount, detail: `من ${selectedStrategy.source}` },
      { icon: '🛒', label: 'شراء', amount: loanAmount - buyDexFee, detail: 'من DEX A (سعر منخفض)' },
      { icon: '💱', label: 'بيع', amount: loanAmount + grossProfit - sellDexFee, detail: 'على DEX B (سعر أعلى)' },
      { icon: '🔄', label: 'سداد', amount: loanAmount + flashLoanFee, detail: 'القرض + الرسوم' },
      { icon: '💰', label: 'ربح', amount: netProfit, detail: 'صافي الربح لمحفظتك' },
    ];

    return { grossProfit, flashLoanFee, totalDexFees, gasCost, netProfit, roi, flowSteps };
  }, [loanAmount, spread, selectedStrategy]);

  const profitGaugeValue = Math.max(0, Math.min((calculation.netProfit / (loanAmount * 0.05)) * 100, 100));

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🧮</span>
          <div>
            <h2 className="text-lg font-bold">حاسبة الأرباح</h2>
            <p className="text-xs text-gray-500">احسب أرباحك المتوقعة من عمليات الـ Arbitrage</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-5">
            {/* Strategy selector */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">الاستراتيجية</label>
              <div className="grid grid-cols-3 gap-2">
                {STRATEGIES.map((s) => (
                  <motion.button
                    key={s.id}
                    onClick={() => setStrategy(s.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      strategy === s.id
                        ? 'bg-accent-cyan/10 border-accent-cyan text-accent-cyan shadow-[0_0_15px_rgba(0,212,255,0.15)]'
                        : 'bg-dark-800 border-dark-500 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-xl mb-1">{s.icon}</div>
                    <div className="text-xs font-bold">{s.label}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">رسوم: {s.feeLabel}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Loan amount */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                مبلغ القرض: <span className="text-accent-cyan font-mono">${loanAmount.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min={100}
                max={1000000}
                step={100}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full h-2 bg-dark-600 rounded-full appearance-none cursor-pointer accent-accent-cyan"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PRESET_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setLoanAmount(amount)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                      loanAmount === amount
                        ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                        : 'bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600'
                    }`}
                  >
                    ${amount >= 1000 ? `${amount / 1000}K` : amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Spread */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                الفرق (Spread): <span className="text-accent-cyan font-mono">{spread.toFixed(2)}%</span>
              </label>
              <input
                type="range"
                min={0.01}
                max={5}
                step={0.01}
                value={spread}
                onChange={(e) => setSpread(Number(e.target.value))}
                className="w-full h-2 bg-dark-600 rounded-full appearance-none cursor-pointer accent-accent-cyan"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1 font-mono">
                <span>0.01%</span>
                <span>5.00%</span>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <GaugeChart
                value={Math.max(0, calculation.netProfit)}
                max={loanAmount * 0.03}
                label="صافي الربح"
                sublabel={`ROI: ${calculation.roi.toFixed(3)}%`}
                color={calculation.netProfit > 0 ? 'accent-green' : 'accent-red'}
                size="lg"
                icon="💰"
                format={(v) => `$${v.toFixed(0)}`}
              />
            </div>

            {/* Fee breakdown */}
            <div className="bg-dark-800/80 rounded-xl p-4 space-y-2.5">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">تفاصيل الرسوم</div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">الربح الإجمالي</span>
                <span className="font-mono text-white">${calculation.grossProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">رسوم {selectedStrategy.label} ({selectedStrategy.feeLabel})</span>
                <span className="font-mono text-accent-red">-${calculation.flashLoanFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">رسوم DEX (0.3% × 2)</span>
                <span className="font-mono text-accent-red">-${calculation.totalDexFees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">تكلفة الغاز</span>
                <span className="font-mono text-accent-green">$0.00 (Paymaster)</span>
              </div>
              <div className="border-t border-dark-500 pt-2 flex justify-between">
                <span className="text-white font-bold">صافي الربح</span>
                <span className={`font-mono text-lg font-bold ${calculation.netProfit > 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {calculation.netProfit >= 0 ? '+' : ''}${calculation.netProfit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flow diagram */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <span>🔄</span> خطوات التنفيذ
          </h3>
          <button
            onClick={() => setShowFlow(!showFlow)}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            {showFlow ? 'إخفاء' : 'عرض'}
          </button>
        </div>

        <AnimatePresence>
          {showFlow && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col md:flex-row items-stretch gap-2">
                {calculation.flowSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex-1 relative"
                  >
                    <div className={`bg-dark-800 rounded-xl p-4 border transition-all h-full ${
                      i === calculation.flowSteps.length - 1
                        ? calculation.netProfit > 0
                          ? 'border-accent-green/30 bg-accent-green/5'
                          : 'border-accent-red/30 bg-accent-red/5'
                        : 'border-dark-500'
                    }`}>
                      <div className="text-center">
                        <span className="text-2xl">{step.icon}</span>
                        <div className="text-xs font-bold mt-1">{step.label}</div>
                        <div className={`font-mono text-sm font-bold mt-1 ${
                          i === calculation.flowSteps.length - 1
                            ? step.amount >= 0 ? 'text-accent-green' : 'text-accent-red'
                            : 'text-accent-cyan'
                        }`}>
                          ${Math.abs(step.amount).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">{step.detail}</div>
                      </div>
                    </div>
                    {/* Arrow connector */}
                    {i < calculation.flowSteps.length - 1 && (
                      <div className="hidden md:flex absolute -left-1 top-1/2 -translate-y-1/2 -translate-x-1/2 text-gray-600 text-lg z-10">
                        →
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
