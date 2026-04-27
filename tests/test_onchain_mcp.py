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
from onchain_mcp import eth_balance, gas_price, erc20_balance


@patch("onchain_mcp._get_web3")
def test_eth_balance(mock_get_web3):
    mock_w3 = MagicMock()
    mock_w3.eth.get_balance.return_value = 1000000000000000000  # 1 ETH in Wei
    mock_w3.from_wei.return_value = 1.0
    mock_get_web3.return_value = mock_w3

    result = eth_balance("0x1234")
    assert result["balance_wei"] == "1000000000000000000"
    assert result["balance_eth"] == "1.0"
    assert result["address"] == "0x1234"


@patch("onchain_mcp._get_web3")
def test_gas_price(mock_get_web3):
    mock_w3 = MagicMock()
    mock_w3.eth.gas_price = 20000000000  # 20 Gwei
    mock_w3.from_wei.return_value = 20.0
    mock_get_web3.return_value = mock_w3

    result = gas_price()
    assert result["gas_price_wei"] == "20000000000"
    assert result["gas_price_gwei"] == "20.0"


@patch("onchain_mcp._get_web3")
def test_erc20_balance(mock_get_web3):
    mock_w3 = MagicMock()
    mock_get_web3.return_value = mock_w3

    mock_contract = MagicMock()
    mock_w3.eth.contract.return_value = mock_contract

    # Mock balance 100 with 6 decimals
    mock_contract.functions.balanceOf().call.return_value = 100000000
    mock_contract.functions.decimals().call.return_value = 6

    result = erc20_balance("0xUser", "0xToken")

    assert result["address"] == "0xUser"
    assert result["contract"] == "0xToken"
    assert result["balance_raw"] == "100000000"
    assert result["balance"] == 100.0
    assert result["decimals"] == 6


@patch("onchain_mcp._get_web3")
def test_erc20_balance_decimals_fallback(mock_get_web3):
    mock_w3 = MagicMock()
    mock_get_web3.return_value = mock_w3

    mock_contract = MagicMock()
    mock_w3.eth.contract.return_value = mock_contract

    # Mock balance 1e18 -> 1.0 with 18 decimals fallback
    mock_contract.functions.balanceOf().call.return_value = 1000000000000000000
    mock_contract.functions.decimals().call.side_effect = Exception(
        "No decimals function"
    )

    result = erc20_balance("0xUser", "0xToken")

    assert result["balance"] == 1.0
    assert result["decimals"] == 18


import pytest
from onchain_mcp import get_dexscreener_trending, search_dexscreener_token

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from onchain_mcp import get_dexscreener_trending, search_dexscreener_token


@pytest.mark.asyncio
@patch("onchain_mcp.httpx.AsyncClient")
async def test_get_dexscreener_trending(mock_async_client):
    mock_client = AsyncMock()
    mock_async_client.return_value.__aenter__.return_value = mock_client

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [{"id": 1}]
    mock_client.get.return_value = mock_response

    result = await get_dexscreener_trending()

    assert result["status"] == "success"
    assert result["data"] == [{"id": 1}]


@pytest.mark.asyncio
@patch("onchain_mcp.httpx.AsyncClient")
async def test_search_dexscreener_token(mock_async_client):
    mock_client = AsyncMock()
    mock_async_client.return_value.__aenter__.return_value = mock_client

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"pairs": [{"id": 1}]}
    mock_client.get.return_value = mock_response

    result = await search_dexscreener_token("test")

    assert result["status"] == "success"
    assert result["data"] == [{"id": 1}]
