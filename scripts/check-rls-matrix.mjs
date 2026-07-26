#!/usr/bin/env node
/**
 * RLS matrix regression check.
 *
 * For every user-scoped table in the app, asserts:
 *   - anonymous SELECT is either denied or returns 0 rows
 *   - authenticated SELECT (optional) returns only rows belonging to the caller
 *
 * Uses only the public anon key + optional test-user email/password.
 * Exits non-zero on any assertion failure.
 *
 * Env:
 *   VITE_SUPABASE_URL              (required)
 *   VITE_SUPABASE_PUBLISHABLE_KEY  (required)
 *   RLS_TEST_USER_EMAIL            (optional — enables authenticated checks)
 *   RLS_TEST_USER_PASSWORD         (optional)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env if present so `bun run check:rls` works locally without a wrapper.
try {
  const envFile = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of envFile.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
} catch {
  /* no .env */
}

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !anonKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY.");
  process.exit(2);
}

/** @type {Array<{ table: string, anon: 'empty'|'denied'|'empty_or_denied', authScoped?: boolean, note?: string }>} */
const MATRIX = [
  // Intentionally publicly readable — no sensitive columns.
  { table: "profiles", anon: "empty", note: "public read allowed (only full_name/avatar_url)" },
  // Private per-user data — anon must get nothing; auth must only see own rows.
  { table: "user_profiles_extended", anon: "empty_or_denied", authScoped: true, note: "anon must NOT see rows even when username is set" },

  { table: "user_achievements", anon: "empty_or_denied", authScoped: true },
  { table: "quiz_results", anon: "empty_or_denied", authScoped: true },
  { table: "notifications", anon: "empty_or_denied", authScoped: true },
  { table: "push_subscriptions", anon: "empty_or_denied", authScoped: true },
  { table: "user_activity_log", anon: "empty_or_denied", authScoped: true },
  { table: "xp_transactions", anon: "empty_or_denied", authScoped: true },
  { table: "user_topic_progress", anon: "empty_or_denied", authScoped: true },
  { table: "user_problem_solutions", anon: "empty_or_denied", authScoped: true },
  { table: "user_folders", anon: "empty_or_denied", authScoped: true },
  { table: "user_folder_items", anon: "empty_or_denied", authScoped: true },
  { table: "user_goals", anon: "empty_or_denied", authScoped: true },
  { table: "user_projects", anon: "empty_or_denied", authScoped: true },
  { table: "code_submissions", anon: "empty_or_denied", authScoped: true },
  { table: "code_drafts", anon: "empty_or_denied", authScoped: true },
  { table: "resume_analyses", anon: "empty_or_denied", authScoped: true },
  { table: "blog_bookmarks", anon: "empty_or_denied", authScoped: true },
  { table: "blog_likes", anon: "empty_or_denied", authScoped: true },
  { table: "chat_messages", anon: "empty_or_denied", authScoped: true },
  { table: "conversations", anon: "empty_or_denied", authScoped: true },
  { table: "daily_challenge_completions", anon: "empty_or_denied", authScoped: true },
  { table: "user_sheet_prefs", anon: "empty_or_denied", authScoped: true },
  // Intentionally publicly readable — anon should get []/data, never a 401.
  { table: "user_follows", anon: "empty", note: "public read allowed" },
];

const FORBIDDEN_PUBLIC_COLUMNS = ["mobile_number", "resume_url", "suspended_reason"];

const anon = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const results = [];
let fail = 0;

function record(row) {
  results.push(row);
  if (!row.ok) fail++;
}

async function anonCheck(table, expected, note) {
  const { data, error, status } = await anon.from(table).select("*").limit(5);
  const denied = !!error;
  const empty = !error && Array.isArray(data) && data.length === 0;
  let ok = false;
  let observed = denied ? `denied(${error?.code})` : `rows:${data?.length ?? 0}`;
  if (expected === "empty") ok = empty;
  else if (expected === "denied") ok = denied;
  else if (expected === "public") ok = !denied; // readable, rows allowed
  else ok = denied || empty; // empty_or_denied
  record({ table, role: "anon", expected, observed, status, ok, note });
}


async function authScopedCheck(client, userId, table) {
  const { data, error } = await client.from(table).select("user_id").limit(50);
  if (error) {
    // Denied for authed user is unusual but not necessarily a leak — flag as warning.
    record({ table, role: "auth", expected: "own-only", observed: `denied(${error.code})`, ok: true, note: "auth denied (ok, no leak)" });
    return;
  }
  const foreign = (data ?? []).filter((r) => r.user_id && r.user_id !== userId);
  record({
    table,
    role: "auth",
    expected: "own-only",
    observed: `rows:${data?.length ?? 0}, foreign:${foreign.length}`,
    ok: foreign.length === 0,
  });
}

async function sensitiveColumnCheck() {
  // 1. Base table must not leak sensitive columns to anon.
  const { data: baseRows } = await anon.from("user_profiles_extended").select("*").not("username", "is", null).limit(1);
  const baseOk = !baseRows || baseRows.length === 0;
  record({ table: "user_profiles_extended", role: "anon-columns", expected: "no rows", observed: `rows:${baseRows?.length ?? 0}`, ok: baseOk });

  // 2. Public view must return rows but NOT expose sensitive columns.
  const { data: viewRows, error: viewErr } = await anon.from("public_user_profiles").select("*").limit(1);
  if (viewErr) {
    record({ table: "public_user_profiles", role: "anon-columns", expected: "readable", observed: `denied(${viewErr.code})`, ok: false });
    return;
  }
  const sample = viewRows?.[0] ?? {};
  const leaked = FORBIDDEN_PUBLIC_COLUMNS.filter((c) => c in sample);
  record({
    table: "public_user_profiles",
    role: "anon-columns",
    expected: `no ${FORBIDDEN_PUBLIC_COLUMNS.join("/")}`,
    observed: leaked.length ? `LEAKS:${leaked.join(",")}` : "clean",
    ok: leaked.length === 0,
  });
}

console.log(`\nRLS matrix — ${MATRIX.length} tables against ${url}\n`);

for (const row of MATRIX) {
  await anonCheck(row.table, row.anon, row.note);
}
await sensitiveColumnCheck();

const email = process.env.RLS_TEST_USER_EMAIL;
const password = process.env.RLS_TEST_USER_PASSWORD;
if (email && password) {
  const authed = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: signIn, error: signInErr } = await authed.auth.signInWithPassword({ email, password });
  if (signInErr || !signIn.user) {
    console.error("Auth sign-in failed:", signInErr?.message);
    fail++;
  } else {
    for (const row of MATRIX) {
      if (row.authScoped) await authScopedCheck(authed, signIn.user.id, row.table);
    }
    await authed.auth.signOut();
  }
} else {
  console.log("(No RLS_TEST_USER_EMAIL/PASSWORD — skipping authenticated checks)\n");
}

// Print report
const pad = (s, n) => String(s).padEnd(n);
console.log(pad("table", 34) + pad("role", 16) + pad("expected", 22) + pad("observed", 28) + "ok");
console.log("-".repeat(110));
for (const r of results) {
  console.log(
    pad(r.table, 34) + pad(r.role, 16) + pad(r.expected, 22) + pad(r.observed, 28) + (r.ok ? "PASS" : "FAIL") + (r.note ? `  # ${r.note}` : "")
  );
}
console.log(`\n${results.length - fail}/${results.length} checks passed.\n`);

process.exit(fail === 0 ? 0 : 1);
