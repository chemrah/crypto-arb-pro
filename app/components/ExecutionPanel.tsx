'use client';

import { useState } from 'react';
import { useArbStore } from '@/lib/store';

export function ExecutionPanel() {
  const { walletAddress, opportunities, executionHistory, selectedOpportunity } = useArbStore();
  const [strategy, setStrategy] = useState<'flash_loan' | 'flash_swap' | 'flash_mint'>('flash_loan');
  const [loanAmount, setLoanAmount] = useState('10000');
  const [isExecuting, setIsExecuting] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const handleSimulate = () => {
    if (!selectedOpportunity) return;

    const result = {
      strategy,
      loanAmount: parseFloat(loanAmount),
      steps: [
        { action: 'Flash Loan', amount: `$${loanAmount}`, source: strategy === 'flash_mint' ? 'MakerDAO' : 'Aave V3' },
        { action: 'شراء', dex: selectedOpportunity.buyDex, price: selectedOpportunity.buyPrice },
        { action: 'بيع', dex: selectedOpportunity.sellDex, price: selectedOpportunity.sellPrice },
        { action: 'سداد', amount: `$${(parseFloat(loanAmount) * 1.0009).toFixed(2)}` },
      ],
      estimatedProfit: selectedOpportunity.profit.usd * (parseFloat(loanAmount) / selectedOpportunity.loanAmount),
      gasCost: 0,
      netProfit: selectedOpportunity.profit.usd * (parseFloat(loanAmount) / selectedOpportunity.loanAmount),
    };

    setSimulationResult(result);
  };

  const handleExecute = async () => {
    if (!walletAddress || !selectedOpportunity) return;

    setIsExecuting(true);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    setIsExecuting(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="glass-card p-4">
          <h2 className="text-lg font-bold mb-4">⚡ تنفيذ Arbitrage</h2>

          {!walletAddress ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🔒</div>
              <p className="text-gray-400">أدخل عنوان محفظتك في الأعلى للبدء</p>
            </div>
          ) : !selectedOpportunity ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-gray-400">اختر فرصة من جدول الفرص الحية</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-dark-800 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">الفرصة المحددة</div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">{selectedOpportunity.pair}</span>
                  <span className="font-mono font-bold text-accent-green">
                    +${selectedOpportunity.profit.usd.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {selectedOpportunity.buyDex} → {selectedOpportunity.sellDex}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">الاستراتيجية</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'flash_loan', label: 'Flash Loan', icon: '👻', fee: '0.09%' },
                    { id: 'flash_swap', label: 'Flash Swap', icon: '🦄', fee: '0.3%' },
                    { id: 'flash_mint', label: 'Flash Mint', icon: '🏛️', fee: '0%' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStrategy(s.id as any)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        strategy === s.id
                          ? 'bg-accent-cyan/10 border-accent-cyan text-accent-cyan'
                          : 'bg-dark-800 border-dark-500 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-xl mb-1">{s.icon}</div>
                      <div className="text-xs font-medium">{s.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.fee}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">مبلغ القرض ($)</label>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-dark-800 border border-dark-500 font-mono text-lg focus:outline-none focus:border-accent-cyan"
                  dir="ltr"
                />
                <div className="flex gap-2 mt-2">
                  {['1000', '10000', '50000', '100000'].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setLoanAmount(amount)}
                      className="px-3 py-1 rounded text-xs bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600 transition-colors"
                    >
                      ${parseInt(amount).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSimulate}
                  className="flex-1 py-3 rounded-lg bg-dark-700 border border-dark-500 text-white font-medium hover:bg-dark-600 transition-colors"
                >
                  🔍 محاكاة
                </button>
                <button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                    isExecuting
                      ? 'bg-accent-orange/20 text-accent-orange border border-accent-orange/50'
                      : 'bg-gradient-to-r from-accent-cyan to-accent-purple text-white hover:opacity-90'
                  }`}
                >
                  {isExecuting ? '⏳ جاري التنفيذ...' : '⚡ تنفيذ الآن'}
                </button>
              </div>
            </div>
          )}
        </div>

        {simulationResult && (
          <div className="glass-card p-4 animate-slide-in">
            <h3 className="font-bold mb-3">📊 نتيجة المحاكاة</h3>
            <div className="space-y-2">
              {simulationResult.steps.map((step: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-dark-800 rounded-lg p-3 text-sm">
                  <span className="text-gray-400">{step.action}</span>
                  <span className="font-mono">
                    {step.amount || `${step.dex} @ ${step.price?.toFixed(4)}`}
                  </span>
                </div>
              ))}
              <div className="border-t border-dark-500 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold">الربح المتوقع</span>
                  <span className="font-mono text-xl font-bold text-accent-green">
                    +${simulationResult.netProfit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                  <span>رسوم الغاز</span>
                  <span className="text-accent-green">$0.00 (Paymaster)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="glass-card p-4">
          <h2 className="text-lg font-bold mb-4">📜 سجل التنفيذ</h2>
          {executionHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-400">لا توجد عمليات منفذة بعد</p>
              <p className="text-xs text-gray-600 mt-1">ستظهر هنا جميع عمليات الـ arbitrage المنفذة</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
              {executionHistory.map((exec, i) => (
                <div key={i} className="bg-dark-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{exec.pair}</span>
                    <span className={`font-mono font-bold ${exec.success ? 'text-accent-green' : 'text-accent-red'}`}>
                      {exec.success ? `+$${exec.profit.toFixed(2)}` : 'فشل'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{exec.timestamp}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-4">
          <h3 className="font-bold mb-3">🛡️ حماية MEV</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-dark-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span>🤖</span>
                <span className="text-sm">Flashbots Protect</span>
              </div>
              <span className="px-2 py-0.5 rounded text-xs bg-accent-green/10 text-accent-green">نشط</span>
            </div>
            <div className="flex items-center justify-between bg-dark-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span>🔒</span>
                <span className="text-sm">Private Transactions</span>
              </div>
              <span className="px-2 py-0.5 rounded text-xs bg-accent-green/10 text-accent-green">نشط</span>
            </div>
            <div className="flex items-center justify-between bg-dark-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span>💰</span>
                <span className="text-sm">Gasless (Paymaster)</span>
              </div>
              <span className="px-2 py-0.5 rounded text-xs bg-accent-green/10 text-accent-green">نشط</span>
            </div>
            <div className="flex items-center justify-between bg-dark-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span>🛡️</span>
                <span className="text-sm">Sandwich Protection</span>
              </div>
              <span className="px-2 py-0.5 rounded text-xs bg-accent-green/10 text-accent-green">نشط</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
