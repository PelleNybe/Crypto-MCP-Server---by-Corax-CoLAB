from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

import bot_bridge
import strategy_doctor
from integrations.common.mcp_signal_reader import (
    get_spread_multiplier,
    get_stake_multiplier,
    load_historical_signal,
    load_mcp_signal,
    should_allow_entry,
)
from integrations.freqtrade.McpEnhancedStrategy import McpEnhancedStrategy
from integrations.hummingbot.mcp_signal_filter import adjust_market_making_params
from integrations.octobot.mcp_signal_filter import (
    get_octobot_eval_score,
    get_octobot_size_multiplier,
)


def test_compute_market_regime_halt_and_blocked_pairs():
    news = {
        "news": [
            {"title": "Major exchange hack and exploit drains hot wallet", "currencies": [{"code": "SOL"}]},
            {"title": "Stablecoin depeg triggers liquidation cascade", "currencies": [{"code": "ETH"}]},
            {"title": "Protocol outage halts withdrawals"},
        ]
    }
    ta = {"indicators": {"rsi": 80.0, "atr_pct": 6.5, "trend": "bearish"}}
    gas = {"gas_price_gwei": 180.0}

    sig = bot_bridge.compute_market_regime(news_data=news, ta_data=ta, gas_data=gas)
    assert sig["regime"] == "halt"
    assert sig["risk_score"] >= 80
    assert sig["allow_entries"] is False
    assert sig["stake_multiplier"] == 0.0
    assert sig["spread_multiplier"] == 2.5
    assert "SOL/USDT" in sig["blocked_pairs"]
    assert "ETH/USDT" in sig["blocked_pairs"]


def test_compute_market_regime_risk_on():
    news = {
        "news": [
            {"title": "Bitcoin ETF inflow hits record high on institutional adoption"},
            {"title": "Major network upgrade sparks breakout"},
        ]
    }
    ta = {"indicators": {"rsi": 55.0, "atr_pct": 2.1, "trend": "bullish"}}
    gas = {"gas_price_gwei": 15.0}

    sig = bot_bridge.compute_market_regime(news_data=news, ta_data=ta, gas_data=gas)
    assert sig["regime"] == "risk_on"
    assert sig["risk_score"] < 30
    assert sig["allow_entries"] is True
    assert sig["stake_multiplier"] == 1.15


def test_signal_reader_fresh_stale_and_missing(tmp_path):
    sig_path = tmp_path / "mcp_signals.json"

    # Missing file fails open by default
    allowed, reason = should_allow_entry("BTC/USDT", signal_path=str(sig_path), fail_open=True)
    assert allowed is True
    assert "fail_open" in reason

    # Fresh halt signal blocks entry and blocks specific pair
    sig = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "ttl_seconds": 300,
        "risk_score": 85,
        "regime": "halt",
        "allow_entries": False,
        "stake_multiplier": 0.0,
        "spread_multiplier": 2.5,
        "blocked_pairs": ["SOL/USDT"],
    }
    bot_bridge.write_signal_file(sig, output_path=str(sig_path))

    loaded, fresh = load_mcp_signal(str(sig_path))
    assert fresh is True
    assert loaded["regime"] == "halt"
    assert should_allow_entry("BTC/USDT", signal_path=str(sig_path))[0] is False
    assert get_stake_multiplier(str(sig_path)) == 0.0
    assert get_spread_multiplier(str(sig_path)) == 2.5

    # Stale signal falls back safely
    stale_sig = dict(sig)
    stale_sig["generated_at"] = (datetime.now(timezone.utc) - timedelta(minutes=20)).isoformat()
    bot_bridge.write_signal_file(stale_sig, output_path=str(sig_path))
    _, fresh_stale = load_mcp_signal(str(sig_path))
    assert fresh_stale is False
    assert should_allow_entry("BTC/USDT", signal_path=str(sig_path), fail_open=True)[0] is True
    assert get_stake_multiplier(str(sig_path), default=1.0) == 1.0


def test_hummingbot_and_octobot_filters(tmp_path):
    sig_path = tmp_path / "mcp_signals.json"
    sig = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "ttl_seconds": 300,
        "risk_score": 65,
        "regime": "caution",
        "allow_entries": True,
        "stake_multiplier": 0.5,
        "spread_multiplier": 1.5,
        "blocked_pairs": ["DOGE/USDT"],
    }
    bot_bridge.write_signal_file(sig, output_path=str(sig_path))

    allow_btc, bid, ask, amt, _ = adjust_market_making_params(
        "BTC/USDT", 0.002, 0.002, 100.0, signal_path=str(sig_path)
    )
    assert allow_btc is True
    assert bid == pytest.approx(0.003)
    assert ask == pytest.approx(0.003)
    assert amt == pytest.approx(50.0)

    allow_doge, *_ = adjust_market_making_params(
        "DOGE/USDT", 0.002, 0.002, 100.0, signal_path=str(sig_path)
    )
    assert allow_doge is False

    assert get_octobot_eval_score("BTC/USDT", signal_path=str(sig_path)) == pytest.approx(0.3)
    assert get_octobot_eval_score("DOGE/USDT", signal_path=str(sig_path)) == 1.0
    assert get_octobot_size_multiplier(str(sig_path)) == 0.5


