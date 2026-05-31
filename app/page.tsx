'use client';

import { useEffect, useState } from 'react';
import { useArbStore } from '@/lib/store';
import { connectWebSocket } from '@/lib/websocket';
import { Header } from './components/Header';
import { StatsGrid } from './components/StatsGrid';
import { OpportunityTable } from './components/OpportunityTable';
import { PriceChart } from './components/PriceChart';
import { OpportunityDetail } from './components/OpportunityDetail';
import { DexOverview } from './components/DexOverview';
import { ExecutionPanel } from './components/ExecutionPanel';
import { ProfitCalculator } from './components/ProfitCalculator';
import { ExecutionHistory } from './components/ExecutionHistory';
import { BotModeSelector } from './components/BotModeSelector';
import { LendingSourceSelector } from './components/LendingSourceSelector';
import { CustomTokenManager } from './components/CustomTokenManager';

const TABS = [
  { id: 'opportunities', label: 'الفرص الحية', icon: '🎯' },
  { id: 'chart', label: 'الرسوم البيانية', icon: '📊' },
  { id: 'dexes', label: 'المنصات', icon: '🏦' },
  { id: 'execute', label: 'التنفيذ', icon: '⚡' },
  { id: 'calculator', label: 'حاسبة الأرباح', icon: '🧮' },
  { id: 'history', label: 'السجل', icon: '📜' },
  { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function Home() {
  const { isConnected, selectedOpportunity } = useArbStore();
  const [activeTab, setActiveTab] = useState<TabId>('opportunities');

  useEffect(() => {
    const cleanup = connectWebSocket();
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-dark-900">
      <Header />

      <main className="flex-1 p-4 lg:p-6 space-y-6">
        <StatsGrid />

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-dark-500 pb-2 overflow-x-auto scrollbar-thin">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/50 shadow-lg shadow-accent-cyan/10'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <span className="ml-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'opportunities' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <OpportunityTable />
              </div>
              <div>
                {selectedOpportunity ? (
                  <OpportunityDetail opportunity={selectedOpportunity} />
                ) : (
                  <div className="glass-card p-8 text-center">
                    <div className="text-4xl mb-4">🎯</div>
                    <p className="text-gray-400">اختر فرصة لعرض التفاصيل</p>
                    <p className="text-xs text-gray-600 mt-2">يتم اكتشاف جميع الفرص المربحة تلقائياً</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'chart' && <PriceChart />}
          {activeTab === 'dexes' && <DexOverview />}
          {activeTab === 'execute' && <ExecutionPanel />}
          {activeTab === 'calculator' && <ProfitCalculator />}
          {activeTab === 'history' && <ExecutionHistory />}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <BotModeSelector />
              <LendingSourceSelector />
              <CustomTokenManager />
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-dark-500 p-4 text-center text-sm text-gray-500">
        <p>
          ⚡ Crypto Arbitrage Pro v3.0 — Flash Loans • Flash Swaps • Flash Mint — 
          <span className="text-accent-green"> Zero Gas Fees</span> — 
          <span className="text-accent-cyan"> 59 DEXes</span> — 
          <span className="text-accent-purple"> 6 Chains</span> — 
          <span className="text-amber-400"> 4 Lending Sources</span>
        </p>
      </footer>
    </div>
  );
}
