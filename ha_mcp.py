#!/usr/bin/env python3
"""
ha_mcp.py
HeadlineArena MCP server for Crypto MCP Server – Produced by Corax CoLAB
Exposes tools from the HeadlineArena agent plugin.
Run via systemd or: python3 ha_mcp.py
"""

import os
import sys
import io
import json
import logging
import contextlib
from typing import Optional, List
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ha_mcp")

mcp = FastMCP(
    name="headlinearena", stateless_http=True, json_response=True, host="0.0.0.0", port=7018
)

# Import ha script from vendor directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "vendor", "headlinearena"))
import ha

def _run(cmd_func, _augment=None, **field_values):
    from types import SimpleNamespace
    ns = SimpleNamespace(**field_values)
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            cmd_func(ns)
    except ha.HAFailure as e:
        logger.error(f"HA Error: {str(e)}")
        return {"error": str(e)}
    except Exception as e:
        logger.error(f"Unexpected Error: {str(e)}")
        return {"error": str(e)}

    out = buf.getvalue().strip()
    try:
        parsed = json.loads(out)
        if _augment:
            _augment(parsed)
        return parsed
    except json.JSONDecodeError:
        return {"text": out}

@mcp.tool()
def ha_update_check() -> dict:
    """Check for an available HeadlineArena plugin update."""
    return _run(ha.cmd_update_check, _agent_id=None)

@mcp.tool()
def ha_agents() -> dict:
    """List all agents stored in ~/.headlinearena/credentials.json."""
    return _run(ha.cmd_agents)

@mcp.tool()
def ha_use(agent_id: str) -> dict:
    """Set the default agent used when HA_AGENT_ID is unset."""
    return _run(ha.cmd_use, agent_id=agent_id)

@mcp.tool()
def ha_register(name: str, bio: str, model_provider: str, model_name: str, referral_code: Optional[str] = None) -> dict:
    """Register a new AI agent on HeadlineArena."""
    return _run(ha.cmd_register, name=name, bio=bio, model_provider=model_provider, model_name=model_name, referral_code=referral_code, _agent_id=None)

@mcp.tool()
def ha_status() -> dict:
    """Show the currently active agent's status, identity details, and claim-link requirement."""
    return _run(ha.cmd_status, _agent_id=None)

@mcp.tool()
def ha_challenges(track: Optional[str] = None, include_post_close: bool = False, agent_id: Optional[str] = None) -> dict:
    """List open or active prediction challenges (financial and Civic Index)."""
    return _run(ha.cmd_challenges, track=track, include_post_close=include_post_close, _agent_id=agent_id)

@mcp.tool()
def ha_predict(challenge_id: str, direction: str, confidence: float, reasoning: str, amount: Optional[float] = None, agent_id: Optional[str] = None) -> dict:
    """Submit a ternary prediction (bullish/bearish/flat) for a financial market challenge."""
    return _run(ha.cmd_predict, challenge_id=challenge_id, direction=direction, confidence=confidence, reasoning=reasoning, amount=amount, _agent_id=agent_id)

@mcp.tool()
def ha_forecast(challenge_id: str, amount: float, mean: Optional[float] = None, std: Optional[float] = None, yes_probability: Optional[float] = None, category_index: Optional[int] = None, reasoning: str = "", agent_id: Optional[str] = None) -> dict:
    """Submit a forecast for a Civic Index challenge."""
    return _run(ha.cmd_forecast, challenge_id=challenge_id, amount=amount, mean=mean, std=std, yes_probability=yes_probability, category_index=category_index, reasoning=reasoning, _agent_id=agent_id)

@mcp.tool()
def ha_leaderboard() -> dict:
    """Fetch the HeadlineArena leaderboard to see rankings."""
    return _run(ha.cmd_leaderboard)

if __name__ == "__main__":
    logger.info("Starting ha_mcp on http://0.0.0.0:7018/mcp — Crypto MCP Server")
    mcp.run("streamable-http")
