import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface AdminProblemRow {
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  topics: string[];
  is_published: boolean;
  updated_at: string;
  // Computed client-side from related tables so the admin list can flag
  // problems that are published but missing solver-facing pieces.
  _incomplete?: boolean;
  _incompleteReasons?: string[];
}

export interface FullProblemPayload {
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  topics: string[];
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  hints: string[];
  cpu_time_limit_sec?: number;
  memory_limit_kb?: number;
  is_published: boolean;
  starter_code: Record<string, string>;
  reference_solution: Record<string, string>;
  sample_tests: { input: string; expected: string }[];
  hidden_tests: { input: string; expected: string }[];
  sql_spec?: {
    schema_sql: string;
    seed_sql: string;
    reference_query: string;
    order_matters: boolean;
    starter: string;
  } | null;
}

// Paginated fetch helper — Supabase caps each request at 1000 rows.
const fetchAllPaginated = async <T,>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
): Promise<T[]> => {
  const PAGE = 1000;
  const out: T[] = [];
  for (let page = 0; page < 50; page++) {
    const { data, error } = await build(page * PAGE, page * PAGE + PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
};

export const useAdminProblems = (search = "") => {
  return useQuery({
    queryKey: ["admin-problems", search],
    queryFn: async (): Promise<AdminProblemRow[]> => {
      const term = search.trim();
      // Fetch ALL admin problems (slug is the PRIMARY KEY in the DB, so
      // duplicates are physically impossible — the de-dup below is purely
      // defensive against any future row overlap across paged requests).
      type Row = AdminProblemRow & { description: string | null };
      const all = await fetchAllPaginated<Row>((from, to) => {
        let q = supabase
          .from("coding_problems")
          .select("slug,title,difficulty,topics,is_published,updated_at,description,created_at")
          .order("created_at", { ascending: true })
          .order("slug", { ascending: true })
          .range(from, to);
        if (term) q = q.ilike("title", `%${term}%`);
        return q as unknown as PromiseLike<{ data: Row[] | null; error: any }>;
      });
      const seen = new Set<string>();
      const unique = all.filter((r) => (seen.has(r.slug) ? false : (seen.add(r.slug), true)));
      const slugs = unique.map((r) => r.slug);

      // Fetch only the (slug) columns from related tables for completeness
      // detection. Cheap even at 900+ problems.
      // NOTE: `.range()` without a deterministic `.order()` can skip/duplicate
      // rows across pages in PostgREST, which produced false "missing starter/
      // sample" flags (~157 phantom incompletes). Always order before paging.
      const [starter, sample, sql] = await Promise.all([
        fetchAllPaginated<{ problem_slug: string }>((from, to) =>
          supabase
            .from("coding_problem_starter_code")
            .select("problem_slug")
            .order("problem_slug", { ascending: true })
            .order("lang_id", { ascending: true })
            .range(from, to),
        ),
        fetchAllPaginated<{ problem_slug: string }>((from, to) =>
          supabase
            .from("coding_problem_tests")
            .select("problem_slug,ord")
            .eq("kind", "sample")
            .order("problem_slug", { ascending: true })
            .order("ord", { ascending: true })
            .range(from, to),
        ),
        fetchAllPaginated<{ problem_slug: string; schema_sql: string | null; reference_query: string | null }>(
          (from, to) =>
            supabase
              .from("coding_problem_sql_specs")
              .select("problem_slug,schema_sql,reference_query")
              .order("problem_slug", { ascending: true })
              .range(from, to),
        ),
      ]);
      const hasStarter = new Set(starter.map((r) => r.problem_slug));
      const hasSample = new Set(sample.map((r) => r.problem_slug));
      const sqlBySlug = new Map(sql.map((r) => [r.problem_slug, r]));

      return unique.map(({ description, ...r }) => {
        const sqlSpec = sqlBySlug.get(r.slug);
        const reasons: string[] = [];
        if (sqlSpec) {
          if (!(sqlSpec.schema_sql && String(sqlSpec.schema_sql).trim()))
            reasons.push("Missing SQL schema");
          if (!(sqlSpec.reference_query && String(sqlSpec.reference_query).trim()))
            reasons.push("Missing SQL reference query");
        } else {
          if (!(description && String(description).trim()))
            reasons.push("Missing description");
          if (!hasSample.has(r.slug)) reasons.push("Missing sample tests");
          if (!hasStarter.has(r.slug)) reasons.push("Missing starter code");
        }
        return {
          ...r,
          _incomplete: reasons.length > 0,
          _incompleteReasons: reasons,
        };
      });
    },
  });
};

// Lightweight published-count query used to surface mismatches between the
// admin list and the public library. Both sides should agree; if they don't,
// a banner alerts the operator that something is off (e.g. a partial fetch).
export const usePublishedProblemCount = () => {
  return useQuery({
    queryKey: ["coding-problems", "published-count"],
    staleTime: 60_000,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
    retry: 2,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("coding_problems")
        .select("slug", { count: "exact", head: true })
        .eq("is_published", true);
      if (error) throw error;
      return count ?? 0;
    },
  });
};

export const useAdminProblem = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["admin-problem", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_full_problem", {
        _slug: slug!,
      });
      if (error) throw error;
      return data as any;
    },
  });
};

