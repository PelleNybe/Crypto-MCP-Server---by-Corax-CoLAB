## 2024-03-14 - React List Rendering
**Learning:** React list components with 200 items recalculating on each simple state change (like expanding a row) can cause noticeable lag.
**Action:** Always wrap repeating list rows in `React.memo` and memoize callbacks passed to them using `useCallback` to avoid unnecessary layout calculations and re-renders on large lists.

## 2024-10-24 - API Rate Limit Bottlenecks in Loops
**Learning:** Redundant API calls within a loop without shared state/memory mapping (e.g. fetching the entire CoinGecko coins list of ~14k assets for *each* uncached portfolio coin) cause severe rate limit HTTP 429 errors and massive slowdowns.
**Action:** Cache the heavy reference list/mapping once for an appropriate duration (e.g. 1 hour) and use memory lookups for individual items to optimize performance and prevent API blocking.

## 2024-03-27 - Custom Hook Redundant API Calls
**Learning:** Custom React hooks that initiate API calls or set intervals (like `setInterval` for polling) will execute independently for *each* component that uses them. If 10 components use the same hook, 10 identical network requests and intervals are created simultaneously, causing severe frontend lag and backend/API rate-limit pressure.
**Action:** When a hook provides globally shared or synchronized data (e.g., active portfolio symbol, global market status), move the fetching logic and state into a React Context Provider wrapping the app. Update the custom hook to simply `return useContext(...)` to ensure the work is only done once and shared across all consumers.
