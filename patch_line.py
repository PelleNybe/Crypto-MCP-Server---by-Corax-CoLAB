with open("autonomous_orchestrator.py", "r") as f:
    lines = f.readlines()

lines[167] = '    user_prompt = f"Data to analyze: {json.dumps(market_data)}\\nRespond strictly with JSON in this format: {{\\"decision\\": \\"BUY|SELL|HOLD\\", \\"reasoning\\": \\"your reasoning here\\"}}"\n'
del lines[168]

with open("autonomous_orchestrator.py", "w") as f:
    f.writelines(lines)
