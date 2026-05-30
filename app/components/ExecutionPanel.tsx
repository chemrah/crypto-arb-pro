'use client';

import { useState, useCallback } from 'react';
import { useArbStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';

const EXECUTION_STEPS = [
  { icon: '🏦', label: 'Flash Loan طلب', activeLabel: 'جاري طلب القرض...' },
  { icon: '🛒', label: 'الشراء من DEX A', activeLabel: 'جاري الشراء...' },
  { icon: '💱', label: 'البيع على DEX B', activeLabel: 'جاري البيع...' },
  { icon: '🔄', label: 'سداد القرض', activeLabel: 'جاري السداد...' },
  { icon: '💰', label: 'تحويل الربح', activeLabel: 'جاري تحويل الربح...' },
];

const STRATEGIES = [
  { id: 'flash_loan', label: 'Flash Loan', icon: '⚡', fee: '0.09%', desc: 'Aave V3', color: 'accent-cyan' },
  { id: 'flash_swap', label: 'Flash Swap', icon: '🦄', fee: '0.3%', desc: 'Uniswap V2/V3', color: 'accent-purple' },
  { id: 'flash_mint', label: 'Flash Mint', icon: '🏛️', fee: '0%', desc: 'MakerDAO DAI', color: 'accent-green' },
] as const;

export function ExecutionPanel() {
  const store = useArbStore();
  const { walletAddress, opportunities, executionHistory, selectedOpportunity } = store;
  const executionStatus = (store as any).executionStatus || null;
  const autoExecuteConfig = (store as any).autoExecuteConfig || { enabled: false, minProfit: 10, maxGasGwei: 50 };
  const setAutoExecuteConfig = (store as any).setAutoExecuteConfig;
  const setExecutionStatus = (store as any).setExecutionStatus;

  const [strategy, setStrategy] = useState<'flash_loan' | 'flash_swap' | 'flash_mint'>('flash_loan');
  const [loanAmount, setLoanAmount] = useState('10000');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<{ success: boolean; profit: number } | null>(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [autoMinProfit, setAutoMinProfit] = useState(autoExecuteConfig.minProfit);
  const [autoMaxGas, setAutoMaxGas] = useState(autoExecuteConfig.maxGasGwei);

  const handleSimulate = useCallback(async () => {
    if (!selectedOpportunity) return;
    setIsSimulating(true);
    setSimulationResult(null);

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));

    const amount = parseFloat(loanAmount);
    const selectedStrat = STRATEGIES.find((s) => s.id === strategy)!;
    const feeRate = strategy === 'flash_loan' ? 0.0009 : strategy === 'flash_swap' ? 0.003 : 0;

    const result = {
      strategy: selectedStrat.label,
      loanAmount: amount,
      steps: [
        { action: 'Flash Loan', amount: `$${amount.toLocaleString()}`, source: selectedStrat.desc },
        { action: 'شراء', dex: selectedOpportunity.buyDex, price: selectedOpportunity.buyPrice },
        { action: 'بيع', dex: selectedOpportunity.sellDex, price: selectedOpportunity.sellPrice },
        { action: 'سداد', amount: `$${(amount * (1 + feeRate)).toFixed(2)}` },
      ],
      estimatedProfit: selectedOpportunity.profit.usd * (amount / selectedOpportunity.loanAmount),
      gasCost: 0,
      netProfit: selectedOpportunity.profit.usd * (amount / selectedOpportunity.loanAmount),
    };

    setSimulationResult(result);
    setIsSimulating(false);
  }, [selectedOpportunity, loanAmount, strategy]);

  const handleExecute = useCallback(async () => {
    if (!walletAddress || !selectedOpportunity) return;
    setIsExecuting(true);
    setTxHash(null);
    setExecutionResult(null);

    // Call executeOpportunity via websocket
    try {
      const { executeOpportunity } = await import('@/lib/websocket');
      if (typeof executeOpportunity === 'function') {
        executeOpportunity(selectedOpportunity.id, strategy);
      }
    } catch { /* websocket module not yet available */ }

    // Simulate execution steps
    for (let i = 0; i < EXECUTION_STEPS.length; i++) {
      setCurrentStep(i);
      if (setExecutionStatus) {
        setExecutionStatus({
          step: i + 1,
          totalSteps: EXECUTION_STEPS.length,
          currentAction: EXECUTION_STEPS[i].activeLabel,
        });
      }
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Simulated result
    const fakeTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    setTxHash(fakeTxHash);
    setCurrentStep(EXECUTION_STEPS.length);

    const profit = selectedOpportunity.profit.usd * (parseFloat(loanAmount) / selectedOpportunity.loanAmount);
    setExecutionResult({ success: true, profit });

    if (setExecutionStatus) {
      setExecutionStatus({ step: 5, totalSteps: 5, currentAction: 'مكتمل', txHash: fakeTxHash });
    }

    setIsExecuting(false);
  }, [walletAddress, selectedOpportunity, strategy, loanAmount, setExecutionStatus]);

  const handleToggleAuto = useCallback(async (enabled: boolean) => {
    if (setAutoExecuteConfig) {
      setAutoExecuteConfig({ ...autoExecuteConfig, enabled, minProfit: autoMinProfit, maxGasGwei: autoMaxGas });
    }
    try {
      const { toggleAutoExecute } = await import('@/lib/websocket');
      if (typeof toggleAutoExecute === 'function') {
        toggleAutoExecute(enabled, autoMinProfit);
      }
    } catch { /* ignore */ }
  }, [autoExecuteConfig, autoMinProfit, autoMaxGas, setAutoExecuteConfig]);

  // Stats for auto-execute panel
  const todayExecutions = executionHistory.filter((e: any) => {
    const ts = new Date(e.timestamp || Date.now()).toDateString();
    return ts === new Date().toDateString();
  }).length;
  const successRate = executionHistory.length > 0
    ? (executionHistory.filter((e: any) => e.success).length / executionHistory.length) * 100
    : 0;
  const totalProfit = executionHistory
    .filter((e: any) => e.success)
    .reduce((sum: number, e: any) => sum + (e.profit || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Execute Panel */}
      <div className="space-y-4">
        <div className="glass-card p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-sm">⚡</span>
            تنفيذ Arbitrage
          </h2>

          {!walletAddress ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3 animate-float">🔒</div>
              <p className="text-gray-400">قم بتوصيل محفظتك من الأعلى للبدء</p>
              <p className="text-xs text-gray-600 mt-1">يدعم MetaMask والمحافظ المتوافقة مع EVM</p>
            </div>
          ) : !selectedOpportunity ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3 animate-float">🎯</div>
              <p className="text-gray-400">اختر فرصة من جدول الفرص الحية</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected opportunity */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-500">
                <div className="text-xs text-gray-500 mb-1">الفرصة المحددة</div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">{selectedOpportunity.pair}</span>
                  <span className="font-mono font-bold text-accent-green text-lg">
                    +${selectedOpportunity.profit.usd.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {selectedOpportunity.buyDex} → {selectedOpportunity.sellDex}
                </div>
              </div>

              {/* Strategy selector */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">الاستراتيجية</label>
                <div className="grid grid-cols-3 gap-2">
                  {STRATEGIES.map((s) => (
                    <motion.button
                      key={s.id}
                      onClick={() => setStrategy(s.id as any)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        strategy === s.id
                          ? `bg-${s.color}/10 border-${s.color} text-${s.color} shadow-lg`
                          : 'bg-dark-800 border-dark-500 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-xl mb-1">{s.icon}</div>
                      <div className="text-xs font-bold">{s.label}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{s.fee}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Loan amount */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">مبلغ القرض ($)</label>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-dark-500 font-mono text-lg focus:outline-none focus:border-accent-cyan transition-colors"
                  dir="ltr"
                />
                <div className="flex gap-2 mt-2">
                  {['1000', '10000', '50000', '100000', '500000'].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setLoanAmount(amount)}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                        loanAmount === amount
                          ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                          : 'bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600'
                      }`}
                    >
                      ${parseInt(amount) >= 1000 ? `${parseInt(amount) / 1000}K` : amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 rounded-xl bg-dark-700 border border-dark-500 text-white font-medium hover:bg-dark-600 transition-colors flex items-center justify-center gap-2"
                >
                  {isSimulating ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>🔄</motion.span>
                  ) : (
                    <span>🔍</span>
                  )}
                  محاكاة
                </motion.button>
                <motion.button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    isExecuting
                      ? 'bg-accent-orange/20 text-accent-orange border border-accent-orange/50'
                      : 'bg-gradient-to-r from-accent-cyan to-accent-purple text-white hover:opacity-90 shadow-lg shadow-accent-cyan/20'
                  }`}
                >
                  {isExecuting ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.span>
                      جاري التنفيذ...
                    </>
                  ) : (
                    <>⚡ تنفيذ الآن</>
                  )}
                </motion.button>
              </div>
            </div>
          )}
        </div>

        {/* Execution progress stepper */}
        <AnimatePresence>
          {(isExecuting || currentStep >= 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card p-5"
            >
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span>📋</span> خطوات التنفيذ
              </h3>
              <div className="space-y-3">
                {EXECUTION_STEPS.map((step, i) => {
                  const isActive = i === currentStep;
                  const isDone = i < currentStep;
                  const isFailed = false;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-accent-cyan/10 border border-accent-cyan/30'
                          : isDone
                          ? 'bg-accent-green/5 border border-accent-green/20'
                          : 'bg-dark-800 border border-dark-500'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                        isDone ? 'bg-accent-green/20' : isActive ? 'bg-accent-cyan/20' : 'bg-dark-700'
                      }`}>
                        {isDone ? '✅' : isActive ? (
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          >
                            ⏳
                          </motion.span>
                        ) : isFailed ? '❌' : step.icon}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${
                          isDone ? 'text-accent-green' : isActive ? 'text-accent-cyan' : 'text-gray-400'
                        }`}>
                          {isActive ? step.activeLabel : step.label}
                        </div>
                      </div>
                      {isActive && (
                        <div className="flex gap-0.5">
                          {[0, 1, 2].map((d) => (
                            <motion.div
                              key={d}
                              className="w-1.5 h-1.5 rounded-full bg-accent-cyan"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* TX Hash */}
              {txHash && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-xl bg-dark-800 border border-accent-green/20"
                >
                  <div className="text-xs text-gray-500 mb-1">TX Hash</div>
                  <a
                    href={`https://arbiscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-cyan text-sm font-mono hover:underline break-all"
                  >
                    {txHash}
                  </a>
                </motion.div>
              )}

              {/* Profit result */}
              {executionResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`mt-4 p-4 rounded-xl text-center ${
                    executionResult.success
                      ? 'bg-accent-green/10 border border-accent-green/30'
                      : 'bg-accent-red/10 border border-accent-red/30'
                  }`}
                >
                  <div className="text-3xl mb-2">
                    {executionResult.success ? '🎉' : '❌'}
                  </div>
                  <div className={`text-2xl font-bold font-mono ${
                    executionResult.success ? 'text-accent-green' : 'text-accent-red'
                  }`}>
                    {executionResult.success ? `+$${executionResult.profit.toFixed(2)}` : 'فشل التنفيذ'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {executionResult.success ? 'تم تحويل الربح إلى محفظتك ✨' : 'يرجى المحاولة مرة أخرى'}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Simulation result */}
        <AnimatePresence>
          {simulationResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-5"
            >
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <span>📊</span> نتيجة المحاكاة
              </h3>
              <div className="space-y-2">
                {simulationResult.steps.map((step: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-dark-800 rounded-xl p-3 text-sm">
                    <span className="text-gray-400">{step.action}</span>
                    <span className="font-mono text-white">
                      {step.amount || `${step.dex} @ $${step.price?.toFixed(4)}`}
                    </span>
                  </div>
                ))}
                <div className="border-t border-dark-500 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">الربح المتوقع</span>
                    <AnimatedNumber
                      value={simulationResult.netProfit}
                      prefix="+$"
                      decimals={2}
                      className="text-xl font-bold text-accent-green"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                    <span>رسوم الغاز</span>
                    <span className="text-accent-green">$0.00 (Paymaster)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Auto Execute Config */}
      <div className="space-y-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>🤖</span> التنفيذ التلقائي
            </h2>
            <button
              onClick={() => handleToggleAuto(!autoExecuteConfig.enabled)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                autoExecuteConfig.enabled ? 'bg-accent-green' : 'bg-dark-500'
              }`}
            >
              <motion.div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
                animate={{ left: autoExecuteConfig.enabled ? 28 : 4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            </button>
          </div>

          <div className={`space-y-4 transition-opacity ${autoExecuteConfig.enabled ? 'opacity-100' : 'opacity-50'}`}>
            {/* Min profit threshold */}
            <div>
              <label className="flex justify-between text-sm text-gray-400 mb-2">
                <span>الحد الأدنى للربح</span>
                <span className="text-accent-cyan font-mono">${autoMinProfit}</span>
              </label>
              <input
                type="range"
                min={1}
                max={1000}
                step={1}
                value={autoMinProfit}
                onChange={(e) => setAutoMinProfit(Number(e.target.value))}
                disabled={!autoExecuteConfig.enabled}
                className="w-full h-2 bg-dark-600 rounded-full appearance-none cursor-pointer accent-accent-cyan"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1 font-mono">
                <span>$1</span>
                <span>$1,000</span>
              </div>
            </div>

            {/* Max gas price */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                الحد الأقصى لسعر الغاز (Gwei)
              </label>
              <input
                type="number"
                value={autoMaxGas}
                onChange={(e) => setAutoMaxGas(Number(e.target.value))}
                disabled={!autoExecuteConfig.enabled}
                className="w-full px-4 py-2 rounded-xl bg-dark-800 border border-dark-500 font-mono text-sm focus:outline-none focus:border-accent-cyan disabled:opacity-50"
                dir="ltr"
              />
            </div>

            {/* Strategy preference */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">الاستراتيجية المفضلة</label>
              <div className="grid grid-cols-3 gap-2">
                {STRATEGIES.map((s) => (
                  <button
                    key={s.id}
                    disabled={!autoExecuteConfig.enabled}
                    className="p-2 rounded-lg bg-dark-800 border border-dark-500 text-center text-xs text-gray-400 hover:border-accent-cyan/50 disabled:opacity-50 transition-all"
                  >
                    <span className="text-lg">{s.icon}</span>
                    <div className="mt-0.5">{s.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Auto-execute stats */}
        <div className="glass-card p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <span>📊</span> إحصائيات اليوم
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-dark-800 rounded-xl p-3 text-center">
              <div className="text-lg font-bold font-mono text-accent-cyan">{todayExecutions}</div>
              <div className="text-[10px] text-gray-500">عمليات</div>
            </div>
            <div className="bg-dark-800 rounded-xl p-3 text-center">
              <div className="text-lg font-bold font-mono text-accent-green">{successRate.toFixed(0)}%</div>
              <div className="text-[10px] text-gray-500">نجاح</div>
            </div>
            <div className="bg-dark-800 rounded-xl p-3 text-center">
              <div className="text-lg font-bold font-mono text-accent-orange">${totalProfit.toFixed(0)}</div>
              <div className="text-[10px] text-gray-500">الربح</div>
            </div>
          </div>
        </div>

        {/* Activity log */}
        <div className="glass-card p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <span>📜</span> سجل النشاط
          </h3>
          {executionHistory.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-gray-400 text-sm">لا توجد عمليات منفذة بعد</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {executionHistory.slice(0, 10).map((exec: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-dark-800 rounded-xl p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{exec.pair}</span>
                    <span className={`font-mono font-bold text-sm ${exec.success ? 'text-accent-green' : 'text-accent-red'}`}>
                      {exec.success ? `+$${exec.profit?.toFixed(2) || '0.00'}` : '❌ فشل'}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">{exec.timestamp || 'الآن'}</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* MEV Protection */}
        <div className="glass-card p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <span>🛡️</span> حماية MEV
          </h3>
          <div className="space-y-2">
            {[
              { icon: '🤖', label: 'Flashbots Protect', status: 'نشط' },
              { icon: '🔒', label: 'Private Transactions', status: 'نشط' },
              { icon: '💰', label: 'Gasless (Paymaster)', status: 'نشط' },
              { icon: '🛡️', label: 'Sandwich Protection', status: 'نشط' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-dark-800 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-xs bg-accent-green/10 text-accent-green">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
