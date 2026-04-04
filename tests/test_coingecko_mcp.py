import sys
from unittest.mock import MagicMock

# Mock dependencies thoroughly
mock_mcp = MagicMock()
mock_fastmcp = MagicMock()
mock_fastmcp.tool.return_value = lambda f: f
mock_mcp.server.fastmcp.FastMCP.return_value = mock_fastmcp

sys.modules["mcp"] = mock_mcp
sys.modules["mcp.server.fastmcp"] = MagicMock()
sys.modules["mcp.server.fastmcp"].FastMCP = MagicMock(return_value=mock_fastmcp)
sys.modules["requests"] = MagicMock()
sys.modules["requests_cache"] = MagicMock()
sys.modules["dotenv"] = MagicMock()
sys.modules["pycoingecko"] = MagicMock()

from unittest.mock import patch, MagicMock
from coingecko_mcp import get_coins_markets

@patch('coingecko_mcp.cg')
def test_get_coins_markets_success(mock_cg):
    # Setup mock
    mock_cg.get_coins_markets.return_value = [
        {"id": "bitcoin", "symbol": "btc", "name": "Bitcoin", "current_price": 50000},
        {"id": "ethereum", "symbol": "eth", "name": "Ethereum", "current_price": 3000}
    ]

    # Call function
    res = get_coins_markets(vs_currency="usd", limit=2)

    # Assertions
    mock_cg.get_coins_markets.assert_called_once_with(vs_currency="usd", per_page=2)
    assert len(res) == 2
    assert res[0]["id"] == "bitcoin"
    assert res[1]["id"] == "ethereum"

@patch('coingecko_mcp.cg')
def test_get_coins_markets_exception(mock_cg):
    # Setup mock to raise Exception
    mock_cg.get_coins_markets.side_effect = Exception("API rate limit exceeded")

    # Call function
    res = get_coins_markets(vs_currency="usd", limit=50)

    # Assertions
    mock_cg.get_coins_markets.assert_called_once_with(vs_currency="usd", per_page=50)
    assert isinstance(res, list)
    assert len(res) == 1
    assert "error" in res[0]
    assert res[0]["error"] == "API rate limit exceeded"
