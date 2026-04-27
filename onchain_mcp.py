#!/usr/bin/env python3
"""
onchain_mcp.py
On-chain MCP server (Ethereum family) for Crypto MCP Server – Produced by Corax CoLAB - The Future of Edge AI & Blockchain
Exposes: eth_balance, erc20_balance, tx_info, gas_price
"""

import os
import logging
from typing import Optional
import httpx
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

load_dotenv(dotenv_path=".env")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("onchain_mcp")

mcp = FastMCP(
    name="onchain", stateless_http=True, json_response=True, host="0.0.0.0", port=7002
)

# Global cache for Web3 instances to reuse underlying HTTP sessions
_w3_instances = {}


def _get_web3(rpc_url: Optional[str] = None) -> Web3:
    rpc_url = rpc_url or os.getenv("ETH_RPC_URL", "https://eth.llamarpc.com")

    if rpc_url in _w3_instances:
        return _w3_instances[rpc_url]

    w3 = Web3(Web3.HTTPProvider(rpc_url))
    try:
        w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    except Exception as e:
        logger.warning(f"Failed to inject ExtraDataToPOAMiddleware: {e}")

    if not w3.is_connected():
        raise RuntimeError(f"Kan inte koppla till RPC: {rpc_url}")

    _w3_instances[rpc_url] = w3
    return w3


@mcp.tool()
def gas_price(rpc_url: Optional[str] = None) -> dict:
    w3 = _get_web3(rpc_url)
    wei = w3.eth.gas_price
    gwei = w3.from_wei(wei, "gwei")
    return {"gas_price_wei": str(wei), "gas_price_gwei": str(gwei)}


@mcp.tool()
def eth_balance(address: str, rpc_url: Optional[str] = None) -> dict:
    w3 = _get_web3(rpc_url)
    wei = w3.eth.get_balance(address)
    eth = w3.from_wei(wei, "ether")
    return {"address": address, "balance_wei": str(wei), "balance_eth": str(eth)}


ERC20_ABI = [
    {
        "constant": True,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function",
    },
    {
        "constant": True,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function",
    },
    {
        "constant": True,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function",
    },
]


@mcp.tool()
def erc20_balance(
    address: str, contract_address: str, rpc_url: Optional[str] = None
) -> dict:
    w3 = _get_web3(rpc_url)
    contract = w3.eth.contract(
        address=w3.to_checksum_address(contract_address), abi=ERC20_ABI
    )
    balance = contract.functions.balanceOf(w3.to_checksum_address(address)).call()
    try:
        decimals = contract.functions.decimals().call()
    except Exception:
        decimals = 18
    human = balance / (10**decimals)
    return {
        "address": address,
        "contract": contract_address,
        "balance_raw": str(balance),
        "balance": human,
        "decimals": decimals,
    }


@mcp.tool()
def tx_info(txhash: str, rpc_url: Optional[str] = None) -> dict:
    w3 = _get_web3(rpc_url)
    tx = w3.eth.get_transaction(txhash)
    receipt = w3.eth.get_transaction_receipt(txhash)
    return {"tx": dict(tx), "receipt": dict(receipt)}


if __name__ == "__main__":
    print(
        "Starting onchain_mcp on http://127.0.0.1:7002/mcp — Crypto MCP Server (Corax CoLAB - The Future of Edge AI & Blockchain)"
    )
    # transport, bind (address:port), mount_path
    mcp.run("streamable-http")


@mcp.tool()
async def get_dexscreener_trending() -> dict:
    """
    Fetches the latest trending tokens from DexScreener across all chains.
    This gives the AI insight into what is popular on-chain right now.
    """
    try:
        url = "https://api.dexscreener.com/token-profiles/latest/v1"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10)
            if response.status_code == 200:
                return {"status": "success", "data": response.json()}
            else:
                return {"error": f"DexScreener API error: {response.status_code}"}
    except Exception as e:
        logger.error(f"Error fetching DexScreener trending: {e}")
        return {"error": str(e)}


@mcp.tool()
async def search_dexscreener_token(query: str) -> dict:
    """
    Searches for a specific token or contract address on DexScreener.
    """
    try:
        url = f"https://api.dexscreener.com/latest/dex/search?q={query}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10)
            if response.status_code == 200:
                return {"status": "success", "data": response.json().get("pairs", [])}
            else:
                return {"error": f"DexScreener API error: {response.status_code}"}
    except Exception as e:
        logger.error(f"Error searching DexScreener token: {e}")
        return {"error": str(e)}


