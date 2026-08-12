# LeetLeague clone — feature-by-feature build plan

Goal: reproduce the referenced product's full feature set inside our platform, using our existing design system and backend. Build in ordered milestones, each independently shippable.

## What already exists here (reuse, don't rebuild)

- LeetCode/coding-profile fetching: `leetcode-profile` and `fetch-coding-profiles` edge functions, `useLeetCodeProfile`, `useCodingPlatformsStats`, `user_platform_stats`, `user_platform_sync_jobs`.
- Sheets: large static sheet datasets + `/learn/sheets/:slug` with progress, bookmarks, revision list.
- Contests: our own contest engine at `/contests`.
- Profiles, roles, XP, achievements, notifications, admin console.

## What is missing (the actual clone work)

- Friends: add by handle, bulk import, per-friend synced stats, compare.
- Clans: create/join by invite code, public browse, membership roles, clan leaderboards.
- Ranks: multi-metric leaderboards (Today / Weekly / Monthly / All-Time / Contest Rating / Current Streak / Longest Streak / Hard Problems / Consistency) with podium.
- Global Activity Feed of recent solves across tracked handles, with Solve / Solution / Save actions.
- Overview dashboard: total solved, streak, rating, difficulty rings, global standing, solving pace, daily challenge card, daily/weekly/monthly solve chart, contest rating chart, language and topic distribution, recent solves.
- External contests calendar (AtCoder / LeetCode / Codeforces / CodeChef / HackerRank) with countdowns.
- "Sync All" action + per-entity sync status.
- Bookmarks hub for saved problems.

## Milestones

### M1 — Tracked handles + sync core
Foundation everything else reads from. Store any LeetCode handle (own or a friend's) as a tracked handle with a snapshot of stats, submission calendar, recent solves, contest rating history, language and topic distribution. Add a batched "Sync All" job with per-handle status and rate limiting.

### M2 — Overview dashboard
`/league` home reproducing the metric row, difficulty rings, global standing, solving pace, daily challenge card, and the four charts, all driven by M1 data.

### M3 — Friends
Add friend by handle, bulk import (paste list / CSV), friend cards with solved / rating / streak and today's activity, per-friend detail page (difficulty breakdown, standing, pace, rating chart, heatmap, recent solves), and Compare view.

### M4 — Ranks
Leaderboard with the metric tabs above, podium for the top three, paginated table, scoped to friends or global-tracked pool.

### M5 — Clans
Clans with public/private visibility, invite codes, banner and logo, member roles (owner/admin/member), member list, clan-level aggregate stats, browse and Top Clans.

### M6 — Global activity feed + bookmarks
Reverse-chronological solve feed across tracked handles with difficulty badges and Solve / Solution / Save actions; Bookmarks page for saved problems.

### M7 — External contests calendar
Scheduled fetch of upcoming contests across the five platforms, platform filters, search, countdown badges, external View link.

### M8 — Sheets parity pass
Pattern-grouped sheet view with per-problem company tags, bookmark, revision flag, and Solve action — applied to our existing sheet data.

## Technical notes

- New tables (all with GRANTs + RLS, roles via existing `has_role`): `tracked_handles`, `handle_stats_snapshots`, `handle_daily_activity`, `handle_recent_solves`, `handle_contest_history`, `friends`, `clans`, `clan_members`, `clan_invites`, `external_contests`, `saved_problems`.
- Leaderboards served by security-definer SQL functions returning pre-ranked rows, mirroring the existing `get_coding_leaderboard` pattern, so ranking never runs client-side.
- Sync: one edge function `handles-sync` doing batched fetches with backoff, driven by `user_platform_sync_jobs`; cron for periodic refresh plus a manual "Sync All" trigger.
- `external-contests-sync` edge function on cron populating `external_contests`.
- Charts use the existing recharts setup and semantic tokens; no new color hardcoding.
- Routes live under `/league/*` inside a dashboard layout, and the features are surfaced from the existing left rail rather than a separate shell.

## Confirmations needed before M1

Answering these shapes the schema, so they are asked before the first migration.
