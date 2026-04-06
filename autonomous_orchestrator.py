import asyncio
import json
import logging
import os
import glob
from telegram_manager import TelegramManager
from datetime import datetime
from dotenv import load_dotenv

# Import MCP Client SDK
from mcp.client.session import ClientSession
from mcp.client.stdio import stdio_client, StdioServerParameters

# Import LLM Providers
try:
    import openai
except ImportError:
    openai = None

try:
    import anthropic
except ImportError:
    anthropic = None

try:
    import google.genai as genai
    from google.genai import types as genai_types
except ImportError:
    genai = None

# Logging setup
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("AutonomousOrchestrator")

load_dotenv()

async def connect_mcp(server_config):
    """
    Establish stdio connection to an MCP server.
    """
    logger.info(f"Connecting to MCP server via: {server_config['command']} {' '.join(server_config.get('args', []))}")
    env = os.environ.copy()
    if 'env' in server_config:
        env.update(server_config['env'])

    server_parameters = StdioServerParameters(
        command=server_config['command'],
        args=server_config.get('args', []),
        env=env
    )

    return stdio_client(server_parameters)

async def gather_market_data(target_ticker: str, config: dict):
    """
    Queries Aarna ATARS for technical signals and LunarCrush for sentiment on a target ticker.
    """
    logger.info(f"Gathering market data for {target_ticker}...")
    market_data = {
        "ticker": target_ticker,
        "technical_signals": None,
        "sentiment": None,
        "price": None
    }


    # Try Aarna
    if "aarna-atars" in config.get("mcpServers", {}):
        logger.info("Connecting to aarna-atars to fetch technical signals...")
        try:
            async with await connect_mcp(config["mcpServers"]["aarna-atars"]) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    tools_response = await session.list_tools()
                    tools = tools_response.tools

                    target_tool = None
                    schema = None
                    for t in tools:
                        if any(kw in t.name.lower() or kw in (t.description or "").lower() for kw in ["signal", "macd", "technical"]):
                            target_tool = t.name
                            schema = t.inputSchema
                            break

                    if target_tool:
                        arg_name = "ticker"
                        if schema and "properties" in schema:
                            if "symbol" in schema["properties"]:
                                arg_name = "symbol"
                            elif "coin" in schema["properties"]:
                                arg_name = "coin"

                        logger.info(f"Calling {target_tool} with {arg_name}={target_ticker}")
                        res = await session.call_tool(target_tool, arguments={arg_name: target_ticker})
                        market_data["technical_signals"] = res.content[0].text if res.content else None
                    else:
                        logger.warning(f"No technical signal tool found on aarna-atars. Available tools: {[t.name for t in tools]}")
        except Exception as e:
            logger.error(f"Failed to gather data from aarna-atars: {e}")

    # Try LunarCrush
    if "lunarcrush" in config.get("mcpServers", {}):
        logger.info("Connecting to lunarcrush to fetch sentiment...")
        try:
            async with await connect_mcp(config["mcpServers"]["lunarcrush"]) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    tools_response = await session.list_tools()
                    tools = tools_response.tools

                    target_tool = None
                    schema = None
                    for t in tools:
                        if any(kw in t.name.lower() or kw in (t.description or "").lower() for kw in ["sentiment", "social"]):
                            target_tool = t.name
                            schema = t.inputSchema
                            break

                    if target_tool:
                        arg_name = "ticker"
                        if schema and "properties" in schema:
                            if "symbol" in schema["properties"]:
                                arg_name = "symbol"
                            elif "coin" in schema["properties"]:
                                arg_name = "coin"

                        logger.info(f"Calling {target_tool} with {arg_name}={target_ticker}")
                        res = await session.call_tool(target_tool, arguments={arg_name: target_ticker})
                        market_data["sentiment"] = res.content[0].text if res.content else None
                    else:
                        logger.warning(f"No sentiment tool found on lunarcrush. Available tools: {[t.name for t in tools]}")
        except Exception as e:
            logger.error(f"Failed to gather data from lunarcrush: {e}")
    logger.info(f"Data gathered: {market_data}")
    return market_data