export const useSaveProblem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FullProblemPayload) => {
      const { data, error } = await supabase.rpc("admin_save_problem", {
        payload: payload as any,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-problems"] });
      qc.invalidateQueries({ queryKey: ["admin-problem", vars.slug] });
      qc.invalidateQueries({ queryKey: ["coding-problems-db"] });
      qc.invalidateQueries({ queryKey: ["coding-problem-db", vars.slug] });
      toast({ title: "Saved", description: `Problem "${vars.slug}" saved.` });
    },
    onError: (err: any) => {
      toast({
        title: "Save failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteProblem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      const { error } = await supabase
        .from("coding_problems")
        .delete()
        .eq("slug", slug);
      if (error) throw error;
    },
    onMutate: async (slug: string) => {
      await qc.cancelQueries({ queryKey: ["coding-problems-db"] });
      await qc.cancelQueries({ queryKey: ["coding-problems", "published-count"] });
      await qc.cancelQueries({ queryKey: ["admin-problems"] });
      const prevList = qc.getQueryData<any[]>(["coding-problems-db"]);
      const prevCount = qc.getQueryData<number>(["coding-problems", "published-count"]);
      const prevAdmin = qc.getQueryData<any[]>(["admin-problems"]);
      const wasPublished = Array.isArray(prevList)
        ? prevList.some((p) => p?.slug === slug)
        : true;
      if (Array.isArray(prevList)) {
        qc.setQueryData<any[]>(
          ["coding-problems-db"],
          prevList.filter((p) => p?.slug !== slug),
        );
      }
      if (Array.isArray(prevAdmin)) {
        qc.setQueryData<any[]>(
          ["admin-problems"],
          prevAdmin.filter((p) => p?.slug !== slug),
        );
      }
      if (typeof prevCount === "number" && wasPublished) {
        qc.setQueryData<number>(
          ["coding-problems", "published-count"],
          Math.max(0, prevCount - 1),
        );
      }
      return { prevList, prevCount, prevAdmin };
    },
    onError: (err: any, _slug, ctx) => {
      if (ctx?.prevList !== undefined)
        qc.setQueryData(["coding-problems-db"], ctx.prevList);
      if (ctx?.prevCount !== undefined)
        qc.setQueryData(["coding-problems", "published-count"], ctx.prevCount);
      if (ctx?.prevAdmin !== undefined)
        qc.setQueryData(["admin-problems"], ctx.prevAdmin);
      toast({
        title: "Delete failed",
        description: err?.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-problems"] });
      qc.invalidateQueries({ queryKey: ["coding-problems-db"] });
      qc.invalidateQueries({ queryKey: ["coding-problems", "published-count"] });
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Problem removed." });
    },
  });
};

export const useTogglePublish = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, publish }: { slug: string; publish: boolean }) => {
      const { error } = await supabase
        .from("coding_problems")
        .update({ is_published: publish })
        .eq("slug", slug);
      if (error) throw error;
      // Best-effort audit log entry
      try {
        const { data: auth } = await supabase.auth.getUser();
        const actor = auth.user?.id;
        if (actor) {
          await supabase.from("admin_audit_log").insert({
            actor_id: actor,
            action: publish ? "publish" : "unpublish",
            entity_type: "coding_problem",
            entity_slug: slug,
            diff: { is_published: publish },
          });
        }
      } catch (_) {}
      return { slug, publish };
    },
    onMutate: async ({ slug, publish }) => {
      await qc.cancelQueries({ queryKey: ["coding-problems", "published-count"] });
      await qc.cancelQueries({ queryKey: ["admin-problems"] });
      const prevCount = qc.getQueryData<number>(["coding-problems", "published-count"]);
      const prevAdmin = qc.getQueryData<any[]>(["admin-problems"]);
      if (typeof prevCount === "number") {
        qc.setQueryData<number>(
          ["coding-problems", "published-count"],
          Math.max(0, prevCount + (publish ? 1 : -1)),
        );
      }
      if (Array.isArray(prevAdmin)) {
        qc.setQueryData<any[]>(
          ["admin-problems"],
          prevAdmin.map((p) =>
            p?.slug === slug ? { ...p, is_published: publish } : p,
          ),
        );
      }
      return { prevCount, prevAdmin };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.prevCount !== undefined)
        qc.setQueryData(["coding-problems", "published-count"], ctx.prevCount);
      if (ctx?.prevAdmin !== undefined)
        qc.setQueryData(["admin-problems"], ctx.prevAdmin);
      toast({
        title: "Update failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
    onSettled: (_data, _err, { slug }) => {
      qc.invalidateQueries({ queryKey: ["admin-problems"] });
      qc.invalidateQueries({ queryKey: ["admin-problem", slug] });
      qc.invalidateQueries({ queryKey: ["admin-audit-log"] });
      qc.invalidateQueries({ queryKey: ["coding-problems-db"] });
      qc.invalidateQueries({ queryKey: ["coding-problem-db", slug] });
      qc.invalidateQueries({ queryKey: ["coding-problems", "published-count"] });
    },
    onSuccess: ({ slug, publish }) => {
      toast({
        title: publish ? "Published" : "Unpublished",
        description: publish
          ? `"${slug}" is now live for learners.`
          : `"${slug}" is hidden from the library.`,
      });
    },
  });
};

