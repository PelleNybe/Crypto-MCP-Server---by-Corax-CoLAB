import re

with open('autonomous_orchestrator.py', 'r') as f:
    content = f.read()

# Add import
if 'from telegram_manager import TelegramManager' not in content:
    content = content.replace('import os', 'import os\nimport glob\nfrom telegram_manager import TelegramManager')

# Global orchestrator state to keep track
global_state = """
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
    return f"🟢 Orchestrator Status\\nProviders: {providers}\\nTarget Ticker: {ticker}\\nLast Decision: {last}"

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
        return f"Decision: {decision}\\nSee the latest /report for details."
    except Exception as e:
        return f"Error during analysis: {e}"
"""

if 'orchestrator_state =' not in content:
    content = content.replace('def load_config():', global_state + '\ndef load_config():')

# Modify agent_loop signature to accept telegram manager
old_loop_def = """async def agent_loop(config: dict):"""
new_loop_def = """async def agent_loop(config: dict, telegram_mgr: TelegramManager):"""
content = content.replace(old_loop_def, new_loop_def)

# Modify agent_loop internals to use telegram and update state
old_cycle = """            # 4. Proof of Brain (Record keeping)
            generate_trading_report(market_data, analysis, trade_executed, target_ticker)"""

new_cycle = """            # 4. Proof of Brain (Record keeping)
            generate_trading_report(market_data, analysis, trade_executed, target_ticker)

            # Update state
            orchestrator_state["last_decision"] = analysis.get("decision", "HOLD")

            # Send Telegram Alert
            if telegram_mgr:
                decision = analysis.get("decision", "HOLD")
                votes = ", ".join([f"{v.get('provider')}: {v.get('decision')}" for v in analysis.get("director_votes", [])])
                msg = f"🔔 Cycle Complete for {target_ticker}\\nConsensus: {decision}\\nVotes: {votes}"
                await telegram_mgr.send_telegram_alert(msg)"""

content = content.replace(old_cycle, new_cycle)

# Modify main to initialize telegram manager
old_main = """    if not config:
        logger.warning("Starting with empty or missing configuration. Check multi_mcp_config.example.json.")

    await agent_loop(config)"""

new_main = """    if not config:
        logger.warning("Starting with empty or missing configuration. Check multi_mcp_config.example.json.")

    orchestrator_state["config"] = config

    telegram_mgr = TelegramManager(get_status, get_latest_report, trigger_analyze)
    asyncio.create_task(telegram_mgr.start())

    await agent_loop(config, telegram_mgr)"""

content = content.replace(old_main, new_main)

with open('autonomous_orchestrator.py', 'w') as f:
    f.write(content)