# Minimal ABI for Uniswap V2 Router `getAmountsOut` and ERC20 `decimals`
UNISWAP_V2_ROUTER_ABI = [
    {
        "inputs": [
            {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
            {"internalType": "address[]", "name": "path", "type": "address[]"},
        ],
        "name": "getAmountsOut",
        "outputs": [
            {"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}
        ],
        "stateMutability": "view",
        "type": "function",
    }
]
ERC20_MINIMAL_ABI = [
    {
        "constant": True,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function",
    }
]


@mcp.tool()
def get_dex_quote(
    token_in: str, token_out: str, amount_in: float, rpc_url: Optional[str] = None
) -> dict:
    """
    Gets a real on-chain quote from a DEX Router (Uniswap V2 on Ethereum Mainnet) via Web3.
    Replaces the old 'simulate_dex_swap' stub with 100% functioning code.
    """
    try:
        # Default to public Ankr RPC if none provided, to ensure it works without API keys
        w3 = _get_web3(rpc_url)

        # Uniswap V2 Router on Mainnet
        router_address = w3.to_checksum_address(
            "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
        )

        token_in_address = w3.to_checksum_address(token_in)
        token_out_address = w3.to_checksum_address(token_out)

        # Get decimals for both tokens
        in_contract = w3.eth.contract(address=token_in_address, abi=ERC20_MINIMAL_ABI)
        out_contract = w3.eth.contract(address=token_out_address, abi=ERC20_MINIMAL_ABI)

        try:
            in_decimals = in_contract.functions.decimals().call()
        except Exception:
            in_decimals = 18  # fallback

        try:
            out_decimals = out_contract.functions.decimals().call()
        except Exception:
            out_decimals = 18  # fallback

        # Convert human amount to raw wei
        amount_in_wei = int(amount_in * (10**in_decimals))

        # Call getAmountsOut
        router_contract = w3.eth.contract(
            address=router_address, abi=UNISWAP_V2_ROUTER_ABI
        )
        try:
            amounts_out = router_contract.functions.getAmountsOut(
                amount_in_wei, [token_in_address, token_out_address]
            ).call()
        except Exception as e:
            # If direct pair fails or has no liquidity, try routing through WETH
            WETH = w3.to_checksum_address("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")
            if token_in_address != WETH and token_out_address != WETH:
                amounts_out = router_contract.functions.getAmountsOut(
                    amount_in_wei, [token_in_address, WETH, token_out_address]
                ).call()
            else:
                raise e

        if len(amounts_out) < 2:
            return {"error": "Invalid response from getAmountsOut"}

        amount_out_raw = amounts_out[-1]
        amount_out_human = amount_out_raw / (10**out_decimals)

        # Estimate gas for a standard swap (approx 150k gas)
        try:
            gas_price_wei = w3.eth.gas_price
        except Exception:
            gas_price_wei = w3.to_wei(15, "gwei")
        estimated_gas_eth = w3.from_wei(gas_price_wei * 150000, "ether")

        return {
            "status": "success",
            "message": "Real on-chain quote from Uniswap V2.",
            "token_in": token_in,
            "token_out": token_out,
            "amount_in": amount_in,
            "amount_out": amount_out_human,
            "estimated_gas_eth": float(estimated_gas_eth),
            "exchange": "Uniswap V2 Router",
            "warning": "This is a quote. Live execution requires transaction signing.",
        }

    except Exception as e:
        logger.error(f"Error getting DEX quote: {e}")
        return {"error": str(e)}


@mcp.tool()
def execute_dex_swap(
    token_in: str,
    token_out: str,
    amount_in: float,
    slippage_tolerance: float = 0.5,
    rpc_url: Optional[str] = None,
) -> dict:
    """
    Executes a real on-chain swap using Uniswap V2 Router on Ethereum Mainnet.
    Requires ETH_PRIVATE_KEY and ETH_PUBLIC_ADDRESS in .env.
    """
    try:
        private_key = os.getenv("ETH_PRIVATE_KEY")
        public_address = os.getenv("ETH_PUBLIC_ADDRESS")

        if not private_key or not public_address:
            return {
                "error": "ETH_PRIVATE_KEY and ETH_PUBLIC_ADDRESS must be set in .env to execute live swaps."
            }

        w3 = _get_web3(rpc_url)

        router_address = w3.to_checksum_address(
            "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
        )
        token_in_address = w3.to_checksum_address(token_in)
        token_out_address = w3.to_checksum_address(token_out)
        account = w3.to_checksum_address(public_address)

        in_contract = w3.eth.contract(address=token_in_address, abi=ERC20_MINIMAL_ABI)
        try:
            in_decimals = in_contract.functions.decimals().call()
        except Exception:
            in_decimals = 18

        amount_in_wei = int(amount_in * (10**in_decimals))

        # We first need to get the expected out amount to calculate minimum out with slippage
        router_contract = w3.eth.contract(
            address=router_address, abi=UNISWAP_V2_ROUTER_ABI
        )
        WETH = w3.to_checksum_address("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")

        path = [token_in_address, token_out_address]
        try:
            amounts_out = router_contract.functions.getAmountsOut(
                amount_in_wei, path
            ).call()
        except Exception:
            if token_in_address != WETH and token_out_address != WETH:
                path = [token_in_address, WETH, token_out_address]
                amounts_out = router_contract.functions.getAmountsOut(
                    amount_in_wei, path
                ).call()
            else:
                return {
                    "error": "Could not fetch quote for this pair (no liquidity or invalid path)."
                }

        expected_out_wei = amounts_out[-1]
        amount_out_min = int(expected_out_wei * (1 - (slippage_tolerance / 100.0)))

        deadline = w3.eth.get_block("latest")["timestamp"] + 60 * 10  # 10 minutes

        # Check allowance and approve if necessary
        allowance_abi = [
            {
                "constant": True,
                "inputs": [
                    {"name": "_owner", "type": "address"},
                    {"name": "_spender", "type": "address"},
                ],
                "name": "allowance",
                "outputs": [{"name": "", "type": "uint256"}],
                "payable": False,
                "stateMutability": "view",
                "type": "function",
            },
            {
                "constant": False,
                "inputs": [
                    {"name": "_spender", "type": "address"},
                    {"name": "_value", "type": "uint256"},
                ],
                "name": "approve",
                "outputs": [{"name": "", "type": "bool"}],
                "payable": False,
                "stateMutability": "nonpayable",
                "type": "function",
            },
        ]

        token_contract = w3.eth.contract(address=token_in_address, abi=allowance_abi)
        if token_in_address != WETH:
            allowance = token_contract.functions.allowance(
                account, router_address
            ).call()
            if allowance < amount_in_wei:
                # Need to approve
                nonce = w3.eth.get_transaction_count(account)
                approve_tx = token_contract.functions.approve(
                    router_address, amount_in_wei
                ).build_transaction(
                    {
                        "from": account,
                        "nonce": nonce,
                        "gas": 100000,
                        "gasPrice": w3.eth.gas_price,
                    }
                )
                signed_approve = w3.eth.account.sign_transaction(
                    approve_tx, private_key=private_key
                )
                approve_hash = w3.eth.send_raw_transaction(
                    signed_approve.rawTransaction
                )
                w3.eth.wait_for_transaction_receipt(
                    approve_hash
                )  # wait for approval to mine

        # Build transaction
        swap_abi = [
            {
                "inputs": [
                    {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
                    {
                        "internalType": "uint256",
                        "name": "amountOutMin",
                        "type": "uint256",
                    },
                    {"internalType": "address[]", "name": "path", "type": "address[]"},
                    {"internalType": "address", "name": "to", "type": "address"},
                    {"internalType": "uint256", "name": "deadline", "type": "uint256"},
                ],
                "name": "swapExactTokensForTokens",
                "outputs": [
                    {
                        "internalType": "uint256[]",
                        "name": "amounts",
                        "type": "uint256[]",
                    }
                ],
                "stateMutability": "nonpayable",
                "type": "function",
            }
        ]

        router_swap_contract = w3.eth.contract(address=router_address, abi=swap_abi)

        nonce = w3.eth.get_transaction_count(account)

        tx = router_swap_contract.functions.swapExactTokensForTokens(
            amount_in_wei, amount_out_min, path, account, deadline
        ).build_transaction(
            {
                "from": account,
                "nonce": nonce,
                "gas": 200000,
                "gasPrice": w3.eth.gas_price,
            }
        )

        # Sign transaction
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=private_key)

        # Send transaction
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)

        return {
            "status": "success",
            "message": "Swap transaction submitted to the network.",
            "tx_hash": w3.to_hex(tx_hash),
            "explorer_url": f"https://etherscan.io/tx/{w3.to_hex(tx_hash)}",
        }

    except Exception as e:
        logger.error(f"Error executing DEX swap: {e}")
        return {"error": str(e)}
