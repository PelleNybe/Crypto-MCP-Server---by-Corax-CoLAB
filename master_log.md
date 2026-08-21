## Resolved Issues
- Fix XSS Vulnerability in Authentication System (`gui/frontend/src/auth.ts`)
- Fix Denial of Service in Express Arrays (`gui/backend/server.js`)
- Fix Timing Attack in Password Check (`gui/backend/server.js`)
- Fix SSRF / Prototype Pollution (`gui/backend/server.js`)
- Fix Hardcoded Password Exposure in Socket.io (`gui/backend/server.js`)
- Fix API Piling caused by setInterval (`gui/frontend/src/components/features/*.tsx`)
- Fix async HTTP in FastMCP Tools (`news_mcp.py` etc.)
- Removed API piling issues
- Replaced remaining setInterval with recursive setTimeout/requestAnimationFrame.
- Added aria-labels to icon/iconless buttons for accessibility.
- Optimized dictionary lookups in portfolio_mcp.py loops.
- Added React.memo to components rendering React Three Fiber <Canvas> elements to prevent unnecessary Three.js sub-tree updates when parent state changes.

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

## 2025-04-24 - Optimize Dictionary Lookups
**Learning:** Repeated dictionary key lookups and string method calls inside tight loops are significantly slower than dictionary comprehensions.
**Action:** Use dictionary comprehensions, local variable aliasing, and the walrus operator (`:=`) for inline assignments when processing dictionary lookups within loops.

## 2024-05-24 - Unrelated State Updates Triggering Expensive Three.js Re-renders
**Learning:** In components rendering React Three Fiber `<Canvas>` elements, frequent parent state updates (like animations or interval timers) can cause the entire Three.js sub-tree to be re-evaluated by React, even if the 3D data hasn't changed. This is a massive performance bottleneck.
**Action:** Always isolate heavy Three.js components (like `InstancedMesh` with thousands of particles) using `React.memo` when their parent component manages unrelated, frequently updating state (e.g., overlay opacities or lightning flashes).

## 2026-05-10 - Pre-calculating string transformations in loops
**Learning:** Performing redundant string operations like `.upper()` inside loops or dictionary comprehensions unnecessarily increases CPU cycles and memory allocations, especially when the input list doesn't change.
**Action:** Pre-calculate normalized versions of input strings once at the start of the function and reuse the resulting list in subsequent operations.

## 2025-05-19 - Prevent API Piling in GasHologram
**Learning:** High-frequency polling using `setInterval` without waiting for the previous request to finish can cause API requests to pile up, degrading frontend performance and causing backend DoS conditions if responses are delayed.
**Action:** Replaced `setInterval` with a recursive `setTimeout` inside a `finally` block in `fetchGas` to ensure the next request is scheduled only after the previous one completes.

## 2025-02-23 - Pre-calculating strings for Dictionary mapping
**Learning:** In Python, manipulating strings like `.upper()` repeatedly on the same element within loops scaling with market assets is a bottleneck.
**Action:** When a transformation (like `coin.upper()`) is needed multiple times (e.g., adding to a list and later matching in a dict), perform it once at the start, store the transformed values in intermediate data structures (like tuples or another mapping), and reuse them in subsequent operations.

## CRITICAL DEVELOPMENT RULES
**Context:** These rules must be strictly adhered to in all interactions within this repository.
1. **No Guessing:** Guessing variable names, tool names, or schemas is strictly prohibited. You must read the actual source code or dynamically fetch schemas.
2. **No Deletion of Incomplete Code:** Do not remove code just because it appears unused. Code must always be developed and completed to 100%.
3. **No Mock-ups or Placeholders:** Mock-ups and placeholders with fake/simulated content are strictly forbidden.
4. **100% Implementation:** Everything must be 100% implemented with real, functional, production-ready code.
5. **Recursive Scanning Required:** Whenever you search for files, functions, definitions, or implementations, you MUST scan recursively through all subdirectories in the repository to ensure absolutely nothing is missed.

## 2024-04-10 - [Unhandled Exception DoS in Order Endpoints]
**Vulnerability:** The order endpoints (`/api/order/execute`, `/api/order/dry_run`, `/api/order/pending`) did not validate that input fields such as `exchange` were strictly strings before calling string methods like `.toLowerCase()` on them.
**Learning:** Sending JSON arrays or objects for these fields caused unhandled exceptions and potentially SQL injection-like errors (due to array serialization mismatch in SQLite parameterized queries) when passed down to `db.prepare()`.
**Prevention:** Always explicitly check the type of incoming request body fields (e.g., `typeof field === 'string'`) in Node.js/Express, and ensure SQL parameter counts perfectly match the schema to avoid exposing database structure on errors.