def calculate_consensus(votes):
    """
    Evaluates the results from all active providers.
    Implements Majority Rule. If tie or no consensus, default is HOLD.
    """
    decisions = [v.get("decision", "HOLD").upper() for v in votes]
    vote_counts = {"BUY": decisions.count("BUY"), "SELL": decisions.count("SELL"), "HOLD": decisions.count("HOLD")}
    total_votes = len(votes)

    final_decision = "HOLD"
    if total_votes > 0:
        for action, count in vote_counts.items():
            if count > total_votes / 2:
                final_decision = action
                break

    return {
        "decision": final_decision,
        "vote_counts": vote_counts,
        "total_votes": total_votes,
        "director_votes": votes
    }

async def call_provider(provider: str, market_data: dict):
    provider = provider.strip().lower()

    personas = {
        "gemini": "Technical Analyst",
        "openai": "Macro Strategist",
        "anthropic": "Risk Manager"
    }

    persona = personas.get(provider, "General Analyst")
    system_prompt = f"You are Corax CoLAB's autonomous hedge fund manager acting as the {persona}. Analyze this data and return a JSON decision: BUY, SELL, or HOLD."
    user_prompt = f"Data to analyze: {json.dumps(market_data)}\nRespond strictly with JSON in this format: {{\"decision\": \"BUY|SELL|HOLD\", \"reasoning\": \"your reasoning here\"}}"

    decision_json = {"decision": "HOLD", "reasoning": f"Fallback decision due to failure for {provider}.", "provider": provider}

    try:
        if provider == "openai":
            if not openai:
                raise ImportError("OpenAI SDK not installed.")
            client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            decision_json = json.loads(response.choices[0].message.content)
            decision_json["provider"] = provider

        elif provider == "anthropic":
            if not anthropic:
                raise ImportError("Anthropic SDK not installed.")
            client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
            response = await client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )
            content = response.content[0].text
            decision_json = json.loads(content)
            decision_json["provider"] = provider

        elif provider == "gemini":
            if not genai:
                raise ImportError("Google GenAI SDK not installed.")
            client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
            def _call_gemini():
                return client.models.generate_content(
                    model='gemini-2.5-pro',
                    contents=user_prompt,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        response_mime_type="application/json"
                    )
                )
            response = await asyncio.to_thread(_call_gemini)
            decision_json = json.loads(response.text)
            decision_json["provider"] = provider

        else:
            logger.error(f"Unknown LLM provider: {provider}")

    except Exception as e:
        logger.error(f"LLM Analysis failed for {provider}: {e}")

    logger.info(f"{provider} Analysis Complete. Decision: {decision_json.get('decision')}")
    return decision_json

async def consult_board_of_directors(market_data: dict):
    """
    Evaluates the signals using multiple LLM providers and returns a consensus decision.
    """
    providers_str = os.getenv("ACTIVE_LLM_PROVIDERS", os.getenv("ACTIVE_LLM_PROVIDER", "gemini"))
    providers = [p.strip() for p in providers_str.split(",") if p.strip()]

    logger.info(f"Consulting Board of Directors ({', '.join(providers)})...")

    tasks = [call_provider(p, market_data) for p in providers]
    results = await asyncio.gather(*tasks)

    consensus_result = calculate_consensus(results)

    final_decision = consensus_result["decision"]
    votes_for_decision = consensus_result["vote_counts"].get(final_decision, 0)
    total_votes = consensus_result["total_votes"]

    if votes_for_decision > total_votes / 2:
        logger.info(f"Consensus reached: {final_decision} ({votes_for_decision}/{total_votes} votes)")
    else:
        logger.info(f"No consensus: HOLD ({consensus_result['vote_counts'].get('HOLD', 0)}/{total_votes} votes)")

    return consensus_result

