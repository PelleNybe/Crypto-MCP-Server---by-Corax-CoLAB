#!/usr/bin/env python3
"""
bot_bridge.py
Universal MCP Signal & Risk Guardrail Bridge for Freqtrade, Hummingbot, and OctoBot.

Polls Crypto MCP Server endpoints (news_mcp, ta_mcp, onchain_mcp), computes a
deterministic market regime & risk score, atomically writes `data/mcp_signals.json`
for sub-millisecond consumption inside bot strategy loops, and optionally triggers
automated risk guardrails on Freqtrade / OctoBot + notifications.

For Crypto MCP Server – Produced by Corax CoLAB - The Future of Edge AI & Blockchain
"""

import argparse
import asyncio
import json
import logging
import os
import sqlite3
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("bot_bridge")

DEFAULT_SIGNAL_PATH = os.getenv("MCP_SIGNAL_FILE", "data/mcp_signals.json")
DEFAULT_HISTORY_DB = os.getenv("MCP_HISTORY_DB", "data/mcp_signal_history.db")
MCP_TA_URL = os.getenv("MCP_TA", "http://127.0.0.1:7003/mcp")
MCP_NEWS_URL = os.getenv("MCP_NEWS", "http://127.0.0.1:7008/mcp")
MCP_ONCHAIN_URL = os.getenv("MCP_ONCHAIN", "http://127.0.0.1:7005/mcp")
MCP_NOTIFIER_URL = os.getenv("MCP_NOTIFIER", "http://127.0.0.1:7007/mcp")
MCP_FREQTRADE_URL = os.getenv("MCP_FREQTRADE", "http://127.0.0.1:7011/mcp")
MCP_OCTOBOT_URL = os.getenv("MCP_OCTOBOT", "http://127.0.0.1:7012/mcp")

BEARISH_RISK_KEYWORDS = (
    "hack",
    "exploit",
    "bankrupt",
    "insolvent",
    "depeg",
    "halt",
    "sec lawsuit",
    "flash crash",
    "rug pull",
    "liquidation cascade",
    "outage",
)

BULLISH_KEYWORDS = (
    "etf inflow",
    "approval",
    "partnership",
    "upgrade",
    "adoption",
    "surge",
    "breakout",
)


def _extract_mcp_payload(raw_text: str) -> Any:
    """Parse JSON or SSE `data:` MCP HTTP response into a Python object."""
    text = raw_text.strip()
    if not text:
        return None

    parsed = None
    if text.startswith("{"):
        parsed = json.loads(text)
    else:
        for line in text.splitlines():
            if line.startswith("data:"):
                candidate = line[5:].strip()
                if candidate and candidate != "[DONE]":
                    parsed = json.loads(candidate)
                    break

    if not isinstance(parsed, dict):
        return parsed

    if "error" in parsed:
        raise RuntimeError(f"MCP error: {parsed['error']}")

    result = parsed.get("result", parsed)
    if isinstance(result, dict):
        if "structuredContent" in result and result["structuredContent"] is not None:
            return result["structuredContent"]
        content = result.get("content")
        if isinstance(content, list) and content:
            first = content[0]
            if isinstance(first, dict) and "text" in first:
                inner = first["text"]
                try:
                    return json.loads(inner)
                except Exception:
                    return inner
    return result


async def call_mcp_tool(
    client: httpx.AsyncClient,
    url: str,
    tool_name: str,
    arguments: Optional[Dict[str, Any]] = None,
) -> Optional[Any]:
    """Call a FastMCP streamable-http tool and return its decoded payload, or None on error."""
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": tool_name, "arguments": arguments or {}},
    }
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    try:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        return _extract_mcp_payload(resp.text)
    except Exception as exc:
        logger.warning("MCP call failed (%s -> %s): %s", url, tool_name, exc)
        return None


