import sys
from unittest.mock import MagicMock

# Mock required modules to prevent import errors in missing deps environment
sys.modules["mcp"] = MagicMock()
sys.modules["mcp.client"] = MagicMock()
sys.modules["mcp.client.session"] = MagicMock()
sys.modules["mcp.client.stdio"] = MagicMock()
sys.modules["mcp.types"] = MagicMock()
sys.modules["telegram"] = MagicMock()
sys.modules["telegram.ext"] = MagicMock()
sys.modules["dotenv"] = MagicMock()

import pytest
import json
from unittest.mock import patch, mock_open
from autonomous_orchestrator import load_config, calculate_consensus


def test_load_config_valid():
    """Test loading a valid configuration file."""
    valid_json = '{"mcpServers": {"test": {}}}'
    with patch("builtins.open", mock_open(read_data=valid_json)):
        config = load_config()
        assert config == {"mcpServers": {"test": {}}}


def test_load_config_not_found():
    """Test behavior when configuration file is missing."""
    with patch("builtins.open", side_effect=FileNotFoundError):
        config = load_config()
        assert config == {}


def test_load_config_invalid_json():
    """Test behavior when configuration file contains invalid JSON."""
    invalid_json = '{"mcpServers": {}'  # Missing closing bracket
    with patch("builtins.open", mock_open(read_data=invalid_json)):
        with patch("autonomous_orchestrator.logger.error") as mock_logger_error:
            config = load_config()
            assert config == {}
            mock_logger_error.assert_called_once()
            assert (
                "Error parsing configuration file" in mock_logger_error.call_args[0][0]
            )


def test_calculate_consensus_buy_majority():
    """Verifies that if 2 out of 3 votes are BUY, the consensus is BUY."""
    votes = [
        {"decision": "BUY", "provider": "p1"},
        {"decision": "BUY", "provider": "p2"},
        {"decision": "HOLD", "provider": "p3"},
    ]
    result = calculate_consensus(votes)
    assert result["decision"] == "BUY"
    assert result["vote_counts"]["BUY"] == 2
    assert result["total_votes"] == 3


def test_calculate_consensus_sell_majority():
    """Verifies that if 2 out of 2 votes are SELL, the consensus is SELL."""
    votes = [
        {"decision": "SELL", "provider": "p1"},
        {"decision": "SELL", "provider": "p2"},
    ]
    result = calculate_consensus(votes)
    assert result["decision"] == "SELL"
    assert result["vote_counts"]["SELL"] == 2
    assert result["total_votes"] == 2


def test_calculate_consensus_hold_majority():
    """Verifies that if 2 out of 3 votes are HOLD, the consensus is HOLD."""
    votes = [
        {"decision": "HOLD", "provider": "p1"},
        {"decision": "HOLD", "provider": "p2"},
        {"decision": "BUY", "provider": "p3"},
    ]
    result = calculate_consensus(votes)
    assert result["decision"] == "HOLD"
    assert result["vote_counts"]["HOLD"] == 2


def test_calculate_consensus_tie_no_majority():
    """Verifies that if there is a 1-1 tie between BUY and SELL, the consensus defaults to HOLD."""
    votes = [
        {"decision": "BUY", "provider": "p1"},
        {"decision": "SELL", "provider": "p2"},
    ]
    result = calculate_consensus(votes)
    assert result["decision"] == "HOLD"
    assert result["vote_counts"]["BUY"] == 1
    assert result["vote_counts"]["SELL"] == 1


def test_calculate_consensus_empty_votes():
    """Verifies that an empty list of votes results in a HOLD consensus."""
    votes = []
    result = calculate_consensus(votes)
    assert result["decision"] == "HOLD"
    assert result["total_votes"] == 0


def test_calculate_consensus_missing_decision_key():
    """Verifies that a vote dictionary missing the 'decision' key defaults to HOLD in the count."""
    votes = [
        {"provider": "p1"},  # Missing decision
        {"decision": "BUY", "provider": "p2"},
    ]
    # Total votes = 2. HOLD=1, BUY=1. No majority. Result should be HOLD.
    result = calculate_consensus(votes)
    assert result["decision"] == "HOLD"
    assert result["vote_counts"]["HOLD"] == 1
    assert result["vote_counts"]["BUY"] == 1


def test_calculate_consensus_case_insensitivity():
    """Verifies that lowercase 'buy' is correctly counted as 'BUY'."""
    votes = [
        {"decision": "buy", "provider": "p1"},
        {"decision": "BUY", "provider": "p2"},
        {"decision": "HOLD", "provider": "p3"},
    ]
    result = calculate_consensus(votes)
    assert result["decision"] == "BUY"
    assert result["vote_counts"]["BUY"] == 2