async def execute_trade(decision: dict, target_ticker: str, config: dict):
    """
    If the decision is to act, calls the local Corax MCP (CCXT tool) to execute the trade.
    """
    action = decision.get("decision", "HOLD").upper()
    if action not in ["BUY", "SELL"]:
        logger.info(f"Decision is {action}. No trade executed for {target_ticker}.")
        return False

    logger.info(f"Preparing to execute {action} order for {target_ticker}...")

    if "corax-crypto" not in config.get("mcpServers", {}):
        logger.error("corax-crypto server not configured in multi_mcp_config.example.json.")
        return False

    try:
        async with await connect_mcp(config["mcpServers"]["corax-crypto"]) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()

                # Fetch available tools
                tools_response = await session.list_tools()
                tool_names = [t.name for t in tools_response.tools]

                if "create_order" not in tool_names or "get_ticker" not in tool_names:
                    logger.error("Required tools ('create_order', 'get_ticker') are not available on corax-crypto.")
                    return False

                exchange_name = "binance"
                symbol = f"{target_ticker}/USDT"

                # Get current price to calculate amount dynamically
                logger.info(f"Fetching ticker for {symbol} on {exchange_name}...")
                ticker_result = await session.call_tool("get_ticker", arguments={"exchange": exchange_name, "symbol": symbol})

                try:
                    ticker_data = json.loads(ticker_result.content[0].text)
                    current_price = ticker_data.get("last")
                except Exception as e:
                    logger.error(f"Failed to parse ticker data: {e}. Raw: {ticker_result.content[0].text if ticker_result.content else None}")
                    return False

                if not current_price or current_price <= 0:
                    logger.error(f"Invalid current price for {symbol}: {current_price}")
                    return False

                # Calculate trade amount for a fixed risk amount (e.g. 20 USD)
                trade_usd = 20.0
                amount = trade_usd / current_price

                # Call create_order tool
                tool_args = {
                    "exchange": exchange_name,
                    "symbol": symbol,
                    "type": "market",
                    "side": action.lower(),
                    "amount": round(amount, 6)
                }

                logger.info(f"Calling corax-crypto create_order tool with: {tool_args}")
                result = await session.call_tool("create_order", arguments=tool_args)

                logger.info(f"Trade Execution Result: {result.content[0].text if result.content else 'Success'}")
                return True

    except Exception as e:
        logger.error(f"Failed to execute trade on corax-crypto: {e}")
        return False


def generate_trading_report(market_data: dict, board_results: dict, trade_executed: bool, target_ticker: str):
    """
    Generates a human-readable Proof of Brain markdown report for the cycle.
    """
    os.makedirs("trading_diary", exist_ok=True)

    timestamp = datetime.now()
    timestamp_str = timestamp.strftime('%Y%m%d_%H%M%S')
    decision = board_results.get("decision", "HOLD")

    filename = f"trading_diary/{timestamp_str}_{target_ticker}_{decision}.md"

    md_content = f"# Proof of Brain: Trading Diary\n\n"
    md_content += f"**Timestamp:** {timestamp.strftime('%Y-%m-%d %H:%M:%S')}\n"
    md_content += f"**Target Ticker:** {target_ticker}\n"
    md_content += f"**Final Consensus Decision:** {decision}\n\n"

    md_content += f"## 1. Raw Market Context\n\n"
    md_content += f"```json\n{json.dumps(market_data, indent=2)}\n```\n\n"

    md_content += f"## 2. Board's Deliberation\n\n"
    for vote in board_results.get("director_votes", []):
        provider = vote.get("provider", "Unknown")
        v_decision = vote.get("decision", "HOLD")
        reasoning = vote.get("reasoning", "No reasoning provided.")
        md_content += f"### Director: {provider}\n"
        md_content += f"- **Vote:** {v_decision}\n"
        md_content += f"- **Reasoning:** {reasoning}\n\n"

    md_content += f"## 3. Consensus Analysis\n\n"
    md_content += f"- **Total Votes:** {board_results.get('total_votes', 0)}\n"
    md_content += f"- **Vote Distribution:** {json.dumps(board_results.get('vote_counts', {}))}\n"
    md_content += f"- **Trade Executed:** {'Yes' if trade_executed else 'No'}\n\n"

    if trade_executed:
        md_content += f"## 4. Execution Data\n\n"
        md_content += f"A {decision} trade was dispatched to the CCXT orchestrator.\n"

    try:
        with open(filename, "w") as f:
            f.write(md_content)
        logger.info(f"Trading report saved to {filename}")
    except Exception as e:
        logger.error(f"Failed to write trading report: {e}")