def compute_market_regime(
    news_data: Optional[Dict[str, Any]] = None,
    ta_data: Optional[Dict[str, Any]] = None,
    gas_data: Optional[Dict[str, Any]] = None,
    symbol: str = "BTC/USDT",
    ttl_seconds: int = 300,
) -> Dict[str, Any]:
    """
    Combine news sentiment, technical indicators, and on-chain gas into a
    normalized risk & regime signal for trading bots.
    """
    risk_score = 35  # Neutral baseline
    reasons: List[str] = []
    blocked_pairs: List[str] = []

    # 1. News & Black-Swan Risk Analysis
    articles = []
    if isinstance(news_data, dict):
        articles = news_data.get("news") or news_data.get("results") or []
    if isinstance(articles, list) and articles:
        neg_hits = 0
        pos_hits = 0
        for item in articles[:15]:
            title = str(item.get("title", "") if isinstance(item, dict) else item).lower()
            if any(kw in title for kw in BEARISH_RISK_KEYWORDS):
                neg_hits += 1
                currencies = item.get("currencies") if isinstance(item, dict) else None
                if isinstance(currencies, list):
                    for c in currencies:
                        code = c.get("code") if isinstance(c, dict) else str(c)
                        if code:
                            pair = f"{code.upper()}/USDT"
                            if pair not in blocked_pairs:
                                blocked_pairs.append(pair)
            if any(kw in title for kw in BULLISH_KEYWORDS):
                pos_hits += 1

        if neg_hits > 0:
            penalty = min(45, neg_hits * 15)
            risk_score += penalty
            reasons.append(f"Negative/risk news headlines detected ({neg_hits})")
        if pos_hits > neg_hits:
            relief = min(15, (pos_hits - neg_hits) * 5)
            risk_score -= relief
            reasons.append(f"Positive market catalysts detected ({pos_hits})")

    # 2. Technical Analysis (TA MCP)
    if isinstance(ta_data, dict) and "error" not in ta_data:
        indicators = ta_data.get("indicators", ta_data)
        if isinstance(indicators, dict):
            rsi = indicators.get("rsi") or indicators.get("RSI_14")
            if isinstance(rsi, (int, float)):
                if rsi >= 78:
                    risk_score += 15
                    reasons.append(f"{symbol} RSI overbought ({rsi:.1f})")
                elif rsi <= 25:
                    risk_score += 10
                    reasons.append(f"{symbol} RSI extreme oversold ({rsi:.1f})")
                elif 45 <= rsi <= 65:
                    risk_score -= 5

            atr_pct = indicators.get("atr_pct")
            if isinstance(atr_pct, (int, float)) and atr_pct > 5.0:
                risk_score += 20
                reasons.append(f"{symbol} elevated volatility (ATR {atr_pct:.2f}%)")

            trend = str(indicators.get("trend", "")).lower()
            if trend == "bearish":
                risk_score += 12
                reasons.append(f"{symbol} TA trend bearish")
            elif trend == "bullish":
                risk_score -= 10
                reasons.append(f"{symbol} TA trend bullish")

    # 3. On-Chain Gas Congestion
    if isinstance(gas_data, dict) and "error" not in gas_data:
        gwei = gas_data.get("gas_price_gwei") or gas_data.get("gwei")
        if isinstance(gwei, (int, float)) and gwei > 120:
            risk_score += 15
            reasons.append(f"Ethereum gas spike ({gwei:.1f} gwei)")

    risk_score = max(0, min(100, int(round(risk_score))))

    if risk_score >= 80:
        regime = "halt"
        allow_entries = False
        stake_multiplier = 0.0
        spread_multiplier = 2.5
    elif risk_score >= 60:
        regime = "caution"
        allow_entries = True
        stake_multiplier = 0.5
        spread_multiplier = 1.5
    elif risk_score < 30:
        regime = "risk_on"
        allow_entries = True
        stake_multiplier = 1.15
        spread_multiplier = 0.9
    else:
        regime = "neutral"
        allow_entries = True
        stake_multiplier = 1.0
        spread_multiplier = 1.0

    if not reasons:
        reasons.append("Normal market conditions")

    return {
        "schema_version": 2,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "ttl_seconds": ttl_seconds,
        "symbol": symbol,
        "risk_score": risk_score,
        "regime": regime,
        "allow_entries": allow_entries,
        "stake_multiplier": stake_multiplier,
        "spread_multiplier": spread_multiplier,
        "blocked_pairs": blocked_pairs,
        "reasons": reasons,
        "pair_signals": {},
    }


