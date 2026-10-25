import pytest
import sys
import json
import io
from unittest.mock import MagicMock, patch

# Mock mcp
mock_mcp = MagicMock()
mock_fastmcp = MagicMock()
mock_fastmcp.tool.return_value = lambda f: f
mock_mcp.server.fastmcp.FastMCP.return_value = mock_fastmcp

sys.modules["mcp"] = mock_mcp
sys.modules["mcp.server.fastmcp"] = MagicMock()
sys.modules["mcp.server.fastmcp"].FastMCP = MagicMock(return_value=mock_fastmcp)
sys.modules["dotenv"] = MagicMock()

import ha_mcp

@patch('ha_mcp.ha')
def test_ha_run_success(mock_ha):
    mock_cmd = MagicMock()

    # We must patch sys.stdout inside the test explicitly because _run intercepts it
    def mock_cmd_side_effect(ns):
        sys.stdout.write(json.dumps({"success": True}))

    mock_cmd.side_effect = mock_cmd_side_effect

    res = ha_mcp._run(mock_cmd)

    assert res == {"success": True}

@patch('ha_mcp.ha')
def test_ha_run_text_fallback(mock_ha):
    mock_cmd = MagicMock()

    # Simulate the command printing non-JSON text
    def mock_cmd_side_effect(ns):
        sys.stdout.write("Hello World")

    mock_cmd.side_effect = mock_cmd_side_effect

    res = ha_mcp._run(mock_cmd)

    assert res == {"text": "Hello World"}

@patch('ha_mcp.ha')
def test_ha_run_hafailure(mock_ha):
    mock_cmd = MagicMock()
    mock_ha.HAFailure = Exception
    mock_cmd.side_effect = Exception("HA failed")

    res = ha_mcp._run(mock_cmd)

    assert res == {"error": "HA failed"}

@patch('ha_mcp._run')
def test_endpoints(mock_run):
    mock_run.return_value = {"ok": True}

    assert ha_mcp.ha_update_check() == {"ok": True}
    assert ha_mcp.ha_agents() == {"ok": True}
    assert ha_mcp.ha_use("agent-id") == {"ok": True}
    assert ha_mcp.ha_register("a", "b", "c", "d", "e") == {"ok": True}
    assert ha_mcp.ha_status() == {"ok": True}
    assert ha_mcp.ha_challenges("t") == {"ok": True}
    assert ha_mcp.ha_predict("c", "bullish", 0.9, "reason") == {"ok": True}
    assert ha_mcp.ha_forecast("c", 10.0, 5.0, 1.0, 0.5, 0, "reason") == {"ok": True}
    assert ha_mcp.ha_leaderboard() == {"ok": True}
