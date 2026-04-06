with open("README.md", "r") as f:
    content = f.read()

proof_of_brain_section = """### Proof of Brain / Trading Diary

To provide full transparency, the Autonomous Orchestrator includes a "Proof of Brain" module. After every complete OODA cycle (Observe, Analyze, Act), a comprehensive Markdown report is generated in the `trading_diary/` directory.

These reports document every decision made by the AI Board of Directors, answering *why* a specific action was taken. They include:
*   The raw market data the orchestrator gathered from its MCPs.
*   The individual votes and reasoning from the Technical Analyst (Gemini), Macro Strategist (OpenAI), and Risk Manager (Anthropic).
*   The final consensus reached and execution parameters.

Reports are saved even if the board's decision is "HOLD", ensuring a fully auditable track record of the agent's logic.

"""

if "### Proof of Brain" not in content:
    # insert before "A `systemd/corax_orchestrator.service` template"
    target = "A `systemd/corax_orchestrator.service` template"
    content = content.replace(target, proof_of_brain_section + target)

with open("README.md", "w") as f:
    f.write(content)
