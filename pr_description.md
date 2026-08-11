💡 What:
Replaced the inline `details.sort()` operation in the `PortfolioPanel.tsx` component with a memoized version using `useMemo`. The array is now shallow-copied before sorting (`[...details].sort()`) and cached.

🎯 Why:
The `Array.prototype.sort()` method mutates arrays in place in JavaScript. By doing this directly on the state array `details` inside the render function, we were inadvertently mutating React state without `setState`, an anti-pattern that can cause unexpected behavior or dropped renders. In addition, sorting an array on every render pass is an expensive `O(N log N)` operation that could block the main thread and drop frames.

📊 Impact:
- Prevents accidental state mutation.
- Avoids `O(N log N)` re-computation on every UI update, specifically noticeable when toggling the view mode.
- Reduces CPU overhead and prevents dropped frames when rendering a large asset universe list.

🔬 Measurement:
Start the frontend with `pnpm run dev`. Navigate to the Portfolio panel and toggle the view modes rapidly. You should not experience visual stutter or see React warnings regarding state mutations.
