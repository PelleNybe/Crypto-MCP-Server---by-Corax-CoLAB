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

## 2026-04-18 - [Denial of Service] Unhandled Exception DoS in SQLite Queries
**Vulnerability:** Several `db.run()` queries in the `node-sqlite3` driver were invoked without an error callback (e.g., during database initialization and order updates).
**Learning:** In `node-sqlite3`, if a query fails and no callback is provided, an error event is emitted on the Database object. If no error handler is attached or the caller didn't provide a callback, this bubbles up to an uncaught exception, leading to a server crash (Denial of Service).
**Prevention:** Always provide an error callback `(err) => { ... }` when executing queries using `db.run()`, `db.exec()`, or `stmt.run()` to catch and handle database exceptions locally and fail securely without terminating the process.

## 2024-05-20 - [Injection] Parameter Injection in News API Call
**Vulnerability:** The `search_news` function in `news_mcp.py` used f-string interpolation to construct the CryptoPanic API URL: `f"...&currencies={query}"`. This allowed an attacker to inject additional query parameters (e.g., `&public=false`) by including them in the `query` string.
**Learning:** Manual string interpolation for URLs is prone to injection and encoding issues.
**Prevention:** Use the `params` argument in the `requests` library (or equivalent in other libraries) to handle query parameters. This ensures all keys and values are automatically and correctly URL-encoded, preventing parameter injection.