## 2024-05-20 - [Injection] Parameter Injection in News API Call
**Vulnerability:** The `search_news` function in `news_mcp.py` used f-string interpolation to construct the CryptoPanic API URL: `f"...&currencies={query}"`. This allowed an attacker to inject additional query parameters (e.g., `&public=false`) by including them in the `query` string.
**Learning:** Manual string interpolation for URLs is prone to injection and encoding issues.
**Prevention:** Use the `params` argument in the `requests` library (or equivalent in other libraries) to handle query parameters. This ensures all keys and values are automatically and correctly URL-encoded, preventing parameter injection.

## 2025-04-10 - Add aria-labels for Interactive Buttons Without Text Labels
**Learning:** React components containing icon-only buttons or interactive elements communicating state without text fail accessibility tests since they lack clear semantic meaning for screen readers. Using dynamically updated `aria-label` or `aria-pressed` values improves keyboard accessibility for tools like the Strategy Grid Architect and Risk Radar.
**Action:** When implementing or updating buttons without text labels (like icons) or buttons whose states change functionally, make sure to include `aria-label` or `aria-pressed` to clarify the state.
- React components without proper explicit text-labels on standard form inputs are less accessible for screen reader users and users requiring clear context. Including `title` and `placeholder` attributes on `<input>` and `<select>` elements provides this context when structural label tags aren't present.
- Disabled interactive elements like buttons should communicate their state visually. Updating global styles with a `:disabled` pseudo-class that drops opacity and alters the cursor to `not-allowed` informs users immediately when actions like form submission are suspended or unavailable.

## 2026-04-24 - Accessible Notification Toasts
**Learning:** Custom notification systems (like NeonToasts) often fail to announce critical information to screen reader users if they lack proper ARIA live regions, leaving disabled users unaware of asynchronous actions like order placements.
**Action:** When creating or fixing custom toast notification systems, ensure the container uses `aria-live="polite"` and `aria-atomic="true"`, and individual toasts use `role="alert"` to guarantee dynamic updates are announced.


**Learning:** Automatically wrapping the `Canvas` component alongside its outer parent component definition with `React.memo` effectively causes redundant wrapping that complicates reconciliation.
**Action:** Removed inner `CanvasScene = React.memo()` wrappers rendering another `<CanvasScene/>` in various 3D visualization components.

## 2026-05-16 - Pre-calculating string transformations
**Learning:** Found more redundant `.upper()` calls when constructing `api_key` and `api_secret` variables.
**Action:** Pre-calculate `upper()` for the exchange id and reuse it to avoid redundant operations in `ccxt_mcp.py` and `portfolio_mcp.py`.

## 2026-05-18 - Missing React.memo for ForceGraph3D components
**Learning:** `ForceGraph3D` is a heavy WebGL component that causes severe frame drops if its parent component updates its state frequently (e.g. updating connection strings or timer ticks).
**Action:** Always wrap `<ForceGraph3D>` inside a `React.memo` container when placed in a component with unrelated state updates, similar to how React Three Fiber `<Canvas>` elements are optimized.
See ../master_log.md
See ../master_log.md
## 2024-05-18 - [Optimize CCXT instantiation]
**Learning:** Instantiating `ccxt` objects inside frequently called tool endpoints (like `get_ticker`) adds significant overhead (~1.19s vs 0.01s for 100 calls in a local benchmark) and prevents proper reuse of underlying `requests.Session` connections and internal rate limiting state (`enableRateLimit: True`).
**Action:** Use `functools.lru_cache` to memoize the instantiation of the `ccxt.Exchange` objects. This safely persists the connection pool and rate limiter state in memory per exchange, dramatically reducing response times without architectural changes.
See ../master_log.md
See ../master_log.md

## 2026-05-19 - Fixed duplicate title attributes and double fetching
**Learning:** Found duplicate title attributes on input fields that broke accessibility guidelines. Also found a double fetch in RiskRadarPanel.
**Action:** Removed redundant title attributes from inputs across the app and removed the explicit `fetchData()` call in RiskRadarPanel before the polling setup.

## 2024-05-01 - [Loading State Accessibility]
**Learning:** Reusable loading components (like CyberpunkLoader) often lack proper ARIA attributes, causing screen readers to remain silent during async operations.
**Action:** Always include `role="status"`, `aria-live="polite"`, and `aria-busy="true"` on global loading indicators to ensure state changes are announced seamlessly.

