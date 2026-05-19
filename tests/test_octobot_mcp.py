import sys
from unittest.mock import MagicMock, patch

# Mock dependencies thoroughly before importing
mock_mcp = MagicMock()
mock_fastmcp = MagicMock()
mock_fastmcp.tool.return_value = lambda f: f
mock_mcp.server.fastmcp.FastMCP.return_value = mock_fastmcp

sys.modules["mcp"] = mock_mcp
sys.modules["mcp.server.fastmcp"] = MagicMock()
sys.modules["mcp.server.fastmcp"].FastMCP = MagicMock(return_value=mock_fastmcp)
sys.modules["requests"] = MagicMock()
sys.modules["dotenv"] = MagicMock()

import octobot_mcp


def test_req_success():
    with patch("octobot_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": True}
        mock_request.return_value = mock_response

        result = octobot_mcp._req("api/test")

        assert result["status_code"] == 200
        assert result["json"] == {"success": True}
        mock_request.assert_called_once()
        args, kwargs = mock_request.call_args
        assert kwargs["timeout"] == 15
        assert args[0] == "get"
        assert args[1].endswith("api/test")


def test_req_exception():
    with patch("octobot_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.json.side_effect = Exception("No JSON")
        mock_response.text = "Internal Server Error"
        mock_request.return_value = mock_response

        result = octobot_mcp._req("api/test")

        assert result["status_code"] == 500
        assert "text" in result
        assert result["text"] == "Internal Server Error"
        assert "json" not in result


def test_req_headers_with_api_key():
    with patch("octobot_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {}
        mock_request.return_value = mock_response

        original_api_key = octobot_mcp.OCTOBOT_API_KEY
        octobot_mcp.OCTOBOT_API_KEY = "test_key_123"

        try:
            octobot_mcp._req("api/test")
            args, kwargs = mock_request.call_args
            assert "Authorization" in kwargs["headers"]
            assert kwargs["headers"]["Authorization"] == "Bearer test_key_123"
        finally:
            octobot_mcp.OCTOBOT_API_KEY = original_api_key


def test_req_headers_without_api_key():
    with patch("octobot_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {}
        mock_request.return_value = mock_response

        original_api_key = octobot_mcp.OCTOBOT_API_KEY
        octobot_mcp.OCTOBOT_API_KEY = None

        try:
            octobot_mcp._req("api/test")
            args, kwargs = mock_request.call_args
            assert "Authorization" not in kwargs["headers"]
        finally:
            octobot_mcp.OCTOBOT_API_KEY = original_api_key


def test_req_request_exception():
    with patch("octobot_mcp.requests.request") as mock_request:
        mock_request.side_effect = Exception("Connection Timeout")

        result = octobot_mcp._req("api/test")

        assert result["status_code"] == 500
        assert "text" in result
        assert result["text"] == "Connection Timeout"
        assert "json" not in result


def test_status_success():
    with patch("octobot_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"bot_status": "running"}
        mock_request.return_value = mock_response

        result = octobot_mcp.status()

        assert result["status_code"] == 200
        assert result["json"] == {"bot_status": "running"}
        mock_request.assert_called_once()
        args, kwargs = mock_request.call_args
        assert args[1].endswith("api/bot/status")


def test_status_error():
    with patch("octobot_mcp.requests.request") as mock_request:
        mock_request.side_effect = Exception("API connection failed")

        result = octobot_mcp.status()

        assert result["status_code"] == 500
        assert "text" in result
        assert result["text"] == "API connection failed"
        assert "json" not in result


def test_ping():
    result = octobot_mcp.ping()
    assert "octobot_mcp alive" in result
    assert octobot_mcp.OCTOBOT_REST_URL in result


def test_portfolio_success():
    with patch("octobot_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"portfolio": {}}
        mock_request.return_value = mock_response

        result = octobot_mcp.portfolio()

        assert result["status_code"] == 200
        assert result["json"] == {"portfolio": {}}
        mock_request.assert_called_once()
        args, kwargs = mock_request.call_args
        assert args[1].endswith("api/portfolio/get_portfolio")


def test_start_bot_success():
    with patch("octobot_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"started": True}
        mock_request.return_value = mock_response

        result = octobot_mcp.start_bot()

        assert result["status_code"] == 200
        assert result["json"] == {"started": True}
        mock_request.assert_called_once()
        args, kwargs = mock_request.call_args
        assert args[0] == "post"
        assert args[1].endswith("api/bot/start")


def test_stop_bot_success():
    with patch("octobot_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"stopped": True}
        mock_request.return_value = mock_response

        result = octobot_mcp.stop_bot()

        assert result["status_code"] == 200
        assert result["json"] == {"stopped": True}
        mock_request.assert_called_once()
        args, kwargs = mock_request.call_args
        assert args[0] == "post"
        assert args[1].endswith("api/bot/stop")


def test_history_success():
    with patch("octobot_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"history": []}
        mock_request.return_value = mock_response

        result = octobot_mcp.history()

        assert result["status_code"] == 200
        assert result["json"] == {"history": []}
        mock_request.assert_called_once()
        args, kwargs = mock_request.call_args
        assert args[1].endswith("api/trading/history")
