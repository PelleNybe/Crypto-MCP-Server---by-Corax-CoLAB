import asyncio
import json
import logging
import os
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

async def analyze_with_llm(market_data: dict):
    """
    Evaluates the signals and returns a JSON decision: BUY, SELL, or HOLD.
    """
    provider = os.getenv("ACTIVE_LLM_PROVIDER", "gemini").lower()
    logger.info(f"Analyzing data with LLM ({provider})...")

    system_prompt = "You are Corax CoLAB's autonomous hedge fund manager. Analyze this data and return a JSON decision: BUY, SELL, or HOLD."
    user_prompt = f"Data to analyze: {json.dumps(market_data)}\nRespond strictly with JSON in this format: {{\"decision\": \"BUY|SELL|HOLD\", \"reasoning\": \"your reasoning here\"}}"

    decision_json = {"decision": "HOLD", "reasoning": "Fallback decision due to failure."}

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
            # Try to parse the text block as JSON
            content = response.content[0].text
            decision_json = json.loads(content)

        elif provider == "gemini":
            if not genai:
                raise ImportError("Google GenAI SDK not installed.")
            client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
            # In async contexts, use aio or run in executor depending on SDK support.
            # We'll use synchronous call wrapped in to_thread since GenAI SDK async support varies
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

        else:
            logger.error(f"Unknown LLM provider: {provider}")

    except Exception as e:
        logger.error(f"LLM Analysis failed: {e}")

    logger.info(f"LLM Analysis Complete. Decision: {decision_json.get('decision')}")
    return decision_json

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

async def agent_loop(config: dict):
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
            analysis = await analyze_with_llm(market_data)

            # 3. Act (Execute Trade)
            await execute_trade(analysis, target_ticker, config)

        except Exception as e:
            logger.error(f"Error during agent loop cycle: {e}", exc_info=True)

        logger.info(f"Cycle complete. Waiting for {loop_interval_minutes} minutes...")
        await asyncio.sleep(loop_interval_minutes * 60)

async def main():
    logger.info("Initializing Autonomous Orchestrator...")
    config = load_config()

    if not config:
        logger.warning("Starting with empty or missing configuration. Check multi_mcp_config.example.json.")

    await agent_loop(config)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Autonomous Orchestrator stopped by user.")
