import { useArbStore } from './store';

let ws: WebSocket | null = null;
let reconnectInterval: NodeJS.Timeout | null = null;

export function connectWebSocket() {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

  function connect() {
    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      console.error('[WS] فشل إنشاء اتصال:', e);
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      console.log('[WS] متصل بالخادم');
      useArbStore.getState().setConnected(true);

      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }

      ws?.send(JSON.stringify({ type: 'get_stats' }));
      ws?.send(JSON.stringify({ type: 'get_opportunities' }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message);
      } catch (e) {
        console.error('[WS] رسالة غير صالحة:', e);
      }
    };

    ws.onclose = () => {
      console.log('[WS] انقطع الاتصال');
      useArbStore.getState().setConnected(false);
      scheduleReconnect();
    };

    ws.onerror = (error) => {
      console.error('[WS] خطأ:', error);
      ws?.close();
    };
  }

  function scheduleReconnect() {
    if (!reconnectInterval) {
      reconnectInterval = setInterval(() => {
        console.log('[WS] محاولة إعادة الاتصال...');
        connect();
      }, 5000);
    }
  }

  connect();

  return () => {
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
    ws?.close();
  };
}

function handleMessage(message: any) {
  const store = useArbStore.getState();

  switch (message.type) {
    case 'connected':
      if (message.data.opportunities) {
        message.data.opportunities.forEach((opp: any) => {
          store.addOpportunity(opp);
        });
      }
      if (message.data.stats) {
        store.setStats(message.data.stats);
      }
      if (message.data.networkMode) {
        store.setNetworkMode(message.data.networkMode);
      }
      if (message.data.autoExecute) {
        store.setAutoExecuteConfig(message.data.autoExecute);
      }
      break;

    case 'new_opportunity':
      store.addOpportunity(message.data);
      break;

    case 'scan_update':
      if (message.data.stats) {
        store.setStats(message.data.stats);
      }
      break;

    case 'price_update':
      if (message.data.prices) {
        Object.entries(message.data.prices).forEach(([pair, prices]) => {
          store.updatePrices({ pair, prices: prices as any });
        });
      }
      break;

    case 'stats':
      store.setStats(message.data);
      break;

    case 'opportunities':
      if (Array.isArray(message.data)) {
        message.data.forEach((opp: any) => {
          store.addOpportunity(opp);
        });
      }
      break;

    case 'simulation_result':
      console.log('[WS] نتيجة المحاكاة:', message.data);
      break;

    // Execution events
    case 'execution_started':
      store.setExecutionStatus({
        step: message.data.step || 1,
        totalSteps: message.data.totalSteps || 5,
        currentAction: message.data.action || 'بدء التنفيذ...',
      });
      break;

    case 'execution_step':
      store.setExecutionStatus({
        step: message.data.step,
        totalSteps: message.data.totalSteps || 5,
        currentAction: message.data.action,
        txHash: message.data.txHash,
      });
      break;

    case 'execution_confirmed':
      store.setExecutionStatus(null);
      store.addExecution({
        id: message.data.id || `exec_${Date.now()}`,
        pair: message.data.pair,
        strategy: message.data.strategy,
        buyDex: message.data.buyDex,
        sellDex: message.data.sellDex,
        profit: message.data.profit,
        txHash: message.data.txHash,
        status: 'success',
        timestamp: new Date().toISOString(),
        gasUsed: message.data.gasUsed,
        gasCost: message.data.gasCost,
      });
      if (message.data.gasCost) {
        store.addGasSaved(message.data.gasCost);
      }
      break;

    case 'execution_failed':
      store.setExecutionStatus({
        step: message.data.step || 0,
        totalSteps: 5,
        currentAction: message.data.error || 'فشل التنفيذ',
        error: message.data.error,
      });
      store.addExecution({
        id: message.data.id || `exec_${Date.now()}`,
        pair: message.data.pair || 'N/A',
        strategy: message.data.strategy || 'N/A',
        buyDex: message.data.buyDex || '',
        sellDex: message.data.sellDex || '',
        profit: 0,
        txHash: message.data.txHash || '',
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: message.data.error,
      });
      // Clear status after 5 seconds
      setTimeout(() => store.setExecutionStatus(null), 5000);
      break;

    case 'auto_execute_result':
      store.addExecution({
        id: message.data.id || `auto_${Date.now()}`,
        pair: message.data.pair,
        strategy: message.data.strategy,
        buyDex: message.data.buyDex,
        sellDex: message.data.sellDex,
        profit: message.data.profit || 0,
        txHash: message.data.txHash || '',
        status: message.data.success ? 'success' : 'failed',
        timestamp: new Date().toISOString(),
        gasUsed: message.data.gasUsed,
        gasCost: message.data.gasCost,
        error: message.data.error,
      });
      if (message.data.gasCost) {
        store.addGasSaved(message.data.gasCost);
      }
      break;

    case 'network_switched':
      store.setNetworkMode(message.data.mode);
      store.clearOpportunities();
      break;

    case 'eth_price_update':
      if (message.data.ethPrice) store.setEthPrice(message.data.ethPrice);
      if (message.data.gasPrice) store.setGasPrice(message.data.gasPrice);
      break;

    case 'auto_execute_toggled':
      store.setAutoExecuteConfig({
        enabled: message.data.enabled,
        minProfit: message.data.minProfit,
      });
      break;

    case 'error':
      console.error('[WS] خطأ من الخادم:', message.data);
      break;
  }
}

// --- Outgoing messages ---

export function sendWsMessage(type: string, data: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, data }));
  }
}

export function executeOpportunity(opportunityId: string, strategy: string, walletAddress?: string) {
  sendWsMessage('execute_opportunity', {
    opportunityId,
    strategy,
    walletAddress: walletAddress || useArbStore.getState().walletAddress,
  });
}

export function simulateTrade(params: any) {
  sendWsMessage('simulate_trade', params);
}

export function toggleAutoExecute(enabled: boolean, minProfit: number, maxGasGwei?: number) {
  sendWsMessage('toggle_auto_execute', { enabled, minProfit, maxGasGwei });
}

export function switchNetwork(mode: 'testnet' | 'mainnet') {
  sendWsMessage('switch_network', { mode });
}

export function subscribePair(tokenA: string, tokenB: string) {
  sendWsMessage('subscribe_pair', { tokenA, tokenB });
}

export function unsubscribePair(tokenA: string, tokenB: string) {
  sendWsMessage('unsubscribe_pair', { tokenA, tokenB });
}
