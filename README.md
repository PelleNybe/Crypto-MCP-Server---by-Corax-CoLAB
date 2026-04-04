<div align="center">
  <a href="https://cryptop.coraxcolab.com" target="_blank">
    <img width="800" alt="Frontend Dashboard" src="./gui/frontend/public/images/dashboard.png" style="border-radius: 12px; margin-bottom: 20px; box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);" />
  </a>

  <h1>Crypto MCP Server <br> <span style="font-size: 0.6em; color: #10b981;">by Corax CoLAB & PelleNybe 🚀🪙</span></h1>

  <p>
    <a href="https://github.com/PelleNybe"><img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=22&pause=1000&color=10B981&center=true&vCenter=true&width=600&lines=Welcome+to+Crypto+MCP+Server;The+Future+of+Edge+AI+%26+Blockchain;AI-driven+command+center;100%25+Real+Data+Integration" alt="Typing SVG" /></a>
  </p>

  <p>
    <a href="https://github.com/PelleNybe"><img src="https://img.shields.io/badge/version-2.0.0-blue.svg?style=for-the-badge&logo=github" alt="Version"/></a>
    <img src="https://img.shields.io/badge/python->=3.10-blue.svg?style=for-the-badge&logo=python" alt="Python"/>
    <img src="https://img.shields.io/badge/node->=20.x-green.svg?style=for-the-badge&logo=nodedotjs" alt="Node.js"/>
    <img src="https://img.shields.io/badge/React-Vite-61dafb.svg?style=for-the-badge&logo=react" alt="React"/>
    <img src="https://img.shields.io/badge/Three.js-3D-black.svg?style=for-the-badge&logo=three.js" alt="Three.js"/>
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License"/>
  </p>

  <p><em>The ultimate AI-driven command center for your local crypto operations, featuring a dark, cyberpunk/command-center aesthetic.</em></p>
</div>

---

## 👨‍💻 Developer & Company

<div align="center">
  <img src="https://raw.githubusercontent.com/PelleNybe/PelleNybe/main/assets/line.svg" width="100%" height="2" onerror="this.style.display='none'"/>

  <h3>Architected by Pelle Nyberg & Corax CoLAB</h3>

  <p>
    <i>This product is proudly brought to you by <b>Corax CoLAB</b> and <b>PelleNybe</b>, the architects behind cyber-physical systems that secure your future in an increasingly regulated and resource-constrained world.</i>
  </p>

  <p>
    <b>We unite:</b><br>
    🤖 Edge AI & Autonomous Systems<br>
    🔗 Blockchain & Decentralized Finance<br>
    🌌 Advanced 3D Data Visualization
  </p>

  <p>
    <a href="https://github.com/PelleNybe">
      <img src="https://img.shields.io/badge/PelleNybe-GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="PelleNybe Repo" />
    </a>
    <a href="https://www.linkedin.com/in/pellenyberg/">
      <img src="https://img.shields.io/badge/LinkedIn-Pelle_Nyberg-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="Pelle Nyberg LinkedIn" />
    </a>
    <a href="https://pellenybe.github.io">
      <img src="https://img.shields.io/badge/Portfolio-Pelle_Nyberg-FF5722?style=for-the-badge&logo=polywork&logoColor=white" alt="Pelle Nyberg Portfolio" />
    </a>
  </p>

  <p>
    <a href="https://cryptop.coraxcolab.com">
      <img src="https://img.shields.io/badge/Crypto P's Crypto Circus-Live_Demo-8A2BE2?style=for-the-badge&logo=rocket&logoColor=white" alt="Crypto P's Crypto Circus Live" />
    </a>
    <a href="https://coraxcolab.com">
      <img src="https://img.shields.io/badge/Corax_CoLAB-Website-10B981?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Corax CoLAB" />
    </a>
  </p>

  <img src="https://raw.githubusercontent.com/PelleNybe/PelleNybe/main/assets/line.svg" width="100%" height="2" onerror="this.style.display='none'"/>
</div>

---





## ✨ 10 Technical and Visual Upgrades
1. **Async Portfolio MCP**: The `portfolio_mcp.py` now fetches concurrent exchange balances using `ccxt.async_support` for incredibly fast dashboard load times.
2. **Robust Proxy Timeouts**: The Node backend implements robust `AbortSignal` logic for MCP communication, preventing hanging connections.
3. **SQLite Indices**: The backend automatically initializes proper database indices on `orders.db` for `created_at` and `status` to dramatically speed up log querying.
4. **WebSocket Resilience**: The React frontend implements a centralized, self-healing `Socket.io` client ensuring the dashboard never goes stale if the backend restarts.
5. **Strict Input Validation**: Backend order execution endpoints rigorously validate symbol format, trade side, and order type before dispatching to the MCP.
6. **Cyberpunk Loaders**: Components like `PortfolioPanel` and `TickerPanel` feature animated, stylized loading states during data decryption.
7. **Neon Toasts**: A custom notification system provides sleek, auto-dismissing visual feedback for system events and order executions.
8. **Enhanced Orders Table**: The `OrdersLogPanel` is upgraded with pagination, neon-color-coded status badges, and interactive hover effects.
9. **Glitch Effects**: Critical data changes trigger subtle CSS glitch animations, enhancing the cyberpunk aesthetic.
10. **Dynamic Theme Colors**: The entire dashboard reacts to global market sentiment, shifting its neon glowing borders based on whether the market is bullish or bearish.






