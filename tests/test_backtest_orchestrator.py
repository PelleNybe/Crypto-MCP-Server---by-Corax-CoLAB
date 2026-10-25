import pytest
import pandas as pd
import numpy as np
import pandas_ta as ta # Ensure pandas_ta monkey-patches pandas
from unittest.mock import patch, MagicMock, AsyncMock

import backtest_orchestrator

@pytest.fixture
def mock_ohlcv():
    return [
        [1612137600000, 30000.0, 31000.0, 29000.0, 30500.0, 100.0],
        [1612141200000, 30500.0, 31500.0, 30000.0, 31000.0, 120.0],
        [1612144800000, 31000.0, 32000.0, 30500.0, 31500.0, 150.0],
    ]

@pytest.mark.asyncio
@patch('backtest_orchestrator.ccxt.binance')
async def test_fetch_historical_data_success(mock_binance_cls, mock_ohlcv):
    mock_exchange = MagicMock()
    mock_exchange.fetch_ohlcv.return_value = mock_ohlcv
    mock_binance_cls.return_value = mock_exchange

    df = await backtest_orchestrator.fetch_historical_data("BTC", "1d", 3)

    assert not df.empty
    assert len(df) == 3
    assert df.iloc[0]["open"] == 30000.0
    mock_exchange.fetch_ohlcv.assert_called_once_with("BTC/USDT", "1d", limit=3)

@pytest.mark.asyncio
@patch('backtest_orchestrator.ccxt.binance')
async def test_fetch_historical_data_exception(mock_binance_cls):
    mock_exchange = MagicMock()
    mock_exchange.fetch_ohlcv.side_effect = Exception("API Error")
    mock_binance_cls.return_value = mock_exchange

    df = await backtest_orchestrator.fetch_historical_data("BTC", "1d", 3)

    assert df is None

@pytest.mark.asyncio
@patch('backtest_orchestrator.fetch_historical_data')
@patch('backtest_orchestrator.consult_board_of_directors')
async def test_run_backtest_success(mock_consult, mock_fetch):
    # Setup sufficient mock data so ta.rsi and ta.sma can compute without dropping everything
    dates = pd.date_range("2023-01-01", periods=100, freq="D")
    df = pd.DataFrame({
        "timestamp": dates,
        "open": np.random.randn(100) + 100,
        "high": np.random.randn(100) + 102,
        "low": np.random.randn(100) + 98,
        "close": np.linspace(100, 150, 100),
        "volume": np.random.rand(100) * 100,
    })
    mock_fetch.return_value = df

    mock_consult.side_effect = [
        {"decision": "BUY", "vote_counts": {}, "director_votes": []},
        {"decision": "HOLD", "vote_counts": {}, "director_votes": []}
    ] * 50

    res = await backtest_orchestrator.run_backtest("BTC", "1d", limit=2)

    assert res["ticker"] == "BTC"
    assert res["total_steps"] == 2
    assert "summary" in res
    assert "details" in res
    assert len(res["details"]) == 2
    mock_consult.assert_called()

@pytest.mark.asyncio
@patch('backtest_orchestrator.fetch_historical_data')
async def test_run_backtest_no_data(mock_fetch):
    mock_fetch.return_value = None
    res = await backtest_orchestrator.run_backtest("BTC", "1d", limit=2)
    assert res is None

@patch('backtest_orchestrator.os.makedirs')
@patch('builtins.open')
def test_generate_backtest_report(mock_open, mock_makedirs):
    backtest_data = {
        "ticker": "BTC",
        "timeframe": "1d",
        "start_time": "2023-01-01",
        "end_time": "2023-01-02",
        "total_steps": 2,
        "summary": {"BUY": 1, "HOLD": 1, "SELL": 0},
        "details": [
            {
                "timestamp": "2023-01-01",
                "price": 100.0,
                "decision": "BUY",
                "analysis": {"vote_counts": {"BUY": 1}, "director_votes": [{"provider": "X", "decision": "BUY", "reasoning": "Y"}]}
            }
        ]
    }

    backtest_orchestrator.generate_backtest_report(backtest_data)
    mock_open.assert_called_once()
    mock_makedirs.assert_called_once_with("trading_diary", exist_ok=True)

@pytest.mark.asyncio
@patch('backtest_orchestrator.run_backtest')
@patch('backtest_orchestrator.generate_backtest_report')
async def test_main(mock_gen, mock_run):
    mock_run.return_value = {"success": True}
    await backtest_orchestrator.main()
    mock_run.assert_called_once()
    mock_gen.assert_called_once_with({"success": True})
