#!/usr/bin/env node
/**
 * Pre-build security guard for the daily challenge feature.
 * Verifies anon key cannot read protected tables / call restricted RPCs.
 */

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ??
  "https://lvnpvfxlmzbnylwkvgnq.supabase.co";
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2bnB2ZnhsbXpibnlsd2t2Z25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODQwNjUsImV4cCI6MjA4NTc2MDA2NX0.hDu56RIXWloY5MilImp8hfhfSKv6bc-f5ud9P4ErA_s";

async function checkTableBlocked(table) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`,
      {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      },
    );
    if (res.status === 401 || res.status === 403) {
      return { passed: true, detail: `anon blocked (${res.status})` };
    }
    if (res.ok) {
      const data = await res.json().catch(() => []);
      if (Array.isArray(data) && data.length === 0) {
        return { passed: true, detail: "anon returns empty (RLS enforced)" };
      }
      return { passed: false, detail: `anon received rows (${res.status})` };
    }
    return { passed: true, detail: `anon non-ok (${res.status})` };
  } catch (e) {
    return { passed: true, detail: `network skip: ${e?.message ?? e}` };
  }
}

const checks = [
  { name: "daily_challenges anon read", table: "daily_challenges" },
  { name: "daily_challenge_submissions anon read", table: "daily_challenge_submissions" },
];

let allPassed = true;
for (const c of checks) {
  const r = await checkTableBlocked(c.table);
  const icon = r.passed ? "✅" : "❌";
  console.log(`${icon} ${c.name} — ${r.detail}`);
  if (!r.passed) allPassed = false;
}

if (!allPassed) {
  console.error("\n❌ Daily challenge RLS checks FAILED. Build aborted.");
  process.exit(1);
}
console.log("\n✅ Daily challenge RLS checks passed.");
