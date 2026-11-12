"""
McpEnhancedStrategy.py
Drop-in Freqtrade IStrategy mixin/template powered by Crypto MCP Server (`bot_bridge.py`).

Copy this file (and `integrations/common/mcp_signal_reader.py`) into your
Freqtrade `user_data/strategies/` directory, or point `MCP_SIGNAL_FILE` to
`/path/to/Crypto-MCP-Server---by-Corax-CoLAB/data/mcp_signals.json`.

During backtesting/hyperopt, `self.dp.runmode.value` is not 'live'/'dry_run',
so MCP live-signal filtering is automatically skipped to preserve deterministic backtests.
"""

import os
from datetime import datetime
from typing import Optional

try:
    from freqtrade.strategy import IStrategy
    from pandas import DataFrame
except ImportError:  # Allows syntax checks outside a Freqtrade environment
    class IStrategy:  # type: ignore[no-redef]
        pass

    DataFrame = object  # type: ignore[misc, assignment]

from integrations.common.mcp_signal_reader import (
    get_stake_multiplier,
    load_historical_signal,
    should_allow_entry,
)


class McpEnhancedStrategy(IStrategy):
    """Example Freqtrade strategy that overlays Crypto MCP risk & sentiment signals."""

    INTERFACE_VERSION = 3
    timeframe = "1h"
    minimal_roi = {"0": 0.05, "60": 0.02, "180": 0.0}
    stoploss = -0.08
    process_only_new_candles = True

    mcp_signal_file = os.getenv("MCP_SIGNAL_FILE", "data/mcp_signals.json")
    mcp_history_db = os.getenv("MCP_HISTORY_DB", "")
    mcp_fail_open = True

    def _is_live_or_dry(self) -> bool:
        dp = getattr(self, "dp", None)
        runmode = getattr(getattr(dp, "runmode", None), "value", None)
        return runmode in ("live", "dry_run")

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        # Keep technical indicators deterministic and fast inside Freqtrade.
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        return dataframe

    def confirm_trade_entry(
        self,
        pair: str,
        order_type: str,
        amount: float,
        rate: float,
        time_in_force: str,
        current_time: datetime,
        entry_tag: Optional[str],
        side: str,
        **kwargs,
    ) -> bool:
        """Veto new entries when Crypto MCP Server flags a HALT regime or blocked pair."""
        if not self._is_live_or_dry():
            if self.mcp_history_db:
                hist = load_historical_signal(current_time, db_path=self.mcp_history_db)
                if hist and not hist.get("allow_entries", True):
                    return False
            return True
        allowed, _reason = should_allow_entry(
            pair=pair,
            signal_path=self.mcp_signal_file,
            fail_open=self.mcp_fail_open,
        )
        return allowed

    def custom_stake_amount(
        self,
        pair: str,
        current_time: datetime,
        current_rate: float,
        proposed_stake: float,
        min_stake: Optional[float],
        max_stake: float,
        leverage: float,
        entry_tag: Optional[str],
        side: str,
        **kwargs,
    ) -> float:
        """Scale position size using Crypto MCP Server's `stake_multiplier`."""
        if not self._is_live_or_dry():
            if self.mcp_history_db:
                hist = load_historical_signal(current_time, db_path=self.mcp_history_db)
                if hist:
                    mult = float(hist.get("stake_multiplier", 1.0))
                    return min(max(proposed_stake * mult, min_stake or 0.0), max_stake)
            return proposed_stake
        mult = get_stake_multiplier(signal_path=self.mcp_signal_file, default=1.0, pair=pair)
        adjusted = proposed_stake * mult
        if min_stake is not None and adjusted < min_stake:
            return proposed_stake if mult >= 1.0 else min_stake
        return min(adjusted, max_stake)
