#!/usr/bin/env python3
"""
hummingbot_mcp.py
MCP server to interact with a running Hummingbot Gateway API.
For Crypto MCP Server – Produced by Corax CoLAB - The Future of Edge AI & Blockchain
"""

import os
import logging
import requests
from typing import Any, Dict, Optional
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hummingbot_mcp")

mcp = FastMCP(
    name="hummingbot",
    stateless_http=True,
    json_response=True,
    host="0.0.0.0",
    port=7013,
)

HUMMINGBOT_REST_URL = os.getenv("HUMMINGBOT_REST_URL", "https://127.0.0.1:15888")
HUMMINGBOT_API_URL = os.getenv("HUMMINGBOT_API_URL", "http://127.0.0.1:8000")
HUMMINGBOT_API_KEY = os.getenv("HUMMINGBOT_API_KEY", None)


def _parse_verify_ssl():
    verify_str = os.getenv("HUMMINGBOT_VERIFY_SSL", "True")
    if verify_str.lower() in ("false", "0", "no"):
        return False
    if verify_str.lower() in ("true", "1", "yes"):
        return True
    return verify_str


HUMMINGBOT_VERIFY_SSL = _parse_verify_ssl()


def _req(path: str, method: str = "get", json: Optional[dict] = None) -> Dict[str, Any]:
    url = HUMMINGBOT_REST_URL.rstrip("/") + "/" + path.lstrip("/")
    headers = {"Content-Type": "application/json"}

    try:
        # Hummingbot uses self-signed certs by default on gateway
        r = requests.request(
            method,
            url,
            json=json,
            headers=headers,
            timeout=15,
            verify=HUMMINGBOT_VERIFY_SSL,
        )
        try:
            return {"status_code": r.status_code, "json": r.json()}
        except Exception:
            return {"status_code": r.status_code, "text": r.text}
    except Exception as e:
        logger.error(f"Hummingbot request error ({url}): {e}")
        return {"status_code": 503, "error": str(e)}


def _api_req(path: str, method: str = "get", json: Optional[dict] = None) -> Dict[str, Any]:
    """Send a request to the Hummingbot Backend API (CEX bot orchestration)."""
    url = HUMMINGBOT_API_URL.rstrip("/") + "/" + path.lstrip("/")
    headers = {"Content-Type": "application/json"}
    if HUMMINGBOT_API_KEY:
        headers["Authorization"] = f"Bearer {HUMMINGBOT_API_KEY}"

    try:
        r = requests.request(method, url, json=json, headers=headers, timeout=15)
        try:
            return {"status_code": r.status_code, "json": r.json()}
        except Exception:
            return {"status_code": r.status_code, "text": r.text}
    except Exception as e:
        logger.error(f"Hummingbot Backend API error ({url}): {e}")
        return {"status_code": 503, "error": str(e)}


@mcp.tool()
def ping() -> str:
    # Gateway root ping
    res = _req("")
    return f"hummingbot_mcp alive (rest={HUMMINGBOT_REST_URL}), status={res.get('status_code')} — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"


@mcp.tool()
def get_balances(
    network: str = "ethereum", chain: str = "mainnet", address: str = ""
) -> Dict[str, Any]:
    return _req(
        "network/balances",
        method="post",
        json={"network": network, "chain": chain, "address": address},
    )


@mcp.tool()
def get_tokens(network: str = "ethereum", chain: str = "mainnet") -> Dict[str, Any]:
    return _req(
        "network/tokens", method="post", json={"network": network, "chain": chain}
    )


@mcp.tool()
def clob_markets(chain: str, network: str, connector: str) -> Dict[str, Any]:
    return _req(
        "clob/markets",
        method="post",
        json={"chain": chain, "network": network, "connector": connector},
    )


@mcp.tool()
def amm_price(
    chain: str,
    network: str,
    connector: str,
    base: str,
    quote: str,
    amount: str,
    side: str = "BUY",
) -> Dict[str, Any]:
    return _req(
        "amm/price",
        method="post",
        json={
            "chain": chain,
            "network": network,
            "connector": connector,
            "base": base,
            "quote": quote,
            "amount": amount,
            "side": side,
        },
    )


@mcp.tool()
def connectors() -> Dict[str, Any]:
    """List available Hummingbot Gateway connectors and supported networks."""
    return _req("connectors")


@mcp.tool()
def clob_orderbook(
    chain: str, network: str, connector: str, market: str
) -> Dict[str, Any]:
    """Fetch CLOB orderbook snapshot for a market on Hummingbot Gateway."""
    return _req(
        "clob/orderBook",
        method="post",
        json={
            "chain": chain,
            "network": network,
            "connector": connector,
            "market": market,
        },
    )


@mcp.tool()
def clob_orders(
    chain: str, network: str, connector: str, address: str, market: str = ""
) -> Dict[str, Any]:
    """Fetch open CLOB orders for an address on Hummingbot Gateway."""
    payload: Dict[str, Any] = {
        "chain": chain,
        "network": network,
        "connector": connector,
        "address": address,
    }
    if market:
        payload["market"] = market
    return _req("clob/orders", method="post", json=payload)


@mcp.tool()
def amm_quote(
    chain: str,
    network: str,
    connector: str,
    base: str,
    quote: str,
    amount: str,
    side: str = "BUY",
) -> Dict[str, Any]:
    """Fetch an AMM swap price/gas quote without executing a trade."""
    return _req(
        "amm/price",
        method="post",
        json={
            "chain": chain,
            "network": network,
            "connector": connector,
            "base": base,
            "quote": quote,
            "amount": amount,
            "side": side,
        },
    )


# --- Hummingbot Backend API (CEX Bot Orchestration) ---


@mcp.tool()
def bot_status() -> Dict[str, Any]:
    """Fetch running Hummingbot bot instances from Hummingbot Backend API."""
    return _api_req("bot-orchestration/status")


@mcp.tool()
def start_bot(
    bot_name: str,
    script: Optional[str] = None,
    conf: Optional[str] = None,
) -> Dict[str, Any]:
    """Start a Hummingbot bot/script via Hummingbot Backend API."""
    payload: Dict[str, Any] = {"bot_name": bot_name}
    if script:
        payload["script"] = script
    if conf:
        payload["conf"] = conf
    return _api_req("bot-orchestration/start-bot", method="post", json=payload)


@mcp.tool()
def stop_bot(bot_name: str, skip_order_cancellation: bool = False) -> Dict[str, Any]:
    """Stop a running Hummingbot bot via Hummingbot Backend API."""
    return _api_req(
        "bot-orchestration/stop-bot",
        method="post",
        json={
            "bot_name": bot_name,
            "skip_order_cancellation": skip_order_cancellation,
        },
    )


@mcp.tool()
def list_controllers() -> Dict[str, Any]:
    """List available Hummingbot v2 controllers."""
    return _api_req("controllers")


@mcp.tool()
def bot_performance(bot_name: str) -> Dict[str, Any]:
    """Fetch performance metrics for a specific Hummingbot bot."""
    return _api_req(f"bot-orchestration/bot-performance/{bot_name}")


if __name__ == "__main__":
    print(
        "Starting hummingbot_mcp on http://127.0.0.1:7013/mcp — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"
    )
    # Disable warnings for self-signed certificates if verification is disabled
    if HUMMINGBOT_VERIFY_SSL is False:
        import urllib3

        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    mcp.run("streamable-http")
