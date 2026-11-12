# Bot Integrations (Freqtrade, Hummingbot, OctoBot)

Crypto MCP Server acts as both an **MCP control plane** and a **real-time AI/market risk overlay** for external trading bots.

## 1. Universal Signal & Risk Bridge (`bot_bridge.py`)

[`bot_bridge.py`](../bot_bridge.py) polls your running MCP servers (`news_mcp`, `ta_mcp`, `onchain_mcp`), computes a normalized risk/regime score (`0–100`), atomically writes `data/mcp_signals.json`, and can automatically trigger bot guardrails when `regime == "halt"`:

```bash
# One-shot signal update
.venv/bin/python bot_bridge.py --symbol BTC/USDT --timeframe 1h

# Continuous 60s loop with Freqtrade whitelist sync, historical SQLite logging, halt guardrails & alerts
.venv/bin/python bot_bridge.py --watch --interval 60 --sync-freqtrade-whitelist --guard-freqtrade --guard-octobot --notify

# Per-pair signals without Freqtrade whitelist sync
.venv/bin/python bot_bridge.py --pairs BTC/USDT,ETH/USDT,SOL/USDT

# Automated Strategy Doctor post-mortem & Telegram/Discord digest
.venv/bin/python strategy_doctor.py --include-octobot --notify
```

### Signal Schema (`data/mcp_signals.json`)
- `risk_score` (`0-100`): `0–29` (`risk_on`), `30–59` (`neutral`), `60–79` (`caution`), `80–100` (`halt`)
- `allow_entries`: `false` when `regime == "halt"`
- `stake_multiplier`: `1.15` (`risk_on`), `1.0` (`neutral`), `0.5` (`caution`), `0.0` (`halt`)
- `spread_multiplier`: `0.9`–`2.5` (for Hummingbot market making)
- `blocked_pairs`: pairs flagged by negative/exploit news headlines
- `pair_signals`: optional per-pair risk/TA breakdown (`BTC/USDT`, `ETH/USDT`, ...) when `--pairs` or `--sync-freqtrade-whitelist` is used.
- `data/mcp_signal_history.db`: SQLite history table (`signal_history`) for replaying historical MCP regimes in Freqtrade backtests via `MCP_HISTORY_DB`.

## 2. Freqtrade

- **MCP Server (`freqtrade_mcp.py`, port `7011`)**: Exposes `status`, `balance`, `profit`, `performance`, `daily`, `count`, `health`, `start_bot`, `stop_bot`, `stopbuy`, `pause`, `reload_config`, `forceenter`, `forceexit`, `cancel_open_order`, `whitelist`, `blacklist`, `delete_blacklist`, `locks`, `create_lock`, `delete_lock`, `list_strategies`, `strategy`, `backtest_history`, `trades`, and `analyze_trade_performance`.
- **Strategy Overlay**: See [`freqtrade/McpEnhancedStrategy.py`](./freqtrade/McpEnhancedStrategy.py) for a drop-in `confirm_trade_entry()` + `custom_stake_amount()` implementation that reads `data/mcp_signals.json` in `<1ms` during live/dry-run and automatically bypasses during backtests.

## 3. Hummingbot

- **MCP Server (`hummingbot_mcp.py`, port `7013`)**: Exposes Gateway (`ping`, `connectors`, `get_balances`, `get_tokens`, `clob_markets`, `clob_orderbook`, `clob_orders`, `amm_price`, `amm_quote`) and Backend API (`bot_status`, `start_bot`, `stop_bot`, `list_controllers`, `bot_performance`).
- **Spread & Size Filter**: See [`hummingbot/mcp_signal_filter.py`](./hummingbot/mcp_signal_filter.py) to widen spreads and scale order sizes dynamically from `data/mcp_signals.json`.

## 4. OctoBot

- **MCP Server (`octobot_mcp.py`, port `7012`)**: Exposes `ping`, `status`, `portfolio`, `start_bot`, `stop_bot`, `restart_bot`, `history`, `open_orders`, `trades`, `profits`, `tentacles`, `reload_tentacles`, and `cancel_order`.
- **Evaluator Helper**: See [`octobot/mcp_signal_filter.py`](./octobot/mcp_signal_filter.py).

## 5. Dashboard & Deployment
- **Web Dashboard**: Open the **BOT FLEET** tab in the React frontend (backed by `GET /api/bot-bridge/signal` and `/api/mcp`) to monitor live `bot_bridge` risk regimes and trigger Start/StopBuy/Reload actions.
- **Docker / Systemd**: `docker-compose.yml` includes the `bot_bridge` service mounting `./data:/app/data`, and `systemd/bot_bridge.service` provides a Linux systemd unit.
