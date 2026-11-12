#!/usr/bin/env python3
"""
news_mcp.py
News MCP server for Crypto MCP Server – Produced by Corax CoLAB
Exposes: get_latest_news, search_news
"""

import os
import logging
import httpx
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("news_mcp")

mcp = FastMCP(
    name="news", stateless_http=True, json_response=True, host="0.0.0.0", port=7017
)

CRYPTOPANIC_API_KEY = os.getenv("CRYPTOPANIC_API_KEY", "public")

# Optimization: Maintain a module-level httpx.AsyncClient to reuse connection pools
# across multiple concurrent MCP tool calls. This significantly reduces latency
# compared to instantiating a new client per request.
_client = httpx.AsyncClient(timeout=10.0)


@mcp.tool()
def ping() -> str:
    return "news_mcp alive — Crypto MCP Server (Corax CoLAB)"


@mcp.tool()
async def get_latest_news(limit: int = 10) -> dict:
    """
    Fetches the latest crypto news from CryptoPanic API.
    Provides real data for the News Singularity feature.
    """
    try:
        url = "https://cryptopanic.com/api/v1/posts/"
        params = {"auth_token": CRYPTOPANIC_API_KEY, "public": "true"}

        response = await _client.get(url, params=params)

        if response.status_code == 200:
            data = response.json()
            results = data.get("results", [])[:limit]

            # Format the output for the frontend
            formatted_news = [
                {
                    "id": item.get("id", str(i)),
                    "title": item.get("title", ""),
                    "domain": item.get("domain", ""),
                    "url": item.get("url", ""),
                    "published_at": item.get("published_at", ""),
                    "sentiment": (
                        "bullish"
                        if (
                            bullish := (v := item.get("votes", {})).get("positive", 0)
                            + v.get("important", 0)
                            + v.get("liked", 0)
                        )
                        > (
                            (
                                bearish := v.get("negative", 0)
                                + v.get("disliked", 0)
                                + v.get("toxic", 0)
                            )
                            * 1.5
                        )
                        else "bearish" if bearish > (bullish * 1.5) else "neutral"
                    ),
                    "currencies": (
                        [c.get("code") for c in item.get("currencies", [])]
                        if item.get("currencies")
                        else []
                    ),
                }
                for i, item in enumerate(results)
            ]

            return {"status": "success", "news": formatted_news}
        else:
            return {"error": f"CryptoPanic API error: {response.status_code}"}
    except Exception as e:
        logger.error(f"Error fetching news: %s", e)
        return {"error": str(e)}


@mcp.tool()
async def search_news(query: str, limit: int = 10) -> dict:
    """
    Searches for specific crypto news by currency ticker or keyword.
    """
    try:
        url = "https://cryptopanic.com/api/v1/posts/"
        params = {"auth_token": CRYPTOPANIC_API_KEY, "public": "true"}
        q_clean = query.strip()
        if q_clean and " " not in q_clean:
            params["currencies"] = q_clean

        response = await _client.get(url, params=params)

        if response.status_code == 200:
            results = response.json().get("results", [])
            if "currencies" not in params and q_clean:
                q_low = q_clean.lower()
                results = [
                    r for r in results
                    if q_low in (r.get("title") or "").lower()
                    or any(q_low in (c.get("code") or "").lower() for c in (r.get("currencies") or []))
                ]
            return {
                "status": "success",
                "news": results[:limit],
            }
        else:
            return {"error": f"CryptoPanic API error: {response.status_code}"}
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    print("Starting news_mcp on http://0.0.0.0:7017/mcp — Crypto MCP Server")
    mcp.run("streamable-http")
