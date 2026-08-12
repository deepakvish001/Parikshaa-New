// Syncs tracked LeetCode handles into the shared league tables.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const PROFILE_QUERY = `
query league($username: String!) {
  matchedUser(username: $username) {
    username
    profile { userAvatar realName ranking countryName }
    submitStatsGlobal { acSubmissionNum { difficulty count submissions } }
    submitStats { acSubmissionNum { difficulty count } totalSubmissionNum { difficulty count } }
    userCalendar { streak totalActiveDays submissionCalendar }
    languageProblemCount { languageName problemsSolved }
    tagProblemCounts {
      advanced { tagName problemsSolved }
      intermediate { tagName problemsSolved }
      fundamental { tagName problemsSolved }
    }
    badges { id displayName icon }
  }
  recentAcSubmissionList(username: $username, limit: 20) { id title titleSlug timestamp lang }
  userContestRanking(username: $username) { attendedContestsCount rating globalRanking totalParticipants topPercentage }
  userContestRankingHistory(username: $username) { attended rating ranking contest { title startTime } }
  allQuestionsCount { difficulty count }
}`;

async function lcFetch(username: string, query: string, variables: Record<string, unknown>) {
  const res = await fetch("https://leetcode.com/graphql/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: `https://leetcode.com/${username}/`,
      "User-Agent": "Mozilla/5.0 (compatible; ParikshaaBot/1.0)",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`LeetCode HTTP ${res.status}`);
  const j = await res.json();
  if (j.errors?.length) throw new Error(j.errors[0].message || "LeetCode GraphQL error");
  return j.data;
}

const DAY_MS = 86400000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

function computePace(calendar: Record<string, number>) {
  const entries = Object.entries(calendar).map(([ts, n]) => ({
    day: new Date(Number(ts) * 1000),
    n: Number(n),
  }));
  const now = new Date();
  const todayKey = dayKey(now);
  let today = 0, week = 0, month = 0, total = 0, activeDays = 0;
  const dow = [0, 0, 0, 0, 0, 0, 0];
  for (const e of entries) {
    const k = dayKey(e.day);
    const age = (now.getTime() - e.day.getTime()) / DAY_MS;
    if (k === todayKey) today += e.n;
    if (age <= 7) week += e.n;
    if (age <= 30) month += e.n;
    total += e.n;
    if (e.n > 0) activeDays++;
    dow[e.day.getUTCDay()] += e.n;
  }
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const peakDay = names[dow.indexOf(Math.max(...dow))];
  // longest streak over consecutive active days
  const activeKeys = entries.filter((e) => e.n > 0).map((e) => dayKey(e.day)).sort();
  let longest = 0, run = 0, prev: string | null = null;
  for (const k of activeKeys) {
    if (prev && new Date(k).getTime() - new Date(prev).getTime() === DAY_MS) run++;
    else run = 1;
    longest = Math.max(longest, run);
    prev = k;
  }
  const consistency = activeDays > 0 ? Math.round((activeDays / 365) * 1000) / 10 : 0;
  return {
    today,
    week,
    month,
    activeDays,
    peakDay,
    longest,
    consistency,
    avgPerActive: activeDays ? Math.round((total / activeDays) * 100) / 100 : 0,
  };
}

