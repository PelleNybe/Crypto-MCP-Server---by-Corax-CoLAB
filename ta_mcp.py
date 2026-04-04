#!/usr/bin/env python3
"""
ta_mcp.py
Technical analysis MCP server for Crypto MCP Server – Produced by Corax CoLAB - The Future of Edge AI & Blockchain
Exposes: compute_indicators (RSI, MACD, SMA50, BB)
"""
import logging
from typing import Dict, Any
import pandas as pd
import pandas_ta as ta
import ccxt
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ta_mcp")

mcp = FastMCP(name="ta", stateless_http=True, json_response=True, host="0.0.0.0", port=7003)

def _fetch_ohlcv(exchange_id: str, symbol: str, timeframe: str, limit: int = 200):
    exchange_id = exchange_id.lower()
    if exchange_id not in ccxt.exchanges:
        raise ValueError(f"Unsupported exchange: {exchange_id}")
    cls = getattr(ccxt, exchange_id)
    ex = cls({"enableRateLimit": True})
    data = ex.fetch_ohlcv(symbol, timeframe=timeframe, limit=limit)
    df = pd.DataFrame(data, columns=["ts", "open", "high", "low", "close", "volume"])
    df["ts"] = pd.to_datetime(df["ts"], unit="ms")
    df.set_index("ts", inplace=True)
    return df

@mcp.tool()
def compute_indicators(exchange: str, symbol: str, timeframe: str = "1h", limit: int = 200) -> Dict[str, Any]:
    df = _fetch_ohlcv(exchange, symbol, timeframe, limit)
    df["rsi"] = ta.rsi(df["close"], length=14)
    macd = ta.macd(df["close"])
    df["macd"] = macd["MACD_12_26_9"]
    df["macd_signal"] = macd["MACDs_12_26_9"]
    df["sma50"] = ta.sma(df["close"], length=50)
    bb = ta.bbands(df["close"])
    df["bb_lower"] = bb["BBL_20_2.0"]
    df["bb_upper"] = bb["BBU_20_2.0"]

    last = df.iloc[-1].to_dict()
    rsi = last.get("rsi")
    macd_hist = last.get("macd") - last.get("macd_signal") if (last.get("macd") is not None and last.get("macd_signal") is not None) else None
    signal = "hold"
    if rsi and rsi < 30 and macd_hist and macd_hist > 0:
        signal = "buy"
    elif rsi and rsi > 70 and macd_hist and macd_hist < 0:
        signal = "sell"
    return {"symbol": symbol, "timeframe": timeframe, "rsi": rsi, "macd_hist": macd_hist, "sma50": last.get("sma50"), "bb_lower": last.get("bb_lower"), "bb_upper": last.get("bb_upper"), "signal": signal }



import numpy as np
from scipy.stats import norm

@mcp.tool()
def monte_carlo_simulation(exchange: str, symbol: str, timeframe: str = "1h", limit: int = 500, future_steps: int = 20, simulations: int = 1000) -> Dict[str, Any]:
    """
    Performs a Monte Carlo simulation based on historical OHLCV data to predict future price bounds.
    Returns the median predicted path, and the upper and lower 95% confidence intervals.
    """
    try:
        df = _fetch_ohlcv(exchange, symbol, timeframe, limit)
        if df.empty or len(df) < 50:
            return {"error": "Not enough historical data for a meaningful simulation"}

        # Calculate log returns
        df['log_ret'] = np.log(df['close'] / df['close'].shift(1))

        # Calculate drift and volatility
        u = df['log_ret'].mean()
        var = df['log_ret'].var()
        drift = u - (0.5 * var)
        stdev = df['log_ret'].std()

        current_price = df['close'].iloc[-1]

        # Generate random paths
        # Z is standard normal distributed random variables
        np.random.seed(int(current_price * 100) % 100000)
        Z = norm.ppf(np.random.rand(future_steps, simulations))
        daily_returns = np.exp(drift + stdev * Z)

        price_paths = np.zeros_like(daily_returns)
        price_paths[0] = current_price

        for t in range(1, future_steps):
            price_paths[t] = price_paths[t-1] * daily_returns[t]

        # Calculate percentiles
        median_path = np.percentile(price_paths, 50, axis=1).tolist()
        lower_bound = np.percentile(price_paths, 5, axis=1).tolist() # 5th percentile
        upper_bound = np.percentile(price_paths, 95, axis=1).tolist() # 95th percentile

        # Adjust lengths to be future_steps + 1 including the current price at index 0
        median_path.insert(0, float(current_price))
        lower_bound.insert(0, float(current_price))
        upper_bound.insert(0, float(current_price))

        return {
            "symbol": symbol,
            "current_price": float(current_price),
            "future_steps": future_steps,
            "median_path": median_path,
            "lower_bound": lower_bound,
            "upper_bound": upper_bound
        }
    except Exception as e:
        logger.error(f"Error in monte_carlo_simulation: {e}")
        return {"error": str(e)}


if __name__ == "__main__":
    print("Starting ta_mcp on http://127.0.0.1:7003/mcp — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)")
    # transport, bind (address:port), mount_path
    mcp.run("streamable-http")
