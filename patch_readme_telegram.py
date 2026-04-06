with open("README.md", "r") as f:
    content = f.read()

telegram_section = """### Telegram Command Center

The Autonomous Orchestrator includes a built-in Telegram integration allowing you to receive real-time alerts and send commands to your trading agent.

1.  **Create a Bot:** Talk to `@BotFather` on Telegram, create a new bot, and get the HTTP API Token.
2.  **Get Chat ID:** Message your new bot, then go to `https://api.telegram.org/bot<YourBOTToken>/getUpdates` to find your `chat_id`.
3.  **Update `.env`:**
    ```env
    TELEGRAM_BOT_TOKEN="your_token_here"
    TELEGRAM_CHAT_ID="your_chat_id_here"
    TELEGRAM_NOTIFICATIONS_ENABLED="true"
    ```

**Available Commands:**
*   `/status` - Returns the current active AI providers, the target ticker, and the last known decision.
*   `/report` - Directly sends you the latest "Proof of Brain" markdown report as a document.
*   `/analyze` - Manually triggers the agent to run an OODA cycle instantly without executing a trade.

"""

if "### Telegram Command Center" not in content:
    # insert before "A `systemd/corax_orchestrator.service` template"
    target = "A `systemd/corax_orchestrator.service` template"
    content = content.replace(target, telegram_section + target)

with open("README.md", "w") as f:
    f.write(content)
