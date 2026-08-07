# Visualizer layout: explanation + complexity move to the bottom

## Goal
On the Code Visualizer page, the top area should be a clean two-column workspace, and the analysis content should sit underneath it full width.

```text
+---------------------------+---------------------------------+
|  Code editor (left)       |  Visual blocks / call stack     |
|                           |  (right, full height)           |
+---------------------------+---------------------------------+
|  Line explanation + output |  Time / space complexity       |
+---------------------------+---------------------------------+
```

## What changes
- Top row: code editor on the left, execution/visual blocks on the right, both stretching to the same height.
- Bottom row: a full-width strip split into two equal halves — line-by-line explanation (with console output) on the left, complexity analysis on the right.
- The bottom strip only appears once a trace exists; without a trace the page keeps the current single two-column layout.
- On small screens everything stacks vertically in the same order: code, visuals, explanation, complexity.

## Technical notes
All edits are in `src/pages/learn/visualize/CodeVisualizer.tsx`:
- The explanation + complexity block currently sits in the DOM between the code panel and the visualization panel and is pushed down with `order-last`. Move it so it comes after the visualization panel in the markup and drop the `order-last` hack, so grid order matches DOM order.
- Keep the grid as `lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:grid-rows-[1fr_auto]` when a trace is present; the bottom strip stays `lg:col-span-2` with a two-column inner grid.
- Give the top-row panels `min-h-0` so the editor and the visual panel scroll internally instead of stretching the page.
- No logic, data, or state changes — presentation only.
