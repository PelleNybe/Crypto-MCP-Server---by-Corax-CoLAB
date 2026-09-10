def app(environ, start_response):
    data = b"Crypto MCP Server API is running.\n"
    start_response("200 OK", [
        ("Content-Type", "text/plain"),
        ("Content-Length", str(len(data)))
    ])
    return iter([data])
