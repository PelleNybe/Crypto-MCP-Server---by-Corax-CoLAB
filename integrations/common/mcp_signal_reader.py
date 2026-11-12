"""
Shared, zero-dependency signal reader for Freqtrade, Hummingbot, and OctoBot.
Reads `data/mcp_signals.json` produced by `bot_bridge.py` in <1ms with safe
staleness fallbacks so trading bots are never blocked by stale or missing files.
"""

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

DEFAULT_SIGNAL_FILE = os.getenv("MCP_SIGNAL_FILE", "data/mcp_signals.json")
DEFAULT_HISTORY_DB = os.getenv("MCP_HISTORY_DB", "")


def load_mcp_signal(
    signal_path: str = DEFAULT_SIGNAL_FILE,
    max_age_seconds: Optional[int] = None,
) -> Tuple[Optional[Dict[str, Any]], bool]:
    """
    Load the latest MCP signal JSON.

    Returns `(signal_dict, is_fresh)`. If the file does not exist, is invalid JSON,
    or is older than `max_age_seconds` (defaults to the signal's `ttl_seconds` or 300s),
    returns `(signal_or_none, False)`.
    """
    path = Path(signal_path)
    if not path.is_file():
        return None, False

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None, False

    if not isinstance(data, dict):
        return None, False

    generated_at = data.get("generated_at")
    if not generated_at:
        return data, False

    try:
        ts = datetime.fromisoformat(str(generated_at).replace("Z", "+00:00"))
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        age = (datetime.now(timezone.utc) - ts).total_seconds()
        ttl = max_age_seconds if max_age_seconds is not None else int(data.get("ttl_seconds", 300))
        return data, 0 <= age <= ttl
    except Exception:
        return data, False


def should_allow_entry(
    pair: str,
    signal_path: str = DEFAULT_SIGNAL_FILE,
    fail_open: bool = True,
) -> Tuple[bool, str]:
    """
    Check whether a new entry for `pair` should be allowed.

    Checks `pair_signals[pair]` first if present, then falls back to global
    `allow_entries` and `blocked_pairs`.
    """
    data, fresh = load_mcp_signal(signal_path)
    if not fresh or data is None:
        return (True, "mcp_signal_stale_or_missing_fail_open") if fail_open else (False, "mcp_signal_stale_or_missing")

    normalized_pair = pair.split(":")[0].upper()
    pair_signals = data.get("pair_signals")
    if isinstance(pair_signals, dict) and normalized_pair in pair_signals:
        ps = pair_signals[normalized_pair]
        if isinstance(ps, dict) and not ps.get("allow_entry", True):
            return False, f"mcp_pair_regime_{ps.get('regime', 'halt')}"

    if not data.get("allow_entries", True):
        return False, f"mcp_regime_{data.get('regime', 'halt')}"

    blocked = {str(p).upper() for p in data.get("blocked_pairs", [])}
    if normalized_pair in blocked or pair.upper() in blocked:
        return False, f"mcp_pair_blocked:{normalized_pair}"

    return True, f"mcp_regime_{data.get('regime', 'neutral')}"


def get_stake_multiplier(
    signal_path: str = DEFAULT_SIGNAL_FILE,
    default: float = 1.0,
    pair: Optional[str] = None,
) -> float:
    """Return position-size multiplier (0.0 - 1.25) for `pair` or global when fresh."""
    data, fresh = load_mcp_signal(signal_path)
    if not fresh or data is None:
        return default
    try:
        if pair:
            norm = pair.split(":")[0].upper()
            ps = data.get("pair_signals", {}).get(norm)
            if isinstance(ps, dict) and "stake_multiplier" in ps:
                return float(ps["stake_multiplier"])
        return float(data.get("stake_multiplier", default))
    except (TypeError, ValueError):
        return default


def get_spread_multiplier(
    signal_path: str = DEFAULT_SIGNAL_FILE,
    default: float = 1.0,
    pair: Optional[str] = None,
) -> float:
    """Return market-making spread multiplier for `pair` or global when fresh."""
    data, fresh = load_mcp_signal(signal_path)
    if not fresh or data is None:
        return default
    try:
        if pair:
            norm = pair.split(":")[0].upper()
            ps = data.get("pair_signals", {}).get(norm)
            if isinstance(ps, dict) and "spread_multiplier" in ps:
                return float(ps["spread_multiplier"])
        return float(data.get("spread_multiplier", default))
    except (TypeError, ValueError):
        return default


def load_historical_signal(
    at_time: datetime,
    db_path: str = DEFAULT_HISTORY_DB,
) -> Optional[Dict[str, Any]]:
    """
    Look up the most recent recorded MCP signal at or before `at_time` from SQLite
    for historical backtesting replay.
    """
    if not db_path or not Path(db_path).is_file():
        return None
    ts_iso = (at_time if at_time.tzinfo else at_time.replace(tzinfo=timezone.utc)).astimezone(timezone.utc).isoformat()
    try:
        with sqlite3.connect(str(db_path)) as conn:
            row = conn.execute(
                "SELECT payload_json FROM signal_history WHERE generated_at <= ? ORDER BY generated_at DESC LIMIT 1",
                (ts_iso,),
            ).fetchone()
            if row and row[0]:
                return json.loads(row[0])
    except Exception:
        return None
    return None
