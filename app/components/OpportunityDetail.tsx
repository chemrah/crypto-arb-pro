'use client';

import { useState, useEffect } from 'react';
import { Opportunity, useArbStore } from '@/lib/store';
import { executeOpportunity } from '@/lib/websocket';
import { getTxUrl } from '@/lib/wallet';

interface Props {
  opportunity: Opportunity;
}

export function OpportunityDetail({ opportunity: opp }: Props) {
  const { walletAddress, executionStatus, chainId } = useArbStore();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);

  // Live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((opp.expiry - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [opp.expiry]);

  const handleExecute = () => {
    if (!walletAddress) return;
    setIsExecuting(true);
    executeOpportunity(opp.id, opp.strategy || 'flash_loan', walletAddress);
    setTimeout(() => setIsExecuting(false), 10000);
  };

  const handleSimulate = async () => {
    try {
      const res = await fetch('/api/execute/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: opp.id, strategy: 'flash_loan' }),
      });
      const data = await res.json();
      alert(data.success ? `✅ المحاكاة ناجحة — الربح المتوقع: $${opp.profit.usd.toFixed(2)}` : `❌ فشل: ${data.error}`);
    } catch (e) {
      alert('❌ خطأ في الاتصال بالخادم');
    }
  };

  const handleCopyDetails = () => {
    const details = `🎯 فرصة Arbitrage\n${opp.pair}\nشراء: ${opp.buyDex} @ $${opp.buyPrice.toFixed(6)}\nبيع: ${opp.sellDex} @ $${opp.sellPrice.toFixed(6)}\nربح: $${opp.profit.usd.toFixed(2)} (${opp.profit.percent.toFixed(2)}%)\nاستراتيجية: ${opp.strategy}\nالثقة: ${opp.confidence}%`;
    navigator.clipboard.writeText(details);
  };

  const isExpired = timeLeft <= 0;

  const steps = [
    { icon: '🏦', label: 'Flash Loan', detail: `اقتراض $${opp.loanAmount.toLocaleString()} من Aave V3`, fee: `$${(opp.loanAmount * 0.0009).toFixed(2)}` },
    { icon: '🛒', label: 'شراء', detail: `شراء من ${opp.buyDex} بسعر $${opp.buyPrice.toFixed(4)}`, fee: '0.3%' },
    { icon: '💱', label: 'بيع', detail: `بيع على ${opp.sellDex} بسعر $${opp.sellPrice.toFixed(4)}`, fee: '0.3%' },
    { icon: '🔄', label: 'سداد', detail: `سداد $${opp.loanAmount.toLocaleString()} + الرسوم`, fee: '-' },
    { icon: '💰', label: 'ربح', detail: `تحويل الربح إلى محفظتك`, fee: `$${opp.profit.usd.toFixed(2)}` },
  ];

  return (
    <div className="glass-card overflow-hidden animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-dark-500 bg-gradient-to-r from-accent-cyan/10 to-accent-purple/10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{opp.pair}</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            opp.profit.usd >= 50 ? 'bg-accent-green/20 text-accent-green' :
            opp.profit.usd >= 10 ? 'bg-emerald-400/20 text-emerald-400' :
            'bg-yellow-400/20 text-yellow-400'
          }`}>
            +${opp.profit.usd.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-400 font-mono" dir="ltr">{opp.id.slice(0, 20)}...</p>
          <span className={`text-xs font-bold ${isExpired ? 'text-accent-red' : timeLeft <= 5 ? 'text-accent-orange animate-pulse' : 'text-gray-400'}`}>
            {isExpired ? '⏰ منتهية' : `⏳ ${timeLeft}s`}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Price comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-dark-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">سعر الشراء</div>
            <div className="font-mono font-bold text-accent-green">${opp.buyPrice.toFixed(6)}</div>
            <div className="text-xs text-gray-400">{opp.buyDex}</div>
          </div>
          <div className="bg-dark-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">سعر البيع</div>
            <div className="font-mono font-bold text-accent-red">${opp.sellPrice.toFixed(6)}</div>
            <div className="text-xs text-gray-400">{opp.sellDex}</div>
          </div>
        </div>

        {/* Profit breakdown */}
        <div className="bg-dark-800 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-2">تفاصيل الربح</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">الربح الإجمالي</span>
              <span className="font-mono text-white">${opp.profit.gross.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">رسوم Flash Loan (0.09%)</span>
              <span className="font-mono text-accent-red">-${opp.profit.flashLoanFee.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">رسوم DEX</span>
              <span className="font-mono text-accent-red">-${opp.profit.dexFees.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">⛽ رسوم الغاز</span>
              <span className="font-mono text-accent-green">$0.00 (Paymaster)</span>
            </div>
            <div className="border-t border-dark-500 pt-2 flex justify-between">
              <span className="text-white font-bold">الربح الصافي</span>
              <span className="font-mono font-bold text-accent-green">${opp.profit.usd.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Execution steps */}
        <div>
          <div className="text-xs text-gray-500 mb-3">خطوات التنفيذ</div>
          <div className="space-y-2">
            {steps.map((step, i) => {
              const isActive = executionStatus && executionStatus.step === i + 1;
              const isDone = executionStatus && executionStatus.step > i + 1;
              return (
                <div key={i} className={`flex items-center gap-3 rounded-lg p-3 transition-all ${
                  isActive ? 'bg-accent-cyan/10 border border-accent-cyan/30' :
                  isDone ? 'bg-accent-green/5 border border-accent-green/20' :
                  'bg-dark-800'
                }`}>
                  <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center text-lg flex-shrink-0">
                    {isDone ? '✅' : isActive ? '⏳' : step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{step.label}</div>
                    <div className="text-xs text-gray-500 truncate">{step.detail}</div>
                  </div>
                  <div className="text-xs font-mono text-gray-400 flex-shrink-0">{step.fee}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TX Hash display */}
        {executionStatus?.txHash && (
          <div className="bg-accent-green/5 border border-accent-green/20 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">TX Hash</div>
            <a
              href={getTxUrl(chainId, executionStatus.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-accent-cyan hover:underline break-all"
            >
              {executionStatus.txHash}
            </a>
          </div>
        )}

        {/* Gasless badge */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent-green/5 border border-accent-green/20">
          <span className="text-lg">⚡</span>
          <div className="flex-1">
            <div className="text-sm font-medium text-accent-green">Gasless Execution</div>
            <div className="text-xs text-gray-400">الغاز يُدفع عبر Biconomy Paymaster — تكلفة $0.00</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSimulate}
            disabled={isExpired}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-dark-700 border border-dark-500 text-white hover:bg-dark-600 transition-colors disabled:opacity-50"
          >
            🔍 محاكاة
          </button>
          <button
            onClick={handleCopyDetails}
            className="py-2.5 px-3 rounded-lg text-sm bg-dark-700 border border-dark-500 text-gray-400 hover:text-white transition-colors"
          >
            📋
          </button>
        </div>

        <button
          onClick={handleExecute}
          disabled={!walletAddress || isExpired || isExecuting}
          className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
            !walletAddress ? 'bg-dark-700 text-gray-500 cursor-not-allowed' :
            isExecuting ? 'bg-accent-orange/20 text-accent-orange border border-accent-orange/50 animate-pulse' :
            isExpired ? 'bg-dark-700 text-gray-500 cursor-not-allowed' :
            'bg-gradient-to-r from-accent-cyan to-accent-purple text-white hover:opacity-90 animate-glow'
          }`}
        >
          {!walletAddress ? '🔒 اربط المحفظة أولاً' :
           isExecuting ? '⏳ جاري التنفيذ...' :
           isExpired ? '⏰ الفرصة منتهية' :
           '⚡ تنفيذ الآن'}
        </button>

        {/* Confidence & timing */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>الثقة: <span className={`font-bold ${
            opp.confidence >= 80 ? 'text-accent-green' :
            opp.confidence >= 60 ? 'text-accent-orange' : 'text-accent-red'
          }`}>{opp.confidence}%</span></span>
          <span>الانتشار: <span className="font-mono text-white">{opp.spreadPercent.toFixed(3)}%</span></span>
        </div>
      </div>
    </div>
  );
}
