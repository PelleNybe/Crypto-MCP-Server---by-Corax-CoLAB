"""
mcp_signal_filter.py
Lightweight helper for Hummingbot v2 scripts & controllers to consume
Crypto MCP Server signals (`data/mcp_signals.json`) with <1ms overhead.
"""

from typing import Tuple

from integrations.common.mcp_signal_reader import (
    DEFAULT_SIGNAL_FILE,
    get_spread_multiplier,
    get_stake_multiplier,
    should_allow_entry,
)


def adjust_market_making_params(
    pair: str,
    base_bid_spread: float,
    base_ask_spread: float,
    base_order_amount: float,
    signal_path: str = DEFAULT_SIGNAL_FILE,
) -> Tuple[bool, float, float, float, str]:
    """
    Adjust Hummingbot market-making spreads and order size based on Crypto MCP regime.

    Returns `(allow_orders, bid_spread, ask_spread, order_amount, reason)`.
    """
    allowed, reason = should_allow_entry(pair=pair, signal_path=signal_path, fail_open=True)
    spread_mult = get_spread_multiplier(signal_path=signal_path, default=1.0)
    stake_mult = get_stake_multiplier(signal_path=signal_path, default=1.0)

    return (
        allowed,
        base_bid_spread * spread_mult,
        base_ask_spread * spread_mult,
        base_order_amount * stake_mult,
        reason,
    )
