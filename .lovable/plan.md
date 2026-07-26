# Profile & RLS Hardening Plan

## 1. Improve the existing /settings profile editor
File: `src/components/settings/SettingsProfileTab.tsx`

- Add a zod schema for the editable fields (username, bio, urls, mobile, skills/interests/goals/aspirations arrays) with length caps and URL validation.
- Save button: disabled while saving, `sonner` success/error toast, inline field-level errors from zod.
- On successful save, call `refreshExtendedProfile()` from `AuthContext` so `IdentityCard` / `/u/:username` reflect changes without a reload.
- Add a "View public profile" link that opens `/u/{username}` in a new tab (only when username is set).

## 2. Public profile UX (`src/pages/PublicProfile.tsx`)
- Introduce discriminated state: `loading | not_found | rls_blocked | error | ok`.
- Loading: skeleton matching `IdentityCard` layout instead of blank screen.
- Error banner (typed): shows Supabase error code + human message; distinguishes "profile doesn't exist", "profile is private", and "network/RLS failure".
- Keep querying `public_user_profiles` view only (already the case) — never fall back to `user_profiles_extended` from anon.

## 3. E2E test — anonymous public profile
File: `e2e/public-profile-anon.spec.ts`

- Navigate anonymously to `/u/deepak`.
- Assert: page renders, username visible, no `mobile_number` / `resume_url` / `suspended_reason` strings present in DOM or network responses.
- Assert: navigating to `/u/does-not-exist` shows the not-found state (not a spinner forever).
- Wire into existing `playwright.config.ts` (already present).

## 4. Full RLS matrix regression script
File: `scripts/check-rls-matrix.mjs` + `bun run check:rls`

Uses the public anon key only (no service role) and, optionally, a test-user token from env.

For each user-scoped table below, asserts anon SELECT is either empty or fails, and asserts authenticated SELECT only returns rows for the token's `user_id`:

`profiles`, `user_profiles_extended`, `user_achievements`, `quiz_results`, `notifications`, `push_subscriptions`, `user_activity_log`, `xp_transactions`, `user_topic_progress`, `user_problem_solutions`, `user_folders`, `user_folder_items`, `user_goals`, `user_projects`, `code_submissions`, `code_drafts`, `resume_analyses`, `blog_bookmarks`, `blog_likes`, `chat_messages`, `conversations`, `user_follows` (public read allowed — asserts it), `daily_challenge_completions`, `user_sheet_prefs`.

Also asserts the sensitive-fields guarantee:
- `user_profiles_extended` anon `select *` returns `[]` for a username-having user.
- `public_user_profiles` anon returns the row but no `mobile_number` / `resume_url` / `suspended_reason` keys.

Adds a lightweight GitHub Action `.github/workflows/rls-matrix.yml` that runs it on PR + nightly, gated on secrets being present so forks don't fail.

## Technical details

- No schema migrations. Everything is app-side + test-side.
- New deps: none. Playwright, zod, `@supabase/supabase-js`, sonner all present.
- Env for the RLS script: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (already in `.env`), optional `RLS_TEST_USER_EMAIL` / `RLS_TEST_USER_PASSWORD`.
- Script exits non-zero on any assertion failure and prints a table of `table | anon_result | auth_result | expected | ok`.

## Out of scope
- No new `/profile/edit` route (you chose to improve /settings).
- No changes to existing RLS policies unless the matrix surfaces a real leak — if it does, I'll stop and ask before writing a migration.
