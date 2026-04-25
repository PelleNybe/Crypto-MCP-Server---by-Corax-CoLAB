<img width="1024" height="1024" alt="cryptomcplogo" src="https://github.com/user-attachments/assets/159c6ff1-7831-4c01-a3fb-019ea30f33a6" />

<h1>Crypto MCP Server — by Corax CoLAB - The Future of Edge AI & Blockchain 🚀🪙</h1>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-blue.svg?cacheSeconds=2592000" />
  <img src="https://img.shields.io/badge/python->=3.10-blue.svg" />
  <img src="https://img.shields.io/badge/node->=20.x-green.svg" />
  <img src="https://img.shields.io/badge/React-Vite-61dafb.svg" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" />
</p>



Crypto MCP Server is a local, lightweight dashboard + utility layer that connects Claude Desktop (Local MCP tools) and your local MCP servers on a Raspberry Pi (or other platform with Linux dist). It provides a REST + WebSocket backend that proxies MCP tools (CCXT, CoinGecko, Portfolio, Freqtrade, etc.), stores order logs locally (SQLite), and ships a React frontend dashboard for monitoring and limited control.

> Default project path used in this README: /home/pelle/cryptomcpserver/
The installer script name is now install.sh and should be located at /home/pelle/install.sh. 📁




---

## 📚 Table of contents

Overview & features

Repository layout

## ✅ Quick start — automated (install.sh)

Manual install (condensed)

Configuration (.env) & MCP endpoints

## 🔗 Claude Desktop integration (step-by-step)

Dashboard user manual (what you can do)

REST API examples

SQLite & logs

Systemd & services

Troubleshooting & common errors

Security & best practices

Extending & contribution info



---


## ✨ Overview & Features

Crypto MCP Server provides an **advanced, fully integrated ecosystem** for crypto trading and monitoring directly from your edge devices.

🔹 **Proxy to local MCP servers** via JSON-RPC `tools/call`.
🔹 **REST API Endpoints:** `/api/ticker`, `/api/portfolio`, `/api/order/dry_run`, `/api/order/execute`, `/api/orders`.
🔹 **Real-Time Data:** Live updates powered by **Socket.io** for ticker, portfolio, and orders.
🔹 **Local Order Logging:** Securely store order logs locally using **SQLite** (`orders.db`).
🔹 **Next-Gen React + Vite Frontend:** A state-of-the-art dashboard featuring stunning 3D visualizations and advanced trading tools.
🔹 **Systemd Integration:** Runs seamlessly as a background service starting at boot.
🔹 **Claude Desktop Ready:** Designed specifically to integrate with Claude Desktop Local MCP Servers. 🤖

### 🚀 NEW: World-Class 3D Features & Modules
We have recently supercharged the dashboard with **next-level** interactive components:
*   **Arbitrage Wormhole:** Visualize cross-exchange arbitrage opportunities in real-time.
*   **Algo Grid Architect:** Design and deploy automated grid trading strategies.
*   **Oracle Copilot:** AI-driven insights and market sentiment analysis.
*   **Quantum Risk Map:** Advanced topography of your portfolio's risk exposure.
*   **Whale Constellations & Sonar Sweep:** Track large on-chain movements and whale activity.
*   **Global Weather System:** Dynamic environment reflecting current market sentiment (Bull, Bear, Neutral).
*   **News Singularity:** Aggregated crypto news streams directly into your command center.
*   **And much more!** (Predictive Ghosting, Backtest Arena, Risk Radar, Volatility Matrix).

---


## 📁 Repository layout (what you should have)

/home/pelle/cryptomcpserver/
└─ gui/
   ├─ backend/
   │  ├─ server.js
   │  ├─ package.json
   │  ├─ .env.example
   │  └─ orders.db
   └─ frontend/
      ├─ package.json
      ├─ vite.config.ts
      ├─ index.html
      └─ src/
         ├─ main.tsx
         ├─ App.tsx
         ├─ styles.css
         └─ components/
            ├─ PortfolioPanel.tsx
            ├─ TickerPanel.tsx
            ├─ OrderPanel.tsx
            └─ OrdersLogPanel.tsx


---

## ✅ Quick start — automated (recommended) — install.sh 🎯

Place the provided install.sh into /home/pelle/install.sh (or /home/pelle/cryptomcpserver/install.sh if you prefer). Make it executable and run it as user pelle:

# Save install.sh to /home/pelle/install.sh, then:
cd /home/pelle
chmod +x install.sh
./install.sh

What install.sh does (summary):

Creates directories and writes backend & frontend files (with safe fallback frontend CSS).

Installs Node.js if missing and runs npm install for backend & frontend.

Ensures orders table exists in /home/pelle/cryptomcpserver/gui/backend/orders.db.

