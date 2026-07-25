// Auto-fetches internship & fresher openings from multiple public sources
// and upserts into public.job_openings.
// Config (keywords, min score, slugs, adzuna toggle) lives in
// platform_settings.jobs_fetch_config and is editable from /admin/jobs.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Row = {
  company: string;
  title: string;
  role_type: string;
  location: string | null;
  is_remote: boolean;
  apply_url: string;
  description: string | null;
  tags: string[];
  source: string;
  source_id: string;
  company_logo_url: string | null;
  salary: string | null;
  posted_at: string;
};

type FetchConfig = {
  keywords: string[];
  min_score: number;
  greenhouse_slugs: string[];
  lever_slugs: string[];
  ashby_slugs: string[];
  adzuna_enabled: boolean;
};

const DEFAULT_CONFIG: FetchConfig = {
  keywords: [
    "intern", "internship", "fresher", "entry level", "entry-level",
    "graduate", "new grad", "newgrad", "trainee", "junior", "associate", "apprentice",
  ],
  min_score: 1,
  greenhouse_slugs: ["stripe", "airbnb", "coinbase", "figma", "dropbox", "instacart"],
  lever_slugs: ["netflix", "spotify", "palantir", "brex"],
  ashby_slugs: ["ramp", "linear", "posthog", "vercel"],
  adzuna_enabled: true,
};

function scoreTitle(title: string, keywords: string[]): number {
  const t = ` ${title.toLowerCase()} `;
  let s = 0;
  for (const kw of keywords) {
    const k = kw.trim().toLowerCase();
    if (!k) continue;
    // word-boundary-ish match, tolerant of hyphens/spaces
    const re = new RegExp(`(^|[^a-z0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i");
    if (re.test(t)) s++;
  }
  return s;
}

function classifyRole(title: string): string | null {
  const t = title.toLowerCase();
  if (/\bintern(ship)?\b|\btrainee\b|\bapprentice\b/.test(t)) return "Internship";
  if (/\bfresher\b|\bnew ?grad\b|\bgraduate\b|\bentry[- ]level\b/.test(t)) return "Fresher";
  if (/\bjunior\b|\bassociate\b/.test(t)) return "Entry";
  return null;
}

async function fromRemotive(cfg: FetchConfig): Promise<Row[]> {
  const res = await fetch("https://remotive.com/api/remote-jobs?limit=200");
  if (!res.ok) return [];
  const json = await res.json();
  const rows: Row[] = [];
  for (const j of json.jobs ?? []) {
    const title: string = j.title ?? "";
    if (scoreTitle(title, cfg.keywords) < cfg.min_score) continue;
    rows.push({
      company: j.company_name,
      title,
      role_type: classifyRole(title) ?? "Entry",
      location: j.candidate_required_location || "Remote",
      is_remote: true,
      apply_url: j.url,
      description: (j.description ?? "").replace(/<[^>]+>/g, "").slice(0, 1200),
      tags: j.tags ?? [],
      source: "remotive",
      source_id: String(j.id),
      company_logo_url: j.company_logo || null,
      salary: j.salary || null,
      posted_at: j.publication_date ?? new Date().toISOString(),
    });
  }
  return rows;
}

async function fromAdzuna(cfg: FetchConfig): Promise<Row[]> {
  if (!cfg.adzuna_enabled) return [];
  const appId = Deno.env.get("ADZUNA_APP_ID");
  const appKey = Deno.env.get("ADZUNA_APP_KEY");
  if (!appId || !appKey) return [];
  const rows: Row[] = [];
  for (const q of ["intern", "fresher graduate", "entry level software"]) {
    const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=50&what=${encodeURIComponent(q)}&content-type=application/json`;
    const res = await fetch(url);
    if (!res.ok) continue;
    const json = await res.json();
    for (const j of json.results ?? []) {
      const title: string = j.title ?? "";
      if (scoreTitle(title, cfg.keywords) < cfg.min_score) continue;
      rows.push({
        company: j.company?.display_name ?? "Unknown",
        title,
        role_type: classifyRole(title) ?? "Fresher",
        location: j.location?.display_name ?? "India",
        is_remote: false,
        apply_url: j.redirect_url,
        description: (j.description ?? "").slice(0, 1200),
        tags: [j.category?.label].filter(Boolean),
        source: "adzuna",
        source_id: String(j.id),
        company_logo_url: null,
        salary: j.salary_min ? `₹${Math.round(j.salary_min / 1000)}k+` : null,
        posted_at: j.created ?? new Date().toISOString(),
      });
    }
  }
  return rows;
}

async function fromGreenhouse(slug: string, cfg: FetchConfig): Promise<Row[]> {
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`);
  if (!res.ok) return [];
  const json = await res.json();
  const rows: Row[] = [];
  for (const j of json.jobs ?? []) {
    const title: string = j.title ?? "";
    if (scoreTitle(title, cfg.keywords) < cfg.min_score) continue;
    rows.push({
      company: slug,
      title,
      role_type: classifyRole(title) ?? "Entry",
      location: j.location?.name ?? null,
      is_remote: /remote/i.test(j.location?.name ?? ""),
      apply_url: j.absolute_url,
      description: null,
      tags: [],
      source: "greenhouse",
      source_id: `${slug}:${j.id}`,
      company_logo_url: null,
      salary: null,
      posted_at: j.updated_at ?? new Date().toISOString(),
    });
  }
  return rows;
}

async function fromLever(slug: string, cfg: FetchConfig): Promise<Row[]> {
  const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`);
  if (!res.ok) return [];
  const json = await res.json();
  const rows: Row[] = [];
  for (const j of json ?? []) {
    const title: string = j.text ?? "";
    if (scoreTitle(title, cfg.keywords) < cfg.min_score) continue;
    rows.push({
      company: slug,
      title,
      role_type: classifyRole(title) ?? "Entry",
      location: j.categories?.location ?? null,
      is_remote: /remote/i.test(j.categories?.location ?? ""),
      apply_url: j.hostedUrl,
      description: (j.descriptionPlain ?? "").slice(0, 1200),
      tags: j.categories?.team ? [j.categories.team] : [],
      source: "lever",
      source_id: `${slug}:${j.id}`,
      company_logo_url: null,
      salary: null,
      posted_at: new Date(j.createdAt ?? Date.now()).toISOString(),
    });
  }
  return rows;
}

