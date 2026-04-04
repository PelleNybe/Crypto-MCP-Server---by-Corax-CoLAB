import os
import glob

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    new_content = """import sys
from unittest.mock import MagicMock

# Mock dependencies thoroughly
mock_mcp = MagicMock()
mock_fastmcp = MagicMock()
mock_fastmcp.tool.return_value = lambda f: f
mock_mcp.server.fastmcp.FastMCP.return_value = mock_fastmcp

sys.modules["mcp"] = mock_mcp
sys.modules["mcp.server.fastmcp"] = MagicMock()
sys.modules["mcp.server.fastmcp"].FastMCP = MagicMock(return_value=mock_fastmcp)
sys.modules["requests"] = MagicMock()
sys.modules["ccxt"] = MagicMock()
sys.modules["web3"] = MagicMock()
sys.modules["web3.middleware"] = MagicMock()
sys.modules["web3.gas_strategies.time_based"] = MagicMock()
sys.modules["dotenv"] = MagicMock()
sys.modules["eth_account"] = MagicMock()

"""
    # Remove any existing sys.modules injections
    lines = content.split('\n')
    cleaned = []
    skip = False
    for line in lines:
        if line.startswith('import sys'):
            skip = True
        elif line.startswith('import unittest') or line.startswith('from unittest.mock'):
            skip = False
            cleaned.append(line)
        elif not skip:
            cleaned.append(line)

    final_content = new_content + '\n'.join(cleaned)
    with open(filepath, 'w') as f:
        f.write(final_content)

for f in ['tests/test_ccxt_mcp.py', 'tests/test_news_mcp.py', 'tests/test_notifier_mcp.py', 'tests/test_onchain_mcp.py']:
    fix_file(f)
