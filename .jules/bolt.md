## 2024-05-18 - [In-memory caching behavior for Express routes]
**Learning:** `callMCP` function has an in-memory TTL cache, and the Express native endpoints (`/api/portfolio` and `/api/ticker`) DO use `callMCP`. Therefore, my initial assessment that they weren't cached was incorrect. The performance bottleneck must be elsewhere. Let's look for something else.
**Action:** Always verify if inner utility functions handle the optimization before trying to wrap the outer Express routes.
## 2024-05-18 - [Thundering Herd Problem in Promise Caching]
**Learning:** In Node.js, storing just the resolved data in an in-memory cache leaves a race condition where multiple concurrent requests (like the frontend's heavy polling loops) all miss the cache before the first request resolves, hammering downstream services. Storing the Promise itself resolves this.
**Action:** Deduplicate concurrent requests by caching the in-flight Promise instead of just the final result.
