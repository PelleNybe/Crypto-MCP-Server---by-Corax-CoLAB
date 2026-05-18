
## 2024-05-01 - [Loading State Accessibility]
**Learning:** Reusable loading components (like CyberpunkLoader) often lack proper ARIA attributes, causing screen readers to remain silent during async operations.
**Action:** Always include `role="status"`, `aria-live="polite"`, and `aria-busy="true"` on global loading indicators to ensure state changes are announced seamlessly.

## 2025-02-09 - [Disabled Pagination Tooltips and Semantic Nav]
**Learning:** Custom pagination components often leave disabled "Prev/Next" buttons without context, confusing users (especially screen reader users) about why an interaction isn't possible. Additionally, numeric ratios (e.g., "1 / 5") aren't read well by screen readers.
**Action:** Always wrap pagination in `<nav aria-label="pagination">`. Add explanatory `title` attributes (e.g., "Already on the first page") to disabled buttons, spell out "Page X of Y", and add `aria-live="polite"` to the page counter to ensure dynamic updates are announced.
## 2024-05-18 - Missing ARIA Labels and Loading States on Login Form
**Learning:** The authentication form (the first thing a user sees) lacked critical accessibility attributes (`aria-label`, `aria-busy`) and provided no visual feedback when a login attempt was processing, making it unresponsive and screen-reader unfriendly. Additionally, deeply nested ternary operations mimicking component routing in React were causing rendering inconsistencies and excessive bundle sizes when using `pnpm build`.
**Action:** Always wrap async form submissions with loading state flags (`isLoggingIn`), implement `aria-busy` on submission buttons to signal state changes to screen readers, and refactor deeply nested conditional rendering into cleaner JSX logic.
