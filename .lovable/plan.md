# Add contest problems and seed real contests

## What's wrong today

Verified against the live database:

- There is no `contest_problems` table at all, so no contest can list questions. The app, the admin editor, and the weekly-contest scheduler all read/write it.
- There is no `contest_submissions` table (the leaderboard function reads it) and no `contest_rating_history` table (the Weekly Contests page reads it).
- The `contests` table is missing `sequence_no`, `invite_code`, `rules_md`, `banner_url`, `max_participants`, `created_by`. The auto-numbering trigger and the registration function reference `sequence_no` and `invite_code`, so creating or registering for a contest fails.
- The `contests` table is empty (0 rows) and no problem is flagged as part of the contest pool (0 of 1,259 published problems).

## Plan

### 1. Database structure

- Create `contest_problems` (contest, problem slug, order, points, optional unlock time), keyed one row per problem per contest, with read access for everyone and write access for admins only.
- Create `contest_submissions` (contest, user, problem, verdict, language, code, submitted time) so scoring and the leaderboard work; users see only their own rows, admins see all.
- Create `contest_rating_history` (contest, user, old/new rating, delta, rank, participants) so the ratings panel loads; readable by everyone, written by backend functions only.
- Add the missing `contests` columns listed above so contest creation, auto-titling, and registration stop failing.

### 2. Fill the contest pool

Flag a balanced set of published problems as contest-eligible (roughly 40 easy, 40 medium, 20 hard) so the weekly scheduler has something to draw from.

### 3. Seed real contests with problems

Create three visible contests, each with problems attached from the pool:

- One live contest (running now, 2 hours, 4 problems: 1 easy, 2 medium, 1 hard).
- One upcoming Sunday weekly contest (next Sunday, 2 hours, 4 problems).
- One past contest (last week, ended, 4 problems) so the "Past" tab isn't empty.

Points ramp per problem (100 / 200 / 300 / 400); registration opens a week before and closes at contest end.

### 4. Verify

Query the contests with their problem counts, then load the Weekly Contests page and a contest detail page to confirm problems and registration render.

## Notes

No UI files change — the pages already read these tables. All new tables get row-level security plus explicit grants; write paths are admin- or backend-only.
