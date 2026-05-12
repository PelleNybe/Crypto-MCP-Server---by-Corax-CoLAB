## 2024-03-14 - React List Rendering
**Learning:** React list components with 200 items recalculating on each simple state change (like expanding a row) can cause noticeable lag.
**Action:** Always wrap repeating list rows in `React.memo` and memoize callbacks passed to them using `useCallback` to avoid unnecessary layout calculations and re-renders on large lists.

## 2024-10-24 - API Rate Limit Bottlenecks in Loops
**Learning:** Redundant API calls within a loop without shared state/memory mapping (e.g. fetching the entire CoinGecko coins list of ~14k assets for *each* uncached portfolio coin) cause severe rate limit HTTP 429 errors and massive slowdowns.
**Action:** Cache the heavy reference list/mapping once for an appropriate duration (e.g. 1 hour) and use memory lookups for individual items to optimize performance and prevent API blocking.

## 2024-03-27 - Custom Hook Redundant API Calls
**Learning:** Custom React hooks that initiate API calls or set intervals (like `setInterval` for polling) will execute independently for *each* component that uses them. If 10 components use the same hook, 10 identical network requests and intervals are created simultaneously, causing severe frontend lag and backend/API rate-limit pressure.
**Action:** When a hook provides globally shared or synchronized data (e.g., active portfolio symbol, global market status), move the fetching logic and state into a React Context Provider wrapping the app. Update the custom hook to simply `return useContext(...)` to ensure the work is only done once and shared across all consumers.

## 2024-05-15 - React Three Fiber Memoization
**Learning:** React Three Fiber components inside list maps (like `<Star>` in `<GalaxyView>`) re-render entire Three.js layouts when parent state changes. Even if internal Three.js hooks limit calculation overhead, the React reconciliation diffing is slow for a large number of Canvas objects.
**Action:** Always wrap `<Canvas>` list item components in `React.memo` and provide stable event handlers via `useCallback` to prevent unnecessary massive Three.js sub-tree updates.
## 2024-04-17 - Prevent API Piling
**Learning:** High-frequency polling using `setInterval` can cause API requests to pile up and cause a DoS condition on the backend if responses are delayed.
**Action:** Use a recursive `setTimeout` within a `finally` block inside an async polling function to ensure the next request is only scheduled after the previous one completes.
## 2025-04-24 - Optimize Dictionary Lookups
**Learning:** Repeated dictionary key lookups and string method calls inside tight loops are significantly slower than dictionary comprehensions.
**Action:** Use dictionary comprehensions, local variable aliasing, and the walrus operator () for inline assignments when processing dictionary lookups within loops.
## 2025-04-24 - Optimize Dictionary Lookups
**Learning:** Repeated dictionary key lookups and string method calls inside tight loops are significantly slower than dictionary comprehensions.
**Action:** Use dictionary comprehensions, local variable aliasing, and the walrus operator (`:=`) for inline assignments when processing dictionary lookups within loops.

## 2025-05-15 - Asynchronous HTTP in FastMCP
**Learning:** Using synchronous HTTP clients like `requests` in asynchronous FastMCP tools blocks the main event loop, severely degrading performance under concurrent load.
**Action:** Always use asynchronous HTTP clients such as `httpx.AsyncClient` for network operations within FastMCP tools to maintain non-blocking execution and improve overall server throughput.
## 2024-05-18 - ⚡ Bolt: Optimize DexScreener API calls with httpx
**Learning:** Replacing synchronous `requests.get()` with `httpx.AsyncClient().get()` in `onchain_mcp.py` allows non-blocking HTTP requests, significantly improving throughput when making multiple concurrent API calls (measured ~1.8x speedup for 10 requests).
**Action:** When implementing new MCP tools that perform I/O-bound tasks (like external API calls), default to using `httpx` and `async/await` rather than synchronous `requests`.

## 2024-05-24 - Unrelated State Updates Triggering Expensive Three.js Re-renders
**Learning:** In components rendering React Three Fiber `<Canvas>` elements, frequent parent state updates (like animations or interval timers) can cause the entire Three.js sub-tree to be re-evaluated by React, even if the 3D data hasn't changed. This is a massive performance bottleneck.
**Action:** Always isolate heavy Three.js components (like `InstancedMesh` with thousands of particles) using `React.memo` when their parent component manages unrelated, frequently updating state (e.g., overlay opacities or lightning flashes).

## 2026-05-10 - Pre-calculating string transformations in loops
**Learning:** Performing redundant string operations like `.upper()` inside loops or dictionary comprehensions unnecessarily increases CPU cycles and memory allocations, especially when the input list doesn't change.
**Action:** Pre-calculate normalized versions of input strings once at the start of the function and reuse the resulting list in subsequent operations.
