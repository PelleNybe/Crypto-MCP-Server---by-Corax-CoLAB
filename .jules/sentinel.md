## 2026-03-20 - [Timing Attack] Password Length Leak in Authentication Middleware
**Vulnerability:** The authentication middleware in `gui/backend/server.js` used `tokenBuffer.length !== passBuffer.length || !crypto.timingSafeEqual(...)` to verify the dashboard password.
**Learning:** Returning early when lengths mismatch allows an attacker to deduce the exact length of the password through timing attacks.
**Prevention:** Always hash both the expected password and provided token (e.g., using `crypto.createHash('sha256')`) before comparing them with `crypto.timingSafeEqual`, as hashes from the same algorithm will always have the same length.

## 2026-03-27 - [Denial of Service] Express Query Parameter Arrays Crash Application
**Vulnerability:** The `/api/portfolio` endpoint in `gui/backend/server.js` directly called `.split(',')` on `req.query.exchanges` assuming it was always a string. If an attacker provided multiple identical query parameters (e.g., `?exchanges=a&exchanges=b`), Express parsed it as an array, causing a `TypeError: ...split is not a function`. The resulting unhandled rejection led to a `process.exit(1)`, allowing anyone with access to crash the backend (DoS).
**Learning:** Express automatically converts repeated query parameters into arrays. If code expects a string and does not validate the type, it can throw exceptions. Combined with an aggressive `unhandledRejection` handler that calls `process.exit(1)`, this creates a severe Denial of Service vulnerability.
**Prevention:** Always validate and normalize inputs from Express `req.query` (e.g., convert arrays to strings, or reject arrays) before using string-specific methods like `.split()`.

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

## 2024-05-25 - [XSS] Sensitive Token Exposure in LocalStorage
**Vulnerability:** The frontend application in `gui/frontend/src/auth.ts` used `localStorage.setItem('auth_token', token)` to store the `DASHBOARD_PASSWORD` authentication token.
**Learning:** `localStorage` is persistent across sessions and tabs, and is vulnerable to Cross-Site Scripting (XSS). If an attacker manages to execute malicious JavaScript, they can easily read the token from `localStorage` (`localStorage.getItem('auth_token')`) and gain full persistent access to the application, bypassing authentication.
**Prevention:** Do not store sensitive information like passwords, API keys, or long-lived authentication tokens in `localStorage`. Use `sessionStorage` for temporary, tab-scoped storage to limit exposure, or store tokens entirely in-memory and manage them securely through HTTP-only cookies if the architecture allows.

## 2026-05-15 - [Secret Leak] Hardcoded Password Exposure in Socket.io Broadcast
**Vulnerability:** The `/api/order/approve` endpoint in `gui/backend/server.js` used the spread operator (`...orderArgs`) when emitting the `order_placed` Socket.io event. Because `orderArgs` included `params: { approval_token: DASHBOARD_PASSWORD }`, the server was inadvertently broadcasting its critical authentication secret back to connected clients.
**Learning:** Using spread operators to serialize objects into event payloads or API responses is dangerous because it often unintentionally leaks hidden properties (like internal tokens, API keys, or database IDs) that were meant for backend-only processing.
**Prevention:** Always explicitly define and cherry-pick the fields that are safe for exposure when emitting events or sending API responses. Alternatively, use object destructuring to remove sensitive fields (e.g., `const { params, ...safeArgs } = orderArgs`) before passing data to public boundaries.
