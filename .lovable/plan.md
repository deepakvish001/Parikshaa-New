# Plan — Redesign `/library/problems` in the Leetcode-Patterns style

Goal: adopt the visual language from the reference screenshots (dark shell, big pixel-style title, three roadmap tabs, progress bar, filter row, difficulty-grouped collapsible table with pattern tags + company logos + notes + review), while keeping every feature the current page already ships (search, sort, filters, presets, share, bookmarks, keyboard shortcuts, realtime stats, admin counts, virtualized paging, etc.).

## Header

- Big pixel-style wordmark: `Coding` + `Problems.` — Space Grotesk 900 with the second word using the same amber `Highlight` + `Shimmer` box already used on Learn/Home so it stays on-brand (no new fonts).
- Sub-line: `by Parikshaa · Est. 2026`, followed by a one-sentence summary: `A collection of N problems grouped by pattern to help you crack coding interviews.` — N pulls from live count.
- Three roadmap-style tab pills (full-width, amber gradient on active):
  1. **All Questions** (default — existing table view)
  2. **Beginner Roadmap** (renders subset ordered by difficulty asc, `startHere` / low-difficulty first — reuses same data, just re-sorted)
  3. **Experienced Roadmap** (Medium+Hard grouped by pattern)

## Progress rail

Full-width dark card showing `X/N completed (P%)` + amber gradient progress bar. Uses existing `useCodingAttemptStats` counts.

## Filter row (single strip)

Left cluster: Search (`/` shortcut kept), All Difficulties, All Patterns, All Companies. Right cluster: `Starred only`, `Due for review`, `Hide completed`, `Hide patterns` (new toggle — hides Pattern(s) column). All wired to existing filter state; new toggles added to the same reducer.

Second row: `Random`, `Shuffle`, `Export`, `Import` — Export/Import reuse the existing preset export/import; Random picks one filtered row; Shuffle randomises client-side order.

## Table

Columns (in this order, matching the reference): ✓ · ★ · Title · Solutions (external link icon → practiceUrl) · Difficulty pill · Pattern(s) tags · Companies (logos, 0-6 months window label) · Notes (inline pencil) · Review. All columns already exist as fields; only visual style + column order change.

Rows are **grouped by difficulty** with a colored left border and header row that is collapsible:

```
▸ Easy    0/41 completed   (green tint band)
▸ Medium  0/112 completed  (amber tint band)
▸ Hard    0/26 completed   (red tint band)
```

Group open/close persisted per user in `localStorage`.

## Vertical left rail (sticky)

Four vertical tabs (About · Helpful Tips · Acknowledgements — matching reference) shown as sticky rotated pills on lg+, collapsed into a top-right menu on mobile. Each opens an existing side sheet:

- **About** → repurposes existing "About" popover copy.
- **Helpful Tips** → repurposes existing keyboard-shortcuts sheet.
- **Acknowledgements** → new short static section crediting Sean Prashad's leetcode-patterns as inspiration + our data sources.

## Feature preservation (nothing gets dropped)

Everything below stays wired exactly as today — only the outer chrome/table styling changes:

- URL filter sync (`?topic=`, `?difficulty=`, presets)
- `useDbCodingProblems`, `useCodingProblemsRealtime`, `usePublishedProblemCount`, `useCodingAttemptStats`, `useCodingProblemBookmarks`, `useSavedFilterPresets`
- Keyboard shortcuts (`/`, `r`, `j/k`, etc.)
- Share intent, deep-link to `CodingProblemDetail`
- Admin published-count badge
- Virtual paging / infinite scroll
- Focus mode, density toggle (Rows2/Rows3), column visibility
- Skeleton loaders

## Files touched

- `src/pages/library/CodingProblems.tsx` — replace header, tabs, filter row, table shell, grouping. Keep every hook + handler.
- `src/components/library/coding/ProblemHeader.tsx` (new) — big wordmark + tabs + progress rail.
- `src/components/library/coding/DifficultyGroup.tsx` (new) — collapsible difficulty band.
- `src/components/library/coding/LeftRail.tsx` (new) — vertical sticky rail with 3 sheets.
- No data schema changes. No new tables. No hook signature changes.

## Out of scope

- No new backend fields (Solutions column just reuses `practiceUrl`; company logos use existing company array; roadmaps derive from existing difficulty/pattern data).
- No copy of Sean Prashad's data — only the visual layout is mirrored, credited in Acknowledgements.

Say "go" and I'll build it.