Frees port 4000 if occupied, then installs & enables systemd service crypto-mcp-gui.service.

Attempts a production build of the frontend (you can still run dev mode separately).


> After running, check service status and logs:



sudo systemctl status crypto-mcp-gui.service
sudo journalctl -u crypto-mcp-gui.service -f


---

## 🛠 Manual install (condensed)

If you prefer to do everything yourself:

1. Install system deps:



sudo apt update
sudo apt install -y curl build-essential ca-certificates git

2. Install Node.js (if needed):



curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v

3. Backend:



cd /home/pelle/cryptomcpserver/gui/backend
# place server.js and package.json here, then:
npm install
cp .env.example .env
# edit .env if needed

4. Frontend (dev):



cd /home/pelle/cryptomcpserver/gui/frontend
npm install
npm run dev -- --host   # open http://PI_IP:5173 on your laptop

5. Systemd (backend):



# Create /etc/systemd/system/crypto-mcp-gui.service (see below)
sudo systemctl daemon-reload
sudo systemctl enable --now crypto-mcp-gui.service


---

## ⚙️ Configuration: .env (backend)

Copy and edit /home/pelle/cryptomcpserver/gui/backend/.env.example → .env:

MCP_CCXT=http://127.0.0.1:7001/mcp
MCP_PORTFOLIO=http://127.0.0.1:7004/mcp
PORT=4000

MCP_CCXT — CCXT MCP endpoint (for get_ticker, create_order, etc.)

MCP_PORTFOLIO — optional portfolio aggregator MCP

PORT — backend port (default 4000)



---

## 🔗 Claude Desktop integration (detailed) 🧩

Overview

Claude Desktop supports Local MCP Servers (HTTP JSON-RPC endpoints). Add your MCP endpoints in Claude Desktop so Claude can call the tools exposed by those MCPs (e.g., get_ticker, create_order).

Add MCP servers in Claude Desktop (step-by-step)

1. Open Claude Desktop app.


2. Open App Settings / Preferences.


3. Find Local MCP Servers.


4. Click + (Add) — fill fields one by one (do not paste a JSON array):

Name: ccxt

Description: CCXT MCP – exchange trading & market data

Transport: http

Endpoint: http://127.0.0.1:7001/mcp (if Claude runs on Pi) or http://<pi-ip>:7001/mcp (if Claude runs on laptop)

Save.



5. Repeat for other MCPs (coingecko, portfolio, freqtrade, octobot, hummingbot, superalgos, llm) with their ports.



Example endpoints to add

*   `http://127.0.0.1:7001/mcp` — **ccxt MCP** (Exchange trading & market data)
*   `http://127.0.0.1:7002/mcp` — **onchain MCP** (On-chain blockchain data via Web3)
*   `http://127.0.0.1:7003/mcp` — **ta MCP** (Technical Analysis metrics)
*   `http://127.0.0.1:7004/mcp` — **portfolio MCP** (Portfolio tracking & aggregation)
*   `http://127.0.0.1:7005/mcp` — **notifier MCP** (Alerts & notifications)
*   `http://127.0.0.1:7010/mcp` — **coingecko MCP** (Live crypto market data & news)
*   `http://127.0.0.1:7011/mcp` — **freqtrade MCP** (Freqtrade bot integration)
*   `http://127.0.0.1:7012/mcp` — **octobot MCP** (OctoBot integration)
*   `http://127.0.0.1:7013/mcp` — **hummingbot MCP** (Hummingbot integration)
*   `http://127.0.0.1:7014/mcp` — **superalgos MCP** (Superalgos integration)
*   `http://127.0.0.1:7015/mcp` — **llm MCP** (Open Source AI functionality)

Test MCP from the Pi (curl examples)

Ping:

curl -s -X POST http://127.0.0.1:7001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json,text/event-stream' \
  -d '{
    "jsonrpc":"2.0","id":1,"method":"tools/call",
    "params":{"name":"ping","arguments":{}}
  }'

get_ticker:

curl -s -X POST http://127.0.0.1:7001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json,text/event-stream' \
  -d '{
    "jsonrpc":"2.0","id":2,"method":"tools/call",
    "params":{"name":"get_ticker","arguments":{"exchange":"binance","symbol":"BTC/USDT"}}
  }'

If you see Not Acceptable: Client must accept both application/json and text/event-stream → add the Accept header exactly as shown.

How Claude uses the MCP tools

After adding Local MCP Servers via the UI, Claude Desktop will expose those tools when you compose prompts or use tool invocation features. Use tool name get_ticker, create_order etc., and Claude will call the MCP endpoint using the JSON-RPC tools/call pattern.


Troubleshooting Claude <-> MCP

"No servers added" → ensure you pressed + and saved; restart Claude Desktop if UI doesn’t update.

