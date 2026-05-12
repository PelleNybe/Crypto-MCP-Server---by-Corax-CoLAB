#!/usr/bin/env python3
"""
portfolio_mcp.py
Aggregates balances (CEX via CCXT + on-chain) and prices (CoinGecko primary, CCXT fallback).
For Crypto MCP Server – Produced by Corax CoLAB - The Future of Edge AI & Blockchain
"""

import os
import logging
from typing import Dict, Any, List
import ccxt.async_support as ccxt_async
from pycoingecko import CoinGeckoAPI
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv
import time
import asyncio

load_dotenv(dotenv_path=".env")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("portfolio_mcp")

mcp = FastMCP(
    name="portfolio", stateless_http=True, json_response=True, host="0.0.0.0", port=7004
)
cg = CoinGeckoAPI()

_CACHE = {"prices": {}, "timestamp": 0, "mapping": None, "mapping_timestamp": 0}
CACHE_TTL = int(os.getenv("PORTFOLIO_CACHE_TTL", "30"))
MAPPING_TTL = int(os.getenv("PORTFOLIO_MAPPING_TTL", "3600"))


def _get_prices_coingecko(symbols: List[str]) -> Dict[str, float]:
    now = time.time()
    if now - _CACHE["timestamp"] > CACHE_TTL:
        _CACHE["prices"] = {}
        _CACHE["timestamp"] = now

    if _CACHE["mapping"] is None or (now - _CACHE["mapping_timestamp"] > MAPPING_TTL):
        try:
            coins = cg.get_coins_list()
            _CACHE["mapping"] = {c["symbol"].upper(): c["id"] for c in coins}
            _CACHE["mapping_timestamp"] = now
        except Exception as e:
            logger.debug("CoinGecko mapping lookup failed: %s", e)
            if _CACHE["mapping"] is None:
                return {}

    missing_keys = []
    missing_ids = []

    upper_symbols = [s.upper() for s in symbols]
    for key in upper_symbols:
        if key not in _CACHE["prices"]:
            coin_id = _CACHE.get("mapping", {}).get(key)
            if coin_id:
                missing_keys.append(key)
                missing_ids.append(coin_id)

    if missing_ids:
        try:
            ids_str = ",".join(missing_ids)
            rp = cg.get_price(ids=ids_str, vs_currencies="usd")
            for key, coin_id in zip(missing_keys, missing_ids):
                price = rp.get(coin_id, {}).get("usd")
                if price:
                    _CACHE["prices"][key] = price
        except Exception as e:
            logger.debug("CoinGecko batch price lookup failed: %s", e)

    prices = _CACHE["prices"]
    return {k: prices[k] for k in upper_symbols if k in prices}


async def _get_price_ccxt(exchange, symbol):
    pair = f"{symbol}/USDT"
    try:
        t = await exchange.fetch_ticker(pair)
        return t.get("last")
    except Exception:
        return None


async def fetch_exchange_balance(exch_low: str):
    if exch_low not in ccxt_async.exchanges:
        return []

    cls = getattr(ccxt_async, exch_low)
    opts = {"enableRateLimit": True}
    api_key = os.getenv(f"{exch_low.upper()}_API_KEY")
    api_secret = os.getenv(f"{exch_low.upper()}_API_SECRET")
    if api_key and api_secret:
        opts.update({"apiKey": api_key, "secret": api_secret})

    ex = cls(opts)
    details = []

    try:
        bal = await ex.fetch_balance()

        # Collect non-zero balances
        balances = {
            coin: amount
            for coin, amount in bal.get("total", {}).items()
            if amount and amount > 0
        }
        coins = list(balances.keys())

        # Batch fetch prices from Coingecko
        cg_prices = (
            await asyncio.to_thread(_get_prices_coingecko, coins) if coins else {}
        )

        # For missing prices, prepare CCXT fallback tasks
        async def _get_asset_price_ccxt_fallback(coin, amount):
            price = cg_prices.get(coin.upper())
            if price is None:
                price = await _get_price_ccxt(ex, coin)

            return {
                "exchange": exch_low,
                "asset": coin,
                "amount": amount,
                "price_usd": price,
                "value_usd": amount * (price or 0.0),
            }

        tasks = []
        for coin, amount in balances.items():
            tasks.append(_get_asset_price_ccxt_fallback(coin, amount))

        if tasks:
            details = await asyncio.gather(*tasks)

    except Exception as e:
        logger.warning("fetch_balance failed for %s: %s", exch_low, e)
    finally:
        await ex.close()

    return details


@mcp.tool()
async def portfolio_value(exchanges: List[str]) -> Dict[str, Any]:
    tasks = []
    for exch in exchanges:
        exch_low = exch.lower()
        tasks.append(fetch_exchange_balance(exch_low))

    results = await asyncio.gather(*tasks)

    total_usd = 0.0
    details = []

    for exch_details in results:
        for detail in exch_details:
            total_usd += detail["value_usd"]
            details.append(detail)

    return {
        "total_usd": total_usd,
        "details": details,
        "cache_ttl": CACHE_TTL,
        "cached_at": _CACHE["timestamp"],
    }


if __name__ == "__main__":
    print(
        "Starting portfolio_mcp on http://127.0.0.1:7004/mcp — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"
    )
    mcp.run("streamable-http")
