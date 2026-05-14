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

import superalgos_mcp


def test_req_success():
    with patch("superalgos_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": True}
        mock_request.return_value = mock_response

        result = superalgos_mcp._req("test/path")

        assert result["status_code"] == 200
        assert result["json"] == {"success": True}
        mock_request.assert_called_once()
        args, kwargs = mock_request.call_args
        assert kwargs["timeout"] == 15
        assert kwargs["headers"]["Content-Type"] == "application/json"
        assert args[0] == "get"
        assert args[1].endswith("test/path")


def test_req_exception():
    with patch("superalgos_mcp.requests.request") as mock_request:
        mock_request.side_effect = Exception("Connection Refused")

        result = superalgos_mcp._req("test/path")

        assert result["status_code"] == 500
        assert result["error"] == "Connection Refused"
        assert "json" not in result


def test_req_headers_with_api_key():
    with patch("superalgos_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {}
        mock_request.return_value = mock_response

        original_api_key = superalgos_mcp.SUPERALGOS_API_KEY
        superalgos_mcp.SUPERALGOS_API_KEY = "test_key_123"

        try:
            superalgos_mcp._req("test/path")
            args, kwargs = mock_request.call_args
            assert "Authorization" in kwargs["headers"]
            assert kwargs["headers"]["Authorization"] == "Bearer test_key_123"
            assert kwargs["headers"]["Content-Type"] == "application/json"
        finally:
            superalgos_mcp.SUPERALGOS_API_KEY = original_api_key


def test_req_headers_without_api_key():
    with patch("superalgos_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {}
        mock_request.return_value = mock_response

        original_api_key = superalgos_mcp.SUPERALGOS_API_KEY
        superalgos_mcp.SUPERALGOS_API_KEY = None

        try:
            superalgos_mcp._req("test/path")
            args, kwargs = mock_request.call_args
            assert "Authorization" not in kwargs["headers"]
            assert kwargs["headers"]["Content-Type"] == "application/json"
        finally:
            superalgos_mcp.SUPERALGOS_API_KEY = original_api_key


def test_ping():
    with patch("superalgos_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {}
        mock_request.return_value = mock_response

        result = superalgos_mcp.ping()
        assert "superalgos_mcp alive" in result
        assert superalgos_mcp.SUPERALGOS_REST_URL in result
        assert "status=200" in result


def test_get_workspaces():
    with patch("superalgos_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"workspaces": []}
        mock_request.return_value = mock_response

        result = superalgos_mcp.get_workspaces()
        assert result["status_code"] == 200
        assert result["json"] == {"workspaces": []}
        args, kwargs = mock_request.call_args
        assert args[1].endswith("GetWorkspaces")


def test_start_task():
    with patch("superalgos_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"started": True}
        mock_request.return_value = mock_response

        result = superalgos_mcp.start_task("MyTask")
        assert result["status_code"] == 200
        assert result["json"] == {"started": True}
        args, kwargs = mock_request.call_args
        assert args[0] == "post"
        assert args[1].endswith("StartTask")
        assert kwargs["json"] == {"taskName": "MyTask"}


def test_stop_task():
    with patch("superalgos_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"stopped": True}
        mock_request.return_value = mock_response

        result = superalgos_mcp.stop_task("MyTask")
        assert result["status_code"] == 200
        assert result["json"] == {"stopped": True}
        args, kwargs = mock_request.call_args
        assert args[0] == "post"
        assert args[1].endswith("StopTask")
        assert kwargs["json"] == {"taskName": "MyTask"}


def test_get_task_status():
    with patch("superalgos_mcp.requests.request") as mock_request:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "Running"}
        mock_request.return_value = mock_response

        result = superalgos_mcp.get_task_status("MyTask")
        assert result["status_code"] == 200
        assert result["json"] == {"status": "Running"}
        args, kwargs = mock_request.call_args
        assert args[1].endswith("TaskStatus?task=MyTask")
