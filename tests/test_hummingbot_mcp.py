import sys
from unittest.mock import MagicMock, patch

# Mock dependencies thoroughly before importing
mock_mcp = MagicMock()
mock_fastmcp = MagicMock()
mock_fastmcp.tool.return_value = lambda f: f
mock_mcp.server.fastmcp.FastMCP.return_value = mock_fastmcp

sys.modules["mcp"] = mock_mcp
sys.modules["mcp.server.fastmcp"] = MagicMock()
sys.modules["mcp.server.fastmcp"].FastMCP = MagicMock(return_value=mock_fastmcp)
sys.modules["requests"] = MagicMock()
sys.modules["dotenv"] = MagicMock()

import hummingbot_mcp

def test_req_success():
    with patch("hummingbot_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": True}
        mock_request.return_value = mock_response

        result = hummingbot_mcp._req("test/path")

        assert result["status_code"] == 200
        assert result["json"] == {"success": True}
        mock_request.assert_called_once()
        args, kwargs = mock_request.call_args
        assert kwargs["timeout"] == 15
        assert kwargs["verify"] == False
        assert args[0] == "get"
        assert args[1].endswith("test/path")

def test_req_exception():
    with patch("hummingbot_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.json.side_effect = Exception("No JSON")
        mock_response.text = "Internal Server Error"
        mock_request.return_value = mock_response

        result = hummingbot_mcp._req("test/path")

        assert result["status_code"] == 500
        assert "text" in result
        assert result["text"] == "Internal Server Error"
        assert "json" not in result

def test_ping():
    with patch("hummingbot_mcp._req") as mock_req:
        mock_req.return_value = {"status_code": 200}
        result = hummingbot_mcp.ping()
        assert "hummingbot_mcp alive" in result
        assert "status=200" in result
        mock_req.assert_called_once_with("")

def test_get_balances():
    with patch("hummingbot_mcp._req") as mock_req:
        mock_req.return_value = {"status_code": 200, "json": {"balances": []}}
        result = hummingbot_mcp.get_balances(network="ethereum", chain="mainnet", address="0x123")
        assert result["status_code"] == 200
        assert result["json"] == {"balances": []}
        mock_req.assert_called_once_with("network/balances", method="post", json={"network": "ethereum", "chain": "mainnet", "address": "0x123"})

def test_get_tokens():
    with patch("hummingbot_mcp._req") as mock_req:
        mock_req.return_value = {"status_code": 200, "json": {"tokens": []}}
        result = hummingbot_mcp.get_tokens(network="ethereum", chain="mainnet")
        assert result["status_code"] == 200
        assert result["json"] == {"tokens": []}
        mock_req.assert_called_once_with("network/tokens", method="post", json={"network": "ethereum", "chain": "mainnet"})

def test_clob_markets():
    with patch("hummingbot_mcp._req") as mock_req:
        mock_req.return_value = {"status_code": 200, "json": {"markets": []}}
        result = hummingbot_mcp.clob_markets(chain="mainnet", network="ethereum", connector="uniswap")
        assert result["status_code"] == 200
        assert result["json"] == {"markets": []}
        mock_req.assert_called_once_with("clob/markets", method="post", json={"chain": "mainnet", "network": "ethereum", "connector": "uniswap"})

def test_amm_price():
    with patch("hummingbot_mcp._req") as mock_req:
        mock_req.return_value = {"status_code": 200, "json": {"price": "100"}}
        result = hummingbot_mcp.amm_price(chain="mainnet", network="ethereum", connector="uniswap", base="WETH", quote="USDT", amount="1", side="BUY")
        assert result["status_code"] == 200
        assert result["json"] == {"price": "100"}
        mock_req.assert_called_once_with("amm/price", method="post", json={
            "chain": "mainnet", "network": "ethereum", "connector": "uniswap",
            "base": "WETH", "quote": "USDT", "amount": "1", "side": "BUY"
        })
