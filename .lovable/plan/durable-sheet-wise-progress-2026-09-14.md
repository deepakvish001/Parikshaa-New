# Durable Sheet-wise Progress

## Goal
Store each user's solved and pending totals per sheet in Lovable Cloud, so Prep Hub still shows the same live progress after days or weeks.

## Changes
- Add a private `user_sheet_progress_summary` table keyed by user and sheet, with solved, pending, total, tracked time, and last-updated time.
- Add database logic that refreshes the summary whenever a problem completion or sheet study-time record changes.
- Backfill summaries from existing `user_topic_progress` records without losing current progress.
- Update Prep Hub to read the stored sheet summaries and subscribe to their live changes.
- Keep section counts on the sheet page derived from the same saved per-problem records.
- Verify sign-in ownership rules, persistence after reload, live dashboard refresh, and TypeScript checks.

## Technical details
- The summary table will be authenticated-user-only with row-level ownership policies and explicit grants.
- Solved is the count of completed problem rows; pending is `sheet total - solved`; the `__sheet_session__` timing row is excluded from problem counts.
- Known sheet totals remain sourced from the canonical sheet catalogue, while the database stores the resulting snapshot for durable dashboard reads.
