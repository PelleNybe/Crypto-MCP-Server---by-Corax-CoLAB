- Use React.memo and useCallback rigorously when dealing with Three.js/react-three-fiber nested components inside a map loop to prevent massive GPU re-renders.
- Wrap Three.js additive blending materials with \`depthWrite={false}\` or proper \`renderOrder\` values to avoid clipping issues with transparency.

## 2025-04-10 - Add aria-labels for Interactive Buttons Without Text Labels
**Learning:** React components containing icon-only buttons or interactive elements communicating state without text fail accessibility tests since they lack clear semantic meaning for screen readers. Using dynamically updated `aria-label` or `aria-pressed` values improves keyboard accessibility for tools like the Strategy Grid Architect and Risk Radar.
**Action:** When implementing or updating buttons without text labels (like icons) or buttons whose states change functionally, make sure to include `aria-label` or `aria-pressed` to clarify the state.
- React components without proper explicit text-labels on standard form inputs are less accessible for screen reader users and users requiring clear context. Including `title` and `placeholder` attributes on `<input>` and `<select>` elements provides this context when structural label tags aren't present.
- Disabled interactive elements like buttons should communicate their state visually. Updating global styles with a `:disabled` pseudo-class that drops opacity and alters the cursor to `not-allowed` informs users immediately when actions like form submission are suspended or unavailable.

## 2026-04-24 - Accessible Notification Toasts
**Learning:** Custom notification systems (like NeonToasts) often fail to announce critical information to screen reader users if they lack proper ARIA live regions, leaving disabled users unaware of asynchronous actions like order placements.
**Action:** When creating or fixing custom toast notification systems, ensure the container uses `aria-live="polite"` and `aria-atomic="true"`, and individual toasts use `role="alert"` to guarantee dynamic updates are announced.