def compute_pair_signal(
    pair: str,
    ta_data: Optional[Dict[str, Any]],
    global_signal: Dict[str, Any],
) -> Dict[str, Any]:
    """Compute a pair-specific risk/regime overlay derived from the global signal + pair TA."""
    base_score = int(global_signal.get("risk_score", 35))
    pair_score = base_score
    reasons: List[str] = []
    norm_pair = pair.split(":")[0].upper()
    blocked = {str(p).upper() for p in global_signal.get("blocked_pairs", [])}

    if norm_pair in blocked or pair.upper() in blocked:
        pair_score = max(pair_score, 90)
        reasons.append("Flagged in negative/risk news")

    indicators = ta_data.get("indicators", ta_data) if isinstance(ta_data, dict) and "error" not in ta_data else {}
    rsi = None
    atr_pct = None
    trend = None
    if isinstance(indicators, dict):
        rsi = indicators.get("rsi") or indicators.get("RSI_14")
        atr_pct = indicators.get("atr_pct")
        trend = str(indicators.get("trend", "")).lower() or None

        if isinstance(rsi, (int, float)):
            if rsi >= 78:
                pair_score += 15
                reasons.append(f"RSI overbought ({rsi:.1f})")
            elif rsi <= 25:
                pair_score += 10
                reasons.append(f"RSI oversold ({rsi:.1f})")
            elif 45 <= rsi <= 65:
                pair_score -= 5
        if isinstance(atr_pct, (int, float)) and atr_pct > 5.0:
            pair_score += 15
            reasons.append(f"High ATR ({atr_pct:.2f}%)")
        if trend == "bearish":
            pair_score += 10
            reasons.append("Bearish TA trend")
        elif trend == "bullish":
            pair_score -= 10
            reasons.append("Bullish TA trend")

    pair_score = max(0, min(100, int(round(pair_score))))
    if pair_score >= 80:
        regime, allow_entry, stake_mult, spread_mult = "halt", False, 0.0, 2.5
    elif pair_score >= 60:
        regime, allow_entry, stake_mult, spread_mult = "caution", True, 0.5, 1.5
    elif pair_score < 30:
        regime, allow_entry, stake_mult, spread_mult = "risk_on", True, 1.15, 0.9
    else:
        regime, allow_entry, stake_mult, spread_mult = "neutral", True, 1.0, 1.0

    return {
        "pair": norm_pair,
        "risk_score": pair_score,
        "regime": regime,
        "allow_entry": allow_entry,
        "stake_multiplier": stake_mult,
        "spread_multiplier": spread_mult,
        "rsi": rsi,
        "atr_pct": atr_pct,
        "trend": trend,
        "reasons": reasons or ["Inherited global regime"],
    }


async def fetch_freqtrade_whitelist(client: httpx.AsyncClient) -> List[str]:
    """Fetch active whitelist pairs from freqtrade_mcp, returning [] on failure."""
    res = await call_mcp_tool(client, MCP_FREQTRADE_URL, "whitelist", {})
    if not isinstance(res, dict):
        return []
    inner = res.get("json", res)
    if isinstance(inner, dict) and isinstance(inner.get("whitelist"), list):
        return [str(p) for p in inner["whitelist"] if p]
    return []


