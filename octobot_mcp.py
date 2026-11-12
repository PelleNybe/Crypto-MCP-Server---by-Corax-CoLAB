#!/usr/bin/env python3
"""
octobot_mcp.py
MCP server to interact with a running OctoBot instance via its API.
For Crypto MCP Server – Produced by Corax CoLAB - The Future of Edge AI & Blockchain
"""

import os
import logging
import httpx
from typing import Any, Dict, Optional
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("octobot_mcp")

mcp = FastMCP(
    name="octobot", stateless_http=True, json_response=True, host="0.0.0.0", port=7012
)

OCTOBOT_REST_URL = os.getenv("OCTOBOT_REST_URL", "http://127.0.0.1:5001")
OCTOBOT_API_KEY = os.getenv("OCTOBOT_API_KEY", None)

# Optimization: Using httpx.AsyncClient for non-blocking I/O and connection pooling across endpoints
# Performance Impact: Improves concurrent request handling and reduces latency under load.
_client = httpx.AsyncClient(timeout=15.0)

async def _req(path: str, method: str = "get", json: Optional[dict] = None) -> Dict[str, Any]:
    url = OCTOBOT_REST_URL.rstrip("/") + "/" + path.lstrip("/")
    headers = {}
    if OCTOBOT_API_KEY:
        headers["Authorization"] = f"Bearer {OCTOBOT_API_KEY}"
    try:
        r = await _client.request(method, url, json=json, headers=headers)
        return {"status_code": r.status_code, "json": r.json()}
    except Exception as e:
        # Fallback if request fails entirely, or if r.json() fails and r isn't defined yet
        if "r" in locals() and hasattr(r, "status_code"):
            return {"status_code": r.status_code, "text": getattr(r, "text", str(e))}
        return {"status_code": 500, "text": str(e)}


@mcp.tool()
async def ping() -> str:
    return f"octobot_mcp alive (rest={OCTOBOT_REST_URL}) — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"


@mcp.tool()
async def status() -> Dict[str, Any]:
    return await _req("api/bot/status")


@mcp.tool()
async def portfolio() -> Dict[str, Any]:
    return await _req("api/portfolio/get_portfolio")


@mcp.tool()
async def start_bot() -> Dict[str, Any]:
    return await _req("api/bot/start", method="post")


@mcp.tool()
async def stop_bot() -> Dict[str, Any]:
    return await _req("api/bot/stop", method="post")


@mcp.tool()
async def history() -> Dict[str, Any]:
    return await _req("api/trading/history")


@mcp.tool()
async def open_orders() -> Dict[str, Any]:
    """Return currently open orders in OctoBot."""
    return await _req("api/trading/orders")


@mcp.tool()
async def trades() -> Dict[str, Any]:
    """Return executed trades in OctoBot."""
    return await _req("api/trading/trades")


@mcp.tool()
async def profits() -> Dict[str, Any]:
    """Return OctoBot profitability summary."""
    return await _req("api/trading/profits")


@mcp.tool()
async def tentacles() -> Dict[str, Any]:
    """List installed OctoBot tentacles (evaluators, strategies, trading modes)."""
    return await _req("api/tentacles")


@mcp.tool()
async def reload_tentacles() -> Dict[str, Any]:
    """Reload OctoBot tentacles configuration."""
    return await _req("api/tentacles/reload", method="post")


@mcp.tool()
async def restart_bot() -> Dict[str, Any]:
    """Restart the running OctoBot instance."""
    return await _req("api/bot/restart", method="post")


@mcp.tool()
async def cancel_order(order_id: str) -> Dict[str, Any]:
    """Cancel an open order in OctoBot by order ID."""
    return await _req("api/trading/cancel_order", method="post", json={"order_id": order_id})


if __name__ == "__main__":
    print(
        "Starting octobot_mcp on http://127.0.0.1:7012/mcp — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"
    )
    mcp.run("streamable-http")
