import { create } from 'zustand';

export interface Opportunity {
  id: string;
  pair: string;
  tokenIn: string;
  tokenOut: string;
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercent: number;
  loanAmount: number;
  tokensReceived: number;
  sellProceeds: number;
  profit: {
    gross: number;
    flashLoanFee: number;
    dexFees: number;
    gasCost: number;
    net: number;
    usd: number;
    percent: number;
  };
  strategy: string;
  gasless: boolean;
  timestamp: number;
  expiry: number;
  confidence: number;
}

export interface Stats {
  totalScans: number;
  opportunitiesFound: number;
  totalProfit: number;
  activePairs: number;
  lastScan: string | null;
  uptime: number;
}

export interface PriceData {
  pair: string;
  prices: Array<{
    dexId: string;
    price: number;
    amountOut: string;
    timestamp: number;
  }>;
}

interface ArbStore {
  isConnected: boolean;
  opportunities: Opportunity[];
  selectedOpportunity: Opportunity | null;
  stats: Stats;
  priceHistory: PriceData[];
  walletAddress: string;
  executionHistory: any[];

  setConnected: (connected: boolean) => void;
  addOpportunity: (opp: Opportunity) => void;
  setSelectedOpportunity: (opp: Opportunity | null) => void;
  setStats: (stats: Stats) => void;
  updatePrices: (data: PriceData) => void;
  setWalletAddress: (address: string) => void;
  addExecution: (exec: any) => void;
  clearOpportunities: () => void;
}

export const useArbStore = create<ArbStore>((set) => ({
  isConnected: false,
  opportunities: [],
  selectedOpportunity: null,
  stats: {
    totalScans: 0,
    opportunitiesFound: 0,
    totalProfit: 0,
    activePairs: 0,
    lastScan: null,
    uptime: Date.now(),
  },
  priceHistory: [],
  walletAddress: '',
  executionHistory: [],

  setConnected: (connected) => set({ isConnected: connected }),

  addOpportunity: (opp) =>
    set((state) => ({
      opportunities: [opp, ...state.opportunities].slice(0, 200),
    })),

  setSelectedOpportunity: (opp) => set({ selectedOpportunity: opp }),

  setStats: (stats) => set({ stats }),

  updatePrices: (data) =>
    set((state) => ({
      priceHistory: [...state.priceHistory, data].slice(-100),
    })),

  setWalletAddress: (address) => set({ walletAddress: address }),

  addExecution: (exec) =>
    set((state) => ({
      executionHistory: [exec, ...state.executionHistory],
    })),

  clearOpportunities: () => set({ opportunities: [] }),
}));
