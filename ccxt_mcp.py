#!/usr/bin/env python3
"""
ccxt_mcp.py
CCXT MCP server for Crypto MCP Server – Produced by Corax CoLAB - The Future of Edge AI & Blockchain
Exposes: get_ticker, fetch_ohlcv, fetch_balance, create_order, cancel_order, fetch_open_orders
Run via systemd or: python3 ccxt_mcp.py
"""

import os
import logging
import time
import hmac
from functools import wraps
from typing import Optional, List, Any
import ccxt
import requests
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ccxt_mcp")

mcp = FastMCP(
    name="ccxt", stateless_http=True, json_response=True, host="0.0.0.0", port=7001
)

# Guardrails
MAX_TRADE_USD = float(os.getenv("MAX_TRADE_USD", 100.0))
ALLOWED_PAIRS_STR = os.getenv("ALLOWED_PAIRS", "")
ALLOWED_PAIRS = (
    [p.strip() for p in ALLOWED_PAIRS_STR.split(",")] if ALLOWED_PAIRS_STR else []
)
# Example ALLOWED_PAIRS_STR="BTC/USDT,ETH/USDT"
# If ALLOWED_PAIRS is empty, we block all trades by default for security
if not ALLOWED_PAIRS:
    logger.error("No ALLOWED_PAIRS configured. AI trading is DISABLED for all pairs!")

# Endpoint to dashboard for HITL (Human In The Loop) approval
DASHBOARD_API_URL = os.getenv("DASHBOARD_API_URL", "http://backend:4000")


def ttl_cache(seconds: int):
    """Simple TTL cache decorator."""

    def decorator(func):
        cache = {}

        @wraps(func)
        def wrapper(*args, **kwargs):
            key = (args, tuple(sorted(kwargs.items())))
            now = time.time()
            if key in cache:
                result, expiry = cache[key]
                if now < expiry:
                    return result
            result = func(*args, **kwargs)
            cache[key] = (result, now + seconds)
            return result

        return wrapper

    return decorator


def _make_exchange(exchange_id: str) -> ccxt.Exchange:
    exchange_id = exchange_id.lower()
    if exchange_id not in ccxt.exchanges:
        raise ValueError(f"Unsupported exchange: {exchange_id}")
    cls = getattr(ccxt, exchange_id)
    api_key = os.getenv(f"{exchange_id.upper()}_API_KEY")
    api_secret = os.getenv(f"{exchange_id.upper()}_API_SECRET")
    opts = {"enableRateLimit": True}
    if api_key and api_secret:
        opts.update({"apiKey": api_key, "secret": api_secret})
    return cls(opts)


@mcp.tool()
def ping() -> str:
    return "ccxt_mcp alive — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"


@mcp.tool()
@ttl_cache(seconds=30)
def get_ticker(exchange: str, symbol: str) -> dict:
    ex = _make_exchange(exchange)
    ticker = ex.fetch_ticker(symbol)
    return ticker


@mcp.tool()
def fetch_ohlcv(
    exchange: str, symbol: str, timeframe: str = "1h", limit: int = 200
) -> List[List[Any]]:
    ex = _make_exchange(exchange)
    ohlcv = ex.fetch_ohlcv(symbol, timeframe=timeframe, limit=limit)
    return ohlcv


@mcp.tool()
def fetch_balance(exchange: str) -> dict:
    ex = _make_exchange(exchange)
    balance = ex.fetch_balance()
    return balance


