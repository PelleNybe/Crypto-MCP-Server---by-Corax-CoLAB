<div align="center">
  <a href="https://cryptop.coraxcolab.com" target="_blank">
    <img width="800" alt="Frontend Dashboard" src="./gui/frontend/public/images/dashboard.png" style="border-radius: 12px; margin-bottom: 20px; box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);" />
  </a>

  <h1>🌌 Crypto Multi-MCP Hub <br> <span style="font-size: 0.6em; color: #10b981;">by Corax CoLAB & PelleNybe 🚀🪙</span></h1>
  <h2>Hedge Fund AI Orchestrator</h2>

  <p>
    <a href="https://github.com/PelleNybe"><img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=22&pause=1000&color=10B981&center=true&vCenter=true&width=800&lines=Welcome+to+Crypto+MCP+Server;The+Future+of+Edge+AI+%26+Blockchain;AI-driven+command+center;100%25+Real+Data+Integration;Built+with+React,+Three.js+%26+Python" alt="Typing SVG" /></a>
  </p>

  <p>
    <a href="https://github.com/PelleNybe"><img src="https://img.shields.io/badge/version-3.0.0-blue.svg?style=for-the-badge&logo=github" alt="Version"/></a>
    <img src="https://img.shields.io/badge/python->=3.10-blue.svg?style=for-the-badge&logo=python" alt="Python"/>
    <img src="https://img.shields.io/badge/node->=20.x-green.svg?style=for-the-badge&logo=nodedotjs" alt="Node.js"/>
    <img src="https://img.shields.io/badge/React-Vite-61dafb.svg?style=for-the-badge&logo=react" alt="React"/>
    <img src="https://img.shields.io/badge/Three.js-3D-black.svg?style=for-the-badge&logo=three.js" alt="Three.js"/>
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License"/>
  </p>

  <p><em>The ultimate AI-driven command center and Multi-MCP Hub for your local crypto operations, featuring a dark, cyberpunk/command-center aesthetic. Built for everyone, from homebrew Raspberry Pi setups to cloud servers.</em></p>
</div>

---

## 👨‍💻 Developer & Company

<div align="center">
  <img src="https://raw.githubusercontent.com/PelleNybe/PelleNybe/main/assets/line.svg" width="100%" height="2" onerror="this.style.display='none'"/>
</div>

<p align="center">
  This project is brought to you by <strong>Pelle Nyberg</strong> and his company, <strong>Corax CoLAB</strong>.
</p>

<div align="center">
  <table>
    <tr>
      <td align="center">
        <h3><a href="https://pellenybe.github.io" target="_blank">Pelle Nyberg</a></h3>
        <p>Lead Developer & Architect</p>
        <a href="https://github.com/PelleNybe"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/></a>
        <a href="https://www.linkedin.com/in/pellenyberg/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
        <a href="https://pellenybe.github.io"><img src="https://img.shields.io/badge/Portfolio-FF5722?style=for-the-badge&logo=Web&logoColor=white" alt="Portfolio"/></a>
      </td>
      <td align="center">
        <h3><a href="https://coraxcolab.com" target="_blank">Corax CoLAB</a></h3>
        <p>Innovation & AI Solutions</p>
        <a href="https://coraxcolab.com"><img src="https://img.shields.io/badge/Website-000000?style=for-the-badge&logo=Google-Chrome&logoColor=white" alt="Website"/></a>
        <a href="https://cryptop.coraxcolab.com"><img src="https://img.shields.io/badge/Crypto_Dashboard-10b981?style=for-the-badge&logo=Bitcoin&logoColor=white" alt="Crypto Dashboard"/></a>
      </td>
    </tr>
  </table>
</div>

<div align="center">
  <img src="https://raw.githubusercontent.com/PelleNybe/PelleNybe/main/assets/line.svg" width="100%" height="2" onerror="this.style.display='none'"/>
</div>

---

## 📚 Table of contents

