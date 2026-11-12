#!/usr/bin/env python3
"""
freqtrade_mcp.py
MCP server to interact with a running Freqtrade instance via its REST API.
For Crypto MCP Server – Produced by Corax CoLAB - The Future of Edge AI & Blockchain
"""

import os
import logging
import httpx
from typing import Any, Dict, List, Optional
from urllib.parse import quote
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("freqtrade_mcp")

mcp = FastMCP(
    name="freqtrade", stateless_http=True, json_response=True, host="0.0.0.0", port=7011
)

FREQTRADE_REST_URL = os.getenv("FREQTRADE_REST_URL", "http://127.0.0.1:8080")
FREQTRADE_API_KEY = os.getenv("FREQTRADE_API_KEY", None)

# Optimization: Using httpx.AsyncClient for non-blocking I/O and connection pooling across endpoints
# Performance Impact: Improves concurrent request handling and reduces latency under load.
_client = httpx.AsyncClient(timeout=15.0)

async def _req(path: str, method: str = "get", json: Optional[dict] = None) -> Dict[str, Any]:
    url = FREQTRADE_REST_URL.rstrip("/") + "/" + path.lstrip("/")
    headers = {}
    if FREQTRADE_API_KEY:
        headers["Authorization"] = f"Bearer {FREQTRADE_API_KEY}"
    try:
        r = await _client.request(method, url, json=json, headers=headers)
        try:
            return {"status_code": r.status_code, "json": r.json()}
        except Exception:
            return {"status_code": r.status_code, "text": r.text}
    except Exception as e:
        logger.error(f"Freqtrade request error ({url}): {e}")
        return {"status_code": 503, "error": str(e)}


@mcp.tool()
async def ping() -> str:
    return f"freqtrade_mcp alive (rest={FREQTRADE_REST_URL}) — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"


@mcp.tool()
async def status() -> Dict[str, Any]:
    for p in ["api/v1/status", "status", "bot/status", "bot"]:
        res = await _req(p)
        if res.get("status_code") == 200:
            return res
    return {
        "error": "Could not retrieve status",
        "tried": ["api/v1/status", "status", "bot/status", "bot"],
    }


@mcp.tool()
async def start_bot() -> Dict[str, Any]:
    return await _req("api/v1/start", method="post")


@mcp.tool()
async def stop_bot() -> Dict[str, Any]:
    return await _req("api/v1/stop", method="post")


@mcp.tool()
async def reload_config() -> Dict[str, Any]:
    return await _req("api/v1/reload_config", method="post")


@mcp.tool()
async def list_strategies() -> Dict[str, Any]:
    return await _req("api/v1/strategies")


@mcp.tool()
async def trades(limit: int = 20) -> Dict[str, Any]:
    return await _req(f"api/v1/trades?limit={limit}")


# --- Telemetry & Portfolio ---


@mcp.tool()
async def show_config() -> Dict[str, Any]:
    """Return the active Freqtrade bot configuration summary."""
    return await _req("api/v1/show_config")


@mcp.tool()
async def balance() -> Dict[str, Any]:
    """Return account balances managed by Freqtrade."""
    return await _req("api/v1/balance")


@mcp.tool()
async def profit() -> Dict[str, Any]:
    """Return overall closed/open trade profit summary."""
    return await _req("api/v1/profit")


@mcp.tool()
async def performance() -> Dict[str, Any]:
    """Return per-pair trade count and profit performance."""
    return await _req("api/v1/performance")


@mcp.tool()
async def daily(days: int = 7) -> Dict[str, Any]:
    """Return daily profit breakdown for the last N days."""
    return await _req(f"api/v1/daily?timescale={max(1, int(days))}")


@mcp.tool()
async def count() -> Dict[str, Any]:
    """Return current open trade count vs max_open_trades."""
    return await _req("api/v1/count")


@mcp.tool()
async def health() -> Dict[str, Any]:
    """Return Freqtrade bot process health and last heartbeat timestamp."""
    return await _req("api/v1/health")


# --- Lifecycle & Order Control ---


@mcp.tool()
async def stopbuy() -> Dict[str, Any]:
    """Pause new trade entries while continuing to manage existing open trades."""
    return await _req("api/v1/stopbuy", method="post")


@mcp.tool()
async def pause() -> Dict[str, Any]:
    """Pause new entries (alias for Freqtrade stopentry)."""
    return await _req("api/v1/stopentry", method="post")


@mcp.tool()
async def forceenter(
    pair: str,
    side: str = "long",
    price: Optional[float] = None,
    stakeamount: Optional[float] = None,
    ordertype: Optional[str] = None,
    entry_tag: Optional[str] = None,
) -> Dict[str, Any]:
    """Trigger a manual entry on Freqtrade (requires force_entry_enable=true in config)."""
    payload: Dict[str, Any] = {"pair": pair, "side": side}
    if price is not None:
        payload["price"] = price
    if stakeamount is not None:
        payload["stakeamount"] = stakeamount
    if ordertype is not None:
        payload["ordertype"] = ordertype
    if entry_tag is not None:
        payload["entry_tag"] = entry_tag
    return await _req("api/v1/forceenter", method="post", json=payload)


