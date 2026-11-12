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
    mock_req.assert_called_with("api/v1/start", method="post")

    await freqtrade_mcp.stop_bot()
    mock_req.assert_called_with("api/v1/stop", method="post")

    await freqtrade_mcp.reload_config()
    mock_req.assert_called_with("api/v1/reload_config", method="post")

    await freqtrade_mcp.list_strategies()
    mock_req.assert_called_with("api/v1/strategies")

    await freqtrade_mcp.trades(10)
    mock_req.assert_called_with("api/v1/trades?limit=10")


@pytest.mark.asyncio
@patch('freqtrade_mcp._req')
async def test_extended_freqtrade_tools(mock_req):
    mock_req.return_value = {"status_code": 200, "json": {"ok": True}}

    await freqtrade_mcp.show_config()
    mock_req.assert_called_with("api/v1/show_config")

    await freqtrade_mcp.balance()
    mock_req.assert_called_with("api/v1/balance")

    await freqtrade_mcp.profit()
    mock_req.assert_called_with("api/v1/profit")

    await freqtrade_mcp.performance()
    mock_req.assert_called_with("api/v1/performance")

    await freqtrade_mcp.daily(5)
    mock_req.assert_called_with("api/v1/daily?timescale=5")

    await freqtrade_mcp.count()
    mock_req.assert_called_with("api/v1/count")

    await freqtrade_mcp.health()
    mock_req.assert_called_with("api/v1/health")

    await freqtrade_mcp.stopbuy()
    mock_req.assert_called_with("api/v1/stopbuy", method="post")

    await freqtrade_mcp.pause()
    mock_req.assert_called_with("api/v1/stopentry", method="post")

    await freqtrade_mcp.forceenter("BTC/USDT", side="long", stakeamount=100.0)
    mock_req.assert_called_with(
        "api/v1/forceenter",
        method="post",
        json={"pair": "BTC/USDT", "side": "long", "stakeamount": 100.0},
    )

    await freqtrade_mcp.forceexit("42", ordertype="market")
    mock_req.assert_called_with(
        "api/v1/forceexit",
        method="post",
        json={"tradeid": "42", "ordertype": "market"},
    )

    await freqtrade_mcp.cancel_open_order(42)
    mock_req.assert_called_with("api/v1/trades/42/open-order", method="delete")

    await freqtrade_mcp.whitelist()
    mock_req.assert_called_with("api/v1/whitelist")

    await freqtrade_mcp.blacklist(["DOGE/USDT"])
    mock_req.assert_called_with(
        "api/v1/blacklist", method="post", json={"blacklist": ["DOGE/USDT"]}
    )

    await freqtrade_mcp.delete_blacklist(["DOGE/USDT"])
    mock_req.assert_called_with(
        "api/v1/blacklist?pairs_to_delete=DOGE/USDT", method="delete"
    )

    await freqtrade_mcp.locks()
    mock_req.assert_called_with("api/v1/locks")

    await freqtrade_mcp.create_lock("SOL/USDT", "2026-11-12T18:00:00Z")
    mock_req.assert_called_with(
        "api/v1/locks",
        method="post",
        json={
            "pair": "SOL/USDT",
            "until": "2026-11-12T18:00:00Z",
            "side": "*",
            "reason": "mcp_risk_guard",
        },
    )

    await freqtrade_mcp.delete_lock(7)
    mock_req.assert_called_with("api/v1/locks/7", method="delete")


@pytest.mark.asyncio
@patch('freqtrade_mcp._req')
async def test_analyze_trade_performance(mock_req):
    mock_req.side_effect = [
        {"status_code": 200, "json": {"profit_all_coin": 120.5}},
        {
            "status_code": 200,
            "json": [
                {"pair": "BTC/USDT", "profit_abs": 100.0},
                {"pair": "ETH/USDT", "profit_abs": 30.0},
                {"pair": "SOL/USDT", "profit_abs": -9.5},
            ],
        },
        {
            "status_code": 200,
            "json": {
                "trades": [
                    {"is_open": False, "profit_abs": 50.0},
                    {"is_open": False, "profit_abs": -10.0},
                    {"is_open": True, "profit_abs": 5.0},
                ]
            },
        },
    ]
    res = await freqtrade_mcp.analyze_trade_performance()
    assert res["ok"] is True
    assert res["recent_closed_count"] == 2
    assert res["recent_win_rate"] == 0.5
    assert res["top_pairs"][0]["pair"] == "BTC/USDT"
    assert res["worst_pairs"][0]["pair"] == "SOL/USDT"
