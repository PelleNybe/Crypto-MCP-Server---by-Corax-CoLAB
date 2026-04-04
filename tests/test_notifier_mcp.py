import sys
from unittest.mock import MagicMock

# Mock dependencies thoroughly
mock_mcp = MagicMock()
mock_fastmcp = MagicMock()
mock_fastmcp.tool.return_value = lambda f: f
mock_mcp.server.fastmcp.FastMCP.return_value = mock_fastmcp

sys.modules["mcp"] = mock_mcp
sys.modules["mcp.server.fastmcp"] = MagicMock()
sys.modules["mcp.server.fastmcp"].FastMCP = MagicMock(return_value=mock_fastmcp)
sys.modules["requests"] = MagicMock()
sys.modules["ccxt"] = MagicMock()
sys.modules["web3"] = MagicMock()
sys.modules["web3.middleware"] = MagicMock()
sys.modules["web3.gas_strategies.time_based"] = MagicMock()
sys.modules["dotenv"] = MagicMock()
sys.modules["eth_account"] = MagicMock()

from unittest.mock import MagicMock, patch

# Mock dependencies before importing notifier_mcp
mock_mcp_instance = MagicMock()
# Mock the @mcp.tool() decorator
mock_mcp_instance.tool.return_value = lambda f: f

fastmcp_module = MagicMock()
fastmcp_module.FastMCP.return_value = mock_mcp_instance

sys.modules["mcp"] = MagicMock()
sys.modules["mcp.server"] = MagicMock()
sys.modules["mcp.server.fastmcp"] = fastmcp_module
sys.modules["dotenv"] = MagicMock()
sys.modules["requests"] = MagicMock()

import pytest
import notifier_mcp

def test_ping():
    res = notifier_mcp.ping()
    assert "alive" in res

@patch('notifier_mcp.TELEGRAM_TOKEN', 'fake_token')
@patch('notifier_mcp.TELEGRAM_CHAT', 'fake_chat')
@patch('notifier_mcp.requests.post')
def test_send_telegram_success(mock_post):
    # Setup
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"ok": True}
    mock_post.return_value = mock_response

    # Execute
    res = notifier_mcp.send_telegram("test message")

    # Assert
    assert res["status"] == 200
    assert res["result"]["ok"] is True
    mock_post.assert_called_once_with(
        "https://api.telegram.org/botfake_token/sendMessage",
        json={"chat_id": "fake_chat", "text": "test message"}
    )

@patch('notifier_mcp.TELEGRAM_TOKEN', None)
@patch('notifier_mcp.TELEGRAM_CHAT', None)
def test_send_telegram_missing_env_vars():
    # Execute & Assert
    with pytest.raises(RuntimeError) as excinfo:
        notifier_mcp.send_telegram("test message")

    assert "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing in .env" in str(excinfo.value)

@patch('notifier_mcp.DISCORD_WEBHOOK', 'https://discord.com/api/webhooks/123')
@patch('notifier_mcp.requests.post')
def test_send_discord_success(mock_post):
    # Setup
    mock_response = MagicMock()
    mock_response.status_code = 204
    mock_response.text = "success"
    mock_post.return_value = mock_response

    # Execute
    res = notifier_mcp.send_discord("test message")

    # Assert
    assert res["status"] == 204
    assert res["result_text"] == "success"
    mock_post.assert_called_once_with(
        "https://discord.com/api/webhooks/123",
        json={"content": "test message"}
    )

@patch('notifier_mcp.DISCORD_WEBHOOK', None)
def test_send_discord_missing_env_vars():
    # Execute & Assert
    with pytest.raises(RuntimeError) as excinfo:
        notifier_mcp.send_discord("test message")

    assert "DISCORD_WEBHOOK_URL is missing in .env" in str(excinfo.value)