@mcp.tool()
async def forceexit(
    tradeid: str = "all",
    ordertype: Optional[str] = None,
    amount: Optional[float] = None,
) -> Dict[str, Any]:
    """Force-exit a specific trade ID or 'all' open trades."""
    payload: Dict[str, Any] = {"tradeid": str(tradeid)}
    if ordertype is not None:
        payload["ordertype"] = ordertype
    if amount is not None:
        payload["amount"] = amount
    return await _req("api/v1/forceexit", method="post", json=payload)


@mcp.tool()
async def cancel_open_order(tradeid: int) -> Dict[str, Any]:
    """Cancel an open unfilled order for the given trade ID."""
    return await _req(f"api/v1/trades/{int(tradeid)}/open-order", method="delete")


# --- Pairlist & Lock Management ---


@mcp.tool()
async def whitelist() -> Dict[str, Any]:
    """Return the active pair whitelist."""
    return await _req("api/v1/whitelist")


@mcp.tool()
async def blacklist(add: Optional[List[str]] = None) -> Dict[str, Any]:
    """Get the current blacklist, or add pairs to the blacklist if `add` is provided."""
    if add:
        return await _req("api/v1/blacklist", method="post", json={"blacklist": add})
    return await _req("api/v1/blacklist")


@mcp.tool()
async def delete_blacklist(pairs: List[str]) -> Dict[str, Any]:
    """Remove specified pairs from the Freqtrade blacklist."""
    query = "&".join(f"pairs_to_delete={quote(p)}" for p in pairs)
    path = f"api/v1/blacklist?{query}" if query else "api/v1/blacklist"
    return await _req(path, method="delete")


@mcp.tool()
async def locks() -> Dict[str, Any]:
    """Return all active pair locks."""
    return await _req("api/v1/locks")


@mcp.tool()
async def create_lock(
    pair: str,
    until: str,
    side: str = "*",
    reason: str = "mcp_risk_guard",
) -> Dict[str, Any]:
    """Lock a pair until an ISO-8601 UTC timestamp (e.g. '2026-11-12T18:00:00Z')."""
    payload = {"pair": pair, "until": until, "side": side, "reason": reason}
    return await _req("api/v1/locks", method="post", json=payload)


@mcp.tool()
async def delete_lock(lockid: int) -> Dict[str, Any]:
    """Delete an active pair lock by ID."""
    return await _req(f"api/v1/locks/{int(lockid)}", method="delete")


# --- Strategy & Analytics ---


@mcp.tool()
async def strategy(strategy_name: str) -> Dict[str, Any]:
    """Fetch details/code metadata for a specific Freqtrade strategy."""
    return await _req(f"api/v1/strategy/{quote(strategy_name)}")


@mcp.tool()
async def backtest_history() -> Dict[str, Any]:
    """Fetch stored Freqtrade backtest history results (if API server has backtest enabled)."""
    return await _req("api/v1/backtest/history")


@mcp.tool()
async def analyze_trade_performance() -> Dict[str, Any]:
    """Aggregate profit, pair performance, and recent trades into an actionable summary."""
    profit_res = await profit()
    perf_res = await performance()
    trades_res = await trades(limit=50)

    profit_data = profit_res.get("json") if profit_res.get("status_code") == 200 else {}
    perf_data = perf_res.get("json") if perf_res.get("status_code") == 200 else []
    trades_data = trades_res.get("json") if trades_res.get("status_code") == 200 else {}

    trade_list = trades_data.get("trades", []) if isinstance(trades_data, dict) else []
    closed = [t for t in trade_list if not t.get("is_open", False)]
    wins = [t for t in closed if float(t.get("profit_abs", 0) or 0) > 0]
    losses = [t for t in closed if float(t.get("profit_abs", 0) or 0) <= 0]

    sorted_pairs = (
        sorted(perf_data, key=lambda x: float(x.get("profit_abs", 0) or 0), reverse=True)
        if isinstance(perf_data, list)
        else []
    )

    return {
        "ok": True,
        "profit_summary": profit_data,
        "recent_closed_count": len(closed),
        "recent_win_rate": round(len(wins) / len(closed), 4) if closed else None,
        "recent_wins": len(wins),
        "recent_losses": len(losses),
        "top_pairs": sorted_pairs[:3],
        "worst_pairs": list(reversed(sorted_pairs[-3:])) if sorted_pairs else [],
    }


if __name__ == "__main__":
    print(
        "Starting freqtrade_mcp on http://127.0.0.1:7011/mcp — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"
    )
    # transport, bind (address:port), mount_path
    mcp.run("streamable-http")
