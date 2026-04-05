/**
 * Crypto MCP GUI backend - server.js
 * - Proxy JSON-RPC calls to local MCP services
 * - Provides REST endpoints for portfolio, ticker, orders
 * - Provides order dry_run + execute (uses ccxt MCP create_order)
 * - Logs orders to SQLite and emits socket.io events
 */

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const crypto = require('crypto');

let DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;
if (!DASHBOARD_PASSWORD) {
  console.error('\n=============================================================');
  console.error('❌ FATAL SECURITY ERROR: DASHBOARD_PASSWORD not set in environment.');
  console.error('❌ The server will not start without a defined password.');
  console.error('❌ Please set DASHBOARD_PASSWORD in gui/backend/.env for a permanent password.');
  console.error('=============================================================\n');
  process.exit(1);
}
const app = express();

app.use(cors());
app.use(bodyParser.json());

// Basic auth middleware for all /api routes
app.use('/api', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(403).json({ ok: false, error: 'Forbidden' });

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest();
    const passHash = crypto.createHash('sha256').update(DASHBOARD_PASSWORD).digest();
    if (!crypto.timingSafeEqual(tokenHash, passHash)) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
  } catch (e) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }
  next();
});
const path = require('path');




const MCP_CCXT = process.env.MCP_CCXT || 'http://127.0.0.1:7001/mcp';
const MCP_PORTFOLIO = process.env.MCP_PORTFOLIO || 'http://127.0.0.1:7004/mcp';
const MCP_LLM = process.env.MCP_LLM || 'http://127.0.0.1:7015/mcp';
const MCP_COINGECKO = process.env.MCP_COINGECKO || 'http://127.0.0.1:7010/mcp';
const MCP_FREQTRADE = process.env.MCP_FREQTRADE || 'http://127.0.0.1:7002/mcp';
const MCP_OCTOBOT = process.env.MCP_OCTOBOT || 'http://127.0.0.1:7003/mcp';
const MCP_ONCHAIN = process.env.MCP_ONCHAIN || 'http://127.0.0.1:7007/mcp';
const MCP_TA = process.env.MCP_TA || 'http://127.0.0.1:7005/mcp';
const MCP_SUPERALGOS = process.env.MCP_SUPERALGOS || 'http://127.0.0.1:7006/mcp';
const MCP_HUMMINGBOT = process.env.MCP_HUMMINGBOT || 'http://127.0.0.1:7014/mcp';
const MCP_NOTIFIER = process.env.MCP_NOTIFIER || 'http://127.0.0.1:7016/mcp';
const MCP_NEWS = process.env.MCP_NEWS || 'http://127.0.0.1:7017/mcp';

const mcpUrls = {
  MCP_CCXT,
  MCP_PORTFOLIO,
  MCP_LLM,
  MCP_COINGECKO,
  MCP_FREQTRADE,
  MCP_OCTOBOT,
  MCP_ONCHAIN,
  MCP_TA,
  MCP_SUPERALGOS,
  MCP_HUMMINGBOT,
  MCP_NOTIFIER,
  MCP_NEWS
};
const PORT = parseInt(process.env.PORT || '4000', 10);




// Initialize SQLite DB
const DB_PATH = path.resolve(__dirname, 'orders.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to open DB', err);
    process.exit(1);
  }
});

