// Read published coding problems from the DB-backed CMS.
// Additive helper: existing consumers can opt-in to load problems from DB
// without breaking the static `CODING_PROBLEMS` array fallback.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CodingProblem, LangId, TestCase } from "@/data/codingProblemsData";

const STALE_MS = 5 * 60 * 1000;
const CACHE_KEY = "parikshaa:coding-problems-db-cache:v3";
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type ProblemsCache = { savedAt: number; data: CodingProblem[] };

const readProblemsCache = (): ProblemsCache | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as ProblemsCache;
    if (!parsed?.savedAt || !Array.isArray(parsed.data) || parsed.data.length === 0) return undefined;
    if (Date.now() - parsed.savedAt > CACHE_MAX_AGE_MS) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
};

const writeProblemsCache = (data: CodingProblem[]) => {
  if (typeof window === "undefined") return;
  try {
    if (data.length > 0) {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
    }
  } catch {
    // Best-effort cache only; ignore quota/private-mode failures.
  }
};

const toDifficulty = (d: string): CodingProblem["difficulty"] => {
  const v = (d || "").toLowerCase();
  if (v === "easy") return "Easy";
  if (v === "hard") return "Hard";
  return "Medium";
};

const buildProblem = (
  row: any,
  starter: any[],
  refSol: any[],
  sample: any[],
  sql: any | null,
): CodingProblem => {
  const starterCode: Partial<Record<LangId, string>> = {};
  starter.forEach((r) => (starterCode[r.lang_id as LangId] = r.code));
  const referenceSolution: Partial<Record<LangId, string>> = {};
  refSol.forEach((r) => (referenceSolution[r.lang_id as LangId] = r.code));
  const sampleTests: TestCase[] = sample.map((t) => ({
    input: t.input ?? "",
    expected: t.expected ?? "",
  }));
  const hasSql = !!sql;
  // Build a precise reason list so tooltips can explain exactly what's
  // missing rather than a generic warning. SQL problems use a different
  // shape (no starter / sample tests) — we check the SQL spec instead.
  const reasons: string[] = [];
  if (hasSql) {
    if (!(sql?.schema_sql && String(sql.schema_sql).trim()))
      reasons.push("Missing SQL schema");
    if ("has_reference_query" in (sql ?? {}) && !sql?.has_reference_query)
      reasons.push("Missing SQL reference query");
  } else {
    if (!(row.description && String(row.description).trim()))
      reasons.push("Missing description");
    if (sampleTests.length === 0) reasons.push("Missing sample tests");
    if (Object.keys(starterCode).length === 0)
      reasons.push("Missing starter code");
  }
  return {
    slug: row.slug,
    title: row.title,
    difficulty: toDifficulty(row.difficulty),
    topics: row.topics ?? [],
    description: row.description ?? "",
    examples: Array.isArray(row.examples) ? row.examples : [],
    constraints: row.constraints ?? [],
    hints: row.hints ?? [],
    starterCode,
    referenceSolution,
    sampleTests,
    hiddenTests: [], // Hidden tests are admin-only; never exposed to clients.
    cpuTimeLimitSec: Number(row.cpu_time_limit_sec ?? 2),
    memoryLimitKb: row.memory_limit_kb ?? undefined,
    sql: hasSql
      ? {
          schema: sql.schema_sql ?? "",
          seed: sql.seed_sql ?? "",
          referenceQuery: "",
          orderMatters: !!sql.order_matters,
          starter: sql.starter ?? "",
        }
      : undefined,
    _incomplete: reasons.length > 0,
    _incompleteReasons: reasons,
  };
};

