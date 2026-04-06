import re

with open('autonomous_orchestrator.py', 'r') as f:
    content = f.read()

# Add datetime import if missing
if 'from datetime import datetime' not in content:
    content = content.replace('import os', 'import os\nfrom datetime import datetime')

report_fn = """
def generate_trading_report(market_data: dict, board_results: dict, trade_executed: bool, target_ticker: str):
    \"\"\"
    Generates a human-readable Proof of Brain markdown report for the cycle.
    \"\"\"
    os.makedirs("trading_diary", exist_ok=True)

    timestamp = datetime.now()
    timestamp_str = timestamp.strftime('%Y%m%d_%H%M%S')
    decision = board_results.get("decision", "HOLD")

    filename = f"trading_diary/{timestamp_str}_{target_ticker}_{decision}.md"

    md_content = f"# Proof of Brain: Trading Diary\\n\\n"
    md_content += f"**Timestamp:** {timestamp.strftime('%Y-%m-%d %H:%M:%S')}\\n"
    md_content += f"**Target Ticker:** {target_ticker}\\n"
    md_content += f"**Final Consensus Decision:** {decision}\\n\\n"

    md_content += f"## 1. Raw Market Context\\n\\n"
    md_content += f"```json\\n{json.dumps(market_data, indent=2)}\\n```\\n\\n"

    md_content += f"## 2. Board's Deliberation\\n\\n"
    for vote in board_results.get("director_votes", []):
        provider = vote.get("provider", "Unknown")
        v_decision = vote.get("decision", "HOLD")
        reasoning = vote.get("reasoning", "No reasoning provided.")
        md_content += f"### Director: {provider}\\n"
        md_content += f"- **Vote:** {v_decision}\\n"
        md_content += f"- **Reasoning:** {reasoning}\\n\\n"

    md_content += f"## 3. Consensus Analysis\\n\\n"
    md_content += f"- **Total Votes:** {board_results.get('total_votes', 0)}\\n"
    md_content += f"- **Vote Distribution:** {json.dumps(board_results.get('vote_counts', {}))}\\n"
    md_content += f"- **Trade Executed:** {'Yes' if trade_executed else 'No'}\\n\\n"

    if trade_executed:
        md_content += f"## 4. Execution Data\\n\\n"
        md_content += f"A {decision} trade was dispatched to the CCXT orchestrator.\\n"

    try:
        with open(filename, "w") as f:
            f.write(md_content)
        logger.info(f"Trading report saved to {filename}")
    except Exception as e:
        logger.error(f"Failed to write trading report: {e}")

"""

# Insert `generate_trading_report` before `def load_config():`
if 'def generate_trading_report' not in content:
    content = content.replace('def load_config():', report_fn + '\ndef load_config():')

# Update agent_loop to use trade_executed and generate_trading_report
old_loop = """            # 3. Act (Execute Trade)
            await execute_trade(analysis, target_ticker, config)

        except Exception as e:"""

new_loop = """            # 3. Act (Execute Trade)
            trade_executed = await execute_trade(analysis, target_ticker, config)

            # 4. Proof of Brain (Record keeping)
            generate_trading_report(market_data, analysis, trade_executed, target_ticker)

        except Exception as e:"""

content = content.replace(old_loop, new_loop)

with open('autonomous_orchestrator.py', 'w') as f:
    f.write(content)
