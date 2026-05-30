import { useArbStore } from './store';

let ws: WebSocket | null = null;
let reconnectInterval: NodeJS.Timeout | null = null;

export function connectWebSocket() {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

  function connect() {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[WS] متصل بالخادم');
      useArbStore.getState().setConnected(true);

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

      if (!reconnectInterval) {
        reconnectInterval = setInterval(() => {
          console.log('[WS] محاولة إعادة الاتصال...');
          connect();
        }, 5000);
      }
    };

    ws.onerror = (error) => {
      console.error('[WS] خطأ:', error);
      ws?.close();
    };
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
          store.updatePrices({
            pair,
            prices: prices as any,
          });
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

    case 'error':
      console.error('[WS] خطأ من الخادم:', message.data);
      break;
  }
}

export function sendWsMessage(type: string, data: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, data }));
  }
}

export function subscribePair(tokenA: string, tokenB: string) {
  sendWsMessage('subscribe_pair', { tokenA, tokenB });
}

export function unsubscribePair(tokenA: string, tokenB: string) {
  sendWsMessage('unsubscribe_pair', { tokenA, tokenB });
}

export function simulateTrade(params: any) {
  sendWsMessage('simulate_trade', params);
}
