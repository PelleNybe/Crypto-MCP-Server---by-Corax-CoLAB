import asyncio
import ccxt
import pandas as pd
import pandas_ta as ta
import os
import json
from datetime import datetime
import logging
from dotenv import load_dotenv

from autonomous_orchestrator import consult_board_of_directors

# Logging setup
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("BacktestOrchestrator")

load_dotenv()

async def fetch_historical_data(ticker: str, timeframe: str = '1d', limit: int = 100):
    """
    Fetches historical OHLCV data using CCXT.
    """
    logger.info(f"Fetching {limit} bars of {timeframe} historical data for {ticker} via Binance...")
    exchange = ccxt.binance({
        'enableRateLimit': True,
    })

    symbol = f"{ticker}/USDT"
    try:
        # Run synchronously as ccxt fetching is blocking, using to_thread
        def _fetch():
            return exchange.fetch_ohlcv(symbol, timeframe, limit=limit)

        ohlcv = await asyncio.to_thread(_fetch)

        # Convert to DataFrame
        df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        return df
    except Exception as e:
        logger.error(f"Failed to fetch historical data: {e}")
        return None


async def run_backtest(ticker: str = "BTC", timeframe: str = "1d", limit: int = 10):
    """
    Main loop to simulate the AI's decisions over historical data.
    """
    logger.info("Initializing Agentic Backtesting Engine...")
    df = await fetch_historical_data(ticker, timeframe, limit=limit+50) # fetch extra for indicators

    if df is None or df.empty:
        logger.error("No data fetched. Aborting backtest.")
        return

    # Calculate indicators
    df['rsi'] = df.ta.rsi(length=14)
    df['sma'] = df.ta.sma(length=20)

    # Drop rows with NaN values caused by indicator lookback periods
    df = df.dropna()

    # Limit to requested simulation length
    df = df.tail(limit).reset_index(drop=True)

    start_time = df.iloc[0]['timestamp']
    end_time = df.iloc[-1]['timestamp']
    logger.info(f"Simulation Period: {start_time} to {end_time}")

    results = []
    summary = {"BUY": 0, "SELL": 0, "HOLD": 0}

    for index, row in df.iterrows():
        current_time = row['timestamp']
        current_price = row['close']

        logger.info(f"--- Simulating Step {index + 1}/{len(df)} at {current_time} ---")

        # Construct simulated market data
        market_data = {
            "ticker": ticker,
            "price": current_price,
            "technical_signals": f"RSI: {row['rsi']:.2f}, SMA(20): {row['sma']:.2f}, Volume: {row['volume']}",
            "sentiment": "Neutral (Simulated Backtest)"
        }

        # Consult the board (AI analysis)
        # Note: telegram alerts and live ccxt trades are NOT connected here.
        analysis = await consult_board_of_directors(market_data)

        decision = analysis.get("decision", "HOLD")
        summary[decision] += 1

        results.append({
            "timestamp": str(current_time),
            "price": current_price,
            "decision": decision,
            "analysis": analysis
        })

        logger.info(f"Backtest Decision at {current_time}: {decision}")

    return {
        "ticker": ticker,
        "timeframe": timeframe,
        "start_time": str(start_time),
        "end_time": str(end_time),
        "total_steps": len(df),
        "summary": summary,
        "details": results
    }

def generate_backtest_report(backtest_data: dict):
    """
    Generates a human-readable Markdown report for the backtest.
    """
    os.makedirs("trading_diary", exist_ok=True)

    timestamp_str = datetime.now().strftime('%Y%m%d_%H%M%S')
    ticker = backtest_data['ticker']
    filename = f"trading_diary/{timestamp_str}_{ticker}_BACKTEST.md"

    md_content = f"# Agentic Backtesting Report\\n\\n"
    md_content += f"**Ticker:** {ticker}\\n"
    md_content += f"**Timeframe:** {backtest_data['timeframe']}\\n"
    md_content += f"**Simulation Period:** {backtest_data['start_time']} to {backtest_data['end_time']}\\n"
    md_content += f"**Total Steps simulated:** {backtest_data['total_steps']}\\n\\n"

    md_content += f"## 1. Summary of Actions\\n\\n"
    md_content += f"```json\\n{json.dumps(backtest_data['summary'], indent=2)}\\n```\\n\\n"

    md_content += f"## 2. Detailed Event Log\\n\\n"
    for event in backtest_data['details']:
        md_content += f"### {event['timestamp']} | Price: ${event['price']:.2f}\\n"
        md_content += f"**Consensus Decision:** {event['decision']}\\n"
        md_content += f"**Vote Distribution:** {json.dumps(event['analysis'].get('vote_counts', {}))}\\n"

        md_content += "<details>\\n<summary><b>Director Reasoning (Click to expand)</b></summary>\\n\\n"
        for vote in event['analysis'].get("director_votes", []):
            provider = vote.get("provider", "Unknown")
            v_decision = vote.get("decision", "HOLD")
            reasoning = vote.get("reasoning", "No reasoning provided.")
            md_content += f"- **{provider} ({v_decision}):** {reasoning}\\n"
        md_content += "</details>\\n\\n---\\n\\n"

    try:
        with open(filename, "w") as f:
            f.write(md_content)
        logger.info(f"Backtest report saved to {filename}")
    except Exception as e:
        logger.error(f"Failed to write backtest report: {e}")

async def main():
    # Run a short backtest simulation by default
    results = await run_backtest(ticker="BTC", timeframe="1d", limit=5)
    if results:
        generate_backtest_report(results)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Backtest Orchestrator stopped by user.")