@mcp.tool()
def create_order(
    exchange: str,
    symbol: str,
    side: str,
    type: str,
    amount: float,
    price: Optional[float] = None,
    params: Optional[dict] = None,
) -> dict:
    """
    Creates an order.
    IMPORTANT: This does NOT execute immediately. It sends a pending request to the dashboard for human approval.
    """
    if symbol not in ALLOWED_PAIRS:
        return {
            "error": f"Symbol {symbol} is not in ALLOWED_PAIRS list: {ALLOWED_PAIRS}"
        }

    try:
        ex = _make_exchange(exchange)
        ticker = ex.fetch_ticker(symbol)
        current_price = ticker.get("last", 0)

        # Guardrail: Check MAX_TRADE_USD
        estimated_usd = amount * (price if price else current_price)
        if estimated_usd > MAX_TRADE_USD:
            return {
                "error": f"Estimated trade size ${estimated_usd:.2f} exceeds MAX_TRADE_USD ${MAX_TRADE_USD:.2f}"
            }

        # Instead of executing, send to Dashboard API as "pending"
        payload = {
            "exchange": exchange,
            "symbol": symbol,
            "side": side,
            "type": type,
            "amount": amount,
            "price": price,
            "params": params or {},
            "estimated_usd": estimated_usd,
        }

        # Call backend to register pending order
        headers = {"Authorization": f"Bearer {os.getenv('DASHBOARD_PASSWORD', '')}"}
        res = requests.post(
            f"{DASHBOARD_API_URL}/api/order/pending",
            json=payload,
            headers=headers,
            timeout=5,
        )
        if res.status_code == 200:
            return {
                "status": "pending_approval",
                "message": f"Order for {amount} {symbol} requires human approval in the dashboard.",
                "details": payload,
            }
        else:
            return {"error": f"Failed to register pending order: {res.text}"}

    except Exception as e:
        logger.error(f"Error in create_order: {e}")
        return {"error": str(e)}


@mcp.tool()
def execute_approved_order(
    exchange: str,
    symbol: str,
    side: str,
    type: str,
    amount: float,
    price: Optional[float] = None,
    params: Optional[dict] = None,
) -> dict:
    """Internal tool called by the backend to actually execute the order after human approval."""
    params = params or {}
    db_pass = os.getenv("DASHBOARD_PASSWORD")
    token = params.pop("approval_token", "") if params else ""
    if db_pass and not hmac.compare_digest(
        str(token or "").encode("utf-8"), str(db_pass).encode("utf-8")
    ):
        return {
            "error": "Unauthorized: Dashboard approval required. Use create_order instead."
        }
    ex = _make_exchange(exchange)
    if type == "market":
        order = ex.create_order(symbol, type, side, amount, None, params)
    else:
        order = ex.create_order(symbol, type, side, amount, price, params)
    return order


@mcp.tool()
def cancel_order(exchange: str, order_id: str, symbol: Optional[str] = None) -> dict:
    ex = _make_exchange(exchange)
    res = ex.cancel_order(order_id, symbol) if symbol else ex.cancel_order(order_id)
    return res


@mcp.tool()
def fetch_open_orders(exchange: str, symbol: Optional[str] = None) -> list:
    ex = _make_exchange(exchange)
    if symbol:
        return ex.fetch_open_orders(symbol)
    return ex.fetch_open_orders()


@mcp.tool()
def log_reasoning(trade_id: str, explanation: str) -> dict:
    """
    Logs the AI's reasoning for a specific pending trade or general market observation.
    Must be called BEFORE executing a trade or immediately after a dry_run.
    """
    try:
        payload = {"trade_id": trade_id, "explanation": explanation}
        headers = {"Authorization": f"Bearer {os.getenv('DASHBOARD_PASSWORD', '')}"}
        res = requests.post(
            f"{DASHBOARD_API_URL}/api/order/reasoning",
            json=payload,
            headers=headers,
            timeout=5,
        )
        if res.status_code == 200:
            return {"status": "success", "message": "Reasoning logged successfully."}
        else:
            return {"error": f"Failed to log reasoning: {res.text}"}
    except Exception as e:
        logger.error(f"Error in log_reasoning: {e}")
        return {"error": str(e)}


if __name__ == "__main__":
    print(
        "Starting ccxt_mcp on http://0.0.0.0:7001/mcp — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"
    )
    mcp.run("streamable-http")


@mcp.tool()
def fetch_order_book(exchange: str, symbol: str, limit: int = 20) -> dict:
    """
    Fetch the order book (L2) for a given symbol.
    """
    try:
        ex = _make_exchange(exchange)
        return ex.fetch_order_book(symbol, limit)
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def fetch_trades(exchange: str, symbol: str, limit: int = 50) -> list:
    """
    Fetch the list of recent trades for a given symbol.
    """
    try:
        ex = _make_exchange(exchange)
        return ex.fetch_trades(symbol, limit=limit)
    except Exception as e:
        return [{"error": str(e)}]
