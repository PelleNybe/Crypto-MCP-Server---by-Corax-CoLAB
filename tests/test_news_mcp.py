import sys
from unittest.mock import MagicMock, AsyncMock
import asyncio

# Mock dependencies thoroughly
mock_mcp = MagicMock()
mock_fastmcp = MagicMock()
mock_fastmcp.tool.return_value = lambda f: f
mock_mcp.server.fastmcp.FastMCP.return_value = mock_fastmcp

sys.modules["mcp"] = mock_mcp
sys.modules["mcp.server.fastmcp"] = MagicMock()
sys.modules["mcp.server.fastmcp"].FastMCP = MagicMock(return_value=mock_fastmcp)
sys.modules["httpx"] = MagicMock()
sys.modules["ccxt"] = MagicMock()
sys.modules["web3"] = MagicMock()
sys.modules["web3.middleware"] = MagicMock()
sys.modules["web3.gas_strategies.time_based"] = MagicMock()
sys.modules["dotenv"] = MagicMock()
sys.modules["eth_account"] = MagicMock()

from unittest.mock import patch
import pytest

# We need to delete news_mcp from sys.modules to ensure it reloads with our mocks
if "news_mcp" in sys.modules:
    del sys.modules["news_mcp"]
from news_mcp import get_latest_news


def test_get_latest_news():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "results": [
            {
                "title": "Bitcoin reaches new high",
                "votes": {"positive": 10, "negative": 1},
            },
            {"title": "Market crash", "votes": {"positive": 1, "negative": 10}},
        ]
    }

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client.__aenter__.return_value = mock_client

    with patch("httpx.AsyncClient", return_value=mock_client):
        res = asyncio.run(get_latest_news())
        assert res["status"] == "success"
        assert len(res["news"]) == 2
        assert res["news"][0]["title"] == "Bitcoin reaches new high"
        assert res["news"][0]["sentiment"] == "bullish"
        assert res["news"][1]["sentiment"] == "bearish"