<details open>
  <summary><b>Click to expand/collapse contents</b></summary>
  <ul>
    <li><a href="#-developer--company">👨‍💻 Developer & Company</a></li>
    <li><a href="#-100-real-data-integration--visualizer-dynamics-upgraded-v30">🌌 100% Real Data Integration & Visualizer Dynamics</a></li>
    <li><a href="#️-system-overview--architecture">🗺️ System Overview & Architecture</a></li>
    <li><a href="#-quick-start--automated">✅ Quick start — automated</a></li>
    <li><a href="#-manual-install">🛠 Manual install</a></li>
    <li><a href="#️-configuration">⚙️ Configuration</a></li>
    <li><a href="#-claude-desktop-integration">🔗 Claude Desktop integration</a></li>
    <li><a href="#-dashboard-user-manual">🖥 Dashboard user manual</a></li>
    <li><a href="#-security--best-practices">🔒 Security & best practices</a></li>
  </ul>
</details>

---

## 🌌 100% Real Data Integration & Visualizer Dynamics (Upgraded v3.0)

The Crypto MCP Server has been heavily upgraded to ensure **every single conceptual placeholder has been actively replaced with real data mechanisms**. The entire system operates without a single mockup across visualizers. All 3D graphs reflect live local data.

*   🎯 **Dark Pool Sonar:** Real-time 3D sonar pings for large volume "whale" trades on central exchanges. Connected to `MCP_CCXT` to monitor `fetch_trades` data and renders physics-based 3D ripples with `@react-three/fiber`.
*   🔥 **Flash-Crash Prediction Matrix:** Visualizes the ratio of bids to asks as a dynamic glowing heatmap grid, tracking potential liquidity drains using `MCP_CCXT` `fetch_order_book`.
*   🚀 **Galaxy View (Gravity Well):** Maps the top 50 cryptocurrencies in a 3D galaxy using `MCP_COINGECKO`. Star size = Market Cap, orbit speed = Volume, color = 24h change.
*   🧠 **AI Sentiment Word-Cloud Sphere:** Fetches recent crypto news via `MCP_NEWS` and extracts trending keywords and sentiment to form a 3D interactive floating word sphere.
*   ⚡ **Gas & Network Congestion Hologram:** Visualizes current Ethereum network congestion as a glowing, pulsating reactor core using `MCP_ONCHAIN` `gas_price`. Faster pulsing/red colors indicate high congestion.

### 🏛 Legacy Visualizers
*   **Arbitrage Wormhole:** Live Cross-DEX arbitrage detection using multi-exchange CCXT MCP polling.
*   **Neural Trade Visualizer:** Calculates genuine diagnostic routing data retrieved from live orderbooks (L2 Bids/Asks) using `react-three-fiber`.
*   **Quantum Risk Map:** Real-time 3D topography of your portfolio risk exposure.
*   **Orbital Portfolio Deck:** A dynamic, physics-based 3D visualization of your actual asset allocation.
*   **Global Weather System:** An interactive background system that reacts to the current market sentiment (Bull, Bear, Neutral), altering the entire visual environment.

---


## 🚀 The Multi-MCP Ecosystem

This repository has evolved into a **Multi-MCP Hub** - a Hedge Fund AI Orchestrator. The vision is that anyone downloading this repo can easily configure their AI agent to use our server for execution/raw data, combined with external public MCPs for analysis.

Synergy examples:
*   **Aarna ATARS:** High-frequency sentiment signals and specialized DeFi analytics.
*   **Blockscout:** Contract safety, verified smart contract readouts.
*   **LunarCrush:** Social sentiment and trending metrics.
*   **Corax Crypto MCP (This repo):** Trade execution, real-time monitoring, and local AI reasoning.

### How to use the Multi-MCP Configuration

We provide a `multi_mcp_config.example.json` file that shows you how to connect your AI client (like Claude Desktop or Cursor) to multiple servers simultaneously.

