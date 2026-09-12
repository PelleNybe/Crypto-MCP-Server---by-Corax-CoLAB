#!/usr/bin/env python3
"""
freqtrade_mcp.py
MCP server to interact with a running Freqtrade instance via its REST API.
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
    r = await _client.request(method, url, json=json, headers=headers)
    try:
        return {"status_code": r.status_code, "json": r.json()}
    except Exception:
        return {"status_code": r.status_code, "text": r.text}


@mcp.tool()
async def ping() -> str:
    return f"freqtrade_mcp alive (rest={FREQTRADE_REST_URL}) — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"


@mcp.tool()
async def status() -> Dict[str, Any]:
    for p in ["status", "bot/status", "bot"]:
        res = await _req(p)
        if res.get("status_code") == 200:
            return res
    return {
        "error": "Could not retrieve status",
        "tried": ["status", "bot/status", "bot"],
    }


@mcp.tool()
async def start_bot() -> Dict[str, Any]:
    return await _req("start", method="post")


@mcp.tool()
async def stop_bot() -> Dict[str, Any]:
    return await _req("stop", method="post")


@mcp.tool()
async def reload_config() -> Dict[str, Any]:
    return await _req("reload_config", method="post")


@mcp.tool()
async def list_strategies() -> Dict[str, Any]:
    return await _req("strategies")


@mcp.tool()
async def trades(limit: int = 20) -> Dict[str, Any]:
    return await _req(f"trades?limit={limit}")


if __name__ == "__main__":
    print(
        "Starting freqtrade_mcp on http://127.0.0.1:7011/mcp — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"
    )
    # transport, bind (address:port), mount_path
    mcp.run("streamable-http")
