import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface WeeklyCfg { day: number; hour_utc: number; minute_utc: number; problem_count: number; duration_minutes: number; }
const DEFAULT_CFG: WeeklyCfg = { day: 0, hour_utc: 15, minute_utc: 0, problem_count: 4, duration_minutes: 120 };

function nextRunUTC(cfg: WeeklyCfg) {
  const now = new Date();
  const d = new Date(now);
  const cur = d.getUTCDay();
  let add = (cfg.day - cur + 7) % 7;
  const candidate = new Date(d);
  candidate.setUTCDate(d.getUTCDate() + add);
  candidate.setUTCHours(cfg.hour_utc, cfg.minute_utc, 0, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setUTCDate(candidate.getUTCDate() + 7);
  }
  return candidate;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: cfgRow } = await admin
      .from("platform_settings").select("value").eq("key", "weekly_contest_config").maybeSingle();
    const cfg: WeeklyCfg = { ...DEFAULT_CFG, ...((cfgRow?.value as WeeklyCfg) ?? {}) };
    const problemCount = Math.max(2, Math.min(10, cfg.problem_count));

    const starts = nextRunUTC(cfg);
    const ends = new Date(starts.getTime() + cfg.duration_minutes * 60 * 1000);
    const slug = `weekly-${starts.toISOString().slice(0, 10)}`;

    // idempotent
    const { data: existing } = await admin.from("contests").select("id,slug").eq("slug", slug).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ ok: true, skipped: true, contest_id: existing.id }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick problems from private contest pool
    const { data: pool, error: poolErr } = await admin
      .from("coding_problems")
      .select("slug,title,difficulty")
      .eq("is_contest_pool", true)
      .eq("is_published", true)
      .limit(500);
    if (poolErr) throw poolErr;
    if (!pool || pool.length < problemCount) {
      return new Response(JSON.stringify({ error: `Contest pool has fewer than ${problemCount} problems. Mark more coding_problems.is_contest_pool = true.` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prefer variety by difficulty
    const byDiff: Record<string, any[]> = { easy: [], medium: [], hard: [] };
    pool.forEach((p) => (byDiff[(p.difficulty ?? "medium").toLowerCase()] ??= []).push(p));
    const pick = (arr: any[], n: number) => arr.sort(() => Math.random() - 0.5).slice(0, n);
    const easyN = Math.max(1, Math.floor(problemCount * 0.25));
    const hardN = Math.max(1, Math.floor(problemCount * 0.25));
    const medN = Math.max(0, problemCount - easyN - hardN);
    const chosen = [
      ...pick(byDiff.easy ?? [], easyN),
      ...pick(byDiff.medium ?? [], medN),
      ...pick(byDiff.hard ?? [], hardN),
    ].filter(Boolean);
    while (chosen.length < problemCount) {
      const extra = pool.find((p) => !chosen.some((c) => c.slug === p.slug));
      if (!extra) break;
      chosen.push(extra);
    }
    chosen.length = Math.min(chosen.length, problemCount);

    const { data: contest, error: cErr } = await admin.from("contests").insert({
      slug,
      title: `Parikshaa Weekly Round · ${starts.toISOString().slice(0, 10)}`,
      description: `Rated ${Math.round(cfg.duration_minutes / 60 * 10) / 10}-hour weekly contest. ${chosen.length} problems. Ratings update after end.`,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      registration_opens_at: new Date(starts.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      registration_closes_at: ends.toISOString(),
      status: "published",
      visibility: "public",
      scoring_mode: "icpc",
      penalty_minutes: 10,
      is_weekly_rated: true,
    }).select().single();
    if (cErr) throw cErr;

    const problemRows = chosen.map((p, i) => ({
      contest_id: contest.id,
      problem_slug: p.slug,
      order_index: i,
      points: 100 * (i + 1),
    }));
    const { error: pErr } = await admin.from("contest_problems").insert(problemRows);
    if (pErr) throw pErr;

    return new Response(JSON.stringify({ ok: true, contest_id: contest.id, slug, problems: chosen.length }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("schedule-weekly-contest", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
