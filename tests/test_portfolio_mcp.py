import sys
import unittest
import asyncio
from unittest.mock import MagicMock, AsyncMock, patch

# Mock dependencies properly for FastMCP decorators
fastmcp_mock = MagicMock()
fastmcp_mock.tool.return_value = lambda f: f
mcp_mock = MagicMock()
mcp_mock.server.fastmcp.FastMCP.return_value = fastmcp_mock
sys.modules["mcp"] = mcp_mock
sys.modules["mcp.server.fastmcp"] = MagicMock()
sys.modules["ccxt"] = MagicMock()
sys.modules["ccxt.async_support"] = MagicMock()
sys.modules["pycoingecko"] = MagicMock()
sys.modules["dotenv"] = MagicMock()

import portfolio_mcp

class TestPortfolioMCP(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Reset cache and mocks
        portfolio_mcp._CACHE = {"prices": {}, "timestamp": 0, "mapping": None, "mapping_timestamp": 0}

    @patch("portfolio_mcp._get_prices_coingecko")
    @patch("portfolio_mcp._get_price_ccxt")
    async def test_fetch_exchange_balance_concurrent(self, mock_ccxt, mock_cg):
        # Setup
        mock_cg.return_value = {}

        async def mock_ccxt_call(ex, symbol):
            await asyncio.sleep(0.01)
            return 100.0
        mock_ccxt.side_effect = mock_ccxt_call

        mock_ex = AsyncMock()
        mock_ex.fetch_balance.return_value = {"total": {"BTC": 1.0, "ETH": 2.0}}
        mock_ex.close = AsyncMock()

        portfolio_mcp.ccxt_async.exchanges = ["binance"]
        portfolio_mcp.ccxt_async.binance = MagicMock(return_value=mock_ex)

        # Action
        results = await portfolio_mcp.fetch_exchange_balance("binance")

        # Assertions
        self.assertEqual(len(results), 2)
        assets = {r["asset"] for r in results}
        self.assertIn("BTC", assets)
        self.assertIn("ETH", assets)
        for r in results:
            self.assertEqual(r["price_usd"], 100.0)
            if r["asset"] == "BTC":
                self.assertEqual(r["value_usd"], 100.0)
            if r["asset"] == "ETH":
                self.assertEqual(r["value_usd"], 200.0)

if __name__ == "__main__":
    unittest.main()
