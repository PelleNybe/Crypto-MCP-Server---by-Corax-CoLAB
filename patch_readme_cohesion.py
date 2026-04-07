import re

with open("README.md", "r") as f:
    content = f.read()

# Make the AI section more prominent and update the quick start
old_orchestrator = """## Autonomous Orchestrator Mode

The Autonomous Orchestrator Mode evolves the project from a passive Multi-MCP tool into an autonomous, 24/7 trading agent framework."""

new_orchestrator = """## 🤖 Autonomous Orchestrator Mode

The Autonomous Orchestrator Mode evolves the project from a passive Multi-MCP tool into an autonomous, 24/7 trading agent framework. It features a "Board of Directors" consensus logic, Telegram Command Center, and an Agentic Backtesting Engine."""

content = content.replace(old_orchestrator, new_orchestrator)

# Update the quick start to mention the new requirements
old_quick = """## 🛠 Manual install

If you prefer to do everything yourself:

1. **Install system deps:**"""

new_quick = """## 🛠 Manual install

If you prefer to do everything yourself:

1. **Install system deps & Python Requirements:**
   ```bash
   sudo apt update
   sudo apt install -y curl build-essential ca-certificates git python3-pip
   pip3 install -r requirements.txt
   ```
"""
content = content.replace(old_quick, new_quick)

with open("README.md", "w") as f:
    f.write(content)
