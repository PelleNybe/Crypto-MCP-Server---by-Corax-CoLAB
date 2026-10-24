import pytest
import sys
from unittest.mock import MagicMock, AsyncMock, patch

# Mock mcp
mock_mcp = MagicMock()
mock_fastmcp = MagicMock()
mock_fastmcp.tool.return_value = lambda f: f
mock_mcp.server.fastmcp.FastMCP.return_value = mock_fastmcp

sys.modules["mcp"] = mock_mcp
sys.modules["mcp.server.fastmcp"] = MagicMock()
sys.modules["mcp.server.fastmcp"].FastMCP = MagicMock(return_value=mock_fastmcp)
sys.modules["dotenv"] = MagicMock()

import freqtrade_mcp

@pytest.mark.asyncio
async def test_ping():
    res = await freqtrade_mcp.ping()
    assert "freqtrade_mcp alive" in res
    assert "Corax CoLAB" in res

@pytest.mark.asyncio
@patch('freqtrade_mcp._client.request')
async def test_req_success(mock_request):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"success": True}

    # Needs to return a coroutine
    async def mock_req_inner(*args, **kwargs):
        return mock_resp
    mock_request.side_effect = mock_req_inner

    res = await freqtrade_mcp._req("testpath")
    assert res["status_code"] == 200
    assert res["json"] == {"success": True}

@pytest.mark.asyncio
@patch('freqtrade_mcp._client.request')
async def test_req_error(mock_request):
    mock_resp = MagicMock()
    mock_resp.status_code = 404
    mock_resp.json.side_effect = Exception("No json")
    mock_resp.text = "Not found"

    async def mock_req_inner(*args, **kwargs):
        return mock_resp
    mock_request.side_effect = mock_req_inner

    res = await freqtrade_mcp._req("testpath")
    assert res["status_code"] == 404
    assert res["text"] == "Not found"
    assert "json" not in res

@pytest.mark.asyncio
@patch('freqtrade_mcp._req')
async def test_status_success(mock_req):
    mock_req.side_effect = [{"status_code": 404}, {"status_code": 200, "json": {"state": "running"}}]
    res = await freqtrade_mcp.status()
    assert res["status_code"] == 200
    assert res["json"] == {"state": "running"}

@pytest.mark.asyncio
@patch('freqtrade_mcp._req')
async def test_status_fail(mock_req):
    mock_req.return_value = {"status_code": 404}
    res = await freqtrade_mcp.status()
    assert "error" in res

@pytest.mark.asyncio
@patch('freqtrade_mcp._req')
async def test_actions(mock_req):
    mock_req.return_value = {"status_code": 200}

    await freqtrade_mcp.start_bot()
    mock_req.assert_called_with("start", method="post")

    await freqtrade_mcp.stop_bot()
    mock_req.assert_called_with("stop", method="post")

    await freqtrade_mcp.reload_config()
    mock_req.assert_called_with("reload_config", method="post")

    await freqtrade_mcp.list_strategies()
    mock_req.assert_called_with("strategies")

    await freqtrade_mcp.trades(10)
    mock_req.assert_called_with("trades?limit=10")