## 🌌 100% Real Data Integration & Visualizer Dynamics (Upgraded v3.0)

The Crypto MCP Server has been heavily upgraded to ensure **every single conceptual placeholder has been actively replaced with real data mechanisms**. The entire system operates without a single mockup across visualizers. All 3D graphs reflect live local data.

*   **Dark Pool Sonar:** Real-time 3D sonar pings for large volume "whale" trades on central exchanges. Connected to `MCP_CCXT` to monitor `fetch_trades` data and renders physics-based 3D ripples with `@react-three/fiber`.
*   **Flash-Crash Prediction Matrix:** Visualizes the ratio of bids to asks as a dynamic glowing heatmap grid, tracking potential liquidity drains using `MCP_CCXT` `fetch_order_book`.
*   **Galaxy View (Gravity Well):** Maps the top 50 cryptocurrencies in a 3D galaxy using `MCP_COINGECKO`. Star size = Market Cap, orbit speed = Volume, color = 24h change.
*   **AI Sentiment Word-Cloud Sphere:** Fetches recent crypto news via `MCP_NEWS` and extracts trending keywords and sentiment to form a 3D interactive floating word sphere.
*   **Gas & Network Congestion Hologram:** Visualizes current Ethereum network congestion as a glowing, pulsating reactor core using `MCP_ONCHAIN` `gas_price`. Faster pulsing/red colors indicate high congestion.

### Legacy Visualizers
*   **Arbitrage Wormhole:** Live Cross-DEX arbitrage detection using multi-exchange CCXT MCP polling.
*   **Neural Trade Visualizer:** Calculates genuine diagnostic routing data retrieved from live orderbooks (L2 Bids/Asks) using `react-three-fiber`.
*   **Quantum Risk Map:** Real-time 3D topography of your portfolio risk exposure.
*   **Orbital Portfolio Deck:** A dynamic, physics-based 3D visualization of your actual asset allocation.
*   **Global Weather System:** An interactive background system that reacts to the current market sentiment (Bull, Bear, Neutral), altering the entire visual environment.


---

## 🗺️ System Overview & Architecture

The image series below illustrates the four key stages of the Crypto MCP Server, bridging AI (Claude Desktop), local tools, and blockchain technology.

<details>
<summary><b>1️⃣ Architectural Overview (Click to expand)</b></summary>
<br>
Claude Desktop communicates via JSON-RPC with the Crypto MCP Server backend (REST + WebSocket). The server acts as a proxy, directing traffic to specific local MCP tools—such as CCXT, CoinGecko, and Portfolio—while logging orders to a local SQLite database.

<div align="center">
  <img width="800" alt="Architectural Overview" src="./gui/frontend/public/images/architecture.jpg" style="border-radius: 12px; margin-bottom: 20px; border: 1px solid #333; box-shadow: 0 4px 15px rgba(0,255,150,0.1);" />
</div>
</details>

<details>
<summary><b>2️⃣ Installation and Configuration (Click to expand)</b></summary>
<br>
The terminal displays successful execution steps of the automated `install.sh` script, automating directory creation, Node.js installation, and service setup.

<div align="center">
  <img width="800" alt="Installation and Configuration" src="./gui/frontend/public/images/installation.jpg" style="border-radius: 12px; margin-bottom: 20px; border: 1px solid #333; box-shadow: 0 4px 15px rgba(0,255,150,0.1);" />
</div>
</details>

<details>
<summary><b>3️⃣ Security and Best Practices (Click to expand)</b></summary>
<br>
Summarizes the core security principles: using testnet keys, securing API keys, restricting network access, leveraging local control, and implementing an authenticated reverse proxy.

<div align="center">
  <img width="800" alt="Security and Best Practices" src="./gui/frontend/public/images/security.jpg" style="border-radius: 12px; margin-bottom: 20px; border: 1px solid #333; box-shadow: 0 4px 15px rgba(0,255,150,0.1);" />
</div>
</details>

---

## 📚 Table of contents

