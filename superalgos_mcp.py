#!/usr/bin/env python3
"""
superalgos_mcp.py
MCP server to interact with Superalgos platform API.
For Crypto MCP Server – Produced by Corax CoLAB - The Future of Edge AI & Blockchain
"""

import os
import logging
import requests
from typing import Any, Dict, Optional
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("superalgos_mcp")

mcp = FastMCP(
    name="superalgos",
    stateless_http=True,
    json_response=True,
    host="0.0.0.0",
    port=7014,
)

SUPERALGOS_REST_URL = os.getenv("SUPERALGOS_REST_URL", "http://127.0.0.1:34248")
SUPERALGOS_API_KEY = os.getenv("SUPERALGOS_API_KEY", None)


def _req(path: str, method: str = "get", json: Optional[dict] = None) -> Dict[str, Any]:
    url = SUPERALGOS_REST_URL.rstrip("/") + "/" + path.lstrip("/")
    headers = {"Content-Type": "application/json"}
    if SUPERALGOS_API_KEY:
        headers["Authorization"] = f"Bearer {SUPERALGOS_API_KEY}"
    try:
        r = requests.request(method, url, json=json, headers=headers, timeout=15)
        return {"status_code": r.status_code, "json": r.json()}
    except Exception as e:
        return {"status_code": 500, "error": str(e)}


@mcp.tool()
def ping() -> str:
    res = _req("Ping")
    return f"superalgos_mcp alive (rest={SUPERALGOS_REST_URL}), status={res.get('status_code')} — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"


@mcp.tool()
def get_workspaces() -> Dict[str, Any]:
    return _req("GetWorkspaces")


@mcp.tool()
def start_task(task_name: str) -> Dict[str, Any]:
    return _req("StartTask", method="post", json={"taskName": task_name})


@mcp.tool()
def stop_task(task_name: str) -> Dict[str, Any]:
    return _req("StopTask", method="post", json={"taskName": task_name})


@mcp.tool()
def get_task_status(task_name: str) -> Dict[str, Any]:
    return _req(f"TaskStatus?task={task_name}")


if __name__ == "__main__":
    print(
        "Starting superalgos_mcp on http://127.0.0.1:7014/mcp — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"
    )
    mcp.run("streamable-http")
