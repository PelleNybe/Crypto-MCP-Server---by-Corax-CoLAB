with open("README.md", "r") as f:
    content = f.read()

backtest_section = """### Agentic Backtesting

To safely test the AI prompts and model configurations against past market behavior, we provide an Agentic Backtesting Engine. This allows you to simulate the "Board of Directors" consensus logic without risking real funds.

The backtest uses the `ccxt` library to fetch actual historical OHLCV data and simulates the market environment the orchestrator would have seen at that time.

**To run a backtest:**
```bash
python3 backtest_orchestrator.py
```

After the simulation finishes, a detailed markdown report summarizing the starting period, ending period, total simulated actions (BUYS, SELLS, HOLDS), and the AI's reasoning will be generated in the `trading_diary/` directory (e.g., `YYYYMMDD_HHMMSS_[TICKER]_BACKTEST.md`).

"""

if "### Agentic Backtesting" not in content:
    # insert before "A `systemd/corax_orchestrator.service` template"
    target = "A `systemd/corax_orchestrator.service` template"
    content = content.replace(target, backtest_section + target)

with open("README.md", "w") as f:
    f.write(content)
