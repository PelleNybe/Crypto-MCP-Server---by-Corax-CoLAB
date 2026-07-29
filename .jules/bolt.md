See ../master_log.md
## 2024-05-18 - [Optimize CCXT instantiation]
**Learning:** Instantiating `ccxt` objects inside frequently called tool endpoints (like `get_ticker`) adds significant overhead (~1.19s vs 0.01s for 100 calls in a local benchmark) and prevents proper reuse of underlying `requests.Session` connections and internal rate limiting state (`enableRateLimit: True`).
**Action:** Use `functools.lru_cache` to memoize the instantiation of the `ccxt.Exchange` objects. This safely persists the connection pool and rate limiter state in memory per exchange, dramatically reducing response times without architectural changes.
