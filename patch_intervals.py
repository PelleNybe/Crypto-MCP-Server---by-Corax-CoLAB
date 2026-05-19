import os
import re

files_to_patch = [
    "./gui/frontend/src/components/features/GalaxyView.tsx",
    "./gui/frontend/src/components/features/MarketSentimentAnalyzer.tsx",
    "./gui/frontend/src/components/features/NeuralNetLiquidity.tsx",
    "./gui/frontend/src/components/features/NewsSingularity.tsx",
    "./gui/frontend/src/components/features/OrbitalPortfolio.tsx",
    "./gui/frontend/src/components/features/PredictiveGhosting.tsx",
    "./gui/frontend/src/components/features/QuantumRiskMap.tsx",
    "./gui/frontend/src/components/features/RiskRadarPanel.tsx",
    "./gui/frontend/src/components/features/SentimentWordCloud.tsx",
    "./gui/frontend/src/components/features/WhaleConstellations.tsx",
    "./gui/frontend/src/components/features/WhaleSonarSweep.tsx",
]


def patch_file(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    # Generic pattern to replace:
    # const interval = setInterval(fetchData, 30000); // Check every 30s
    # return () => { active = false; clearInterval(interval); };

    # 1. find the fetch function call (like fetchCoins, fetchSentiment, fetchLiquidity)
    # 2. find the interval

    # Example: const interval = setInterval(fetchCoins, 60000);

    match = re.search(
        r"const interval = setInterval\(([a-zA-Z0-9_]+),\s*(\d+)\);", content
    )
    if not match:
        return

    func_name = match.group(1)
    timeout_ms = match.group(2)

    # Create the polling function
    polling_code = f"""let timeoutId: NodeJS.Timeout;

    const {func_name}WithPolling = async () => {{
      try {{
        await {func_name}();
      }} finally {{
        if (active) timeoutId = setTimeout({func_name}WithPolling, {timeout_ms});
      }}
    }};

    {func_name}WithPolling();"""

    content = re.sub(
        r"const interval = setInterval\([a-zA-Z0-9_]+,\s*\d+\);(?:[^\n]*\n)?",
        polling_code + "\n",
        content,
    )
    content = content.replace("clearInterval(interval)", "clearTimeout(timeoutId)")

    with open(filepath, "w") as f:
        f.write(content)


for f in files_to_patch:
    print(f"Patching {f}")
    patch_file(f)
