import sys
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

from unittest.mock import patch, MagicMock
from onchain_mcp import eth_balance, gas_price

@patch('onchain_mcp._get_web3')
def test_eth_balance(mock_get_web3):
    mock_w3 = MagicMock()
    mock_w3.eth.get_balance.return_value = 1000000000000000000 # 1 ETH in Wei
    mock_w3.from_wei.return_value = 1.0
    mock_get_web3.return_value = mock_w3

    result = eth_balance("0x1234")
    assert result["balance_wei"] == "1000000000000000000"
    assert result["balance_eth"] == "1.0"
    assert result["address"] == "0x1234"

@patch('onchain_mcp._get_web3')
def test_gas_price(mock_get_web3):
    mock_w3 = MagicMock()
    mock_w3.eth.gas_price = 20000000000 # 20 Gwei
    mock_w3.from_wei.return_value = 20.0
    mock_get_web3.return_value = mock_w3

    result = gas_price()
    assert result["gas_price_wei"] == "20000000000"
    assert result["gas_price_gwei"] == "20.0"
