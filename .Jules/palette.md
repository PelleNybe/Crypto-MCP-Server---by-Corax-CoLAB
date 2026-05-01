
## 2024-05-01 - [Loading State Accessibility]
**Learning:** Reusable loading components (like CyberpunkLoader) often lack proper ARIA attributes, causing screen readers to remain silent during async operations.
**Action:** Always include `role="status"`, `aria-live="polite"`, and `aria-busy="true"` on global loading indicators to ensure state changes are announced seamlessly.
