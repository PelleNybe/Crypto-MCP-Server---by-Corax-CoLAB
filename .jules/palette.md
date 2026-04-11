- Use React.memo and useCallback rigorously when dealing with Three.js/react-three-fiber nested components inside a map loop to prevent massive GPU re-renders.
- Wrap Three.js additive blending materials with \`depthWrite={false}\` or proper \`renderOrder\` values to avoid clipping issues with transparency.

## 2025-04-10 - Add aria-labels for Interactive Buttons Without Text Labels
**Learning:** React components containing icon-only buttons or interactive elements communicating state without text fail accessibility tests since they lack clear semantic meaning for screen readers. Using dynamically updated `aria-label` or `aria-pressed` values improves keyboard accessibility for tools like the Strategy Grid Architect and Risk Radar.
**Action:** When implementing or updating buttons without text labels (like icons) or buttons whose states change functionally, make sure to include `aria-label` or `aria-pressed` to clarify the state.