// Create orders table (safe)
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS strategies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    nodes TEXT,
    connections TEXT,
    active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating strategies table:', err);
  });

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    exchange TEXT,
    symbol TEXT,
    side TEXT,
    type TEXT,
    amount REAL,
    price REAL,
    dry_run INTEGER,
    status TEXT,
    response TEXT
  )`, (err) => {
    if (err) console.error('Error creating orders table:', err);
    db.run('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)');
    db.run('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
  });
});

// Helper: call MCP tools via JSON-RPC tools/call
async function callMCP(mcpUrl, toolName, args = {}) {
  const payload = {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: {
      name: toolName,
      arguments: args
    }
  };
  const res = await axios.post(mcpUrl, payload, {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json,text/event-stream' },
    timeout: parseInt(process.env.MCP_TIMEOUT) || 8000,
    signal: AbortSignal.timeout(parseInt(process.env.MCP_TIMEOUT) || 8000),
    signal: AbortSignal.timeout(parseInt(process.env.MCP_TIMEOUT) || 8000),
    signal: AbortSignal.timeout(parseInt(process.env.MCP_TIMEOUT) || 8000)
  });
  if (res.data && res.data.result) {
    const r = res.data.result;
    if (r.structuredContent) return r.structuredContent;
    if (r.content && Array.isArray(r.content) && r.content.length > 0 && r.content[0].text) {
      try {
        return JSON.parse(r.content[0].text);
      } catch (e) {
        return r.content[0].text;
      }
    }
    return r;
  }
  return res.data;
}

/* Routes */

// GET /api/portfolio
app.get('/api/portfolio', async (req, res) => {
  let exchangesParam = req.query.exchanges || 'binance';
  if (Array.isArray(exchangesParam)) exchangesParam = exchangesParam.join(',');
  else if (typeof exchangesParam !== 'string') exchangesParam = String(exchangesParam);
  const exchanges = exchangesParam.split(',').map(s => s.trim());
  try {
    const result = await callMCP(mcpUrls.MCP_PORTFOLIO, 'portfolio_value', exchanges);
    res.json({ ok: true, data: result });
  } catch (err) {
    console.error('portfolio error', err.message || err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// GET /api/ticker

// GET /api/mcp
app.post('/api/mcp', async (req, res) => {
  const { mcp, method, params } = req.body;
  if (!mcp || !method) return res.status(400).json({ ok: false, error: 'Missing mcp or method' });

  const mcpUrl = mcpUrls[mcp];
  if (!mcpUrl) return res.status(400).json({ ok: false, error: 'Unknown MCP endpoint' });

  try {
    const result = await callMCP(mcpUrl, method, params || {});
    res.json({ ok: true, data: result });
  } catch (err) {
    console.error('mcp error', err.message || err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

app.get('/api/ticker', async (req, res) => {
  const { exchange = 'binance', symbol = 'BTC/USDT' } = req.query;
  try {
    const result = await callMCP(mcpUrls.MCP_CCXT, 'get_ticker', { exchange, symbol });
    res.json({ ok: true, data: result });
  } catch (err) {
    console.error('ticker error', err.message || err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// POST /api/order/dry_run
app.post('/api/order/dry_run', async (req, res) => {
  const { exchange, symbol, side, type, amount, price, params } = req.body || {};
  if (!exchange || !symbol || !side || !type || !amount) {
    return res.status(400).json({ ok:false, error: 'Missing required fields' });
  }
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ ok:false, error: 'Amount must be a positive number' });
  }
  const numericPrice = price !== undefined && price !== null ? Number(price) : null;
  if (numericPrice !== null && (isNaN(numericPrice) || numericPrice <= 0)) {
    return res.status(400).json({ ok:false, error: 'Price must be a positive number' });
  }
  const allowedSides = ['buy', 'sell'];
  const allowedTypes = ['market', 'limit'];
  if (!side || typeof side !== 'string' || !allowedSides.includes(side.toLowerCase())) {
    return res.status(400).json({ ok:false, error: 'Invalid order side (must be buy or sell)' });
  }
  if (!type || typeof type !== 'string' || !allowedTypes.includes(type.toLowerCase())) {
    return res.status(400).json({ ok:false, error: 'Invalid order type (must be market or limit)' });
  }
  const symbolRegex = /^[A-Z0-9-]+\/[A-Z0-9-]+$/i;
  if (!symbolRegex || typeof symbol !== 'string' || !symbolRegex.test(symbol)) {
    return res.status(400).json({ ok:false, error: 'Invalid symbol format (expected e.g. BTC/USDT)' });
  }
  try {
    const ticker = await callMCP(mcpUrls.MCP_CCXT, 'get_ticker', { exchange, symbol });
    const marketPrice = ticker && (ticker.last || ticker.close) ? (ticker.last || ticker.close) : null;
    const usedPrice = (price !== undefined && price !== null) ? price : marketPrice;
    const estimatedCost = (usedPrice && amount) ? (parseFloat(usedPrice) * parseFloat(amount)) : null;

    const preview = {
      exchange, symbol, side, type, amount, price: usedPrice, estimatedCost,
      note: 'This is a simulation. Confirm to execute.',
      params: params || {}
    };

    const stmt = db.prepare('INSERT INTO orders (exchange,symbol,side,type,amount,price,dry_run,status,response) VALUES (?,?,?,?,?,?,?,?,?)');
    stmt.run(exchange, symbol, side, type, amount, usedPrice, 1, 'preview', JSON.stringify(preview));
    stmt.finalize();

    res.json({ ok:true, data: preview });
  } catch (err) {
    console.error('dry_run error', err.message || err);
    res.status(500).json({ ok:false, error: String(err.message || err) });
  }
});

// POST /api/order/execute
app.post('/api/order/execute', async (req, res) => {
  const { exchange, symbol, side, type, amount, price, execute, params } = req.body || {};
  if (!exchange || !symbol || !side || !type || !amount) {
    return res.status(400).json({ ok:false, error: 'Missing required fields' });
  }
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ ok:false, error: 'Amount must be a positive number' });
  }
  const numericPrice = price !== undefined && price !== null ? Number(price) : null;
  if (numericPrice !== null && (isNaN(numericPrice) || numericPrice <= 0)) {
    return res.status(400).json({ ok:false, error: 'Price must be a positive number' });
  }
  const allowedSides = ['buy', 'sell'];
  const allowedTypes = ['market', 'limit'];
  if (!side || typeof side !== 'string' || !allowedSides.includes(side.toLowerCase())) {
    return res.status(400).json({ ok:false, error: 'Invalid order side (must be buy or sell)' });
  }
  if (!type || typeof type !== 'string' || !allowedTypes.includes(type.toLowerCase())) {
    return res.status(400).json({ ok:false, error: 'Invalid order type (must be market or limit)' });
  }
  const symbolRegex = /^[A-Z0-9-]+\/[A-Z0-9-]+$/i;
  if (!symbolRegex || typeof symbol !== 'string' || !symbolRegex.test(symbol)) {
    return res.status(400).json({ ok:false, error: 'Invalid symbol format (expected e.g. BTC/USDT)' });
  }
  try {
    if (!execute) {
      return res.status(400).json({ ok:false, error: 'execute flag not set. Set execute=true to place live order.' });
    }

    // Build exchange-specific params safely, merging provided routing parameters
    const exchangeKey = (exchange || '').toLowerCase();
    let exchangeParams = Object.assign({}, (params && typeof params === 'object') ? params : {});

    const orderArgs = {
      exchange,
      symbol,
      side,
      type,
      amount: Number(amount),
      price: price !== undefined && price !== null ? Number(price) : null,
      params: exchangeParams
    };

    const orderResp = await callMCP(mcpUrls.MCP_CCXT, 'create_order', orderArgs);

    const stmt = db.prepare('INSERT INTO orders (exchange,symbol,side,type,amount,price,dry_run,status,response) VALUES (?,?,?,?,?,?,?,?)');
    stmt.run(exchange, symbol, side, type, amount, price || null, 0, 'placed', JSON.stringify(orderResp));
    stmt.finalize();

    io.emit('order_placed', { exchange, symbol, side, amount, price, response: orderResp });

    res.json({ ok:true, data: orderResp });
  } catch (err) {
    console.error('execute order error', err.message || err);
    const stmt = db.prepare('INSERT INTO orders (exchange,symbol,side,type,amount,price,dry_run,status,response) VALUES (?,?,?,?,?,?,?,?)');
    stmt.run(exchange, symbol, side, type, amount, price || null, 0, 'error', String(err.message || err));
    stmt.finalize();

    res.status(500).json({ ok:false, error: String(err.message || err) });
  }
});

// GET /api/orders
app.get('/api/orders_old', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200', [], (err, rows) => {
    if (err) return res.status(500).json({ ok:false, error: err.message });
    res.json({ ok:true, data: rows });
  });
});

/* Socket.io + periodic polling */
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }
  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest();
    const passHash = crypto.createHash("sha256").update(DASHBOARD_PASSWORD).digest();
    if (!crypto.timingSafeEqual(tokenHash, passHash)) {
      return next(new Error("Authentication error"));
    }
    next();
  } catch (e) {
    next(new Error("Authentication error"));
  }
});

// Helper to call and emit
async function callAndEmit(mcpUrl, toolName, args, eventName) {
  try {
    const data = await callMCP(mcpUrl, toolName, args);
    io.emit(eventName, data);
  } catch (e) {
    console.error('emit error', e && e.message ? e.message : e);
  }
}

// Polling intervals
setInterval(() => callAndEmit(mcpUrls.MCP_PORTFOLIO, 'portfolio_value', ['binance'], 'portfolio'), 30000);
setInterval(() => callAndEmit(mcpUrls.MCP_CCXT, 'get_ticker', { exchange: 'binance', symbol: 'BTC/USDT' }, 'ticker'), 5000);

// GET /api/strategies
app.get("/api/strategies", (req, res) => {
  db.all("SELECT * FROM strategies ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    res.json({ ok: true, data: rows });
  });
});

// POST /api/strategies
app.post("/api/strategies", (req, res) => {
  const { name, nodes, connections, active } = req.body || {};
  if (!name || !nodes || !connections) {
    return res.status(400).json({ ok: false, error: "Missing required fields" });
  }
  const stmt = db.prepare("INSERT INTO strategies (name, nodes, connections, active) VALUES (?, ?, ?, ?)");
  stmt.run(name, JSON.stringify(nodes), JSON.stringify(connections), active ? 1 : 0, function(err) {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    res.json({ ok: true, id: this.lastID });
  });
  stmt.finalize();
});
// Start server and handle errors (EADDRINUSE will be surfaced)
server.listen(PORT, () => {
  console.log('Crypto MCP GUI backend listening on http://127.0.0.1:' + PORT);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Graceful handlers
process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection', reason);
  process.exit(1);
});

// POST /api/order/pending
// Called by ccxt_mcp when AI tries to create an order
app.post('/api/order/pending', (req, res) => {
  const { exchange, symbol, side, type, amount, price, params, estimated_usd } = req.body || {};
  if (!exchange || !symbol || !side || !type || !amount) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ ok: false, error: 'Amount must be a positive number' });
  }
  const numericPrice = price !== undefined && price !== null ? Number(price) : null;
  if (numericPrice !== null && (isNaN(numericPrice) || numericPrice <= 0)) {
    return res.status(400).json({ ok: false, error: 'Price must be a positive number' });
  }
  const allowedSides = ['buy', 'sell'];
  const allowedTypes = ['market', 'limit'];
  if (!side || typeof side !== 'string' || !allowedSides.includes(side.toLowerCase())) {
    return res.status(400).json({ ok: false, error: 'Invalid order side (must be buy or sell)' });
  }
  if (!type || typeof type !== 'string' || !allowedTypes.includes(type.toLowerCase())) {
    return res.status(400).json({ ok: false, error: 'Invalid order type (must be market or limit)' });
  }
  const symbolRegex = /^[A-Z0-9-]+\/[A-Z0-9-]+$/i;
  if (!symbolRegex || typeof symbol !== 'string' || !symbolRegex.test(symbol)) {
    return res.status(400).json({ ok: false, error: 'Invalid symbol format (expected e.g. BTC/USDT)' });
  }

  try {
    const preview = {
      exchange, symbol, side, type, amount, price,
      estimatedCost: estimated_usd,
      note: 'Pending approval by human user.',
      params: params || {}
    };

    const stmt = db.prepare('INSERT INTO orders (exchange,symbol,side,type,amount,price,dry_run,status,response) VALUES (?,?,?,?,?,?,?,?,?)');
    stmt.run(exchange, symbol, side, type, amount, price, 1, 'pending', JSON.stringify(preview), function(err) {
      if (err) {
        console.error('Insert error', err);
        return res.status(500).json({ ok: false, error: err.message });
      }
      const orderId = this.lastID;
      io.emit('order_pending', { id: orderId, ...preview });
      res.json({ ok: true, id: orderId, data: preview });
    });
    stmt.finalize();
  } catch (err) {
    console.error('Pending order error', err.message || err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// POST /api/order/approve
// Called by Dashboard UI to approve a pending order
app.post('/api/order/approve', async (req, res) => {
  const { orderId } = req.body || {};
  if (!orderId) {
    return res.status(400).json({ ok: false, error: 'Missing orderId' });
  }

  db.get('SELECT * FROM orders WHERE id = ?', [orderId], async (err, order) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });
    if (order.status !== 'pending') return res.status(400).json({ ok: false, error: 'Order is not pending' });

    try {
      const orderArgs = {
        exchange: order.exchange,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        amount: Number(order.amount),
        price: order.price !== null ? Number(order.price) : null,
        params: { approval_token: DASHBOARD_PASSWORD }
      };

      const orderResp = await callMCP(mcpUrls.MCP_CCXT, 'execute_approved_order', orderArgs);

      db.run('UPDATE orders SET status = ?, response = ?, dry_run = 0 WHERE id = ?', ['placed', JSON.stringify(orderResp), orderId]);

      io.emit('order_placed', { id: orderId, ...orderArgs, response: orderResp });

      res.json({ ok: true, data: orderResp });
    } catch (apiErr) {
      console.error('Execute error', apiErr);
      db.run('UPDATE orders SET status = ?, response = ? WHERE id = ?', ['error', String(apiErr.message || apiErr), orderId]);
      res.status(500).json({ ok: false, error: String(apiErr.message || apiErr) });
    }
  });
});

// POST /api/order/reasoning
// Log AI reasoning for a specific order.
app.post('/api/order/reasoning', (req, res) => {
  const { trade_id, explanation } = req.body || {};
  if (!trade_id || !explanation) return res.status(400).json({ ok: false, error: 'Missing trade_id or explanation' });

  db.run(`CREATE TABLE IF NOT EXISTS reasoning (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_id INTEGER,
    explanation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    db.run('INSERT INTO reasoning (trade_id, explanation) VALUES (?, ?)', [trade_id, explanation], function(err2) {
      if (err2) return res.status(500).json({ ok: false, error: err2.message });
      res.json({ ok: true });
    });
  });
});

app.get('/api/orders', (req, res) => {
  db.all(`
    SELECT o.*, r.explanation as reasoning
    FROM orders o
    LEFT JOIN reasoning r ON o.id = r.trade_id
    ORDER BY o.created_at DESC
    LIMIT 200
  `, [], (err, rows) => {
    // Graceful fallback if reasoning table doesn't exist yet
    if (err && err.message.includes('no such table: reasoning')) {
      db.all('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200', [], (err2, rows2) => {
        if (err2) return res.status(500).json({ ok:false, error: err2.message });
        return res.json({ ok:true, data: rows2 });
      });
      return;
    }
    if (err) return res.status(500).json({ ok:false, error: err.message });
    res.json({ ok:true, data: rows });
  });
});
