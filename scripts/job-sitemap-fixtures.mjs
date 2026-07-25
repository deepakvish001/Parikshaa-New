// Shared fixtures for the jobs sitemap: used by scripts/generate-jobs-sitemap.mjs
// (the generator) and e2e/jobs-seo.spec.ts (the verifier) so both stay in sync.

export const BASE_URL =
  process.env.SITE_URL || process.env.SEO_BASE_URL || "https://www.parikshaa.org";

export const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://lvnpvfxlmzbnylwkvgnq.supabase.co";
export const SUPABASE_ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2bnB2ZnhsbXpibnlsd2t2Z25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODQwNjUsImV4cCI6MjA4NTc2MDA2NX0.hDu56RIXWloY5MilImp8hfhfSKv6bc-f5ud9P4ErA_s";

// Keep in sync with CATEGORIES in src/pages/Jobs.tsx
export const CATEGORY_SLUGS = [
  "internships",
  "engineering",
  "design",
  "data",
  "product",
  "marketing",
  "sales",
  "support",
  "finance",
];

export function slugify(input) {
  if (!input) return "";
  return String(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function jobSlug(j) {
  const t = slugify(j.title) || "role";
  const c = slugify(j.company) || "company";
  return `${t}-at-${c}-${j.id}`;
}

export async function fetchActiveJobs() {
  try {
    const url = `${SUPABASE_URL}/rest/v1/job_openings?is_active=eq.true&select=id,title,company,posted_at&order=posted_at.desc&limit=2000`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Expected set of /jobs loc entries the generator emits, computed from the same
 * fixtures the generator reads. Returns absolute URLs.
 */
export async function expectedJobLocs(baseUrl = BASE_URL) {
  const jobs = await fetchActiveJobs();
  const categorySet = new Set(CATEGORY_SLUGS);
  const details = jobs
    .filter((j) => j?.id && j?.title && j?.company)
    .map((j) => jobSlug(j))
    .filter((slug) => !categorySet.has(slug))
    .map((slug) => `${baseUrl}/jobs/${slug}`);
  return {
    index: `${baseUrl}/jobs`,
    categories: CATEGORY_SLUGS.map((s) => `${baseUrl}/jobs/${s}`),
    details,
  };
}
