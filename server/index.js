const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { Scanner } = require('./services/scanner');
const { ArbitrageEngine } = require('./services/arbitrage-engine');
const { DexPriceAggregator } = require('./services/dex-prices');
const { RPCManager } = require('./services/rpc-manager');
const { priceFeed } = require('./services/price-feed');
const { GaslessExecutor } = require('./services/executor');
const { TradeMemory } = require('./services/trade-memory');
const { LendingRouter } = require('./services/lending-router');
const { ParaSwapService } = require('./services/paraswap');
const { ethers } = require('ethers');
require('dotenv').config({ path: '../.env' });

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// --- Initialize all services ---
const rpcManager = new RPCManager();

const networkMode = process.env.NETWORK_MODE || 'mainnet';
rpcManager.setNetworkMode(networkMode);

const dexAggregator = new DexPriceAggregator(rpcManager);
const arbEngine = new ArbitrageEngine(priceFeed);
const scanner = new Scanner(dexAggregator, arbEngine, rpcManager, priceFeed);
scanner.setNetworkMode(networkMode);
scanner.setMinProfit(parseFloat(process.env.MIN_PROFIT_USD || '1'));

// Initialize new services
const tradeMemory = new TradeMemory();
const lendingRouter = new LendingRouter(rpcManager);
const paraswap = new ParaSwapService();
arbEngine.setTradeMemory(tradeMemory);
arbEngine.setParaSwap(paraswap);

// Initialize executor with signer
let executor = null;
try {
  if (process.env.PRIVATE_KEY) {
    const provider = rpcManager.getProvider('arbitrum');
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    executor = new GaslessExecutor({
      provider,
      signer,
      biconomyApiKey: process.env.BICONOMY_API_KEY,
      bundlerUrl: process.env.BUNDLER_URL,
      paymasterUrl: process.env.BICONOMY_PAYMASTER_URL,
      relayUrl: process.env.FLASHBOTS_RELAY,
      contracts: {
        flashLoan: process.env.FLASH_LOAN_CONTRACT,
        flashSwap: process.env.FLASH_SWAP_CONTRACT,
        flashMint: process.env.FLASH_MINT_CONTRACT,
      },
    });
    console.log('[Server] ✅ Executor مُهيّأ مع محفظة:', signer.address);
  } else {
    console.warn('[Server] ⚠️ لا يوجد PRIVATE_KEY — التنفيذ التلقائي معطل');
  }
} catch (e) {
  console.error('[Server] ❌ خطأ في تهيئة Executor:', e.message);
}

// --- State ---
let connectedClients = new Set();
let latestOpportunities = [];
let autoExecuteEnabled = process.env.AUTO_EXECUTE === 'true';
let autoExecuteMinProfit = parseFloat(process.env.MIN_PROFIT_USD || '5');
let lastAutoExecution = 0;
const AUTO_EXECUTE_COOLDOWN = 10000; // 10 seconds between auto-executions

let stats = {
  totalScans: 0,
  opportunitiesFound: 0,
  totalProfit: 0,
  activePairs: 0,
  executionsTotal: 0,
  executionsSuccess: 0,
  gasSaved: 0,
  lastScan: null,
  uptime: Date.now(),
};

