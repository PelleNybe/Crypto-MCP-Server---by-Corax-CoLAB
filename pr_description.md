💡 **What:** Replaced `setInterval` with a recursive `setTimeout` pattern in both the Node.js backend (`gui/backend/server.js`) and the React frontend (`gui/frontend/src/components/features/SystemOverview.tsx`) for periodic background polling.

🎯 **Why:** Utilizing `setInterval` for fetching data (e.g. hitting MCP tools like `get_ticker` every 5 seconds) causes subsequent requests to stack up or "pile" if the previous request takes longer to resolve due to network latency, backend processing limits, or rate limits. Using a recursive `setTimeout` inside a `try/finally` block ensures that the next request is *only* scheduled after the previous one fully resolves (or errors out), thereby completely eliminating the risk of accidental DoS conditions, UI freezing, or unnecessary resource exhaustion.

📊 **Impact:**
- Backend: Eliminates the possibility of unhandled promise rejections crashing the process due to overlapping queries, creating a stable polling loop.
- Frontend: Prevents browser UI thread blocking caused by simultaneous concurrent API request stacks, noticeably improving rendering performance.

🔬 **Measurement:**
- Both sets of tests, including E2E frontend Playwright tests (`cd gui/frontend && pnpm test`) and backend unit tests for logic routing (`node tests/order_validation_test.js && node tests/cors_logic_test.js`), continue to pass successfully, indicating no regressions were introduced.
