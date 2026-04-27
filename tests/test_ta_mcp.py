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
sys.modules["dotenv"] = MagicMock()

import pytest
import pandas as pd
import numpy as np
from unittest.mock import patch, MagicMock

# Import the module under test
import ta_mcp


@patch("ta_mcp.ccxt")
def test_fetch_ohlcv_success(mock_ccxt):
    # Setup mock exchange
    mock_ccxt.exchanges = ["binance"]
    mock_exchange_cls = MagicMock()
    mock_exchange = MagicMock()
    # Return mock data: ts, open, high, low, close, volume
    mock_exchange.fetch_ohlcv.return_value = [
        [1612137600000, 30000.0, 31000.0, 29000.0, 30500.0, 100.0],
        [1612141200000, 30500.0, 31500.0, 30000.0, 31000.0, 120.0],
    ]
    mock_exchange_cls.return_value = mock_exchange
    mock_ccxt.binance = mock_exchange_cls

    # Needs to match the getattr(ccxt, exchange_id)
    setattr(mock_ccxt, "binance", mock_exchange_cls)

    df = ta_mcp._fetch_ohlcv("binance", "BTC/USDT", "1h", 2)

    assert not df.empty
    assert len(df) == 2
    assert "open" in df.columns
    assert "close" in df.columns
    assert df.iloc[0]["open"] == 30000.0
    mock_exchange.fetch_ohlcv.assert_called_once_with(
        "BTC/USDT", timeframe="1h", limit=2
    )


@patch("ta_mcp.ccxt")
def test_fetch_ohlcv_unsupported_exchange(mock_ccxt):
    mock_ccxt.exchanges = ["binance"]

    with pytest.raises(ValueError, match="Unsupported exchange: unknown"):
        ta_mcp._fetch_ohlcv("unknown", "BTC/USDT", "1h", 2)


@patch("ta_mcp._fetch_ohlcv")
def test_compute_indicators(mock_fetch_ohlcv):
    # Create a dummy dataframe with enough rows for TA calculation
    dates = pd.date_range("2023-01-01", periods=100, freq="h")
    data = {
        "open": np.random.randn(100) + 100,
        "high": np.random.randn(100) + 102,
        "low": np.random.randn(100) + 98,
        "close": np.linspace(100, 150, 100),  # Upward trend
        "volume": np.random.rand(100) * 100,
    }
    df = pd.DataFrame(data, index=dates)
    mock_fetch_ohlcv.return_value = df

    res = ta_mcp.compute_indicators("binance", "BTC/USDT", "1h", 100)

    assert res["symbol"] == "BTC/USDT"
    assert res["timeframe"] == "1h"
    assert "rsi" in res
    assert "macd_hist" in res
    assert "sma50" in res
    assert "bb_lower" in res
    assert "bb_upper" in res
    assert "signal" in res
    assert res["signal"] in ["buy", "sell", "hold"]


@patch("ta_mcp._fetch_ohlcv")
def test_monte_carlo_simulation_success(mock_fetch_ohlcv):
    dates = pd.date_range("2023-01-01", periods=100, freq="h")
    # Upward trend data
    close_prices = np.linspace(100, 110, 100)
    df = pd.DataFrame({"close": close_prices}, index=dates)
    mock_fetch_ohlcv.return_value = df

    res = ta_mcp.monte_carlo_simulation(
        "binance", "BTC/USDT", future_steps=5, simulations=10
    )

    assert "error" not in res
    assert res["symbol"] == "BTC/USDT"
    assert res["current_price"] == 110.0
    assert res["future_steps"] == 5
    assert len(res["median_path"]) == 6  # future_steps + 1
    assert len(res["lower_bound"]) == 6
    assert len(res["upper_bound"]) == 6
    assert res["median_path"][0] == 110.0
    assert res["lower_bound"][0] == 110.0
    assert res["upper_bound"][0] == 110.0


@patch("ta_mcp._fetch_ohlcv")
def test_monte_carlo_simulation_not_enough_data(mock_fetch_ohlcv):
    # Less than 50 rows
    dates = pd.date_range("2023-01-01", periods=40, freq="h")
    df = pd.DataFrame({"close": np.random.randn(40)}, index=dates)
    mock_fetch_ohlcv.return_value = df

    res = ta_mcp.monte_carlo_simulation("binance", "BTC/USDT")

    assert "error" in res
    assert "Not enough historical data" in res["error"]


@patch("ta_mcp._fetch_ohlcv")
def test_monte_carlo_simulation_error_handling(mock_fetch_ohlcv):
    mock_fetch_ohlcv.side_effect = Exception("API error")

    res = ta_mcp.monte_carlo_simulation("binance", "BTC/USDT")

    assert "error" in res
    assert "API error" in res["error"]