def record_signal_history(signal: Dict[str, Any], db_path: str = DEFAULT_HISTORY_DB) -> Optional[Path]:
    """Append a signal snapshot to SQLite for historical backtesting replay."""
    if not db_path:
        return None
    target = Path(db_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(str(target)) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS signal_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                generated_at TEXT NOT NULL,
                symbol TEXT NOT NULL,
                risk_score INTEGER NOT NULL,
                regime TEXT NOT NULL,
                allow_entries INTEGER NOT NULL,
                stake_multiplier REAL NOT NULL,
                spread_multiplier REAL NOT NULL,
                payload_json TEXT NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_signal_history_ts ON signal_history (generated_at)"
        )
        conn.execute(
            """
            INSERT INTO signal_history (
                generated_at, symbol, risk_score, regime, allow_entries,
                stake_multiplier, spread_multiplier, payload_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                signal["generated_at"],
                signal["symbol"],
                int(signal["risk_score"]),
                str(signal["regime"]),
                1 if signal.get("allow_entries", True) else 0,
                float(signal.get("stake_multiplier", 1.0)),
                float(signal.get("spread_multiplier", 1.0)),
                json.dumps(signal),
            ),
        )
        conn.commit()
    return target


def write_signal_file(signal: Dict[str, Any], output_path: str = DEFAULT_SIGNAL_PATH) -> Path:
    """Atomically write signal JSON so bots never read partial/corrupted files."""
    target = Path(output_path)
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(prefix=".mcp_sig_", suffix=".tmp", dir=str(target.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(signal, fh, indent=2)
            fh.write("\n")
        os.replace(tmp_name, target)
    except Exception:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)
        raise
    return target


async def apply_bot_guardrails(
    client: httpx.AsyncClient,
    signal: Dict[str, Any],
    guard_freqtrade: bool = False,
    guard_octobot: bool = False,
    notify: bool = False,
) -> Dict[str, Any]:
    """Execute automated safety actions on connected bots when regime is 'halt'."""
    actions: List[str] = []
    if signal.get("regime") != "halt":
        return {"triggered": False, "actions": actions}

    if guard_freqtrade:
        res = await call_mcp_tool(client, MCP_FREQTRADE_URL, "stopbuy", {})
        if res is not None:
            actions.append("freqtrade:stopbuy")
        until = (datetime.now(timezone.utc) + timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ")
        for pair in signal.get("blocked_pairs", []):
            lock_res = await call_mcp_tool(
                client,
                MCP_FREQTRADE_URL,
                "create_lock",
                {"pair": pair, "until": until, "reason": "mcp_risk_guard_halt"},
            )
            if lock_res is not None:
                actions.append(f"freqtrade:lock:{pair}")

    if guard_octobot:
        res = await call_mcp_tool(client, MCP_OCTOBOT_URL, "stop_bot", {})
        if res is not None:
            actions.append("octobot:stop_bot")

    if notify:
        msg = (
            f"[Crypto MCP Risk Guard] REGIME=HALT (score={signal['risk_score']}/100). "
            f"Reasons: {', '.join(signal.get('reasons', []))}. "
            f"Actions: {', '.join(actions) or 'signal_only'}"
        )
        await call_mcp_tool(client, MCP_NOTIFIER_URL, "send_telegram", {"message": msg})
        await call_mcp_tool(client, MCP_NOTIFIER_URL, "send_discord", {"message": msg})
        actions.append("notifier:alert_sent")

    return {"triggered": True, "actions": actions}


async def run_once(
    exchange: str = "binance",
    symbol: str = "BTC/USDT",
    timeframe: str = "1h",
    output_path: str = DEFAULT_SIGNAL_PATH,
    guard_freqtrade: bool = False,
    guard_octobot: bool = False,
    notify: bool = False,
    pairs: Optional[List[str]] = None,
    sync_freqtrade_whitelist: bool = False,
    history_db: str = DEFAULT_HISTORY_DB,
) -> Dict[str, Any]:
    """Fetch MCP intelligence once, write the signal file, log history, and optionally guard bots."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        news_task = call_mcp_tool(client, MCP_NEWS_URL, "get_latest_news", {"limit": 15})
        ta_task = call_mcp_tool(
            client,
            MCP_TA_URL,
            "compute_indicators",
            {"exchange": exchange, "symbol": symbol, "timeframe": timeframe, "limit": 200},
        )
        gas_task = call_mcp_tool(client, MCP_ONCHAIN_URL, "gas_price", {})

        tasks: List[Any] = [news_task, ta_task, gas_task]
        if sync_freqtrade_whitelist:
            tasks.append(fetch_freqtrade_whitelist(client))

        results = await asyncio.gather(*tasks)
        news_data, ta_data, gas_data = results[0], results[1], results[2]
        wl_pairs = results[3] if sync_freqtrade_whitelist else []

        signal = compute_market_regime(news_data=news_data, ta_data=ta_data, gas_data=gas_data, symbol=symbol)

        target_pairs: List[str] = []
        for p in (pairs or []) + wl_pairs:
            norm = str(p).strip()
            if norm and norm not in target_pairs:
                target_pairs.append(norm)

        if target_pairs:
            pair_tasks = [
                call_mcp_tool(
                    client,
                    MCP_TA_URL,
                    "compute_indicators",
                    {"exchange": exchange, "symbol": p, "timeframe": timeframe, "limit": 200},
                )
                for p in target_pairs
            ]
            pair_ta_results = await asyncio.gather(*pair_tasks)
            pair_signals: Dict[str, Any] = {}
            for p, p_ta in zip(target_pairs, pair_ta_results):
                ps = compute_pair_signal(p, p_ta, signal)
                pair_signals[ps["pair"]] = ps
            signal["pair_signals"] = pair_signals

        write_signal_file(signal, output_path=output_path)
        record_signal_history(signal, db_path=history_db)
        guard_result = await apply_bot_guardrails(
            client,
            signal,
            guard_freqtrade=guard_freqtrade,
            guard_octobot=guard_octobot,
            notify=notify,
        )
        logger.info(
            "Signal updated: regime=%s risk_score=%d allow_entries=%s stake_mult=%.2f pairs=%d guard=%s",
            signal["regime"],
            signal["risk_score"],
            signal["allow_entries"],
            signal["stake_multiplier"],
            len(signal.get("pair_signals", {})),
            guard_result["actions"],
        )
        return {"signal": signal, "guard": guard_result, "output_path": str(output_path)}


async def watch_loop(
    interval: int,
    exchange: str,
    symbol: str,
    timeframe: str,
    output_path: str,
    guard_freqtrade: bool,
    guard_octobot: bool,
    notify: bool,
    pairs: Optional[List[str]] = None,
    sync_freqtrade_whitelist: bool = False,
    history_db: str = DEFAULT_HISTORY_DB,
) -> None:
    while True:
        await run_once(
            exchange=exchange,
            symbol=symbol,
            timeframe=timeframe,
            output_path=output_path,
            guard_freqtrade=guard_freqtrade,
            guard_octobot=guard_octobot,
            notify=notify,
            pairs=pairs,
            sync_freqtrade_whitelist=sync_freqtrade_whitelist,
            history_db=history_db,
        )
        await asyncio.sleep(max(5, interval))


def main() -> None:
    parser = argparse.ArgumentParser(description="Crypto MCP Server Universal Bot Bridge")
    parser.add_argument("--exchange", default="binance", help="CCXT exchange ID for TA MCP")
    parser.add_argument("--symbol", default="BTC/USDT", help="Benchmark symbol for TA MCP")
    parser.add_argument("--timeframe", default="1h", help="Candle timeframe for TA MCP")
    parser.add_argument("--pairs", default="", help="Comma-separated pairs for per-pair TA signals")
    parser.add_argument("--sync-freqtrade-whitelist", action="store_true", help="Sync pairs from freqtrade_mcp whitelist()")
    parser.add_argument("--output", default=DEFAULT_SIGNAL_PATH, help="Output JSON signal path")
    parser.add_argument("--history-db", default=DEFAULT_HISTORY_DB, help="SQLite history DB path (empty to disable)")
    parser.add_argument("--watch", action="store_true", help="Run continuously on an interval")
    parser.add_argument("--interval", type=int, default=60, help="Polling interval in seconds")
    parser.add_argument("--guard-freqtrade", action="store_true", help="Trigger Freqtrade stopbuy/locks on halt")
    parser.add_argument("--guard-octobot", action="store_true", help="Trigger OctoBot stop_bot on halt")
    parser.add_argument("--notify", action="store_true", help="Send Telegram/Discord alerts on halt")
    args = parser.parse_args()

    pair_list = [p.strip() for p in args.pairs.split(",") if p.strip()]

    if args.watch:
        asyncio.run(
            watch_loop(
                interval=args.interval,
                exchange=args.exchange,
                symbol=args.symbol,
                timeframe=args.timeframe,
                output_path=args.output,
                guard_freqtrade=args.guard_freqtrade,
                guard_octobot=args.guard_octobot,
                notify=args.notify,
                pairs=pair_list,
                sync_freqtrade_whitelist=args.sync_freqtrade_whitelist,
                history_db=args.history_db,
            )
        )
    else:
        asyncio.run(
            run_once(
                exchange=args.exchange,
                symbol=args.symbol,
                timeframe=args.timeframe,
                output_path=args.output,
                guard_freqtrade=args.guard_freqtrade,
                guard_octobot=args.guard_octobot,
                notify=args.notify,
                pairs=pair_list,
                sync_freqtrade_whitelist=args.sync_freqtrade_whitelist,
                history_db=args.history_db,
            )
        )


if __name__ == "__main__":
    main()
