// Fetches a LeetCode user's stats, calendar and contests via LC's public GraphQL.
// Cached for 24h in `leetcode_cache` to avoid hammering LC.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const QUERY = `
query userPublicProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile { userAvatar realName ranking reputation countryName aboutMe }
    submitStatsGlobal {
      acSubmissionNum { difficulty count submissions }
    }
    submitStats {
      acSubmissionNum { difficulty count }
      totalSubmissionNum { difficulty count }
    }
    userCalendar { activeYears streak totalActiveDays submissionCalendar }
    badges {
      id
      displayName
      icon
      hoverText
      creationDate
      category
    }
    upcomingBadges {
      name
      icon
    }
  }
  recentAcSubmissionList(username: $username, limit: 15) {
    id
    title
    titleSlug
    timestamp
    lang
  }
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
    totalParticipants
    topPercentage
  }
  userContestRankingHistory(username: $username) {
    attended
    rating
    ranking
    contest { title startTime }
  }
  allQuestionsCount { difficulty count }
}`;

const YEAR_QUERY = `
query userCalendarYear($username: String!, $year: Int!) {
  matchedUser(username: $username) {
    username
    userCalendar(year: $year) {
      activeYears
      streak
      totalActiveDays
      submissionCalendar
    }
  }
}`;

async function fetchFromLeetCode(username: string, query = QUERY, variables: Record<string, unknown> = { username }) {
  const res = await fetch("https://leetcode.com/graphql/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Referer": `https://leetcode.com/${username}/`,
      "User-Agent": "Mozilla/5.0 (compatible; ParikshaaBot/1.0)",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`LC HTTP ${res.status}`);
  const j = await res.json();
  if (j.errors?.length) throw new Error(j.errors[0].message || "LC GraphQL error");
  return j.data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { username, year } = await req.json();
    if (!username || typeof username !== "string" || username.length > 50) {
      return new Response(JSON.stringify({ error: "invalid username" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const cleanName = username.trim().replace(/^@/, "");
    const yearNum = typeof year === "number" && year >= 2015 && year <= 2100 ? Math.floor(year) : null;

    const supa = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Year-specific calendar request: bypass main cache (different shape), short-circuit return.
    if (yearNum) {
      try {
        const data = await fetchFromLeetCode(cleanName, YEAR_QUERY, { username: cleanName, year: yearNum });
        return new Response(JSON.stringify({ year: yearNum, ...data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: String((e as Error).message) }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Try cache
    const { data: cached } = await supa
      .from("leetcode_cache")
      .select("payload, fetched_at")
      .eq("username", cleanName)
      .maybeSingle();

    if (cached && (Date.now() - new Date(cached.fetched_at).getTime()) < CACHE_TTL_MS
        && cached.payload?.matchedUser?.badges !== undefined) {
      return new Response(JSON.stringify({ cached: true, ...cached.payload }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let payload: any;
    try {
      payload = await fetchFromLeetCode(cleanName);
    } catch (e) {
      // Serve stale cache on transient errors if available
      if (cached) {
        return new Response(JSON.stringify({ cached: true, stale: true, ...cached.payload }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: String((e as Error).message) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!payload?.matchedUser) {
      return new Response(JSON.stringify({ error: "user_not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supa.from("leetcode_cache").upsert({
      username: cleanName,
      payload,
      fetched_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ cached: false, ...payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
