# Test Report

## Overview
I have run all tests across the repository, which includes Python unit tests for the MCP servers, frontend Playwright tests, and backend Jest tests.

## Python Tests
The Python MCP tests have 91 passing tests. 1 test is skipped (`test_auth.py` requires the dev server to run, which we successfully verified via bash, so it's not truly failing, just skipped in the regular suite).

### Files lacking tests completely:
* `app.py`
* `backtest_orchestrator.py`
* `freqtrade_mcp.py`
* `ha_mcp.py`
* `screenshot.py`

### Files lacking full test coverage:
* `autonomous_orchestrator.py` (18% coverage)
* `ccxt_mcp.py` (61% coverage)
* `coingecko_mcp.py` (76% coverage)
* `llm_mcp.py` (88% coverage)
* `news_mcp.py` (80% coverage)
* `onchain_mcp.py` (38% coverage)
* `portfolio_mcp.py` (47% coverage)
* `ta_mcp.py` (99% coverage)

## Frontend Tests
Playwright tests in `gui/frontend/tests/dashboard.spec.ts` pass successfully when the Vite dev server is running (which I booted up to verify). The test itself only validates that the document title is correct.

* No other frontend tests exist for the UI components in React.

## Backend Tests
Jest test suites `gui/backend/tests/security.test.js` and `gui/backend/tests/server.test.js` are passing when `DASHBOARD_PASSWORD` is supplied. However, test coverage for `server.js` is quite low (24.4% statement coverage), meaning many of the Express routes are completely untested.
