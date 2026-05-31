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

export interface ExecutionResult {
  id: string;
  pair: string;
  strategy: string;
  buyDex: string;
  sellDex: string;
  profit: number;
  txHash: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  gasUsed?: number;
  gasCost?: number;
  error?: string;
}

export interface ExecutionStatus {
  step: number;
  totalSteps: number;
  currentAction: string;
  txHash?: string;
  error?: string;
}

export interface AutoExecuteConfig {
  enabled: boolean;
  minProfit: number;
  maxGasGwei: number;
  preferredStrategy: 'flash_loan' | 'flash_swap' | 'flash_mint' | 'auto';
}

interface ArbStore {
  // Connection
  isConnected: boolean;
  walletAddress: string;
  signer: any;
  provider: any;
  chainId: number;
  isWalletConnecting: boolean;
  walletBalance: string;

  // Network & mode
  networkMode: 'testnet' | 'mainnet';
  executionMode: 'manual' | 'auto';

  // Data
  opportunities: Opportunity[];
  selectedOpportunity: Opportunity | null;
  stats: Stats;
  priceHistory: PriceData[];
  executionHistory: ExecutionResult[];

  // Execution
  executionStatus: ExecutionStatus | null;
  autoExecuteConfig: AutoExecuteConfig;

  // Prices
  ethPrice: number;
  gasPrice: number;
  gasSaved: number;

  // Bot mode & settings
  botMode: 'basic' | 'smart';
  tradeStats: any;
  customTokens: Record<string, any>;
  lendingSource: string;

  // Actions - Connection
  setConnected: (connected: boolean) => void;
  setWalletAddress: (address: string) => void;
  setSigner: (signer: any) => void;
  setProvider: (provider: any) => void;
  setChainId: (chainId: number) => void;
  setIsWalletConnecting: (connecting: boolean) => void;
  setWalletBalance: (balance: string) => void;

  // Actions - Network & mode
  setNetworkMode: (mode: 'testnet' | 'mainnet') => void;
  setExecutionMode: (mode: 'manual' | 'auto') => void;

  // Actions - Data
  addOpportunity: (opp: Opportunity) => void;
  setSelectedOpportunity: (opp: Opportunity | null) => void;
  setStats: (stats: Stats) => void;
  updatePrices: (data: PriceData) => void;
  clearOpportunities: () => void;

  // Actions - Execution
  addExecution: (exec: ExecutionResult) => void;
  setExecutionStatus: (status: ExecutionStatus | null) => void;
  setAutoExecuteConfig: (config: Partial<AutoExecuteConfig>) => void;

  // Actions - Prices
  setEthPrice: (price: number) => void;
  setGasPrice: (price: number) => void;
  addGasSaved: (amount: number) => void;

  // Actions - Bot mode & settings
  setBotMode: (mode: string) => void;
  setTradeStats: (stats: any) => void;
  setCustomTokens: (tokens: any) => void;
  setLendingSource: (source: string) => void;
}

export const useArbStore = create<ArbStore>((set) => ({
  // Connection
  isConnected: false,
  walletAddress: '',
  signer: null,
  provider: null,
  chainId: 42161,
  isWalletConnecting: false,
  walletBalance: '0',

  // Network & mode
  networkMode: 'mainnet',
  executionMode: 'manual',

  // Data
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
  executionHistory: [],

  // Execution
  executionStatus: null,
  autoExecuteConfig: {
    enabled: false,
    minProfit: 5,
    maxGasGwei: 0.5,
    preferredStrategy: 'auto',
  },

  // Prices
  ethPrice: 3000,
  gasPrice: 0.1,
  gasSaved: 0,

  // Bot mode & settings
  botMode: 'basic',
  tradeStats: null,
  customTokens: {},
  lendingSource: 'auto',

  // Actions
  setConnected: (connected) => set({ isConnected: connected }),
  setWalletAddress: (address) => set({ walletAddress: address }),
  setSigner: (signer) => set({ signer }),
  setProvider: (provider) => set({ provider }),
  setChainId: (chainId) => set({ chainId }),
  setIsWalletConnecting: (connecting) => set({ isWalletConnecting: connecting }),
  setWalletBalance: (balance) => set({ walletBalance: balance }),

  setNetworkMode: (mode) => set({ networkMode: mode }),
  setExecutionMode: (mode) => set({ executionMode: mode }),

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
  clearOpportunities: () => set({ opportunities: [] }),

  addExecution: (exec) =>
    set((state) => ({
      executionHistory: [exec, ...state.executionHistory].slice(0, 500),
    })),
  setExecutionStatus: (status) => set({ executionStatus: status }),
  setAutoExecuteConfig: (config) =>
    set((state) => ({
      autoExecuteConfig: { ...state.autoExecuteConfig, ...config },
    })),

  setEthPrice: (price) => set({ ethPrice: price }),
  setGasPrice: (price) => set({ gasPrice: price }),
  addGasSaved: (amount) =>
    set((state) => ({ gasSaved: state.gasSaved + amount })),

  setBotMode: (mode) => set({ botMode: mode as 'basic' | 'smart' }),
  setTradeStats: (stats) => set({ tradeStats: stats }),
  setCustomTokens: (tokens) => set({ customTokens: tokens }),
  setLendingSource: (source) => set({ lendingSource: source }),
}));
