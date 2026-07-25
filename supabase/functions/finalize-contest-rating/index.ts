import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const K = 32; // rating volatility

// Codeforces-style seed: expected rank based on ratings
function expectedSeed(userRating: number, others: number[]) {
  let seed = 1;
  for (const r of others) seed += 1 / (1 + Math.pow(10, (userRating - r) / 400));
  return seed;
}

async function finalizeContest(admin: any, contestId: string) {
  // Skip if already finalized
  const { count: existing } = await admin
    .from("contest_rating_history").select("id", { count: "exact", head: true })
    .eq("contest_id", contestId);
  if ((existing ?? 0) > 0) return { contestId, skipped: true };

  // Gather submissions → per-user score
  const { data: subs } = await admin
    .from("contest_submissions")
    .select("user_id, points_awarded, penalty_seconds, verdict")
    .eq("contest_id", contestId);
  const perUser: Record<string, { score: number; penalty: number }> = {};
  (subs ?? []).forEach((s: any) => {
    if (s.verdict !== "accepted" && s.verdict !== "AC") return;
    const u = perUser[s.user_id] ??= { score: 0, penalty: 0 };
    u.score += Number(s.points_awarded ?? 0);
    u.penalty += Number(s.penalty_seconds ?? 0);
  });

  // Include all registered users (even 0 score) so they still lose/gain rating
  const { data: regs } = await admin
    .from("contest_registrations").select("user_id, status")
    .eq("contest_id", contestId).eq("status", "registered");
  (regs ?? []).forEach((r: any) => { perUser[r.user_id] ??= { score: 0, penalty: 0 }; });

  const userIds = Object.keys(perUser);
  if (userIds.length < 2) return { contestId, skipped: true, reason: "too few participants" };

  // Fetch current ratings (latest new_rating per user, else default 1200)
  const { data: hist } = await admin
    .from("contest_rating_history")
    .select("user_id, new_rating, created_at")
    .in("user_id", userIds)
    .order("created_at", { ascending: false });
  const currentRating: Record<string, number> = {};
  (hist ?? []).forEach((h: any) => { if (!(h.user_id in currentRating)) currentRating[h.user_id] = h.new_rating; });
  userIds.forEach((u) => { currentRating[u] ??= 1200; });

  // Rank users by score desc, penalty asc, rating desc
  const ranked = userIds.map((u) => ({
    user_id: u, score: perUser[u].score, penalty: perUser[u].penalty, rating: currentRating[u],
  })).sort((a, b) => b.score - a.score || a.penalty - b.penalty || b.rating - a.rating);

  const participants = ranked.length;
  const rows: any[] = [];
  ranked.forEach((r, idx) => {
    const others = ranked.filter((x) => x.user_id !== r.user_id).map((x) => x.rating);
    const seed = expectedSeed(r.rating, others);
    const actualRank = idx + 1;
    // Codeforces: delta = (mid - actualRank) where mid = sqrt(seed * actualRank)
    const mid = Math.sqrt(seed * actualRank);
    let delta = Math.round((seed - actualRank) / 2);
    // Blend a bit of K-style push for small fields
    delta += Math.round((mid - actualRank) * 0.25);
    // Clamp for stability
    delta = Math.max(-200, Math.min(200, delta));
    rows.push({
      user_id: r.user_id,
      contest_id: contestId,
      old_rating: r.rating,
      new_rating: r.rating + delta,
      delta,
      rank: actualRank,
      participants,
      score: r.score,
    });
  });

  const { error } = await admin.from("contest_rating_history").insert(rows);
  if (error) throw error;
  await admin.from("contests").update({ status: "finished" }).eq("id", contestId);
  return { contestId, finalized: rows.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let body: any = {};
    try { body = await req.json(); } catch {}
    const contestId = body?.contest_id;

    if (contestId) {
      const r = await finalizeContest(admin, contestId);
      return new Response(JSON.stringify(r), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Auto: any weekly rated contest that ended and has no history rows
    const { data: candidates } = await admin
      .from("contests")
      .select("id, ends_at")
      .eq("is_weekly_rated", true)
      .lte("ends_at", new Date().toISOString())
      .neq("status", "finished")
      .limit(5);

    const results = [];
    for (const c of candidates ?? []) {
      try { results.push(await finalizeContest(admin, c.id)); }
      catch (e) { results.push({ contestId: c.id, error: String((e as Error).message ?? e) }); }
    }
    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("finalize-contest-rating", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
