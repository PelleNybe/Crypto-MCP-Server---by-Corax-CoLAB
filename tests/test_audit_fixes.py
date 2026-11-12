"""Regression tests for security and runtime fixes from the repository audit."""

import sys
from unittest.mock import MagicMock, patch

for _mod in ("ccxt", "dotenv", "requests", "httpx", "web3", "web3.middleware", "mcp", "mcp.server", "mcp.server.fastmcp"):
    if _mod not in sys.modules:
        try:
            __import__(_mod)
        except ImportError:
            sys.modules[_mod] = MagicMock()

if isinstance(sys.modules.get("mcp.server.fastmcp"), MagicMock):
    class _FakeFastMCP:
        def __init__(self, *args, **kwargs):
            pass
        def tool(self):
            return lambda fn: fn
        def run(self, *args, **kwargs):
            pass
    sys.modules["mcp.server.fastmcp"].FastMCP = _FakeFastMCP

import ccxt_mcp
import ha_mcp
import onchain_mcp


def test_execute_approved_order_fails_closed_when_password_unset(monkeypatch):
    monkeypatch.delenv("DASHBOARD_PASSWORD", raising=False)
    res = ccxt_mcp.execute_approved_order(
        "binance", "BTC/USDT", "buy", "market", 0.001, params={"approval_token": ""}
    )
    assert "error" in res
    assert "Unauthorized" in res["error"]


def test_execute_approved_order_enforces_allowed_pairs_and_max_usd(monkeypatch):
    monkeypatch.setenv("DASHBOARD_PASSWORD", "secret123")
    monkeypatch.setattr(ccxt_mcp, "ALLOWED_PAIRS", ["BTC/USDT"])
    monkeypatch.setattr(ccxt_mcp, "MAX_TRADE_USD", 100.0)

    res_pair = ccxt_mcp.execute_approved_order(
        "binance", "DOGE/USDT", "buy", "market", 10, params={"approval_token": "secret123"}
    )
    assert "ALLOWED_PAIRS" in res_pair["error"]

    mock_ex = MagicMock()
    mock_ex.fetch_ticker.return_value = {"last": 50000.0}
    with patch("ccxt_mcp._make_exchange", return_value=mock_ex):
        res_cap = ccxt_mcp.execute_approved_order(
            "binance", "BTC/USDT", "buy", "market", 1.0, params={"approval_token": "secret123"}
        )
    assert "MAX_TRADE_USD" in res_cap["error"]


def test_ttl_cache_handles_dict_kwargs():
    calls = {"n": 0}

    @ccxt_mcp.ttl_cache(seconds=60)
    def sample(x, params=None):
        calls["n"] += 1
        return {"x": x, "params": params}

    r1 = sample(1, params={"a": 2, "b": 3})
    r2 = sample(1, params={"b": 3, "a": 2})
    assert r1 == r2
    assert calls["n"] == 1


def test_onchain_validate_rpc_url_blocks_ssrf(monkeypatch):
    monkeypatch.delenv("ALLOW_PRIVATE_RPC", raising=False)
    for bad in [
        "http://localhost:8545",
        "http://127.0.0.1:8545",
        "http://169.254.169.254/latest/meta-data/",
        "http://10.0.0.5:8545",
        "file:///etc/passwd",
    ]:
        try:
            onchain_mcp._validate_rpc_url(bad)
            assert False, f"Expected ValueError for {bad}"
        except ValueError:
            pass

    assert onchain_mcp._validate_rpc_url("https://eth.llamarpc.com") == "https://eth.llamarpc.com"


def test_onchain_to_json_safe_handles_bytes():
    safe = onchain_mcp._to_json_safe({"hash": b"\xab\xcd", "nested": [b"\x01"]})
    assert safe == {"hash": "0xabcd", "nested": ["0x01"]}


def test_ha_mcp_default_namespace_prevents_attribute_error():
    def fake_cmd(ns):
        assert ns.rankings is None
        assert ns.wait is None
        print('{"ok": true}')

    res = ha_mcp._run(fake_cmd)
    assert res == {"ok": True}
