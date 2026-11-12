import sys
from unittest.mock import MagicMock, patch

mock_mcp = MagicMock()
mock_fastmcp = MagicMock()
mock_fastmcp.tool.return_value = lambda f: f
mock_mcp.server.fastmcp.FastMCP.return_value = mock_fastmcp

sys.modules.setdefault("mcp", mock_mcp)
sys.modules.setdefault("mcp.server.fastmcp", MagicMock())
sys.modules["mcp.server.fastmcp"].FastMCP = MagicMock(return_value=mock_fastmcp)
sys.modules.setdefault("dotenv", MagicMock())

import hummingbot_mcp


def test_hummingbot_gateway_and_api_tools():
    with patch("hummingbot_mcp._req") as mock_req, patch("hummingbot_mcp._api_req") as mock_api:
        mock_req.return_value = {"status_code": 200, "json": {"ok": True}}
        mock_api.return_value = {"status_code": 200, "json": {"bots": []}}

        hummingbot_mcp.connectors()
        mock_req.assert_called_with("connectors")

        hummingbot_mcp.clob_orderbook("ethereum", "mainnet", "uniswap", "ETH-USDT")
        mock_req.assert_called_with(
            "clob/orderBook",
            method="post",
            json={"chain": "ethereum", "network": "mainnet", "connector": "uniswap", "market": "ETH-USDT"},
        )

        hummingbot_mcp.amm_quote("ethereum", "mainnet", "uniswap", "WETH", "USDC", "1.0", "BUY")
        mock_req.assert_called_with(
            "amm/price",
            method="post",
            json={
                "chain": "ethereum",
                "network": "mainnet",
                "connector": "uniswap",
                "base": "WETH",
                "quote": "USDC",
                "amount": "1.0",
                "side": "BUY",
            },
        )

        hummingbot_mcp.bot_status()
        mock_api.assert_called_with("bot-orchestration/status")

        hummingbot_mcp.start_bot("bot1", script="pmm.py")
        mock_api.assert_called_with(
            "bot-orchestration/start-bot",
            method="post",
            json={"bot_name": "bot1", "script": "pmm.py"},
        )

        hummingbot_mcp.stop_bot("bot1")
        mock_api.assert_called_with(
            "bot-orchestration/stop-bot",
            method="post",
            json={"bot_name": "bot1", "skip_order_cancellation": False},
        )

        hummingbot_mcp.list_controllers()
        mock_api.assert_called_with("controllers")

        hummingbot_mcp.bot_performance("bot1")
        mock_api.assert_called_with("bot-orchestration/bot-performance/bot1")
