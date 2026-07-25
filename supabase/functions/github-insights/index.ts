// Fetches public GitHub data for a user: profile, top repos, language mix,
// and (best-effort) yearly contribution count scraped from the public profile HTML.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  archived: boolean;
}

interface GitHubInsights {
  handle: string;
  profile: {
    name: string | null;
    bio: string | null;
    avatar_url: string;
    html_url: string;
    public_repos: number;
    followers: number;
    following: number;
    location: string | null;
  };
  totals: { stars: number; forks: number };
  languages: { name: string; count: number; percent: number }[];
  topRepos: Array<Pick<GitHubRepo, "name" | "description" | "html_url" | "language" | "stargazers_count" | "forks_count">>;
  contributionsLastYear: number | null;
  contributionsCalendar: { date: string; count: number; level: number }[];
  achievements: { slug: string; name: string; image: string; tier?: number }[];
  rateLimit?: { limit: number; remaining: number; reset: number } | null;
  sync_status: "ok" | "error" | "rate_limited";
  sync_error?: string;
}

async function gh(path: string, attempt = 0): Promise<Response> {
  const token = Deno.env.get("GITHUB_TOKEN");
  const r = await fetch(`https://api.github.com${path}`, {
    headers: {
      "User-Agent": "parikshaa-app",
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  // Retry secondary/abuse rate limits with backoff
  if ((r.status === 403 || r.status === 429) && attempt < 2) {
    const retryAfter = parseInt(r.headers.get("retry-after") ?? "0", 10);
    const remaining = parseInt(r.headers.get("x-ratelimit-remaining") ?? "1", 10);
    if (retryAfter > 0 || remaining === 0) {
      const wait = Math.min((retryAfter || Math.pow(2, attempt)) * 1000, 4000);
      await new Promise((res) => setTimeout(res, wait));
      return gh(path, attempt + 1);
    }
  }
  return r;
}

function rateInfo(r: Response) {
  const limit = parseInt(r.headers.get("x-ratelimit-limit") ?? "0", 10);
  const remaining = parseInt(r.headers.get("x-ratelimit-remaining") ?? "0", 10);
  const reset = parseInt(r.headers.get("x-ratelimit-reset") ?? "0", 10);
  return { limit, remaining, reset };
}

async function scrapeContributions(
  handle: string,
): Promise<{ total: number | null; calendar: { date: string; count: number; level: number }[] }> {
  try {
    const r = await fetch(`https://github.com/users/${encodeURIComponent(handle)}/contributions`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!r.ok) return { total: null, calendar: [] };
    const html = await r.text();

    let total: number | null = null;
    const m = html.match(/([\d,]+)\s+contributions?\s+in\s+the\s+last\s+year/i);
    if (m) total = parseInt(m[1].replace(/,/g, ""), 10);

    const tipMap = new Map<string, number>();
    const tipRe = /<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g;
    let tm: RegExpExecArray | null;
    while ((tm = tipRe.exec(html))) {
      const cm = tm[2].match(/^(\d+|No)\s+contribution/i);
      if (cm) tipMap.set(tm[1], cm[1].toLowerCase() === "no" ? 0 : parseInt(cm[1], 10));
    }

    const calendar: { date: string; count: number; level: number }[] = [];
    const cellRe = /<td[^>]*class="ContributionCalendar-day"[^>]*>/g;
    const cells = html.match(cellRe) ?? [];
    for (const cell of cells) {
      const dateM = cell.match(/data-date="([^"]+)"/);
      if (!dateM) continue;
      const levelM = cell.match(/data-level="(\d+)"/);
      const idM = cell.match(/id="([^"]+)"/);
      const count = idM ? tipMap.get(idM[1]) ?? 0 : 0;
      calendar.push({
        date: dateM[1],
        count,
        level: levelM ? parseInt(levelM[1], 10) : 0,
      });
    }
    calendar.sort((a, b) => a.date.localeCompare(b.date));
    return { total, calendar };
  } catch {
    return { total: null, calendar: [] };
  }
}

async function scrapeAchievements(
  handle: string,
): Promise<{ slug: string; name: string; image: string; tier?: number }[]> {
  try {
    const r = await fetch(`https://github.com/users/${encodeURIComponent(handle)}/achievements`, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
    });
    if (!r.ok) return [];
    const html = await r.text();

    // Achievement cards contain an <img alt="Achievement: <Name>" src="...badge.svg">
    // Optional tier appears as a "x{N}" badge nearby (e.g. Pull Shark x2).
    const out: { slug: string; name: string; image: string; tier?: number }[] = [];
    const seen = new Set<string>();
    const re = /<img[^>]*alt="Achievement:\s*([^"]+)"[^>]*src="([^"]+)"[^>]*>([\s\S]{0,400})/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      const name = m[1].trim();
      let image = m[2].trim();
      if (image.startsWith("//")) image = `https:${image}`;
      if (image.startsWith("/")) image = `https://github.com${image}`;
      const after = m[3];
      const tierMatch = after.match(/(?:^|>)\s*x\s*(\d+)\s*</i);
      const tier = tierMatch ? parseInt(tierMatch[1], 10) : undefined;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || image;
      const key = `${slug}:${image}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ slug, name, image, tier });
    }
    return out;
  } catch {
    return [];
  }
}

async function fetchInsights(handle: string): Promise<GitHubInsights> {
  try {
    const [userRes, reposRes] = await Promise.all([
      gh(`/users/${encodeURIComponent(handle)}`),
      gh(`/users/${encodeURIComponent(handle)}/repos?per_page=100&sort=updated`),
    ]);
    const rl = rateInfo(userRes);
    if (userRes.status === 403 && rl.remaining === 0) {
      const resetIn = Math.max(0, rl.reset * 1000 - Date.now());
      const mins = Math.ceil(resetIn / 60000);
      return {
        handle,
        profile: { name: null, bio: null, avatar_url: "", html_url: `https://github.com/${handle}`, public_repos: 0, followers: 0, following: 0, location: null },
        totals: { stars: 0, forks: 0 }, languages: [], topRepos: [],
        contributionsLastYear: null, contributionsCalendar: [],
        achievements: [],
        rateLimit: rl,
        sync_status: "rate_limited",
        sync_error: `GitHub API rate limit reached. Try again in ~${mins} min.`,
      };
    }

    if (!userRes.ok) throw new Error(`GitHub user HTTP ${userRes.status}`);
    if (!reposRes.ok) throw new Error(`GitHub repos HTTP ${reposRes.status}`);
    const user = await userRes.json();
    const repos = (await reposRes.json()) as GitHubRepo[];

    const ownedNonFork = repos.filter((r) => !r.fork && !r.archived);
    let stars = 0;
    let forks = 0;
    const langCounts = new Map<string, number>();
    for (const r of ownedNonFork) {
      stars += r.stargazers_count;
      forks += r.forks_count;
      if (r.language) langCounts.set(r.language, (langCounts.get(r.language) ?? 0) + 1);
    }
    const langTotal = Array.from(langCounts.values()).reduce((a, b) => a + b, 0) || 1;
    const languages = Array.from(langCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count, percent: Math.round((count / langTotal) * 100) }));

    const topRepos = [...ownedNonFork]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 6)
      .map((r) => ({
        name: r.name,
        description: r.description,
        html_url: r.html_url,
        language: r.language,
        stargazers_count: r.stargazers_count,
        forks_count: r.forks_count,
      }));

    const [contrib, achievements] = await Promise.all([
      scrapeContributions(handle),
      scrapeAchievements(handle),
    ]);

    return {
      handle,
      profile: {
        name: user.name ?? null,
        bio: user.bio ?? null,
        avatar_url: user.avatar_url,
        html_url: user.html_url,
        public_repos: user.public_repos ?? 0,
        followers: user.followers ?? 0,
        following: user.following ?? 0,
        location: user.location ?? null,
      },
      totals: { stars, forks },
      languages,
      topRepos,
      contributionsLastYear: contrib.total,
      contributionsCalendar: contrib.calendar,
      achievements,
      rateLimit: rl,
      sync_status: "ok",
    };
  } catch (e) {
    return {
      handle,
      profile: {
        name: null, bio: null, avatar_url: "", html_url: `https://github.com/${handle}`,
        public_repos: 0, followers: 0, following: 0, location: null,
      },
      totals: { stars: 0, forks: 0 },
      languages: [],
      topRepos: [],
      contributionsLastYear: null,
      contributionsCalendar: [],
      achievements: [],
      sync_status: "error",
      sync_error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

function extractHandle(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  const m = s.match(/github\.com\/([^/?#]+)/i);
  if (m) return m[1];
  if (/^[A-Za-z0-9-]{1,39}$/.test(s)) return s;
  return null;
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.4");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const raw = String(body?.handle ?? "").trim();
    const handle = extractHandle(raw);
    if (!handle || handle.length > 39) return json({ error: "Invalid handle" }, 400);

    const result = await fetchInsights(handle);
    return json(result, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
