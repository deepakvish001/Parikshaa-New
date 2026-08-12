// Pulls upcoming contests from public platform APIs into public.external_contests.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Row = {
  platform: string;
  external_id: string;
  title: string;
  url: string | null;
  start_time: string;
  duration_seconds: number;
};

async function fromCodeforces(): Promise<Row[]> {
  const res = await fetch("https://codeforces.com/api/contest.list?gym=false");
  const j = await res.json();
  if (j.status !== "OK") return [];
  return (j.result as any[])
    .filter((c) => c.phase === "BEFORE")
    .map((c) => ({
      platform: "Codeforces",
      external_id: String(c.id),
      title: c.name,
      url: `https://codeforces.com/contests/${c.id}`,
      start_time: new Date(c.startTimeSeconds * 1000).toISOString(),
      duration_seconds: c.durationSeconds ?? 0,
    }));
}

async function fromLeetCode(): Promise<Row[]> {
  const res = await fetch("https://leetcode.com/graphql/", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (compatible; ParikshaaBot/1.0)" },
    body: JSON.stringify({
      query: `query { topTwoContests { title titleSlug startTime duration } }`,
    }),
  });
  const j = await res.json();
  const list = j?.data?.topTwoContests ?? [];
  return list.map((c: any) => ({
    platform: "LeetCode",
    external_id: c.titleSlug,
    title: c.title,
    url: `https://leetcode.com/contest/${c.titleSlug}`,
    start_time: new Date(Number(c.startTime) * 1000).toISOString(),
    duration_seconds: Number(c.duration ?? 0),
  }));
}

// kontests.net aggregates AtCoder / CodeChef / HackerRank upcoming contests.
async function fromKontests(path: string, platform: string): Promise<Row[]> {
  try {
    const res = await fetch(`https://kontests.net/api/v1/${path}`);
    if (!res.ok) return [];
    const list = await res.json();
    return (list as any[])
      .filter((c) => c.status === "BEFORE" || new Date(c.start_time).getTime() > Date.now())
      .map((c) => ({
        platform,
        external_id: c.url ?? c.name,
        title: c.name,
        url: c.url ?? null,
        start_time: new Date(c.start_time).toISOString(),
        duration_seconds: Math.round(Number(c.duration ?? 0)),
      }));
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supa = createClient(SUPABASE_URL, SERVICE_ROLE);

  const settled = await Promise.allSettled([
    fromCodeforces(),
    fromLeetCode(),
    fromKontests("at_coder", "AtCoder"),
    fromKontests("code_chef", "CodeChef"),
    fromKontests("hacker_rank", "HackerRank"),
  ]);

  const rows: Row[] = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));

  if (rows.length) {
    await supa.from("external_contests").upsert(rows, { onConflict: "platform,external_id" });
  }
  // Drop contests that already finished more than a day ago.
  await supa
    .from("external_contests")
    .delete()
    .lt("start_time", new Date(Date.now() - 2 * 86400000).toISOString());

  return new Response(JSON.stringify({ upserted: rows.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