export const useDbCodingProblems = () => {
  return useQuery({
    queryKey: ["coding-problems-db"],
    staleTime: STALE_MS,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
    queryFn: async (): Promise<CodingProblem[]> => {
      // Fetch ALL published problems via range pagination (Supabase caps each
      // request at 1000 rows). Keeps the library count in sync with admin.
      const PAGE = 1000;
      const rows: any[] = [];
      for (let page = 0; page < 50; page++) {
        const { data, error } = await supabase
          .from("coding_problems")
          .select(
            "slug,title,difficulty,topics,description,examples,constraints,hints,cpu_time_limit_sec,memory_limit_kb,is_published",
          )
          .eq("is_published", true)
          .order("created_at", { ascending: true })
          .order("slug", { ascending: true })
          .range(page * PAGE, page * PAGE + PAGE - 1);
        if (error) throw error;
        const batch = data ?? [];
        rows.push(...batch);
        if (batch.length < PAGE) break;
      }
      // De-dup defensively by slug in case of overlap across pages.
      const seenSlug = new Set<string>();
      const uniqueRows = rows.filter((r) =>
        seenSlug.has(r.slug) ? false : (seenSlug.add(r.slug), true),
      );
      const slugs = uniqueRows.map((r) => r.slug);
      if (slugs.length === 0) return [];

      // Helper: fetch a related table in chunks of 300 slugs to stay under
      // URL length limits, and paginate inside each chunk so tables with many
      // language rows (starter/reference code) don't silently stop at 1000.
      // A deterministic order is required before `.range()` or paged requests
      // can overlap/skip rows, producing false "Incomplete" flags.
      const CHUNK = 300;
      const chunkedFetch = async <T,>(
        fn: (
          chunk: string[],
          from: number,
          to: number,
        ) => PromiseLike<{ data: T[] | null; error: any }>,
      ): Promise<T[]> => {
        const out: T[] = [];
        for (let i = 0; i < slugs.length; i += CHUNK) {
          const chunk = slugs.slice(i, i + CHUNK);
          for (let page = 0; page < 50; page++) {
            const from = page * PAGE;
            const to = from + PAGE - 1;
            const { data, error } = await fn(chunk, from, to);
            if (error) throw error;
            const batch = (data ?? []) as T[];
            out.push(...batch);
            if (batch.length < PAGE) break;
          }
        }
        return out;
      };

      const [starter, refSol, sample, sql] = await Promise.all([
        chunkedFetch<any>((chunk, from, to) =>
          supabase
            .from("coding_problem_starter_code")
            // List page only needs presence by language for incomplete badges;
            // avoid downloading full starter templates for every problem.
            .select("problem_slug,lang_id")
            .in("problem_slug", chunk)
            .order("problem_slug", { ascending: true })
            .order("lang_id", { ascending: true })
            .range(from, to),
        ),
        Promise.resolve([]),
        chunkedFetch<any>((chunk, from, to) =>
          supabase
            .from("coding_problem_tests")
            // Only presence/order are needed on the library list; full sample
            // input/output is fetched by the individual problem page.
            .select("problem_slug,ord,kind")
            .eq("kind", "sample")
            .in("problem_slug", chunk)
            .order("problem_slug", { ascending: true })
            .order("ord", { ascending: true })
            .range(from, to),
        ),
        chunkedFetch<any>((chunk, from, to) =>
          supabase
            .from("coding_problem_sql_specs")
            .select("problem_slug,schema_sql,seed_sql,order_matters,starter,updated_at")
            .in("problem_slug", chunk)
            .order("problem_slug", { ascending: true })
            .range(from, to),
        ),
      ]);

      const byStarter = new Map<string, any[]>();
      starter.forEach((r: any) => {
        const arr = byStarter.get(r.problem_slug) ?? [];
        arr.push(r);
        byStarter.set(r.problem_slug, arr);
      });
      const byRef = new Map<string, any[]>();
      refSol.forEach((r: any) => {
        const arr = byRef.get(r.problem_slug) ?? [];
        arr.push(r);
        byRef.set(r.problem_slug, arr);
      });
      const bySample = new Map<string, any[]>();
      sample.forEach((r: any) => {
        const arr = bySample.get(r.problem_slug) ?? [];
        arr.push(r);
        bySample.set(r.problem_slug, arr);
      });
      const bySql = new Map<string, any>();
      sql.forEach((r: any) => bySql.set(r.problem_slug, r));

      const result = uniqueRows.map((r) =>
        buildProblem(
          r,
          byStarter.get(r.slug) ?? [],
          byRef.get(r.slug) ?? [],
          bySample.get(r.slug) ?? [],
          bySql.get(r.slug) ?? null,
        ),
      );
      writeProblemsCache(result);
      return result;
    },
    // Render the last successful list immediately after a hard refresh, then
    // revalidate in the background. This removes the 3–4s false empty-state
    // flash without hiding real filter-empty results after fresh data arrives.
    initialData: () => readProblemsCache()?.data,
    initialDataUpdatedAt: 0,
  });
};