1.  Open your AI client's MCP configuration file.
    *   **Claude Desktop:** `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows).
    *   **Cursor:** Add servers in Cursor Settings > Features > MCP.
2.  Copy the structure from `multi_mcp_config.example.json`.
3.  Fill in any required API keys (like `LUNARCRUSH_API_KEY`).
4.  Restart your AI client.

This setup is completely hardware- and OS-agnostic. Use `start_server.sh` or Docker to run the local Corax Server seamlessly on any environment!


## 🤖 Autonomous Orchestrator Mode (Agentic Loop)

We are introducing **Track 2: Agentic Orchestration**, evolving the project from a passive Multi-MCP tool into an autonomous, 24/7 trading agent framework.

The `autonomous_orchestrator.py` script acts as an MCP Client, automatically connecting to the MCPs defined in your `multi_mcp_config.example.json`.

It runs a continuous **Observe-Analyze-Act** (OODA) loop:
1. **Observe (`gather_market_data`):** Queries Aarna ATARS for technical signals and LunarCrush for sentiment.
2. **Analyze (`analyze_with_llm`):** Evaluates signals using an LLM (e.g., Gemini or Claude) to return a structured decision (BUY, SELL, HOLD).
3. **Act (`execute_trade`):** If a trade is decided, it calls the local Corax MCP to execute the trade.

### How to use the Autonomous Orchestrator
1. Ensure your API keys are set correctly in `.env` and your multi-MCP configuration.
2. You can test the orchestrator locally:
   ```bash
   python3 autonomous_orchestrator.py
   ```
3. **Run 24/7 as a background service:**
   We provide a systemd service template `systemd/corax_orchestrator.service`.
   Copy it to your systemd folder, enable it, and start it to let your AI daemon trade fully autonomously:
   ```bash
   sudo cp systemd/corax_orchestrator.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now corax_orchestrator.service
   ```

## 🗺️ System Overview & Architecture

The image series below illustrates the key stages of the Crypto MCP Server, bridging AI (Claude Desktop), local tools, and blockchain technology.

<details>
<summary><b>1️⃣ Architectural Overview (Click to expand)</b></summary>
<br>
Claude Desktop communicates via JSON-RPC with the Crypto MCP Server backend (REST + WebSocket). The server acts as a proxy, directing traffic to specific local MCP tools—such as CCXT, CoinGecko, and Portfolio—while logging orders to a local SQLite database.

<div align="center">
  <img width="800" alt="Architectural Overview" src="./gui/frontend/public/images/architecture.jpg" style="border-radius: 12px; margin-bottom: 20px; border: 1px solid #333; box-shadow: 0 4px 15px rgba(0,255,150,0.1);" onerror="this.style.display='none'" />
</div>
</details>

<details>
<summary><b>2️⃣ Installation and Configuration (Click to expand)</b></summary>
<br>
The terminal displays successful execution steps of the automated `install.sh` script, automating directory creation, Node.js installation, and service setup.

<div align="center">
  <img width="800" alt="Installation and Configuration" src="./gui/frontend/public/images/installation.jpg" style="border-radius: 12px; margin-bottom: 20px; border: 1px solid #333; box-shadow: 0 4px 15px rgba(0,255,150,0.1);" onerror="this.style.display='none'" />
</div>
</details>

<details>
<summary><b>3️⃣ Security and Best Practices (Click to expand)</b></summary>
<br>
Summarizes the core security principles: using testnet keys, securing API keys, restricting network access, leveraging local control, and implementing an authenticated reverse proxy.

<div align="center">
  <img width="800" alt="Security and Best Practices" src="./gui/frontend/public/images/security.jpg" style="border-radius: 12px; margin-bottom: 20px; border: 1px solid #333; box-shadow: 0 4px 15px rgba(0,255,150,0.1);" onerror="this.style.display='none'" />
</div>
</details>

---

## ✅ Quick start — automated

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

## 🛠 Manual install

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

## ⚙️ Configuration

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

## 🔗 Claude Desktop integration

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

## 🖥 Dashboard user manual

*   📊 **Portfolio:** View aggregated balances & USD value (async fetching for speed).
*   📈 **Ticker:** Live market data (via ccxt MCP).
*   🛒 **Order / Trade:**
    *   **Preview (dry_run):** Calculates estimated cost and logs a preview.
    *   **Confirm → Place order:** Sends create_order to CCXT MCP (backend requires `execute:true`).
*   📜 **Orders log:** Shows previews and executed orders (real-time updates via socket.io, paginated with indices).
*   🤖 **AI Copilot:** Voice-activated command center powered by real local LLMs.

> ⚠️ **Safety:** Always test with testnet keys. The UI requires confirmation to execute live orders.

---

## 🔒 Security & best practices

*   **Testnet First:** Use testnet keys while testing.
*   **Environment Variables:** Keep API keys out of repo — store them in the MCP server config or in secure `.env` not committed.
*   **Network Isolation:** Restrict access to MCP endpoints to LAN only (UFW rules) or use VPN/SSH tunnels.
*   **Authentication:** Auth bypass vulnerabilities via insecure `req.ip` validation on localhost have been successfully patched. `/api/order/pending` and `/api/order/reasoning` endpoints are now fully secured with `DASHBOARD_PASSWORD` verification.

<div align="center">
  <img src="https://raw.githubusercontent.com/PelleNybe/PelleNybe/main/assets/line.svg" width="100%" height="2" onerror="this.style.display='none'"/>
  <p><i>Stay Cypherpunk. Keep Building. ⚡</i></p>
</div>

## Autonomous Orchestrator Mode

The Autonomous Orchestrator Mode evolves the project from a passive Multi-MCP tool into an autonomous, 24/7 trading agent framework. It runs a continuous Observe-Orient-Decide-Act (OODA) loop, connecting to external MCPs like Aarna ATARS and LunarCrush to gather market signals, and then utilizes an LLM to analyze the data and make trading decisions. The local Corax MCP is then instructed to execute trades if necessary.

To enable and configure the orchestrator, you can simply edit your `.env` file to select the LLM "brain" of your choice without editing any Python logic:

```env
# --- Autonomous Orchestrator Settings ---
# Choose your provider: 'gemini', 'anthropic', or 'openai'
ACTIVE_LLM_PROVIDER="gemini"

