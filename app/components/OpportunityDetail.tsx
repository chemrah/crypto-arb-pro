'use client';

import { Opportunity } from '@/lib/store';
import { useArbStore } from '@/lib/store';

interface Props {
  opportunity: Opportunity;
}

export function OpportunityDetail({ opportunity: opp }: Props) {
  const { walletAddress } = useArbStore();

  const steps = [
    { icon: '🏦', label: 'Flash Loan', detail: `اقتراض $${opp.loanAmount.toLocaleString()} من Aave V3`, fee: `$${(opp.loanAmount * 0.0009).toFixed(2)}` },
    { icon: '🛒', label: 'شراء', detail: `شراء من ${opp.buyDex} بسعر $${opp.buyPrice.toFixed(4)}`, fee: '0.3%' },
    { icon: '💱', label: 'بيع', detail: `بيع على ${opp.sellDex} بسعر $${opp.sellPrice.toFixed(4)}`, fee: '0.3%' },
    { icon: '🔄', label: 'سداد', detail: `سداد $${opp.loanAmount.toLocaleString()} + الرسوم`, fee: '-' },
    { icon: '💰', label: 'ربح', detail: `تحويل الربح إلى محفظتك`, fee: `$${opp.profit.usd.toFixed(2)}` },
  ];

  return (
    <div className="glass-card overflow-hidden animate-slide-in">
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
        <p className="text-xs text-gray-400 mt-1 font-mono" dir="ltr">{opp.id}</p>
      </div>

      <div className="p-4 space-y-4">
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
              <span className="text-gray-400">رسوم الغاز</span>
              <span className="font-mono text-accent-green">$0.00 (Paymaster)</span>
            </div>
            <div className="border-t border-dark-500 pt-2 flex justify-between">
              <span className="text-white font-bold">الربح الصافي</span>
              <span className="font-mono font-bold text-accent-green">${opp.profit.usd.toFixed(4)}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-3">خطوات التنفيذ</div>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3 bg-dark-800 rounded-lg p-3">
                <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center text-lg flex-shrink-0">
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{step.label}</div>
                  <div className="text-xs text-gray-500 truncate">{step.detail}</div>
                </div>
                <div className="text-xs font-mono text-gray-400 flex-shrink-0">
                  {step.fee}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent-green/5 border border-accent-green/20">
          <span className="text-lg">⚡</span>
          <div className="flex-1">
            <div className="text-sm font-medium text-accent-green">Gasless Execution</div>
            <div className="text-xs text-gray-400">الغاز يُدفع من الأرباح عبر Paymaster</div>
          </div>
        </div>

        <button
          disabled={!walletAddress}
          className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
            walletAddress
              ? 'bg-gradient-to-r from-accent-cyan to-accent-purple text-white hover:opacity-90 animate-glow'
              : 'bg-dark-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {walletAddress ? '⚡ تنفيذ الآن' : '🔒 أدخل عنوان المحفظة أولاً'}
        </button>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>الثقة: <span className={`font-bold ${
            opp.confidence >= 80 ? 'text-accent-green' :
            opp.confidence >= 60 ? 'text-accent-orange' : 'text-accent-red'
          }`}>{opp.confidence}%</span></span>
          <span>ينتهي: {Math.max(0, Math.floor((opp.expiry - Date.now()) / 1000))}s</span>
        </div>
      </div>
    </div>
  );
}
