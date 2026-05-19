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
sys.modules["ccxt"] = MagicMock()
sys.modules["web3"] = MagicMock()
sys.modules["web3.middleware"] = MagicMock()
sys.modules["web3.gas_strategies.time_based"] = MagicMock()
sys.modules["dotenv"] = MagicMock()
sys.modules["eth_account"] = MagicMock()

from unittest.mock import patch, MagicMock
from ccxt_mcp import get_ticker, fetch_ohlcv


@patch("ccxt_mcp._make_exchange")
def test_fetch_ohlcv_success(mock_make_exchange):
    mock_exchange = MagicMock()
    expected_ohlcv = [[1612137600000, 30000.0, 31000.0, 29000.0, 30500.0, 100.0]]
    mock_exchange.fetch_ohlcv.return_value = expected_ohlcv
    mock_make_exchange.return_value = mock_exchange

    res = fetch_ohlcv("binance", "BTC/USDT")
    assert res == expected_ohlcv
    mock_exchange.fetch_ohlcv.assert_called_once()


@patch("ccxt_mcp._make_exchange")
def test_fetch_ohlcv_empty(mock_make_exchange):
    mock_exchange = MagicMock()
    mock_exchange.fetch_ohlcv.return_value = []
    mock_make_exchange.return_value = mock_exchange

    res = fetch_ohlcv("binance", "BTC/USDT")
    assert res == []
    mock_exchange.fetch_ohlcv.assert_called_once()


@patch("ccxt_mcp._make_exchange")
def test_fetch_ohlcv_error(mock_make_exchange):
    import pytest

    mock_exchange = MagicMock()
    mock_exchange.fetch_ohlcv.side_effect = Exception("API Error")
    mock_make_exchange.return_value = mock_exchange

    with pytest.raises(Exception, match="API Error"):
        fetch_ohlcv("binance", "BTC/USDT")
    mock_exchange.fetch_ohlcv.assert_called_once()


@patch("ccxt_mcp._make_exchange")
def test_get_ticker(mock_make_exchange):
    mock_exchange = MagicMock()
    mock_exchange.fetch_ticker.return_value = {"last": 50000.0, "symbol": "BTC/USDT"}
    mock_make_exchange.return_value = mock_exchange

    ticker = get_ticker("binance", "BTC/USDT")
    assert ticker["last"] == 50000.0
    assert ticker["symbol"] == "BTC/USDT"


@patch("ccxt_mcp.requests.post")
@patch("ccxt_mcp._make_exchange")
def test_create_order_pending_flow(mock_make_exchange, mock_post):
    mock_exchange = MagicMock()
    mock_exchange.fetch_ticker.return_value = {"last": 100.0}
    mock_make_exchange.return_value = mock_exchange

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_post.return_value = mock_response

    import os

    os.environ["ALLOWED_PAIRS"] = "BTC/USDT,SOL/USDT"
    import ccxt_mcp

    ccxt_mcp.ALLOWED_PAIRS = ["BTC/USDT", "SOL/USDT"]

    res = ccxt_mcp.create_order("binance", "SOL/USDT", "buy", "market", 1.0, None)

    assert "status" in res
    assert res["status"] == "pending_approval"
    mock_post.assert_called_once()


@patch("ccxt_mcp.requests.post")
@patch("ccxt_mcp._make_exchange")
def test_create_order_blocked_when_empty_allowed_pairs(mock_make_exchange, mock_post):
    import ccxt_mcp

    ccxt_mcp.ALLOWED_PAIRS = []

    res = ccxt_mcp.create_order("binance", "BTC/USDT", "buy", "market", 1.0, None)

    assert "error" in res
    assert "not in ALLOWED_PAIRS list" in res["error"]
    mock_post.assert_not_called()


@patch("ccxt_mcp.requests.post")
def test_log_reasoning(mock_post):
    import ccxt_mcp

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_post.return_value = mock_response

    res = ccxt_mcp.log_reasoning(
        "test_trade_id_123", "AI found a 5% dip and buying volume increasing."
    )

    assert res["status"] == "success"
    mock_post.assert_called_once()
    args, kwargs = mock_post.call_args
    assert "explanation" in kwargs["json"]
    assert (
        kwargs["json"]["explanation"]
        == "AI found a 5% dip and buying volume increasing."
    )
    assert "trade_id" in kwargs["json"]
    assert kwargs["json"]["trade_id"] == "test_trade_id_123"