# API Keys for the LLM providers (only the active one is required)
GEMINI_API_KEY="your_google_gemini_key_here"
ANTHROPIC_API_KEY="your_claude_api_key_here"
OPENAI_API_KEY="your_openai_api_key_here"
```

### Proof of Brain / Trading Diary

To provide full transparency, the Autonomous Orchestrator includes a "Proof of Brain" module. After every complete OODA cycle (Observe, Analyze, Act), a comprehensive Markdown report is generated in the `trading_diary/` directory.

These reports document every decision made by the AI Board of Directors, answering *why* a specific action was taken. They include:
*   The raw market data the orchestrator gathered from its MCPs.
*   The individual votes and reasoning from the Technical Analyst (Gemini), Macro Strategist (OpenAI), and Risk Manager (Anthropic).
*   The final consensus reached and execution parameters.

Reports are saved even if the board's decision is "HOLD", ensuring a fully auditable track record of the agent's logic.

### Telegram Command Center

The Autonomous Orchestrator includes a built-in Telegram integration allowing you to receive real-time alerts and send commands to your trading agent.

1.  **Create a Bot:** Talk to `@BotFather` on Telegram, create a new bot, and get the HTTP API Token.
2.  **Get Chat ID:** Message your new bot, then go to `https://api.telegram.org/bot<YourBOTToken>/getUpdates` to find your `chat_id`.
3.  **Update `.env`:**
    ```env
    TELEGRAM_BOT_TOKEN="your_token_here"
    TELEGRAM_CHAT_ID="your_chat_id_here"
    TELEGRAM_NOTIFICATIONS_ENABLED="true"
    ```

**Available Commands:**
*   `/status` - Returns the current active AI providers, the target ticker, and the last known decision.
*   `/report` - Directly sends you the latest "Proof of Brain" markdown report as a document.
*   `/analyze` - Manually triggers the agent to run an OODA cycle instantly without executing a trade.

A `systemd/corax_orchestrator.service` template is provided to run the `autonomous_orchestrator.py` script as a 24/7 background daemon on Linux.
