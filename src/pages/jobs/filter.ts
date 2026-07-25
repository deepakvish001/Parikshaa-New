// Pure helpers for filtering / sorting jobs. Extracted from Jobs.tsx so they
// can be covered with unit tests independent of Supabase, routing, etc.

export type JobLike = {
  id: string;
  company: string;
  title: string;
  role_type: string;
  location: string | null;
  is_remote: boolean;
  tags: string[];
  posted_at: string;
};

export type CategoryLike = {
  slug: string;
  keywords: string[];
};

export const jobMatchesCategory = (j: JobLike, c: CategoryLike) => {
  const hay = `${j.title} ${j.role_type} ${(j.tags ?? []).join(" ")}`.toLowerCase();
  return c.keywords.some((k) => hay.includes(k));
};

export const scoreJob = (j: JobLike, q: string) => {
  if (!q) return 0;
  let s = 0;
  if (j.title.toLowerCase().includes(q)) s += 5;
  if (j.company.toLowerCase().includes(q)) s += 3;
  if ((j.location ?? "").toLowerCase().includes(q)) s += 2;
  if (j.tags.some((t) => t.toLowerCase().includes(q))) s += 1;
  return s;
};

export type FilterOptions = {
  query?: string;
  role?: string; // "All" | "Internship" | ...
  remoteOnly?: boolean;
  category?: CategoryLike | null;
  sort?: "newest" | "match";
};

export function filterJobs<T extends JobLike>(jobs: T[], opts: FilterOptions = {}): T[] {
  const {
    query = "",
    role = "All",
    remoteOnly = false,
    category = null,
    sort = "newest",
  } = opts;
  const q = query.trim().toLowerCase();
  const base = jobs.filter((j) => {
    if (role !== "All" && j.role_type !== role) return false;
    if (remoteOnly && !j.is_remote) return false;
    if (category && !jobMatchesCategory(j, category)) return false;
    if (!q) return true;
    return scoreJob(j, q) > 0;
  });
  if (sort === "match" && q) {
    return [...base].sort((a, b) => scoreJob(b, q) - scoreJob(a, q));
  }
  return [...base].sort(
    (a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime(),
  );
}

/**
 * Computes per-category counts against the currently applied search + role/remote
 * filters (ignoring the active category itself, so each tile shows its own total).
 * Mirrors the logic used by the Jobs page badges.
 */
export function computeCategoryCounts<T extends JobLike>(
  jobs: T[],
  categories: CategoryLike[],
  opts: Omit<FilterOptions, "category" | "sort"> = {},
): Record<string, number> {
  const scoped = filterJobs(jobs, { ...opts, category: null, sort: "newest" });
  const map: Record<string, number> = {};
  for (const c of categories) {
    map[c.slug] = scoped.filter((j) => jobMatchesCategory(j, c)).length;
  }
  return map;
}

