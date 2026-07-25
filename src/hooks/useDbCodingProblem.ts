// Read a single published coding problem from the DB-backed CMS.
// Falls back to nothing — callers should use the static helper as a fallback.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CodingProblem, LangId, TestCase } from "@/data/codingProblemsData";

const STALE_MS = 5 * 60 * 1000;
const DETAIL_CACHE_PREFIX = "parikshaa:coding-problem-detail-cache:v2:";
const DETAIL_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type DetailCache = { savedAt: number; data: CodingProblem };

const readDetailCache = (slug: string): DetailCache | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(`${DETAIL_CACHE_PREFIX}${slug}`);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as DetailCache;
    if (!parsed?.savedAt || !parsed.data?.slug) return undefined;
    if (Date.now() - parsed.savedAt > DETAIL_CACHE_MAX_AGE_MS) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
};

const writeDetailCache = (slug: string, data: CodingProblem) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${DETAIL_CACHE_PREFIX}${slug}`,
      JSON.stringify({ savedAt: Date.now(), data }),
    );
  } catch {
    // Best-effort cache only.
  }
};

const toDifficulty = (d: string): CodingProblem["difficulty"] => {
  const v = (d || "").toLowerCase();
  if (v === "easy") return "Easy";
  if (v === "hard") return "Hard";
  return "Medium";
};

// DB historically stored "python3" while the frontend LangId is "python".
// Normalize so starter code / reference solutions actually render.
const normalizeLangId = (id: string): LangId => (id === "python3" ? "python" : (id as LangId));

export const fetchDbCodingProblem = async (slug: string): Promise<CodingProblem | null> => {
  // Fetch the problem shell and its required related records in parallel so
  // the editor opens after one network round instead of row → details.
  const [problemRow, starter, sample, sql] = await Promise.all([
    supabase
      .from("coding_problems")
      .select(
        "slug,title,difficulty,topics,description,examples,constraints,hints,cpu_time_limit_sec,memory_limit_kb,is_published",
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle(),
    supabase
      .from("coding_problem_starter_code")
      .select("lang_id,code")
      .eq("problem_slug", slug)
      .order("lang_id", { ascending: true }),
    supabase
      .from("coding_problem_tests")
      .select("input,expected,ord")
      .eq("problem_slug", slug)
      .eq("kind", "sample")
      .order("ord", { ascending: true }),
    supabase
      .from("coding_problem_sql_specs")
      .select("problem_slug,schema_sql,seed_sql,order_matters,starter,updated_at")
      .eq("problem_slug", slug)
      .maybeSingle(),
  ]);

  if (problemRow.error) throw problemRow.error;
  if (starter.error) throw starter.error;
  if (sample.error) throw sample.error;
  if (sql.error) throw sql.error;

  const row = problemRow.data;
  if (!row) return null;

  const starterCode: Partial<Record<LangId, string>> = {};
  (starter.data ?? []).forEach((r: any) => (starterCode[normalizeLangId(r.lang_id)] = r.code));
  const sampleTests: TestCase[] = (sample.data ?? []).map((t: any) => ({
    input: t.input ?? "",
    expected: t.expected ?? "",
  }));

  const problem: CodingProblem = {
    slug: row.slug,
    title: row.title,
    difficulty: toDifficulty(row.difficulty),
    topics: row.topics ?? [],
    description: row.description ?? "",
    examples: Array.isArray(row.examples) ? (row.examples as any) : [],
    constraints: row.constraints ?? [],
    hints: row.hints ?? [],
    starterCode,
    // Loaded lazily only when an accepted user opens Editorial/Solution; keeping
    // it out of the initial payload makes problem pages open much faster.
    referenceSolution: {},
    sampleTests,
    hiddenTests: [],
    cpuTimeLimitSec: Number(row.cpu_time_limit_sec ?? 2),
    memoryLimitKb: row.memory_limit_kb ?? undefined,
    sql: sql.data
      ? {
          schema: sql.data.schema_sql ?? "",
          seed: sql.data.seed_sql ?? "",
          // Never load protected reference_query in the browser; submit-sql
          // fetches it server-side with service role for validation.
          referenceQuery: "",
          orderMatters: !!sql.data.order_matters,
          starter: sql.data.starter ?? "",
        }
      : undefined,
  };
  writeDetailCache(slug, problem);
  return problem;
};

export const fetchDbProblemReferenceSolutions = async (
  slug: string,
): Promise<Partial<Record<LangId, string>>> => {
  const { data, error } = await supabase
    .from("coding_problem_reference_solutions")
    .select("lang_id,code")
    .eq("problem_slug", slug)
    .order("lang_id", { ascending: true });
  if (error) throw error;
  const referenceSolution: Partial<Record<LangId, string>> = {};
  (data ?? []).forEach((r: any) => (referenceSolution[normalizeLangId(r.lang_id)] = r.code));
  return referenceSolution;
};

export const useDbProblemReferenceSolutions = (slug: string | undefined, enabled = true) => {
  return useQuery({
    queryKey: ["coding-problem-reference-solutions", slug],
    enabled: !!slug && enabled,
    staleTime: STALE_MS,
    queryFn: () => fetchDbProblemReferenceSolutions(slug!),
  });
};

export const useDbCodingProblem = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["coding-problem-db", slug],
    enabled: !!slug,
    staleTime: STALE_MS,
    queryFn: () => fetchDbCodingProblem(slug!),
    initialData: () => (slug ? readDetailCache(slug)?.data : undefined),
    initialDataUpdatedAt: 0,
  });
};