## 2025-02-09 - [Disabled Pagination Tooltips and Semantic Nav]
**Learning:** Custom pagination components often leave disabled "Prev/Next" buttons without context, confusing users (especially screen reader users) about why an interaction isn't possible. Additionally, numeric ratios (e.g., "1 / 5") aren't read well by screen readers.
**Action:** Always wrap pagination in `<nav aria-label="pagination">`. Add explanatory `title` attributes (e.g., "Already on the first page") to disabled buttons, spell out "Page X of Y", and add `aria-live="polite"` to the page counter to ensure dynamic updates are announced.
## 2024-05-18 - Missing ARIA Labels and Loading States on Login Form
**Learning:** The authentication form (the first thing a user sees) lacked critical accessibility attributes (`aria-label`, `aria-busy`) and provided no visual feedback when a login attempt was processing, making it unresponsive and screen-reader unfriendly. Additionally, deeply nested ternary operations mimicking component routing in React were causing rendering inconsistencies and excessive bundle sizes when using `pnpm build`.
**Action:** Always wrap async form submissions with loading state flags (`isLoggingIn`), implement `aria-busy` on submission buttons to signal state changes to screen readers, and refactor deeply nested conditional rendering into cleaner JSX logic.
## 2024-07-28 - Fixing non-standard input placeholder attributes
**Learning:** React inputs in this codebase were incorrectly using `Enter="placeholder text"` instead of standard HTML `placeholder="placeholder text"`. This caused the hint text to not render for the user, worsening form UX.
**Action:** Always use standard HTML attributes like `placeholder` for text input hints to ensure they are parsed and rendered correctly by the browser.
## 2025-02-12 - Fixing duplicate title attributes and missing placeholders
**Learning:** Duplicate HTML attributes like `title` in React inputs (e.g. `title="A" title="B"`) are invalid HTML, and the second one gets ignored. Here, the second title was seemingly intended as placeholder text. This leaves users without inline visual hints for empty fields.
**Action:** Always replace the intended placeholder string (previously a duplicate `title`) with the standard HTML `placeholder` attribute to improve visual form clarity while retaining the valid `title` for tooltips.

## 2026-05-19 - Added missing backend indexes
**Learning:** Found multiple SQL SELECT statements ordering by created_at or joining by trade_id, causing missing indexes to slow down response time as database grows.
**Action:** Always create indexes when designing tables that will be ordered or searched by specific columns.

## 2026-05-19 - Added response compression
**Learning:** Returning large uncompressed JSON payloads over API reduces throughput and blocks UI renders on slow networks.
**Action:** Implemented the `compression` middleware in the express server to automatically GZIP payloads.

## 2026-05-19 - Added resize debouncing
**Learning:** Attaching heavy UI calculations directly to window `resize` event handlers without debouncing causes layout thrashing and blocks the main thread.
**Action:** Implemented debounced `setTimeout` (200ms) within window resize handlers for `RiskRadarPanel` and `MatrixRain` to ensure performance remains smooth.

## 2026-05-19 - Fixed React Hook dependencies
**Learning:** Missing hook dependencies can lead to stale closures where async callbacks use old component state variables.
**Action:** Used `useCallback` to memoize `previewOrderDebounced` and added it to the corresponding `useEffect` dependency array.

## 2026-05-19 - XSS Vulnerability Check
**Learning:** React applications are vulnerable to XSS if `dangerouslySetInnerHTML` or direct `element.innerHTML` assignments are used with untrusted data.
**Action:** Audited frontend source code (`gui/frontend/src`) for `innerHTML` and `dangerouslySetInnerHTML`. Found zero occurrences, verifying the frontend is fundamentally safe from these common injection vectors.
## 2024-08-11 - React Array Mutation on Render
**Learning:** Found that `PortfolioPanel.tsx` was sorting `details` inline via `details.sort(...)` on every render. Because `Array.prototype.sort()` mutates the original array in JavaScript, this was actually modifying the React state array in-place, which is a significant anti-pattern that can cause unexpected behavior, dropped renders, and unnecessary performance overhead (O(N log N) on every component update).
**Action:** Always verify that arrays mapped in render functions are not being mutated (e.g., using `sort`, `reverse`, `splice`). Instead, copy and memoize them (`[...arr].sort()`) inside a `useMemo` block.
## 2024-08-11 - [Node Status ARIA Live Missing]
**Learning:** The `SystemOverview.tsx` used simple DOM elements for visual node status updates but lacked semantic roles or `aria-live` attributes, preventing screen readers from picking up state changes in real time when the background status checks happened.
**Action:** Always wrap background check indicators with `role="status"` and `aria-live="polite"` so screen readers are correctly updated on status changes without breaking user flow.

## 2026-08-21 - Performance and Accessibility Improvements
**Learning:**
- Instantiating CCXT objects in `ccxt_mcp.py` on every endpoint call causes a ~1 second overhead due to initialization, and prevents reusing connection pools and rate limit states.
- The `fetchGlobalSentimentWithPolling` hook in `App.tsx` used recursive `setTimeout` without an unmount cancellation flag, causing state updates on unmounted components and memory leaks.
- The login button in `App.tsx` had `aria-busy` but was missing `aria-live="polite"`, failing to alert screen readers when the loading state text updated to "INITIALIZING...".
**Action:**
- Applied `@lru_cache(maxsize=16)` to `_make_exchange` in `ccxt_mcp.py` to persist CCXT exchange objects in memory.
- Added an `isCancelled` flag to `fetchGlobalSentimentWithPolling` and cleared it in the cleanup function in `App.tsx`.
- Added `aria-live="polite"` to the authentication form submit button in `App.tsx`.