Claude cannot reach MCP → use Pi LAN IP and open the port in Pi firewall (ufw), or use SSH port forwarding.

Validation errors → use the JSON-RPC wrapper (method: "tools/call" / params: { name, arguments }).

Security → never expose MCP endpoints that can place live trades to the public internet without TLS + auth.



---

## 🖥 Dashboard — what you can do (user manual)

Portfolio: view aggregated balances & USD value (updated via portfolio MCP).

Ticker: live market data (via ccxt MCP).

Order / Trade:

Preview (dry_run): calculates estimated cost and logs a preview to orders.db.

Confirm → Place order: sends create_order to CCXT MCP (backend requires execute:true).


Orders log: shows previews and executed orders (real-time updates via socket.io).

Export / logs: export orders or check orders.db.


Safety: Always test with testnet keys. The UI requires confirmation to execute live orders.


---

## 🔁 REST API examples (curl)

Ticker:


curl "http://127.0.0.1:4000/api/ticker?exchange=binance&symbol=BTC/USDT"

Portfolio:


curl "http://127.0.0.1:4000/api/portfolio?exchanges=binance"

Preview order (dry_run):


curl -s -X POST http://127.0.0.1:4000/api/order/dry_run \
  -H 'Content-Type: application/json' \
  -d '{"exchange":"binance","symbol":"BTC/USDT","side":"buy","type":"market","amount":0.001}' | jq

Execute order:


curl -s -X POST http://127.0.0.1:4000/api/order/execute \
  -H 'Content-Type: application/json' \
  -d '{"exchange":"binance","symbol":"BTC/USDT","side":"buy","type":"market","amount":0.001,"execute":true}' | jq

Orders list:


curl http://127.0.0.1:4000/api/orders | jq


---

## 🗄 SQLite & logs

DB file: /home/pelle/cryptomcpserver/gui/backend/orders.db

Inspect last 10 orders:

sqlite3 /home/pelle/cryptomcpserver/gui/backend/orders.db \
  "SELECT id,created_at,exchange,symbol,side,amount,price,status FROM orders ORDER BY created_at DESC LIMIT 10;"

Check backend logs:

sudo journalctl -u crypto-mcp-gui.service -f


---

## 🧰 Systemd service (backend)

Service file: /etc/systemd/system/crypto-mcp-gui.service

Minimal example (install.sh writes this for you):

[Unit]
Description=Crypto MCP GUI Backend - Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)
After=network.target

[Service]
Type=simple
User=pelle
WorkingDirectory=/home/pelle/cryptomcpserver/gui/backend
Environment=NODE_ENV=production
Environment=PORT=4000
ExecStart=/usr/bin/node /home/pelle/cryptomcpserver/gui/backend/server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target

Enable & start:

sudo systemctl daemon-reload
sudo systemctl enable --now crypto-mcp-gui.service
sudo systemctl status crypto-mcp-gui.service


---

## ⚠️ Troubleshooting & common errors

Service crashes on start → check journalctl -u crypto-mcp-gui.service -n 200. Common issues: missing npm dependencies, syntax errors, or port 4000 already in use.

EADDRINUSE (port 4000 occupied) → find and kill the process:


sudo lsof -i :4000
sudo kill -9 <PID>

MCP JSON-RPC validation errors → use the tools/call wrapper as shown in the CURL examples.

Claude cannot call MCP → ensure Claude can reach the Pi (use LAN IP or SSH tunnel), and that you added the MCP via the + button.



---

## 🔒 Security & best practices

Use testnet keys while testing.

Keep API keys out of repo — store them in the MCP server config or in secure .env not committed.

Restrict access to MCP endpoints to LAN only (UFW rules) or use VPN/SSH tunnels.

For remote exposure: use an authenticated reverse proxy (NGINX + TLS + basic auth) — do not open trading endpoints publicly without robust auth.



---

## 🧩 Extending & Integration ideas

Add more MCPs: CoinGecko (market data), On-chain (balances &





<img width="1024" height="1536" alt="cryptomcpinfograph1" src="https://github.com/user-attachments/assets/e0bfce4d-2dc2-4d89-abdf-9594fe5df31d" />

<img width="1024" height="1024" alt="cryptomcppic" src="https://github.com/user-attachments/assets/9e8f5a08-cbc9-42e3-aed2-d53fcc6d0083" />

---

## 🌍 The Corax CoLAB Ecosystem
This product is proudly brought to you by **Corax CoLAB**, the architects behind cyber-physical systems that secure your future in an increasingly regulated and resource-constrained world.

We unite:
- **Edge AI & Autonomous Systems**
- **Blockchain & Web3 Innovation**
- **Zero Trust Security (Post-Quantum Cryptography ready)**
- **Sustainability & Compliance-as-Code**

Find out more at [Corax CoLAB](https://coraxcolab.com/).
