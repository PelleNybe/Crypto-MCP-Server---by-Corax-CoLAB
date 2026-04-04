#!/usr/bin/env python3
"""
coingecko_mcp.py
CoinGecko MCP server for Crypto MCP Server – Produced by Corax CoLAB - The Future of Edge AI & Blockchain
Exposes: price, coin_info, market_chart, trending
"""
import logging
from typing import Any, Dict
from pycoingecko import CoinGeckoAPI
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv
import requests_cache

load_dotenv(dotenv_path=".env")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("coingecko_mcp")

requests_cache.install_cache("cg_cache", expire_after=60)

mcp = FastMCP(name="coingecko", stateless_http=True, json_response=True, host="0.0.0.0", port=7010)
cg = CoinGeckoAPI()

@mcp.tool()
def ping() -> str:
    return "coingecko_mcp alive — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"

@mcp.tool()
def price(coin_id: str, vs_currency: str = "usd") -> Dict[str, Any]:
    res = cg.get_price(ids=coin_id, vs_currencies=vs_currency)
    return {"query": {"coin_id": coin_id, "vs_currency": vs_currency}, "result": res}

@mcp.tool()
def coin_info(coin_id: str) -> Dict[str, Any]:
    res = cg.get_coin_by_id(coin_id)
    return res

@mcp.tool()
def market_chart(coin_id: str, vs_currency: str = "usd", days: int = 7) -> Dict[str, Any]:
    res = cg.get_coin_market_chart_by_id(id=coin_id, vs_currency=vs_currency, days=days)
    return res

@mcp.tool()
def trending() -> Dict[str, Any]:
    res = cg.get_search_trending()
    return res

if __name__ == "__main__":
    print("Starting coingecko_mcp on http://127.0.0.1:7010/mcp — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)")
    # transport + bind (address:port/path)
    mcp.run("streamable-http")

@mcp.tool()
def get_coins_markets(vs_currency: str = "usd", limit: int = 50) -> list:
    """
    Fetch the list of coin markets sorted by market cap.
    """
    try:
        res = cg.get_coins_markets(vs_currency=vs_currency, per_page=limit)
        return res
    except Exception as e:
        return [{"error": str(e)}]
