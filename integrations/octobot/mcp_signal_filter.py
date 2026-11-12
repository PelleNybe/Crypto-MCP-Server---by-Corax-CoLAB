"""
mcp_signal_filter.py
Lightweight helper for OctoBot evaluators / trading modes to consume
Crypto MCP Server signals (`data/mcp_signals.json`).
"""

from integrations.common.mcp_signal_reader import (
    DEFAULT_SIGNAL_FILE,
    get_stake_multiplier,
    load_mcp_signal,
    should_allow_entry,
)


def get_octobot_eval_score(pair: str, signal_path: str = DEFAULT_SIGNAL_FILE) -> float:
    """
    Convert Crypto MCP Server regime into an OctoBot-style evaluator score in [-1.0, 1.0].
    -1.0 = strong bearish / halt, 0.0 = neutral, +1.0 = strong risk-on.
    """
    allowed, _ = should_allow_entry(pair=pair, signal_path=signal_path, fail_open=True)
    if not allowed:
        return 1.0  # In OctoBot, +1 evaluation often represents bearish/sell pressure or veto

    data, fresh = load_mcp_signal(signal_path)
    if not fresh or data is None:
        return 0.0

    # Map risk_score (0=calm/bullish .. 100=extreme risk) to [-0.6, +0.8]
    risk_score = float(data.get("risk_score", 50))
    return round(max(-1.0, min(1.0, (risk_score - 50.0) / 50.0)), 3)


def get_octobot_size_multiplier(signal_path: str = DEFAULT_SIGNAL_FILE) -> float:
    """Return position-size multiplier from Crypto MCP Server."""
    return get_stake_multiplier(signal_path=signal_path, default=1.0)
