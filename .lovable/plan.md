# '''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            i want to build this plan for it ?

Primary = Lovable Cloud (aaj jaisa hai). Secondary = external Supabase project
in your own account, kept in near-realtime sync as a warm failover.

## Honest scope check

Kya realistic hai:
- **Data mirror via triggers + edge function**: ~5-30 sec lag per row change.
- **Schema sync**: one-time dump + manual re-apply on future migrations.
- **Storage sync**: hourly rclone job (files change less often than rows).
- **Auth users mirror**: nightly export/import (Supabase auth doesn't stream).
- **Automatic failover**: health-check cron flips a client-side flag; app re-inits Supabase client with mirror URL.

Kya realistic **NAHI** hai on Lovable Cloud:
- Sub-second replication (no logical replication access on managed Cloud).
- Automatic DNS/env swap at hosting layer (Lovable hosting env is build-time baked).
- Perfect consistency (mirror will lag; conflict-free only because it's read-only mirror, writes go to primary).

## Architecture

```text
┌────────────────┐   trigger    ┌──────────────────┐   HTTPS   ┌──────────────────┐
│ Lovable Cloud  │─────────────▶│ mirror-relay     │──────────▶│ External Supabase│
│ (primary)      │  NOTIFY      │ edge function    │  upsert   │ (warm standby)   │
└────────────────┘              └──────────────────┘           └──────────────────┘
        ▲                                                              ▲
        │ writes + reads (normal)                                      │ reads only (failover)
        │                                                              │
        └──────────────────── React app ───────────────────────────────┘
                                    │
                                    ▼
                        ┌──────────────────────┐
                        │ health-check every    │
                        │ 30s → localStorage    │
                        │ flag "use_mirror"     │
                        └──────────────────────┘
```

## Phase 1 — External project setup (you do this)

1. supabase.com → New project (same region as Cloud).
2. Save: project URL, anon key, **service_role key**, DB password.
3. Add 3 secrets to Lovable Cloud:
   - `MIRROR_SUPABASE_URL`
   - `MIRROR_SUPABASE_SERVICE_ROLE_KEY`
   - `MIRROR_SUPABASE_ANON_KEY`

## Phase 2 — Schema mirror (one-time)

Main ek edge function banunga: `export-schema-dump` — Lovable Cloud ke current schema (tables, columns, indexes, RLS policies, functions, triggers **except the mirror triggers themselves**) ko SQL file me export karega. Aap wo SQL external project ke SQL editor me paste karke run karenge.

Repeat karna hoga jab bhi Lovable Cloud pe schema change ho.

## Phase 3 — Realtime data mirror

**Approach**: generic trigger on every mirrorable table → writes to `public.mirror_outbox` → edge function `mirror-drain` polls outbox every 10s → pushes rows to external Supabase via REST → marks synced.

Why outbox (not direct HTTP from trigger): pg_net is async & lossy on failure, outbox gives retries + backpressure + observability.

New table:
```sql
public.mirror_outbox (
  id bigserial pk,
  table_name text,
  op text,           -- 'insert' | 'update' | 'delete'
  row_pk jsonb,      -- primary key(s)
  row_data jsonb,    -- new row (null on delete)
  created_at timestamptz default now(),
  synced_at timestamptz,
  attempts int default 0,
  last_error text
)
```

Generic trigger function applied to each user-facing table via a bootstrap script. Excluded tables: audit logs, ephemeral session tables, `mirror_outbox` itself.

Edge function `mirror-drain`:
- Runs on pg_cron every 10 seconds.
- Reads up to 500 unsynced rows.
- Batches by table → PostgREST upsert to mirror.
- Marks synced_at; on failure increments attempts + last_error.
- Rows with attempts > 10 → alert (log + notification).

Admin page: `/admin/mirror-health` — outbox depth, last sync, error rate, per-table lag.

## Phase 4 — Storage mirror

Edge function `mirror-storage` runs hourly via cron:
- Lists all buckets on primary.
- For each object modified since last run, downloads → uploads to mirror.
- Tracks state in `mirror_storage_cursor` table.

## Phase 5 — Auth users mirror

Auth users can't stream. Nightly cron:
- Edge function `mirror-auth-users` calls admin `listUsers()` on primary.
- Upserts into mirror via admin `createUser()` / `updateUserById()`.
- Password hashes preserved via `password_hash` field (Supabase admin API supports this).

Caveat: users signed up in last <24h before failover won't be in mirror. Acceptable for DR.

## Phase 6 — Health check + auto failover

Client-side change in `src/integrations/supabase/client.ts`:
- Wrap client init: check `localStorage.use_mirror` flag.
- If true → build client with `MIRROR_SUPABASE_URL` + anon key.

Background health monitor (`src/lib/mirrorFailover.ts`):
- Every 30s: `fetch(PRIMARY_URL + '/rest/v1/', { method: HEAD })` with 5s timeout.
- 3 consecutive failures → set flag → soft reload page.
- 3 consecutive successes while on mirror → clear flag → reload.

Toast banner on top: "⚠️ Running on backup — read-only mode" when mirror active.

**Important**: mirror is **read-only** during failover — writes would create split-brain. `App.tsx` wraps mutations with a guard that shows "Backend recovering, try again in a minute" when mirror flag is set.

## Phase 7 — Edge functions

Edge function code lives in GitHub already. External project deploys same code via Supabase CLI whenever primary functions change. Secrets synced manually.

Not automated — functions change less often than data.

## Cost estimate

- External Supabase: free tier fits until ~500MB / 50k MAU, then $25/mo Pro.
- Extra Cloud edge function invocations: ~8,640/day for mirror-drain = well within free tier.
- Storage double-writes: 2× bandwidth on file uploads.

## What I'll build first (approve to proceed)

**Milestone 1 (this turn)**: Phase 1 setup checklist + Phase 2 schema-export edge function. You run one manual step (create external project, add 3 secrets) and I hand you a SQL file to paste.

**Milestone 2 (next turn)**: `mirror_outbox` table + generic trigger bootstrap + `mirror-drain` edge function + cron job. Data starts flowing.

**Milestone 3**: Storage mirror + auth mirror + health check UI.

## Non-negotiable warnings

- Mirror is **eventual consistency** — 5-30 sec typical, more under load.
- During failover you get **read-only** app. Writes wait for primary to recover.
- 287 migrations already applied — future migrations must be **replayed manually** on mirror. I'll add a checklist in `/admin/mirror-health`.
- Row-level security policies also need to match — schema export includes them.
- Cost & credit usage go up (2× edge function calls, 2× storage bandwidth).
