#!/usr/bin/env python3
"""
octobot_mcp.py
MCP server to interact with a running OctoBot instance via its API.
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
logger = logging.getLogger("octobot_mcp")

mcp = FastMCP(
    name="octobot", stateless_http=True, json_response=True, host="0.0.0.0", port=7012
)

OCTOBOT_REST_URL = os.getenv("OCTOBOT_REST_URL", "http://127.0.0.1:5001")
OCTOBOT_API_KEY = os.getenv("OCTOBOT_API_KEY", None)


def _req(path: str, method: str = "get", json: Optional[dict] = None) -> Dict[str, Any]:
    url = OCTOBOT_REST_URL.rstrip("/") + "/" + path.lstrip("/")
    headers = {}
    if OCTOBOT_API_KEY:
        headers["Authorization"] = f"Bearer {OCTOBOT_API_KEY}"
    try:
        r = requests.request(method, url, json=json, headers=headers, timeout=15)
        return {"status_code": r.status_code, "json": r.json()}
    except Exception as e:
        # Fallback if request fails entirely, or if r.json() fails and r isn't defined yet
        if "r" in locals() and hasattr(r, "status_code"):
            return {"status_code": r.status_code, "text": getattr(r, "text", str(e))}
        return {"status_code": 500, "text": str(e)}


@mcp.tool()
def ping() -> str:
    return f"octobot_mcp alive (rest={OCTOBOT_REST_URL}) — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"


@mcp.tool()
def status() -> Dict[str, Any]:
    return _req("api/bot/status")


@mcp.tool()
def portfolio() -> Dict[str, Any]:
    return _req("api/portfolio/get_portfolio")


@mcp.tool()
def start_bot() -> Dict[str, Any]:
    return _req("api/bot/start", method="post")


@mcp.tool()
def stop_bot() -> Dict[str, Any]:
    return _req("api/bot/stop", method="post")


@mcp.tool()
def history() -> Dict[str, Any]:
    return _req("api/trading/history")


if __name__ == "__main__":
    print(
        "Starting octobot_mcp on http://127.0.0.1:7012/mcp — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"
    )
    mcp.run("streamable-http")