- [Developer & Company](#-developer--company)
- [New AI Capabilities & Real Data](#-100-real-data-integration--visualizer-dynamics)
- [System Overview & Architecture](#️-system-overview--architecture)
- [✅ Quick start — automated (install.sh)](#-quick-start--automated-recommended--installsh-)
- [Manual install (condensed)](#-manual-install-condensed)
- [Configuration (.env) & MCP endpoints](#️-configuration-env-backend)
- [🔗 Claude Desktop integration (step-by-step)](#-claude-desktop-integration-detailed-)
- [Dashboard user manual](#-dashboard--what-you-can-do-user-manual)
- [SQLite & logs](#-sqlite--logs)
- [Security & best practices](#-security--best-practices)

---

## ✅ Quick start — automated (recommended) — install.sh 🎯

Place the provided `install.sh` into `$HOME/install.sh` (or `$HOME/cryptomcpserver/install.sh` if you prefer). Make it executable and run it:

```bash
# Save install.sh to $HOME/install.sh, then:
cd $HOME
chmod +x install.sh
./install.sh
```

**What install.sh does (summary):**
1. Creates directories and writes backend & frontend files.
2. Installs Node.js if missing and runs `npm install` for backend & frontend.
3. Ensures the `orders` table exists in `$HOME/cryptomcpserver/gui/backend/orders.db`.
4. Frees port 4000 if occupied, then installs & enables the systemd service `crypto-mcp-gui.service`.
5. Attempts a production build of the frontend.

> After running, check service status and logs:
```bash
sudo systemctl status crypto-mcp-gui.service
sudo journalctl -u crypto-mcp-gui.service -f
```

---

## 🛠 Manual install (condensed)

If you prefer to do everything yourself:

1. **Install system deps:**
   ```bash
   sudo apt update
   sudo apt install -y curl build-essential ca-certificates git
   ```

2. **Install Node.js (if needed):**
   ```bash
   curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. **Backend & Global Config:**
   ```bash
   cd $HOME/cryptomcpserver
   cp .env.example .env
   # edit .env to add your passwords, keys, and allowed pairs

   cd gui/backend
   npm install
   ```

4. **Frontend (dev):**
   ```bash
   cd $HOME/cryptomcpserver/gui/frontend
   npm install
   npm run dev -- --host   # open http://PI_IP:5173 on your laptop
   ```

5. **Systemd (backend):**
   ```bash
   # Create /etc/systemd/system/crypto-mcp-gui.service
   sudo systemctl daemon-reload
   sudo systemctl enable --now crypto-mcp-gui.service
   ```

---

## ⚙️ Configuration: .env (global & backend)

The system uses a centralized `.env` file located at the root of the project to manage both Python MCP servers and the Node.js backend.

Copy and edit `$HOME/cryptomcpserver/.env.example` → `.env`:

```env
# Essential configuration
PORT=4000
DASHBOARD_PASSWORD=your_secure_password # Required for trading and AI reasoning
ALLOWED_PAIRS=BTC/USDT,SOL/USDT # Fail-closed security: only these pairs are allowed
MAX_TRADE_USD=100.0 # Maximum allowed trade amount per transaction

# API Keys
BINANCE_API_KEY=your_key
BINANCE_API_SECRET=your_secret
```

---

## 🔗 Claude Desktop integration (detailed) 🧩

### Add MCP servers in Claude Desktop (step-by-step)
1. Open Claude Desktop app.
2. Open App Settings / Preferences.
3. Find Local MCP Servers.
4. Click `+` (Add) — fill fields one by one:
   *   **Name:** `ccxt`
   *   **Description:** `CCXT MCP – exchange trading & market data`
   *   **Transport:** `http`
   *   **Endpoint:** `http://127.0.0.1:7001/mcp` (if Claude runs on Pi) or `http://<pi-ip>:7001/mcp` (if Claude runs on laptop)
5. Save. Repeat for other MCPs (`coingecko`, `portfolio`, `onchain`, `ta`, `notifier`, `llm`, etc.) with their respective ports.

---

## 🖥 Dashboard — what you can do (user manual)

*   📊 **Portfolio:** View aggregated balances & USD value (async fetching for speed).
*   📈 **Ticker:** Live market data (via ccxt MCP).
*   🛒 **Order / Trade:**
    *   **Preview (dry_run):** Calculates estimated cost and logs a preview.
    *   **Confirm → Place order:** Sends create_order to CCXT MCP (backend requires `execute:true`).
*   📜 **Orders log:** Shows previews and executed orders (real-time updates via socket.io, paginated with indices).
*   🤖 **AI Copilot:** Voice-activated command center powered by real local LLMs.

> ⚠️ **Safety:** Always test with testnet keys. The UI requires confirmation to execute live orders.

---

## 🗄 SQLite & logs

**DB file:** `$HOME/cryptomcpserver/gui/backend/orders.db`

**Inspect last 10 orders:**
```bash
sqlite3 $HOME/cryptomcpserver/gui/backend/orders.db \
  "SELECT id,created_at,exchange,symbol,side,amount,price,status FROM orders ORDER BY created_at DESC LIMIT 10;"
```

---

## 🔒 Security & best practices

*   Use testnet keys while testing.
*   Keep API keys out of repo — store them in the MCP server config or in secure `.env` not committed.
*   Restrict access to MCP endpoints to LAN only (UFW rules) or use VPN/SSH tunnels.
*   Auth bypass vulnerabilities via insecure `req.ip` validation on localhost have been successfully patched. `/api/order/pending` and `/api/order/reasoning` endpoints are now fully secured with `DASHBOARD_PASSWORD` verification.
