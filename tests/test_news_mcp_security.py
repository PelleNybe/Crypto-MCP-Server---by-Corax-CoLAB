import sys
from unittest.mock import MagicMock, patch

# Mock dependencies as in test_news_mcp.py
mock_mcp = MagicMock()
mock_fastmcp = MagicMock()
mock_fastmcp.tool.return_value = lambda f: f
mock_mcp.server.fastmcp.FastMCP.return_value = mock_fastmcp

sys.modules["mcp"] = mock_mcp
sys.modules["mcp.server.fastmcp"] = MagicMock()
sys.modules["mcp.server.fastmcp"].FastMCP = MagicMock(return_value=mock_fastmcp)
sys.modules["httpx"] = MagicMock()
sys.modules["requests"] = MagicMock()
sys.modules["dotenv"] = MagicMock()

from news_mcp import search_news
from unittest.mock import AsyncMock


@patch("news_mcp.httpx.AsyncClient")
def test_search_news_parameter_encoding(mock_async_client_class):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"results": []}

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client.__aenter__.return_value = mock_client
    mock_async_client_class.return_value = mock_client

    # Malicious query attempting to inject additional parameters
    malicious_query = "BTC&public=false"
    import asyncio

    asyncio.run(search_news(malicious_query))

    # Get the URL and params that were actually called
    args, kwargs = mock_client.get.call_args

    if kwargs.get("params"):
        # If using params dict, requests handles encoding
        params = kwargs["params"]
        assert params["currencies"] == malicious_query
    else:
        # If using f-string (vulnerable), check if it's encoded in the URL
        actual_url = args[0]
        # It SHOULD be encoded
        assert "currencies=BTC%26public%3Dfalse" in actual_url
        assert "currencies=BTC&public=false" not in actual_url


if __name__ == "__main__":
    import pytest

    pytest.main([__file__])
