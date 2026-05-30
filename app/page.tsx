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

export default function Home() {
  const { isConnected, setConnected, selectedOpportunity } = useArbStore();
  const [activeTab, setActiveTab] = useState<'opportunities' | 'chart' | 'dexes' | 'execute'>('opportunities');

  useEffect(() => {
    const cleanup = connectWebSocket();
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 p-4 lg:p-6 space-y-6">
        <StatsGrid />

        <div className="flex gap-2 border-b border-dark-500 pb-2">
          {[
            { id: 'opportunities', label: 'الفرص الحية', icon: '🎯' },
            { id: 'chart', label: 'الرسوم البيانية', icon: '📊' },
            { id: 'dexes', label: 'المنصات', icon: '🏦' },
            { id: 'execute', label: 'التنفيذ', icon: '⚡' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/50'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <span className="ml-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

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
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'chart' && <PriceChart />}

          {activeTab === 'dexes' && <DexOverview />}

          {activeTab === 'execute' && <ExecutionPanel />}
        </div>
      </main>

      <footer className="border-t border-dark-500 p-4 text-center text-sm text-gray-500">
        <p>Crypto Arbitrage Pro v1.0 — Flash Loans • Flash Swaps • Flash Mint — Zero Gas Fees</p>
      </footer>
    </div>
  );
}
