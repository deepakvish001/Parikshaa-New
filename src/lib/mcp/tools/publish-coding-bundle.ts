import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errResult, jsonResult, requireAdmin } from "./_shared";

/**
 * Core bundle-publish logic, reusable by other MCP tools (e.g. publish_sheet_bundle).
 * Returns `{ ok, slug, snapshotVersion?, error? }`. Does NOT gate — caller must gate.
 */
export async function publishBundleCore(
  sb: SupabaseClient,
  uid: string,
  input: {
    problem: Record<string, unknown> & { slug: string };
    tests: Array<{ input: string; expected_output: string; is_sample?: boolean; weight?: number }>;
    starter_code?: Array<{ language: string; code: string }>;
    solutions: Array<{ lang_id: string; code: string }>;
    if_exists?: "error" | "update";
    version_note?: string;
  },
): Promise<{ ok: boolean; slug: string; snapshotVersion: number | null; error?: string; overwritten?: boolean }> {
  const p = input.problem;
  const { data: existing, error: exErr } = await sb
    .from("coding_problems").select("slug").eq("slug", p.slug).maybeSingle();
  if (exErr) return { ok: false, slug: p.slug, snapshotVersion: null, error: `Slug check: ${exErr.message}` };
  if (existing && (input.if_exists ?? "error") === "error") {
    return { ok: false, slug: p.slug, snapshotVersion: null, error: `Slug "${p.slug}" exists — pass if_exists:"update".` };
  }
  let snapshotVersion: number | null = null;
  if (existing) {
    const [{ data: fullRow }, { data: curTests }, { data: curStarter }, { data: curSolutions }, { data: latest }] =
      await Promise.all([
        sb.from("coding_problems").select("*").eq("slug", p.slug).maybeSingle(),
        sb.from("coding_problem_tests").select("*").eq("problem_slug", p.slug),
        sb.from("coding_problem_starter_code").select("*").eq("problem_slug", p.slug),
        sb.from("coding_problem_reference_solutions").select("*").eq("problem_slug", p.slug),
        sb.from("coding_problem_versions").select("version_number").eq("slug", p.slug)
          .order("version_number", { ascending: false }).limit(1).maybeSingle(),
      ]);
    snapshotVersion = ((latest?.version_number as number | undefined) ?? 0) + 1;
    const { error: snapErr } = await sb.from("coding_problem_versions").insert({
      slug: p.slug, version_number: snapshotVersion,
      snapshot: { ...(fullRow ?? {}), _solutions: curSolutions ?? [] },
      tests_snapshot: curTests ?? [], starter_snapshot: curStarter ?? [],
      note: input.version_note ?? "Auto snapshot before bundle overwrite",
      created_by: uid,
    });
    if (snapErr) return { ok: false, slug: p.slug, snapshotVersion, error: `Snapshot: ${snapErr.message}` };
  }
  const { error: upErr } = await sb.from("coding_problems")
    .upsert({ ...p, is_published: true, created_by: uid }, { onConflict: "slug" });
  if (upErr) return { ok: false, slug: p.slug, snapshotVersion, error: `Publish: ${upErr.message}` };

  await sb.from("coding_problem_tests").delete().eq("problem_slug", p.slug);
  const { error: tErr } = await sb.from("coding_problem_tests")
    .insert(input.tests.map((t) => ({ ...t, problem_slug: p.slug })));
  if (tErr) return { ok: false, slug: p.slug, snapshotVersion, error: `Tests: ${tErr.message}` };

  if (input.starter_code?.length) {
    await sb.from("coding_problem_starter_code").delete().eq("problem_slug", p.slug);
    const { error: sErr } = await sb.from("coding_problem_starter_code")
      .insert(input.starter_code.map((s) => ({ ...s, problem_slug: p.slug })));
    if (sErr) return { ok: false, slug: p.slug, snapshotVersion, error: `Starter: ${sErr.message}` };
  }
  const solRows = input.solutions.map((s) => ({
    problem_slug: p.slug, lang_id: s.lang_id, code: s.code, updated_at: new Date().toISOString(),
  }));
  const { error: solErr } = await sb.from("coding_problem_reference_solutions")
    .upsert(solRows, { onConflict: "problem_slug,lang_id" });
  if (solErr) return { ok: false, slug: p.slug, snapshotVersion, error: `Solutions: ${solErr.message}` };

  return { ok: true, slug: p.slug, snapshotVersion, overwritten: !!existing };
}


/**
 * Batch workflow tool: publish a coding problem AND its reference solutions
 * for multiple languages in one request. Wraps publish_coding_problem +
 * publish_coding_solution so Claude can ship a complete problem in a single
 * call.
 */
const problemSchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, "slug must be lowercase-with-dashes"),
  title: z.string().min(3).max(150),
  difficulty: z.enum(["easy", "medium", "hard"]),
  description: z.string().min(30),
  topics: z.array(z.string().min(1)).min(1),
  examples: z.array(z.record(z.unknown())).min(1),
  constraints: z.array(z.string()).optional(),
  hints: z.array(z.string()).optional(),
  cpu_time_limit_sec: z.number().positive().optional(),
  memory_limit_kb: z.number().int().positive().optional(),
  mcq: z.record(z.unknown()).optional(),
  is_contest_pool: z.boolean().optional(),
});

const testSchema = z.object({
  input: z.string(),
  expected_output: z.string(),
  is_sample: z.boolean().optional(),
  weight: z.number().optional(),
});

