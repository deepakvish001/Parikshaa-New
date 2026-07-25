---
name: Unified shell components
description: PageShell + SurfaceCard + PageHeader wrappers extracted from /learn and /u/:username; use these on every new page to keep the brand aesthetic uniform
type: design
---
Three reusable wrappers live in `src/components/shell/`:

- `PageShell` — page wrapper. Props: `width="narrow"|"default"|"wide"` (4xl / 6xl / 1400px). Applies `min-h-screen bg-background` + standard `px-3 sm:px-5 lg:px-8 py-4 sm:py-6` padding matching ProfileShell + LearnHub.
- `SurfaceCard` — branded glass surface. Props: `tone="default"|"amber"|"muted"`, `padded` (default true). Use instead of plain shadcn `Card` when you want the amber/orange glass look (`border-border/60 bg-card/60 backdrop-blur-sm rounded-xl`).
- `PageHeader` — eyebrow pill + title + description + actions row. Eyebrow pill always uses amber palette (`border-amber-400/30 bg-amber-500/10 text-amber-200`).

Already adopted by: `src/pages/Settings.tsx` (branded tab list), `src/pages/contests/ContestsList.tsx`, `src/pages/DashboardMatrix.tsx` (stats row swapped from blue/purple → amber/orange). New pages and migrations must use these instead of hand-rolling the same chrome.
