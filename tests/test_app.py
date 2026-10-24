import pytest
from app import app

def test_app_wsgi_response():
    environ = {}
    response_headers = []
    response_status = []

    def start_response(status, headers):
        response_status.append(status)
        response_headers.append(headers)

    response = b"".join(list(app(environ, start_response)))

    assert "200 OK" in response_status[0]
    assert response == b"Crypto MCP Server API is running.\n"
    assert ("Content-Type", "text/plain") in response_headers[0]
