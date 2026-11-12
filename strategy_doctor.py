#!/usr/bin/env python3
"""
strategy_doctor.py
Automated Strategy Post-Mortem & Portfolio Doctor for Freqtrade & OctoBot.

Pulls performance metrics from `freqtrade_mcp` / `octobot_mcp`, inspects
market conditions via `ta_mcp`, generates deterministic pair/risk
recommendations, optionally enriches with `llm_mcp`, and can send a digest
via `notifier_mcp`.

For Crypto MCP Server – Produced by Corax CoLAB - The Future of Edge AI & Blockchain
"""

import argparse
import asyncio
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx
from dotenv import load_dotenv

from bot_bridge import (
    MCP_FREQTRADE_URL,
    MCP_NOTIFIER_URL,
    MCP_OCTOBOT_URL,
    call_mcp_tool,
)

load_dotenv(dotenv_path=".env")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("strategy_doctor")

MCP_LLM_URL = os.getenv("MCP_LLM", "http://127.0.0.1:7009/mcp")


def diagnose_performance(perf_summary: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyze `freqtrade_mcp.analyze_trade_performance()` output and return
    actionable recommendations.
    """
    if not isinstance(perf_summary, dict) or not perf_summary.get("ok"):
        return {
            "ok": False,
            "blacklist_candidates": [],
            "top_pairs": [],
            "recommendations": ["Unable to retrieve bot performance telemetry."],
        }

    recommendations: List[str] = []
    blacklist_candidates: List[str] = []

    win_rate = perf_summary.get("recent_win_rate")
    closed_count = int(perf_summary.get("recent_closed_count") or 0)
    if win_rate is not None and closed_count >= 5:
        if win_rate < 0.4:
            recommendations.append(
                f"Low recent win rate ({win_rate * 100:.1f}% over {closed_count} trades): "
                "tighten entry confirmation or enable bot_bridge caution/halt filtering."
            )
        elif win_rate >= 0.65:
            recommendations.append(
                f"Strong recent win rate ({win_rate * 100:.1f}% over {closed_count} trades): "
                "strategy edge is healthy."
            )

    worst_pairs = perf_summary.get("worst_pairs") or []
    for entry in worst_pairs:
        if not isinstance(entry, dict):
            continue
        pair = entry.get("pair")
        profit_abs = float(entry.get("profit_abs") or 0.0)
        count = int(entry.get("count") or 0)
        if pair and profit_abs < 0 and (count >= 2 or profit_abs <= -25.0):
            blacklist_candidates.append(str(pair))
            recommendations.append(
                f"Consider blacklisting/locking {pair} (net PnL: {profit_abs:.2f}, trades: {count})."
            )

    top_pairs = [
        p.get("pair")
        for p in (perf_summary.get("top_pairs") or [])
        if isinstance(p, dict) and p.get("pair") and float(p.get("profit_abs") or 0.0) > 0
    ]
    if top_pairs:
        recommendations.append(f"Top performing pairs: {', '.join(top_pairs)}.")

    if not recommendations:
        recommendations.append("No anomalies detected; continue monitoring.")

    return {
        "ok": True,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "recent_closed_count": closed_count,
        "recent_win_rate": win_rate,
        "blacklist_candidates": blacklist_candidates,
        "top_pairs": top_pairs,
        "recommendations": recommendations,
    }


async def run_doctor(
    include_octobot: bool = False,
    use_llm: bool = False,
    notify: bool = False,
) -> Dict[str, Any]:
    """Run a full Strategy Doctor diagnostic across connected bots."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        ft_perf = await call_mcp_tool(client, MCP_FREQTRADE_URL, "analyze_trade_performance", {})
        diagnosis = diagnose_performance(ft_perf if isinstance(ft_perf, dict) else None)

        octo_profits = None
        if include_octobot:
            octo_profits = await call_mcp_tool(client, MCP_OCTOBOT_URL, "profits", {})

        llm_review = None
        if use_llm and diagnosis.get("ok"):
            prompt = (
                "Review this trading bot performance summary and give 3 concise tactical improvements:\n"
                + json.dumps({"freqtrade": diagnosis, "octobot": octo_profits}, indent=2)
            )
            llm_review = await call_mcp_tool(client, MCP_LLM_URL, "ask_llm", {"prompt": prompt})

        report = {
            "diagnosis": diagnosis,
            "octobot_profits": octo_profits,
            "llm_review": llm_review,
        }

        if notify:
            recs = "\n- ".join(diagnosis.get("recommendations", []))
            msg = (
                f"[Crypto MCP Strategy Doctor]\n"
                f"Win rate: {diagnosis.get('recent_win_rate')}\n"
                f"Blacklist candidates: {', '.join(diagnosis.get('blacklist_candidates') or ['None'])}\n"
                f"Recommendations:\n- {recs}"
            )
            await call_mcp_tool(client, MCP_NOTIFIER_URL, "send_telegram", {"message": msg})
            await call_mcp_tool(client, MCP_NOTIFIER_URL, "send_discord", {"message": msg})

        return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Crypto MCP Strategy Doctor")
    parser.add_argument("--include-octobot", action="store_true", help="Include OctoBot profit telemetry")
    parser.add_argument("--llm", action="store_true", help="Enrich report with llm_mcp review")
    parser.add_argument("--notify", action="store_true", help="Send digest via notifier_mcp")
    args = parser.parse_args()

    result = asyncio.run(
        run_doctor(
            include_octobot=args.include_octobot,
            use_llm=args.llm,
            notify=args.notify,
        )
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