export const useDuplicateProblem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string): Promise<string> => {
      const { data: full, error: getErr } = await supabase.rpc(
        "admin_get_full_problem",
        { _slug: slug },
      );
      if (getErr) throw getErr;
      const f = full as any;
      if (!f?.problem) throw new Error("Source problem not found");
      const base = f.problem.slug;
      // Find a free slug: <base>-copy, <base>-copy-2, ...
      const { data: existing } = await supabase
        .from("coding_problems")
        .select("slug")
        .ilike("slug", `${base}-copy%`);
      const taken = new Set((existing ?? []).map((r: any) => r.slug));
      let candidate = `${base}-copy`;
      let n = 2;
      while (taken.has(candidate)) candidate = `${base}-copy-${n++}`;

      const payload = {
        slug: candidate,
        title: `${f.problem.title} (Copy)`,
        difficulty: f.problem.difficulty,
        topics: f.problem.topics ?? [],
        description: f.problem.description ?? "",
        examples: f.problem.examples ?? [],
        constraints: f.problem.constraints ?? [],
        hints: f.problem.hints ?? [],
        cpu_time_limit_sec: Number(f.problem.cpu_time_limit_sec ?? 2),
        memory_limit_kb: f.problem.memory_limit_kb ?? 256000,
        is_published: false,
        starter_code: f.starter_code ?? {},
        reference_solution: f.reference_solution ?? {},
        sample_tests: f.sample_tests ?? [],
        hidden_tests: f.hidden_tests ?? [],
        sql_spec: f.sql_spec ?? null,
      };
      const { error: saveErr } = await supabase.rpc("admin_save_problem", {
        payload: payload as any,
      });
      if (saveErr) throw saveErr;
      return candidate;
    },
    onSuccess: (newSlug) => {
      qc.invalidateQueries({ queryKey: ["admin-problems"] });
      qc.invalidateQueries({ queryKey: ["coding-problems-db"] });
      toast({
        title: "Duplicated",
        description: `Created draft "${newSlug}".`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Duplicate failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });
};

export const useAuditLog = () => {
  return useQuery({
    queryKey: ["admin-audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("id,actor_id,action,entity_type,entity_slug,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
};