def test_freqtrade_strategy_live_vs_backtest(tmp_path):
    sig_path = tmp_path / "mcp_signals.json"
    sig = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "ttl_seconds": 300,
        "risk_score": 90,
        "regime": "halt",
        "allow_entries": False,
        "stake_multiplier": 0.0,
        "spread_multiplier": 2.5,
        "blocked_pairs": ["BTC/USDT"],
    }
    bot_bridge.write_signal_file(sig, output_path=str(sig_path))

    strat = McpEnhancedStrategy()
    strat.mcp_signal_file = str(sig_path)

    # Backtest mode: bypasses live MCP veto
    strat.dp = SimpleNamespace(runmode=SimpleNamespace(value="backtest"))
    assert strat.confirm_trade_entry("BTC/USDT", "limit", 1.0, 50000.0, "GTC", datetime.now(timezone.utc), None, "long") is True
    assert strat.custom_stake_amount("BTC/USDT", datetime.now(timezone.utc), 50000.0, 100.0, 10.0, 500.0, 1.0, None, "long") == 100.0

    # Live mode: vetoes entry and scales stake
    strat.dp = SimpleNamespace(runmode=SimpleNamespace(value="live"))
    assert strat.confirm_trade_entry("BTC/USDT", "limit", 1.0, 50000.0, "GTC", datetime.now(timezone.utc), None, "long") is False


@pytest.mark.asyncio
async def test_apply_bot_guardrails_executes_halt_actions():
    sig = {
        "risk_score": 88,
        "regime": "halt",
        "blocked_pairs": ["SOL/USDT"],
        "reasons": ["Major hack"],
    }
    with patch("bot_bridge.call_mcp_tool", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = {"status_code": 200}
        res = await bot_bridge.apply_bot_guardrails(
            client=None,  # type: ignore[arg-type]
            signal=sig,
            guard_freqtrade=True,
            guard_octobot=True,
            notify=True,
        )
    assert res["triggered"] is True
    assert "freqtrade:stopbuy" in res["actions"]
    assert "freqtrade:lock:SOL/USDT" in res["actions"]
    assert "octobot:stop_bot" in res["actions"]
    assert "notifier:alert_sent" in res["actions"]


def test_per_pair_signal_and_history_replay(tmp_path):
    sig_path = tmp_path / "mcp_signals.json"
    db_path = tmp_path / "mcp_signal_history.db"

    global_sig = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "ttl_seconds": 300,
        "symbol": "BTC/USDT",
        "risk_score": 40,
        "regime": "neutral",
        "allow_entries": True,
        "stake_multiplier": 1.0,
        "spread_multiplier": 1.0,
        "blocked_pairs": ["XRP/USDT"],
        "pair_signals": {},
    }
    global_sig["pair_signals"]["ETH/USDT"] = bot_bridge.compute_pair_signal(
        "ETH/USDT", {"indicators": {"rsi": 52.0, "trend": "bullish"}}, global_sig
    )
    global_sig["pair_signals"]["XRP/USDT"] = bot_bridge.compute_pair_signal(
        "XRP/USDT", {"indicators": {"rsi": 81.0, "trend": "bearish"}}, global_sig
    )

    bot_bridge.write_signal_file(global_sig, output_path=str(sig_path))
    bot_bridge.record_signal_history(global_sig, db_path=str(db_path))

    assert should_allow_entry("ETH/USDT", signal_path=str(sig_path))[0] is True
    assert get_stake_multiplier(str(sig_path), pair="ETH/USDT") == 1.15
    assert should_allow_entry("XRP/USDT", signal_path=str(sig_path))[0] is False

    # Historical replay lookup
    future_ts = datetime.now(timezone.utc) + timedelta(seconds=5)
    hist = load_historical_signal(future_ts, db_path=str(db_path))
    assert hist is not None
    assert hist["symbol"] == "BTC/USDT"


def test_strategy_doctor_diagnosis():
    perf = {
        "ok": True,
        "recent_closed_count": 10,
        "recent_win_rate": 0.3,
        "top_pairs": [{"pair": "BTC/USDT", "profit_abs": 120.0, "count": 4}],
        "worst_pairs": [{"pair": "MEME/USDT", "profit_abs": -45.0, "count": 3}],
    }
    diag = strategy_doctor.diagnose_performance(perf)
    assert diag["ok"] is True
    assert "MEME/USDT" in diag["blacklist_candidates"]
    assert "BTC/USDT" in diag["top_pairs"]
    assert any("Low recent win rate" in r for r in diag["recommendations"])
