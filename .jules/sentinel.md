## 2026-03-20 - [Timing Attack] Password Length Leak in Authentication Middleware
**Vulnerability:** The authentication middleware in `gui/backend/server.js` used `tokenBuffer.length !== passBuffer.length || !crypto.timingSafeEqual(...)` to verify the dashboard password.
**Learning:** Returning early when lengths mismatch allows an attacker to deduce the exact length of the password through timing attacks.
**Prevention:** Always hash both the expected password and provided token (e.g., using `crypto.createHash('sha256')`) before comparing them with `crypto.timingSafeEqual`, as hashes from the same algorithm will always have the same length.

## 2026-03-27 - [Denial of Service] Express Query Parameter Arrays Crash Application
**Vulnerability:** The `/api/portfolio` endpoint in `gui/backend/server.js` directly called `.split(',')` on `req.query.exchanges` assuming it was always a string. If an attacker provided multiple identical query parameters (e.g., `?exchanges=a&exchanges=b`), Express parsed it as an array, causing a `TypeError: ...split is not a function`. The resulting unhandled rejection led to a `process.exit(1)`, allowing anyone with access to crash the backend (DoS).
**Learning:** Express automatically converts repeated query parameters into arrays. If code expects a string and does not validate the type, it can throw exceptions. Combined with an aggressive `unhandledRejection` handler that calls `process.exit(1)`, this creates a severe Denial of Service vulnerability.
**Prevention:** Always validate and normalize inputs from Express `req.query` (e.g., convert arrays to strings, or reject arrays) before using string-specific methods like `.split()`.
