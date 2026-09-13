# Global Navigation, Sheet Progress, Contest Results and Prep Hub

## Goal
Make the app shell work consistently on desktop and mobile, track real learning progress, capture genuine contest standings from the next round onward, and replace Prep Hub placeholders with live account data while preserving the Learn page’s dark visual language.

## Implementation

### 1. Global left navigation and fixed mobile header
- Consolidate the duplicated Learn and global rail navigation into one shared navigation definition so Home, Prep Hub, Contest, Ranks, Jobs, Visualize, Roadmap and Notifier stay identical across pages.
- Add a mobile menu button and drawer to the shared dashboard shell; desktop keeps the compact fixed left rail.
- Add a fixed mobile top bar outside the page scroll area with the Parikshaa identity, current section, menu and profile actions.
- Keep the top bar visible while the mobile drawer is open by placing the drawer below the header and aligning overlay/header stacking.
- Apply the same shell behavior to Learn and sheet pages without changing their desktop content layout.

### 2. Real sheet progress and time tracking
- Extend each user’s topic progress with accumulated active time in seconds and last activity metadata; keep access private to that user.
- Track active reading/practice time only while the sheet is visible, flush periodically and when leaving the page, and avoid counting background-tab time.
- Extend the existing sheet progress hook to return solved, pending, total, percentage, revision count and time spent for every sheet.
- Show these metrics on each sheet and aggregate them on Prep Hub.

### 3. Sheet details and downloads
- Add a clear summary for CSES, Competitive Programming Interview and Striver SDE sheets: description, problem count, difficulty mix and section/module overview.
- Add download options for CSV and JSON containing section, topic, difficulty, links, completion, revision and personal note data. No new document library is needed.
- Keep the existing progress controls, filters and section structure intact.

### 4. Genuine contest results from the next round onward
- Do not create fake or demo results for past rounds. Existing empty historical rounds remain honestly empty.
- Route registration through the existing validated contest registration flow instead of direct writes.
- Ensure accepted code submissions made during a registered contest are mirrored into contest submissions and immediately recompute solved count, points, elapsed/penalty time and rank.
- Make finished contest standings readable consistently and finalize contest ratings after a round ends.
- Add operational finalization/recompute support so future rounds cannot remain stuck with empty standings after submissions exist.
- Update Weekly Contests cards and detail standings to show each user’s solved problems, contest time/penalty, rank and rating change when real data exists.
- Connect the Ranks experience to internal contest rating data while retaining external-handle metrics as a separate view.

### 5. Prep Hub with live data
- Replace hardcoded tasks, score, 25% progress, problem-of-the-day and revision snippets with real queries.
- Show live cards for total solved, pending, tracked study time, active sheets, overall sheet completion and current streak.
- Add a sheet-progress list using the shared progress hook and upcoming/live contests using the contests data already in the app.
- Show recent revision items only from the user’s saved progress; use honest empty states when no data exists.
- Keep the current deep-black, amber-accent Learn design, but remove ad-hoc duplicate styling and apply the shared theme at the Prep Hub route shell.

## Technical details
- Database change: add non-negative `time_spent_seconds` to `user_topic_progress`; update grants/RLS-compatible access and indexes only where needed.
- Contest database changes: normalize finished-status visibility, harden registration/submission-to-leaderboard flow, and expose safe recompute/finalize operations without client-side admin checks.
- Frontend: add focused hooks/components for mobile navigation, sheet timing/export, Prep Hub aggregation and contest rating ranks instead of growing page files further.
- Validation: typecheck, targeted tests for sheet aggregation/export and contest standings, then authenticated Playwright checks on mobile and desktop for sidebar/header, sheet progress, Prep Hub and contest pages.

## Data policy
- Past contest standings will not be fabricated.
- Real standings and rating history begin with the next round that receives genuine registrations and submissions.