export const publishCodingBundleTool = defineTool({
  name: "publish_coding_bundle",
  title: "Publish coding problem + solutions bundle",
  description:
    "One-shot publish: problem + tests + starter code + reference solutions for multiple languages. Snapshots the previous version when overwriting. Use this instead of calling publish_coding_problem and publish_coding_solution separately.",
  inputSchema: {
    problem: z.object({
      slug: z.string(),
      title: z.string(),
      difficulty: z.string(),
      description: z.string(),
      topics: z.array(z.string()),
      examples: z.array(z.record(z.unknown())),
      constraints: z.array(z.string()).optional(),
      hints: z.array(z.string()).optional(),
      cpu_time_limit_sec: z.number().optional(),
      memory_limit_kb: z.number().int().optional(),
      mcq: z.record(z.unknown()).optional(),
      is_contest_pool: z.boolean().optional(),
    }),
    tests: z.array(testSchema).min(2, "at least 2 tests required"),
    starter_code: z.array(z.object({ language: z.string(), code: z.string() })).optional(),
    solutions: z
      .array(z.object({ lang_id: z.string().min(1), code: z.string().min(1) }))
      .min(1, "at least one reference solution required"),
    if_exists: z.enum(["error", "update"]).optional(),
    version_note: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async (
    { problem, tests, starter_code, solutions, if_exists, version_note },
    ctx: ToolContext,
  ) => {
    const _gate = await requireAdmin(ctx);
    if (!_gate.ok) return _gate.error;

    const parsed = problemSchema.safeParse(problem);
    if (!parsed.success) {
      return errResult(
        "Validation failed:\n" + JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
      );
    }
    const p = parsed.data;
    const sb = _gate.sb;

    // 1. Conflict check + optional snapshot.
    const { data: existing, error: exErr } = await sb
      .from("coding_problems")
      .select("slug, title")
      .eq("slug", p.slug)
      .maybeSingle();
    if (exErr) return errResult(`Slug check failed: ${exErr.message}`);

    if (existing && (if_exists ?? "error") === "error") {
      return errResult(
        `Slug "${p.slug}" already exists. Re-call with if_exists="update" to overwrite (a version snapshot will be saved).`,
      );
    }

    let snapshotVersion: number | null = null;
    if (existing) {
      const [{ data: fullRow }, { data: curTests }, { data: curStarter }, { data: curSolutions }, { data: latest }] =
        await Promise.all([
          sb.from("coding_problems").select("*").eq("slug", p.slug).maybeSingle(),
          sb.from("coding_problem_tests").select("*").eq("problem_slug", p.slug),
          sb.from("coding_problem_starter_code").select("*").eq("problem_slug", p.slug),
          sb.from("coding_problem_reference_solutions").select("*").eq("problem_slug", p.slug),
          sb
            .from("coding_problem_versions")
            .select("version_number")
            .eq("slug", p.slug)
            .order("version_number", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
      snapshotVersion = ((latest?.version_number as number | undefined) ?? 0) + 1;
      const { error: snapErr } = await sb.from("coding_problem_versions").insert({
        slug: p.slug,
        version_number: snapshotVersion,
        snapshot: { ...(fullRow ?? {}), _solutions: curSolutions ?? [] },
        tests_snapshot: curTests ?? [],
        starter_snapshot: curStarter ?? [],
        note: version_note ?? "Auto snapshot before bundle overwrite",
        created_by: ctx.getUserId(),
      });
      if (snapErr) return errResult(`Snapshot failed (aborted): ${snapErr.message}`);
    }

    // 2. Upsert problem.
    const { error: upErr } = await sb
      .from("coding_problems")
      .upsert({ ...p, is_published: true, created_by: ctx.getUserId() }, { onConflict: "slug" });
    if (upErr) return errResult(`Publish failed: ${upErr.message}`);

    // 3. Replace tests.
    await sb.from("coding_problem_tests").delete().eq("problem_slug", p.slug);
    const { error: tErr } = await sb
      .from("coding_problem_tests")
      .insert(tests.map((t) => ({ ...t, problem_slug: p.slug })));
    if (tErr) return errResult(`Tests insert failed: ${tErr.message}`);

    // 4. Replace starter code.
    if (starter_code?.length) {
      await sb.from("coding_problem_starter_code").delete().eq("problem_slug", p.slug);
      const { error: sErr } = await sb
        .from("coding_problem_starter_code")
        .insert(starter_code.map((s) => ({ ...s, problem_slug: p.slug })));
      if (sErr) return errResult(`Starter code insert failed: ${sErr.message}`);
    }

    // 5. Upsert reference solutions.
    const solRows = solutions.map((s) => ({
      problem_slug: p.slug,
      lang_id: s.lang_id,
      code: s.code,
      updated_at: new Date().toISOString(),
    }));
    const { error: solErr } = await sb
      .from("coding_problem_reference_solutions")
      .upsert(solRows, { onConflict: "problem_slug,lang_id" });
    if (solErr) return errResult(`Solutions upsert failed: ${solErr.message}`);

    return jsonResult(
      existing
        ? `Bundle overwritten "${p.slug}" (previous saved as v${snapshotVersion}). Tests=${tests.length}, starters=${starter_code?.length ?? 0}, solutions=${solRows.length}.`
        : `Bundle published "${p.slug}" — ${tests.length} tests, ${starter_code?.length ?? 0} starters, ${solRows.length} solutions.`,
      {
        slug: p.slug,
        snapshotVersion,
        tests: tests.length,
        starters: starter_code?.length ?? 0,
        solutions: solRows.map((r) => r.lang_id),
      },
    );
  },
});
