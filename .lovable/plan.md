# Visualize — Next Set Plan

Current state: `/learn/visualize` has 1 live track (**DSA Visual**) with 5 algorithms (two-pointers, sliding-window, binary-search, bubble-sort, recursion-factorial). Player supports code sync, PC-line highlighting, call-stack scenes, favorites via localStorage. LLD / Networking / OS tracks are placeholders.

Goal for this next set: **10× the library, deepen the player, and turn Visualize into a course-like surface** without breaking the current aesthetic (amber/black glass, framer-motion, brand shell components).

---

## 1. Expand DSA Visual (highest ROI)

Add 12 new algorithms across the patterns learners actually search for. Each reuses the existing `AlgoFrame` / `CallScene` engine — no new renderer work.

**Arrays / Strings**
- Kadane's max subarray (running best highlight)
- Dutch National Flag (3-pointer partition)
- Longest substring without repeat (window + hashset ticker)

**Linked List** *(new scene type: `LinkedListScene` — nodes + next-arrows)*
- Reverse a linked list (prev/curr/next pointers)
- Detect cycle — Floyd's tortoise & hare (two speeds)
- Merge two sorted lists

**Trees** *(new scene type: `TreeScene` — SVG binary tree with node states)*
- BFS level-order (queue on the side)
- DFS inorder (recursion stack + visited highlight)
- Lowest common ancestor

**Graphs** *(new scene type: `GraphScene` — force-laid nodes + edges)*
- BFS shortest path on unweighted graph
- Dijkstra (priority queue side panel)
- Union-Find (parent-array morphing view)

**DP** *(new scene: `DpTableScene` — 1D/2D grid fill)*
- Fibonacci memo vs tab (side-by-side)
- 0/1 Knapsack (2D grid fill with arrow to source cell)
- Longest common subsequence

## 2. Ship LLD Visual as v1

Currently a placeholder. Ship 4 animated case studies with a new **UML scene** (class boxes + typed arrows that draw themselves):
- SOLID walkthrough — 5 mini refactors, before/after class diagram
- Strategy pattern (payment gateway)
- Observer pattern (event bus with subscriber count animating)
- Factory + Singleton (with anti-pattern callout)

Each lesson uses the same player shell: code panel left, animated diagram right, step controls.

## 3. Player upgrades

- **Speed control**: 0.5× / 1× / 2× (already have autoplay — add speed multiplier).
- **Step-jump timeline**: draggable scrubber above the play/pause bar with tooltips showing `explain` per frame.
- **Compare mode**: split screen showing brute-force vs optimized side-by-side, synced steps (huge for two-pointers, DP).
- **Complexity badge**: persistent `O(n) time · O(1) space` chip in the player header, per algorithm.
- **Keyboard shortcuts**: ←/→ step, space play/pause, R restart, C toggle code.
- **"Try in playground"** button — deep-links to `/learn/code-playground` prefilled with the algo's code snippet.

## 4. Hub UX polish (`/learn/visualize`)

- **Search bar** over algorithms (client-side fuzzy on title + track + tags).
- **Filter chips**: track, difficulty (Easy/Med/Hard), status (New/Live/Bonus).
- **"Continue watching"** row using localStorage last-viewed timestamp per algo.
- **Progress ring** per track: `3 / 12 watched`, tracked in localStorage (same pattern as `useVisualizeFavorites`).
- **Track cards** get a mini animated preview on hover (5-frame loop of the first algo).

## 5. Social & sharing

- **Shareable frame links**: `/learn/visualize/algo/binary-search?step=7` deep-links to a specific frame — for tweets, blog embeds, teaching.
- **Copy-as-GIF** (client-side): capture the stage as a short animated GIF using `gif.js` — one-tap share.
- **Embed snippet**: `<iframe>` code generator so bloggers can embed a single visualizer read-only.

## 6. Persistence upgrade

Move from localStorage-only to a `visualize_progress` table (opt-in, only for signed-in users):
- Columns: `user_id`, `algo_id`, `last_step`, `favorited`, `watched_at`.
- RLS: user reads/writes only their own rows.
- Falls back to localStorage for guests — no regression.

## 7. Networking + OS tracks (teaser only, ship later)

Not building content this round. Just replace the "Preview soon" empty state with a **waitlist form** (email → `visualize_waitlist` table) so we measure demand before investing in the harder scene renderers.

---

## Technical details

**New scene types to add in `algos.ts`**
```ts
type Scene =
  | CallScene        // existing
  | LinkedListScene  // { nodes: {value, state}[], pointers: {name, index}[] }
  | TreeScene        // { root: TreeNode, highlighted: string[], queue?, stack? }
  | GraphScene       // { nodes: {id, x, y, state}[], edges: {from, to, weight?, state}[], side?: 'queue'|'pq'|'uf' }
  | DpTableScene     // { rows, cols, cells: {value, state, arrowFrom?}[][] }
  | UmlScene;        // { classes: {name, methods, x, y}[], relations: {from, to, kind}[] }
```
Player switch already renders `scene` if present — extend the switch in `VisualizePlayer.tsx` with one branch per new scene component. Each scene is a self-contained SVG component under `src/pages/learn/visualize/scenes/`.

**File layout**
```text
src/pages/learn/visualize/
  algos/
    two-pointers.ts      (extract from algos.ts)
    binary-search.ts
    kadane.ts
    ...one file per algo
  scenes/
    LinkedListScene.tsx
    TreeScene.tsx
    GraphScene.tsx
    DpTableScene.tsx
    UmlScene.tsx
  hooks/
    useVisualizeProgress.ts   (localStorage + Supabase sync)
    useAlgoSearch.ts
```

**DB migration** (only if section 6 approved):
```sql
create table public.visualize_progress (
  user_id uuid references auth.users on delete cascade,
  algo_id text not null,
  last_step int default 0,
  favorited boolean default false,
  watched_at timestamptz default now(),
  primary key (user_id, algo_id)
);
grant select, insert, update, delete on public.visualize_progress to authenticated;
grant all on public.visualize_progress to service_role;
alter table public.visualize_progress enable row level security;
create policy "own rows" on public.visualize_progress
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

No breaking changes. All new work is additive; existing 5 algos keep working untouched.

---

## Suggested build order

1. **Player upgrades** (§3) — 1 session, unlocks better UX for everything below.
2. **Hub polish** (§4) — search + filters + progress rings.
3. **DSA expansion wave 1** — Arrays/Strings + Linked List (6 algos, 1 new scene type).
4. **DSA expansion wave 2** — Trees + DP (6 algos, 2 new scene types).
5. **LLD v1** (§2) — UML scene + 4 case studies.
6. **Social/sharing** (§5) — deep-link step, embed, copy-as-GIF.
7. **Persistence** (§6) — table + hook, opt-in.
8. **Graph algos + Networking/OS waitlist** — last, biggest lift.

## Out of scope

- No content for Networking / OS tracks yet — waitlist only.
- No AI-generated explanations (separate future track).
- No mobile-native gestures beyond what framer-motion gives us.

Pick which sections you want in the first cut and I'll start on §1 order unless you say otherwise.
