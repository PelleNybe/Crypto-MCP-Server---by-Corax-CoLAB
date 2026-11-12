import sys
from unittest.mock import MagicMock, patch
import pytest

mock_mcp = MagicMock()
mock_fastmcp = MagicMock()
mock_fastmcp.tool.return_value = lambda f: f
mock_mcp.server.fastmcp.FastMCP.return_value = mock_fastmcp

sys.modules.setdefault("mcp", mock_mcp)
sys.modules.setdefault("mcp.server.fastmcp", MagicMock())
sys.modules["mcp.server.fastmcp"].FastMCP = MagicMock(return_value=mock_fastmcp)
sys.modules.setdefault("dotenv", MagicMock())

import octobot_mcp


@pytest.mark.asyncio
async def test_octobot_ping():
    res = await octobot_mcp.ping()
    assert "octobot_mcp alive" in res


@pytest.mark.asyncio
@patch("octobot_mcp._req")
async def test_octobot_actions(mock_req):
    mock_req.return_value = {"status_code": 200, "json": {"ok": True}}

    await octobot_mcp.status()
    mock_req.assert_called_with("api/bot/status")

    await octobot_mcp.portfolio()
    mock_req.assert_called_with("api/portfolio/get_portfolio")

    await octobot_mcp.start_bot()
    mock_req.assert_called_with("api/bot/start", method="post")

    await octobot_mcp.stop_bot()
    mock_req.assert_called_with("api/bot/stop", method="post")

    await octobot_mcp.restart_bot()
    mock_req.assert_called_with("api/bot/restart", method="post")

    await octobot_mcp.history()
    mock_req.assert_called_with("api/trading/history")

    await octobot_mcp.open_orders()
    mock_req.assert_called_with("api/trading/orders")

    await octobot_mcp.trades()
    mock_req.assert_called_with("api/trading/trades")

    await octobot_mcp.profits()
    mock_req.assert_called_with("api/trading/profits")

    await octobot_mcp.tentacles()
    mock_req.assert_called_with("api/tentacles")

    await octobot_mcp.reload_tentacles()
    mock_req.assert_called_with("api/tentacles/reload", method="post")

    await octobot_mcp.cancel_order("ord-123")
    mock_req.assert_called_with(
        "api/trading/cancel_order", method="post", json={"order_id": "ord-123"}
    )
