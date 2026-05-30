const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { Scanner } = require('./services/scanner');
const { ArbitrageEngine } = require('./services/arbitrage-engine');
const { DexPriceAggregator } = require('./services/dex-prices');
require('dotenv').config({ path: '../.env' });

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

const dexAggregator = new DexPriceAggregator();
const arbEngine = new ArbitrageEngine();
const scanner = new Scanner(dexAggregator, arbEngine);

let connectedClients = new Set();
let latestOpportunities = [];
let stats = {
  totalScans: 0,
  opportunitiesFound: 0,
  totalProfit: 0,
  activePairs: 0,
  lastScan: null,
  uptime: Date.now(),
};

wss.on('connection', (ws) => {
  console.log('[WS] عميل جديد متصل');
  connectedClients.add(ws);

  ws.send(JSON.stringify({
    type: 'connected',
    data: {
      message: 'متصل بخادم Arbitrage Pro',
      opportunities: latestOpportunities,
      stats,
    },
  }));

  ws.on('close', () => {
    connectedClients.delete(ws);
    console.log('[WS] عميل غادر');
  });

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      handleClientMessage(ws, data);
    } catch (e) {
      console.error('[WS] رسالة غير صالحة:', e.message);
    }
  });
});

function handleClientMessage(ws, msg) {
  switch (msg.type) {
    case 'subscribe_pair':
      scanner.addPair(msg.data.tokenA, msg.data.tokenB);
      ws.send(JSON.stringify({ type: 'subscribed', data: msg.data }));
      break;

    case 'unsubscribe_pair':
      scanner.removePair(msg.data.tokenA, msg.data.tokenB);
      ws.send(JSON.stringify({ type: 'unsubscribed', data: msg.data }));
      break;

    case 'get_stats':
      ws.send(JSON.stringify({ type: 'stats', data: stats }));
      break;

    case 'get_opportunities':
      ws.send(JSON.stringify({ type: 'opportunities', data: latestOpportunities }));
      break;

    case 'simulate_trade':
      const result = arbEngine.simulateTrade(msg.data);
      ws.send(JSON.stringify({ type: 'simulation_result', data: result }));
      break;

    default:
      ws.send(JSON.stringify({ type: 'error', data: { message: 'نوع رسالة غير معروف' } }));
  }
}

function broadcast(data) {
  const message = JSON.stringify(data);
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

scanner.on('opportunity', (opportunity) => {
  latestOpportunities.unshift(opportunity);
  if (latestOpportunities.length > 100) {
    latestOpportunities = latestOpportunities.slice(0, 100);
  }

  stats.opportunitiesFound++;
  stats.totalProfit += opportunity.profit.usd;

  broadcast({
    type: 'new_opportunity',
    data: opportunity,
  });

  console.log(`[فرصة] ${opportunity.pair} | ربح: $${opportunity.profit.usd.toFixed(2)} | ${opportunity.buyDex} → ${opportunity.sellDex}`);
});

scanner.on('scan_complete', (scanStats) => {
  stats.totalScans++;
  stats.activePairs = scanStats.pairsScanned;
  stats.lastScan = new Date().toISOString();

  broadcast({
    type: 'scan_update',
    data: {
      stats,
      prices: scanStats.prices,
    },
  });
});

scanner.on('price_update', (priceData) => {
  broadcast({
    type: 'price_update',
    data: priceData,
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Date.now() - stats.uptime,
    clients: connectedClients.size,
    stats,
  });
});

app.get('/api/opportunities', (req, res) => {
  const { limit = 50, minProfit = 0 } = req.query;
  const filtered = latestOpportunities
    .filter((o) => o.profit.usd >= parseFloat(minProfit))
    .slice(0, parseInt(limit));
  res.json(filtered);
});

app.get('/api/stats', (req, res) => {
  res.json(stats);
});

app.get('/api/prices', async (req, res) => {
  try {
    const prices = await dexAggregator.getAllPrices();
    res.json(prices);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/dexes', (req, res) => {
  res.json(dexAggregator.getSupportedDexes());
});

app.get('/api/pairs', (req, res) => {
  res.json(scanner.getTrackedPairs());
});

app.post('/api/simulate', (req, res) => {
  try {
    const result = arbEngine.simulateTrade(req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/execute', async (req, res) => {
  try {
    const { opportunityId, walletAddress, strategy } = req.body;
    const opportunity = latestOpportunities.find((o) => o.id === opportunityId);

    if (!opportunity) {
      return res.status(404).json({ error: 'الفرصة غير موجودة' });
    }

    if (Date.now() - opportunity.timestamp > 15000) {
      return res.status(410).json({ error: 'الفرصة منتهية الصلاحية' });
    }

    const executionPlan = arbEngine.buildExecutionPlan(opportunity, walletAddress, strategy);
    res.json(executionPlan);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║   Crypto Arbitrage Pro - Server          ║`);
  console.log(`║   المنفذ: ${PORT}                           ║`);
  console.log(`║   WebSocket: ws://localhost:${PORT}         ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);

  scanner.start();
});