async function syncHandle(supa: any, handle: string) {
  const data = await lcFetch(handle, PROFILE_QUERY, { username: handle });
  const mu = data.matchedUser;
  if (!mu) throw new Error("Handle not found on LeetCode");

  const acGlobal: any[] = mu.submitStatsGlobal?.acSubmissionNum ?? [];
  const totalSub: any[] = mu.submitStats?.totalSubmissionNum ?? [];
  const pick = (arr: any[], d: string) => Number(arr.find((x) => x.difficulty === d)?.count ?? 0);
  const allCounts: any[] = data.allQuestionsCount ?? [];
  const pickAll = (d: string) => Number(allCounts.find((x) => x.difficulty === d)?.count ?? 0);

  const acAll = pick(acGlobal, "All");
  const subsAll = Number(acGlobal.find((x) => x.difficulty === "All")?.submissions ?? 0)
    || Number(totalSub.find((x) => x.difficulty === "All")?.count ?? 0);

  const calendar: Record<string, number> = JSON.parse(mu.userCalendar?.submissionCalendar ?? "{}");
  const pace = computePace(calendar);

  const tags = mu.tagProblemCounts ?? {};
  const topics = [...(tags.advanced ?? []), ...(tags.intermediate ?? []), ...(tags.fundamental ?? [])]
    .map((t: any) => ({ name: t.tagName, count: t.problemsSolved }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const cr = data.userContestRanking;

  await supa.from("handle_snapshots").upsert({
    platform: "leetcode",
    handle,
    display_name: mu.profile?.realName || mu.username,
    avatar_url: mu.profile?.userAvatar ?? null,
    country: mu.profile?.countryName ?? null,
    total_solved: acAll,
    easy_solved: pick(acGlobal, "Easy"),
    medium_solved: pick(acGlobal, "Medium"),
    hard_solved: pick(acGlobal, "Hard"),
    total_easy: pickAll("Easy"),
    total_medium: pickAll("Medium"),
    total_hard: pickAll("Hard"),
    acceptance_rate: subsAll ? Math.round((acAll / subsAll) * 10000) / 100 : 0,
    global_ranking: mu.profile?.ranking ?? null,
    contest_rating: cr?.rating ? Math.round(cr.rating) : null,
    contest_global_ranking: cr?.globalRanking ?? null,
    contest_top_percentage: cr?.topPercentage ?? null,
    attended_contests: cr?.attendedContestsCount ?? 0,
    current_streak: mu.userCalendar?.streak ?? 0,
    longest_streak: Math.max(pace.longest, mu.userCalendar?.streak ?? 0),
    active_days: mu.userCalendar?.totalActiveDays ?? pace.activeDays,
    solved_today: pace.today,
    solved_this_week: pace.week,
    solved_this_month: pace.month,
    avg_per_active_day: pace.avgPerActive,
    peak_day: pace.peakDay,
    consistency: pace.consistency,
    languages: (mu.languageProblemCount ?? []).map((l: any) => ({
      name: l.languageName,
      count: l.problemsSolved,
    })),
    topics,
    badges: mu.badges ?? [],
    updated_at: new Date().toISOString(),
  }, { onConflict: "platform,handle" });

  const days = Object.entries(calendar).map(([ts, n]) => ({
    platform: "leetcode",
    handle,
    day: dayKey(new Date(Number(ts) * 1000)),
    submissions: Number(n),
  }));
  for (let i = 0; i < days.length; i += 500) {
    await supa.from("handle_daily_activity").upsert(days.slice(i, i + 500), {
      onConflict: "platform,handle,day",
    });
  }

  const solves = (data.recentAcSubmissionList ?? []).map((s: any) => ({
    platform: "leetcode",
    handle,
    problem_slug: s.titleSlug,
    title: s.title,
    lang: s.lang,
    solved_at: new Date(Number(s.timestamp) * 1000).toISOString(),
  }));
  if (solves.length) {
    await supa.from("handle_recent_solves").upsert(solves, {
      onConflict: "platform,handle,problem_slug,solved_at",
    });
  }

  const history = (data.userContestRankingHistory ?? [])
    .filter((h: any) => h.attended)
    .map((h: any) => ({
      platform: "leetcode",
      handle,
      contest_title: h.contest?.title ?? "unknown",
      start_time: new Date(Number(h.contest?.startTime ?? 0) * 1000).toISOString(),
      attended: true,
      rating: h.rating ? Math.round(h.rating) : null,
      ranking: h.ranking ?? null,
    }));
  if (history.length) {
    await supa.from("handle_contest_history").upsert(history, {
      onConflict: "platform,handle,contest_title",
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) return json({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE);

    let query = supa
      .from("tracked_handles")
      .select("id, handle")
      .eq("owner_id", user.id)
      .eq("platform", "leetcode");
    if (typeof body.handle === "string" && body.handle.length) {
      query = query.eq("handle", body.handle.trim().replace(/^@/, ""));
    }
    const { data: rows, error } = await query.limit(120);
    if (error) return json({ error: error.message }, 500);
    if (!rows?.length) return json({ synced: 0, results: [] });

    const results: { handle: string; ok: boolean; error?: string }[] = [];
    for (const row of rows) {
      try {
        await syncHandle(supa, row.handle);
        await supa
          .from("tracked_handles")
          .update({ sync_status: "ok", sync_error: null, last_synced_at: new Date().toISOString() })
          .eq("id", row.id);
        results.push({ handle: row.handle, ok: true });
      } catch (e) {
        const msg = String((e as Error).message).slice(0, 300);
        await supa
          .from("tracked_handles")
          .update({ sync_status: "error", sync_error: msg, last_synced_at: new Date().toISOString() })
          .eq("id", row.id);
        results.push({ handle: row.handle, ok: false, error: msg });
      }
      await new Promise((r) => setTimeout(r, 350));
    }

    return json({ synced: results.filter((r) => r.ok).length, results });
  } catch (e) {
    return json({ error: String((e as Error).message) }, 500);
  }
});