async function fromAshby(slug: string, cfg: FetchConfig): Promise<Row[]> {
  const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=true`);
  if (!res.ok) return [];
  const json = await res.json();
  const rows: Row[] = [];
  for (const j of json.jobs ?? []) {
    const title: string = j.title ?? "";
    if (scoreTitle(title, cfg.keywords) < cfg.min_score) continue;
    rows.push({
      company: slug,
      title,
      role_type: classifyRole(title) ?? "Entry",
      location: j.location ?? null,
      is_remote: !!j.isRemote,
      apply_url: j.jobUrl,
      description: (j.descriptionPlain ?? "").slice(0, 1200),
      tags: j.department ? [j.department] : [],
      source: "ashby",
      source_id: `${slug}:${j.id}`,
      company_logo_url: null,
      salary: j.compensation?.summary ?? null,
      posted_at: j.publishedAt ?? new Date().toISOString(),
    });
  }
  return rows;
}

async function loadConfig(supabase: ReturnType<typeof createClient>): Promise<FetchConfig> {
  const { data } = await supabase
    .from("platform_settings").select("value").eq("key", "jobs_fetch_config").maybeSingle();
  const v = (data?.value ?? {}) as Partial<FetchConfig>;
  return {
    keywords: Array.isArray(v.keywords) && v.keywords.length ? v.keywords : DEFAULT_CONFIG.keywords,
    min_score: Number.isFinite(v.min_score as number) && (v.min_score as number) > 0 ? (v.min_score as number) : DEFAULT_CONFIG.min_score,
    greenhouse_slugs: Array.isArray(v.greenhouse_slugs) ? v.greenhouse_slugs : DEFAULT_CONFIG.greenhouse_slugs,
    lever_slugs: Array.isArray(v.lever_slugs) ? v.lever_slugs : DEFAULT_CONFIG.lever_slugs,
    ashby_slugs: Array.isArray(v.ashby_slugs) ? v.ashby_slugs : DEFAULT_CONFIG.ashby_slugs,
    adzuna_enabled: v.adzuna_enabled !== false,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cfg = await loadConfig(supabase);

    const results = await Promise.allSettled([
      fromRemotive(cfg),
      fromAdzuna(cfg),
      ...cfg.greenhouse_slugs.map((s) => fromGreenhouse(s, cfg)),
      ...cfg.lever_slugs.map((s) => fromLever(s, cfg)),
      ...cfg.ashby_slugs.map((s) => fromAshby(s, cfg)),
    ]);

    const all: Row[] = [];
    const errors: string[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") all.push(...r.value);
      else errors.push(String(r.reason));
    }

    // Dedup on (source, source_id)
    const seen = new Set<string>();
    const unique = all.filter((r) => {
      const k = `${r.source}:${r.source_id}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    // Determine new vs updated by checking existing keys per source
    const bySource = new Map<string, string[]>();
    for (const r of unique) {
      if (!bySource.has(r.source)) bySource.set(r.source, []);
      bySource.get(r.source)!.push(r.source_id);
    }
    const existingKeys = new Set<string>();
    for (const [src, ids] of bySource) {
      for (let i = 0; i < ids.length; i += 500) {
        const slice = ids.slice(i, i + 500);
        const { data } = await supabase
          .from("job_openings").select("source_id").eq("source", src).in("source_id", slice);
        for (const row of data ?? []) existingKeys.add(`${src}:${(row as any).source_id}`);
      }
    }
    const new_count = unique.filter((r) => !existingKeys.has(`${r.source}:${r.source_id}`)).length;
    const updated_count = unique.length - new_count;

    let upserted = 0;
    for (let i = 0; i < unique.length; i += 200) {
      const chunk = unique.slice(i, i + 200).map((r) => ({ ...r, is_active: true }));
      const { error, count } = await supabase
        .from("job_openings")
        .upsert(chunk, { onConflict: "source,source_id", count: "exact", ignoreDuplicates: false });
      if (error) errors.push(error.message);
      else upserted += count ?? chunk.length;
    }

    const finished_at = new Date().toISOString();
    await supabase.from("platform_settings").upsert({
      key: "jobs_fetch_last_run",
      value: { finished_at, fetched: all.length, unique: unique.length, upserted, new: new_count, updated: updated_count, errors: errors.slice(0, 5) } as any,
      updated_at: finished_at,
    }, { onConflict: "key" });

    return new Response(
      JSON.stringify({ ok: true, fetched: all.length, unique: unique.length, upserted, new: new_count, updated: updated_count, finished_at, config: cfg, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
