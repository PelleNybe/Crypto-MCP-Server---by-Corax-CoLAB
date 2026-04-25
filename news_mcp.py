#!/usr/bin/env python3
"""
news_mcp.py
News MCP server for Crypto MCP Server – Produced by Corax CoLAB
Exposes: get_latest_news, search_news
"""
import logging
import requests
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("news_mcp")

mcp = FastMCP(name="news", stateless_http=True, json_response=True, host="0.0.0.0", port=7017)

@mcp.tool()
def get_latest_news(limit: int = 10) -> dict:
    """
    Fetches the latest crypto news from CryptoPanic API.
    Provides real data for the News Singularity feature.
    """
    try:
        # CryptoPanic public API for recent news
        url = "https://cryptopanic.com/api/v1/posts/"
        params = {
            "auth_token": "public",
            "public": "true"
        }
        response = requests.get(url, params=params, timeout=10)

        if response.status_code == 200:
            data = response.json()
            results = data.get('results', [])[:limit]

            # Format the output for the frontend
            formatted_news = [
                {
                    'id': item.get('id', str(i)),
                    'title': item.get('title', ''),
                    'domain': item.get('domain', ''),
                    'url': item.get('url', ''),
                    'published_at': item.get('published_at', ''),
                    'sentiment': (
                        'bullish' if (bullish := (v := item.get('votes', {})).get('positive', 0) + v.get('important', 0) + v.get('liked', 0)) >
                                     ((bearish := v.get('negative', 0) + v.get('disliked', 0) + v.get('toxic', 0)) * 1.5)
                        else 'bearish' if bearish > (bullish * 1.5)
                        else 'neutral'
                    ),
                    'currencies': [c.get('code') for c in item.get('currencies', [])] if item.get('currencies') else []
                }
                for i, item in enumerate(results)
            ]

            return {"status": "success", "news": formatted_news}
        else:
            return {"error": f"CryptoPanic API error: {response.status_code}"}
    except Exception as e:
        logger.error(f"Error fetching news: {e}")
        return {"error": str(e)}

@mcp.tool()
def search_news(query: str, limit: int = 10) -> dict:
    """
    Searches for specific crypto news.
    """
    try:
        url = "https://cryptopanic.com/api/v1/posts/"
        params = {
            "auth_token": "public",
            "public": "true",
            "currencies": query
        }
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            return {"status": "success", "news": response.json().get('results', [])[:limit]}
        else:
            return {"error": f"CryptoPanic API error: {response.status_code}"}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    print("Starting news_mcp on http://0.0.0.0:7017/mcp — Crypto MCP Server")
    mcp.run("streamable-http")