# Global state for Telegram commands
orchestrator_state = {
    "target_ticker": "BTC",
    "last_decision": "None",
    "active_providers": os.getenv("ACTIVE_LLM_PROVIDERS", os.getenv("ACTIVE_LLM_PROVIDER", "gemini")),
    "config": {}
}

async def get_status():
    providers = orchestrator_state["active_providers"]
    ticker = orchestrator_state["target_ticker"]
    last = orchestrator_state["last_decision"]
    return f"🟢 Orchestrator Status\nProviders: {providers}\nTarget Ticker: {ticker}\nLast Decision: {last}"

async def get_latest_report():
    files = glob.glob("trading_diary/*.md")
    if not files:
        return None
    latest_file = max(files, key=os.path.getctime)
    return latest_file

async def trigger_analyze():
    ticker = orchestrator_state["target_ticker"]
    config = orchestrator_state["config"]
    try:
        market_data = await gather_market_data(ticker, config)
        analysis = await consult_board_of_directors(market_data)
        generate_trading_report(market_data, analysis, False, ticker)
        decision = analysis.get("decision", "HOLD")
        return f"Decision: {decision}\nSee the latest /report for details."
    except Exception as e:
        return f"Error during analysis: {e}"

def load_config():
    config_path = "multi_mcp_config.example.json"
    try:
        with open(config_path, "r") as f:
            config = json.load(f)
            logger.info(f"Successfully loaded configuration from {config_path}")
            return config
    except FileNotFoundError:
        logger.error(f"Configuration file not found: {config_path}")
        return {}
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing configuration file {config_path}: {e}")
        return {}

async def agent_loop(config: dict, telegram_mgr: TelegramManager):
    """
    The main autonomous loop: Observe, Analyze, Act.
    """
    target_ticker = "BTC"
    loop_interval_minutes = 15

    logger.info(f"Starting Autonomous Agent Loop. Target: {target_ticker}, Interval: {loop_interval_minutes} minutes.")

    while True:
        try:
            logger.info("--- Starting new cycle ---")
            # 1. Observe (Gather Data)
            market_data = await gather_market_data(target_ticker, config)

            # 2. Analyze (LLM Reasoning)
            analysis = await consult_board_of_directors(market_data)

            # 3. Act (Execute Trade)
            trade_executed = await execute_trade(analysis, target_ticker, config)

            # 4. Proof of Brain (Record keeping)
            generate_trading_report(market_data, analysis, trade_executed, target_ticker)

            # Update state
            orchestrator_state["last_decision"] = analysis.get("decision", "HOLD")

            # Send Telegram Alert
            if telegram_mgr:
                decision = analysis.get("decision", "HOLD")
                votes = ", ".join([f"{v.get('provider')}: {v.get('decision')}" for v in analysis.get("director_votes", [])])
                msg = f"🔔 Cycle Complete for {target_ticker}\nConsensus: {decision}\nVotes: {votes}"
                await telegram_mgr.send_telegram_alert(msg)

        except Exception as e:
            logger.error(f"Error during agent loop cycle: {e}", exc_info=True)

        logger.info(f"Cycle complete. Waiting for {loop_interval_minutes} minutes...")
        await asyncio.sleep(loop_interval_minutes * 60)

async def main():
    logger.info("Initializing Autonomous Orchestrator...")
    config = load_config()

    if not config:
        logger.warning("Starting with empty or missing configuration. Check multi_mcp_config.example.json.")

    orchestrator_state["config"] = config

    telegram_mgr = TelegramManager(get_status, get_latest_report, trigger_analyze)
    asyncio.create_task(telegram_mgr.start())

    await agent_loop(config, telegram_mgr)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Autonomous Orchestrator stopped by user.")
