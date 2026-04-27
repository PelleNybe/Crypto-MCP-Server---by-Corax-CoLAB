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
from autonomous_orchestrator import load_config


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
