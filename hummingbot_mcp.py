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


if __name__ == "__main__":
    print(
        "Starting hummingbot_mcp on http://127.0.0.1:7013/mcp — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"
    )
    # Disable warnings for self-signed certificates if verification is disabled
    if HUMMINGBOT_VERIFY_SSL is False:
        import urllib3

        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    mcp.run("streamable-http")
