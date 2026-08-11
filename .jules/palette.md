## 2024-08-11 - [Node Status ARIA Live Missing]
**Learning:** The `SystemOverview.tsx` used simple DOM elements for visual node status updates but lacked semantic roles or `aria-live` attributes, preventing screen readers from picking up state changes in real time when the background status checks happened.
**Action:** Always wrap background check indicators with `role="status"` and `aria-live="polite"` so screen readers are correctly updated on status changes without breaking user flow.