// --- WebSocket ---
wss.on('connection', (ws) => {
  console.log('[WS] عميل جديد متصل');
  connectedClients.add(ws);

  ws.send(JSON.stringify({
    type: 'connected',
    data: {
      message: 'متصل بخادم Arbitrage Pro',
      opportunities: latestOpportunities.slice(0, 50),
      stats,
      networkMode: scanner.networkMode,
      autoExecute: {
        enabled: autoExecuteEnabled,
        minProfit: autoExecuteMinProfit,
      },
      botMode: arbEngine.getMode(),
      tradeStats: tradeMemory.getStats(),
      lendingSources: lendingRouter.getAllProtocols(),
    },
  }));

  ws.on('close', () => {
    connectedClients.delete(ws);
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

async function handleClientMessage(ws, msg) {
  switch (msg.type) {
    case 'subscribe_pair':
      scanner.addPair(msg.data.tokenA, msg.data.tokenB, msg.data.chain);
      ws.send(JSON.stringify({ type: 'subscribed', data: msg.data }));
      break;

    case 'unsubscribe_pair':
      scanner.removePair(msg.data.tokenA, msg.data.tokenB, msg.data.chain);
      ws.send(JSON.stringify({ type: 'unsubscribed', data: msg.data }));
      break;

    case 'get_stats':
      ws.send(JSON.stringify({ type: 'stats', data: stats }));
      break;

    case 'get_opportunities':
      ws.send(JSON.stringify({ type: 'opportunities', data: latestOpportunities.slice(0, 100) }));
      break;

    case 'simulate_trade':
      const simResult = arbEngine.simulateTrade(msg.data);
      ws.send(JSON.stringify({ type: 'simulation_result', data: simResult }));
      break;

    case 'execute_opportunity':
      await handleExecution(ws, msg.data);
      break;

    case 'toggle_auto_execute':
      autoExecuteEnabled = msg.data.enabled;
      if (msg.data.minProfit !== undefined) autoExecuteMinProfit = msg.data.minProfit;
      broadcast({
        type: 'auto_execute_toggled',
        data: { enabled: autoExecuteEnabled, minProfit: autoExecuteMinProfit },
      });
      console.log(`[AutoExec] ${autoExecuteEnabled ? 'مُفعّل' : 'معطل'} — الحد الأدنى: $${autoExecuteMinProfit}`);
      break;

    case 'switch_network':
      const newMode = msg.data.mode;
      if (newMode === 'testnet' || newMode === 'mainnet') {
        scanner.setNetworkMode(newMode);
        rpcManager.setNetworkMode(newMode);
        if (dexAggregator.setNetworkMode) dexAggregator.setNetworkMode(newMode);
        latestOpportunities = [];
        broadcast({ type: 'network_switched', data: { mode: newMode } });
        console.log(`[Server] تبديل الشبكة إلى: ${newMode}`);
      }
      break;

    case 'switch_bot_mode':
      arbEngine.setMode(msg.data.mode);
      broadcast({ type: 'bot_mode_changed', data: { mode: arbEngine.getMode() } });
      break;

    case 'get_trade_stats':
      ws.send(JSON.stringify({ type: 'trade_stats', data: tradeMemory.getStats() }));
      break;

    case 'get_lending_sources':
      ws.send(JSON.stringify({ type: 'lending_sources', data: lendingRouter.getAllProtocols() }));
      break;

    case 'set_lending_source':
      // Store the user's preferred lending source
      ws.send(JSON.stringify({ type: 'lending_source_set', data: { source: msg.data.source } }));
      break;

    case 'add_custom_token':
      scanner.addCustomToken(msg.data.chain, msg.data.symbol, msg.data.address, msg.data.decimals);
      broadcast({ type: 'custom_tokens_updated', data: scanner.getCustomTokens() });
      break;

    case 'remove_custom_token':
      scanner.removeCustomToken(msg.data.chain, msg.data.address);
      broadcast({ type: 'custom_tokens_updated', data: scanner.getCustomTokens() });
      break;

    case 'get_custom_tokens':
      ws.send(JSON.stringify({ type: 'custom_tokens', data: scanner.getCustomTokens() }));
      break;

    default:
      ws.send(JSON.stringify({ type: 'error', data: { message: 'نوع رسالة غير معروف' } }));
  }
}

async function handleExecution(ws, data) {
  const { opportunityId, strategy, walletAddress } = data;

  if (!executor) {
    ws.send(JSON.stringify({
      type: 'execution_failed',
      data: { error: 'Executor غير مُهيّأ — تحقق من PRIVATE_KEY' },
    }));
    return;
  }

  const opportunity = latestOpportunities.find((o) => o.id === opportunityId);
  if (!opportunity) {
    ws.send(JSON.stringify({
      type: 'execution_failed',
      data: { error: 'الفرصة غير موجودة' },
    }));
    return;
  }

  if (Date.now() - opportunity.timestamp > 15000) {
    ws.send(JSON.stringify({
      type: 'execution_failed',
      data: { error: 'الفرصة منتهية الصلاحية', pair: opportunity.pair },
    }));
    return;
  }

  // Broadcast execution started
  broadcast({
    type: 'execution_started',
    data: { step: 1, totalSteps: 5, action: '🏦 طلب Flash Loan...', pair: opportunity.pair },
  });

  try {
    // Step 2: Simulate first
    broadcast({
      type: 'execution_step',
      data: { step: 2, totalSteps: 5, action: '🔍 محاكاة التنفيذ...' },
    });

    const simResult = await executor.simulateExecution(opportunity, strategy || 'flash_loan');
    if (!simResult.success) {
      broadcast({
        type: 'execution_failed',
        data: {
          error: `فشلت المحاكاة: ${simResult.error}`,
          pair: opportunity.pair,
          strategy,
        },
      });
      return;
    }

    // Step 3: Execute
    broadcast({
      type: 'execution_step',
      data: { step: 3, totalSteps: 5, action: `🛒 شراء من ${opportunity.buyDex}...` },
    });

    const result = await executor.executeArbitrage(
      opportunity,
      walletAddress || executor.signer?.address,
      strategy || 'flash_loan'
    );

    if (result.success) {
      stats.executionsSuccess++;
      stats.totalProfit += opportunity.profit.usd;
      stats.gasSaved += result.gasCost?.gasCostUSD || 0;

      broadcast({
        type: 'execution_step',
        data: { step: 5, totalSteps: 5, action: '💰 تم التنفيذ بنجاح!', txHash: result.transactionHash },
      });

      broadcast({
        type: 'execution_confirmed',
        data: {
          pair: opportunity.pair,
          strategy: strategy || 'flash_loan',
          buyDex: opportunity.buyDex,
          sellDex: opportunity.sellDex,
          profit: opportunity.profit.usd,
          txHash: result.transactionHash || result.userOpHash,
          gasUsed: result.gasUsed,
          gasCost: result.gasCost?.gasCostUSD || 0,
        },
      });
    } else {
      broadcast({
        type: 'execution_failed',
        data: {
          error: result.error,
          pair: opportunity.pair,
          strategy,
        },
      });
    }

    // Record trade in TradeMemory (buyDex)
    tradeMemory.recordTrade({
      dex: opportunity.buyDex,
      pair: opportunity.pair,
      success: result.success,
      profit: result.success ? opportunity.profit.usd : 0,
      gasUsed: parseInt(result.gasUsed) || 0,
      strategy: strategy || 'flash_loan',
    });
    // Record trade in TradeMemory (sellDex)
    tradeMemory.recordTrade({
      dex: opportunity.sellDex,
      pair: opportunity.pair,
      success: result.success,
      profit: result.success ? opportunity.profit.usd : 0,
      gasUsed: parseInt(result.gasUsed) || 0,
      strategy: strategy || 'flash_loan',
    });

    stats.executionsTotal++;
  } catch (error) {
    broadcast({
      type: 'execution_failed',
      data: { error: error.message, pair: opportunity.pair, strategy },
    });
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

// --- Scanner Events ---
scanner.on('opportunity', (opportunity) => {
  latestOpportunities.unshift(opportunity);
  if (latestOpportunities.length > 200) {
    latestOpportunities = latestOpportunities.slice(0, 200);
  }

  stats.opportunitiesFound++;

  broadcast({ type: 'new_opportunity', data: opportunity });

  console.log(`[فرصة] ${opportunity.pair} | ربح: $${opportunity.profit.usd.toFixed(2)} | ${opportunity.buyDex} → ${opportunity.sellDex}`);

  // Auto-execute if enabled
  if (autoExecuteEnabled && executor && opportunity.profit.usd >= autoExecuteMinProfit) {
    const now = Date.now();
    if (now - lastAutoExecution > AUTO_EXECUTE_COOLDOWN) {
      lastAutoExecution = now;
      console.log(`[AutoExec] ⚡ تنفيذ تلقائي: ${opportunity.pair} — ربح: $${opportunity.profit.usd.toFixed(2)}`);

      executor.executeArbitrage(opportunity, executor.signer?.address, 'flash_loan')
        .then((result) => {
          broadcast({
            type: 'auto_execute_result',
            data: {
              pair: opportunity.pair,
              strategy: 'flash_loan',
              buyDex: opportunity.buyDex,
              sellDex: opportunity.sellDex,
              profit: result.success ? opportunity.profit.usd : 0,
              txHash: result.transactionHash || result.userOpHash || '',
              success: result.success,
              error: result.error,
              gasUsed: result.gasUsed,
              gasCost: result.gasCost?.gasCostUSD || 0,
            },
          });
          if (result.success) {
            stats.executionsSuccess++;
            stats.totalProfit += opportunity.profit.usd;
          }
          stats.executionsTotal++;

          // Record trade in TradeMemory (buyDex)
          tradeMemory.recordTrade({
            dex: opportunity.buyDex,
            pair: opportunity.pair,
            success: result.success,
            profit: result.success ? opportunity.profit.usd : 0,
            gasUsed: parseInt(result.gasUsed) || 0,
            strategy: 'flash_loan',
          });
          // Record trade in TradeMemory (sellDex)
          tradeMemory.recordTrade({
            dex: opportunity.sellDex,
            pair: opportunity.pair,
            success: result.success,
            profit: result.success ? opportunity.profit.usd : 0,
            gasUsed: parseInt(result.gasUsed) || 0,
            strategy: 'flash_loan',
          });
        })
        .catch((e) => {
          console.error('[AutoExec] خطأ:', e.message);
          broadcast({
            type: 'auto_execute_result',
            data: {
              pair: opportunity.pair,
              success: false,
              error: e.message,
            },
          });
        });
    }
  }
});

scanner.on('scan_complete', (scanStats) => {
  stats.totalScans++;
  stats.activePairs = scanStats.pairsScanned;
  stats.lastScan = new Date().toISOString();

  broadcast({
    type: 'scan_update',
    data: { stats, prices: scanStats.prices },
  });
});

scanner.on('price_update', (priceData) => {
  broadcast({ type: 'price_update', data: priceData });
});

scanner.on('eth_price_update', (priceData) => {
  broadcast({ type: 'eth_price_update', data: priceData });
});

// --- REST API ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Date.now() - stats.uptime,
    clients: connectedClients.size,
    networkMode: scanner.networkMode,
    autoExecute: autoExecuteEnabled,
    executorReady: !!executor,
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

app.get('/api/stats', (req, res) => res.json(stats));

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

app.get('/api/network', (req, res) => {
  res.json({ mode: scanner.networkMode });
});

app.post('/api/network', (req, res) => {
  const { mode } = req.body;
  if (mode === 'testnet' || mode === 'mainnet') {
    scanner.setNetworkMode(mode);
    rpcManager.setNetworkMode(mode);
    latestOpportunities = [];
    broadcast({ type: 'network_switched', data: { mode } });
    res.json({ success: true, mode });
  } else {
    res.status(400).json({ error: 'Invalid mode' });
  }
});

app.post('/api/simulate', (req, res) => {
  try {
    const result = arbEngine.simulateTrade(req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/execute/simulate', async (req, res) => {
  if (!executor) {
    return res.status(503).json({ error: 'Executor غير مُهيّأ' });
  }
  try {
    const { opportunityId, strategy } = req.body;
    const opportunity = latestOpportunities.find((o) => o.id === opportunityId);
    if (!opportunity) return res.status(404).json({ error: 'الفرصة غير موجودة' });

    const result = await executor.simulateExecution(opportunity, strategy || 'flash_loan');
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/execute', async (req, res) => {
  if (!executor) {
    return res.status(503).json({ error: 'Executor غير مُهيّأ — تحقق من PRIVATE_KEY' });
  }
  try {
    const { opportunityId, walletAddress, strategy } = req.body;
    const opportunity = latestOpportunities.find((o) => o.id === opportunityId);

    if (!opportunity) return res.status(404).json({ error: 'الفرصة غير موجودة' });
    if (Date.now() - opportunity.timestamp > 15000) {
      return res.status(410).json({ error: 'الفرصة منتهية الصلاحية' });
    }

    const result = await executor.executeArbitrage(
      opportunity,
      walletAddress || executor.signer?.address,
      strategy || 'flash_loan'
    );
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auto-execute', (req, res) => {
  const { enabled, minProfit, maxGasGwei } = req.body;
  if (typeof enabled === 'boolean') autoExecuteEnabled = enabled;
  if (typeof minProfit === 'number') autoExecuteMinProfit = minProfit;
  broadcast({
    type: 'auto_execute_toggled',
    data: { enabled: autoExecuteEnabled, minProfit: autoExecuteMinProfit },
  });
  res.json({ enabled: autoExecuteEnabled, minProfit: autoExecuteMinProfit });
});

// --- New API Endpoints (bot-mode, trade-stats, lending, custom-tokens) ---
app.get('/api/bot-mode', (req, res) => {
  res.json({ mode: arbEngine.getMode() });
});

app.post('/api/bot-mode', (req, res) => {
  const { mode } = req.body;
  arbEngine.setMode(mode);
  broadcast({ type: 'bot_mode_changed', data: { mode: arbEngine.getMode() } });
  res.json({ mode: arbEngine.getMode() });
});

app.get('/api/trade-stats', (req, res) => {
  res.json(tradeMemory.getStats());
});

app.get('/api/lending-sources', (req, res) => {
  res.json(lendingRouter.getAllProtocols());
});

app.get('/api/custom-tokens', (req, res) => {
  res.json(scanner.getCustomTokens());
});

app.post('/api/custom-tokens', (req, res) => {
  const { chain, symbol, address, decimals } = req.body;
  scanner.addCustomToken(chain, symbol, address, decimals);
  broadcast({ type: 'custom_tokens_updated', data: scanner.getCustomTokens() });
  res.json({ success: true, customTokens: scanner.getCustomTokens() });
});

app.delete('/api/custom-tokens', (req, res) => {
  const { chain, address } = req.body;
  scanner.removeCustomToken(chain, address);
  broadcast({ type: 'custom_tokens_updated', data: scanner.getCustomTokens() });
  res.json({ success: true, customTokens: scanner.getCustomTokens() });
});

// --- Start ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║   ⚡ Crypto Arbitrage Pro — Real Execution Server    ║`);
  console.log(`║   📡 Port: ${PORT}                                      ║`);
  console.log(`║   🌐 Network: ${scanner.networkMode.padEnd(37)}║`);
  console.log(`║   🤖 Auto-Execute: ${autoExecuteEnabled ? 'ON' : 'OFF'}                              ║`);
  console.log(`║   💰 Min Profit: $${autoExecuteMinProfit}                                ║`);
  console.log(`║   🔑 Executor: ${executor ? 'Ready' : 'Not configured'}                          ║`);
  console.log(`║   🏦 DEXes: 59 across 6 chains                       ║`);
  console.log(`║   🏛️ Lending Sources: 4                               ║`);
  console.log(`╚══════════════════════════════════════════════════════╝\n`);

  scanner.start();
});
