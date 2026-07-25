import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

/**
 * Required fields for a publishable coding problem.
 * Validated in-tool BEFORE any DB write so a bad payload never reaches the table.
 */
const problemSchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, "slug must be lowercase-with-dashes"),
  title: z.string().min(3).max(150),
  difficulty: z.enum(["easy", "medium", "hard"]),
  description: z.string().min(30, "description too short (min 30 chars)"),
  topics: z.array(z.string().min(1)).min(1, "at least 1 topic required"),
  examples: z.array(z.record(z.unknown())).min(1, "at least 1 example required"),
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

export const publishCodingProblemTool = defineTool({
  name: "publish_coding_problem",
  title: "Publish coding problem (validated)",
  description:
    "Validate + publish a coding problem. Enforces required fields, requires ≥2 tests, and handles slug conflicts. If the slug already exists, use if_exists='update' to overwrite (auto-snapshots current version first) or if_exists='error' (default) to abort and prompt the caller.",
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
    tests: z.array(testSchema).min(2, "at least 2 tests required to publish"),
    starter_code: z
      .array(z.object({ language: z.string(), code: z.string() }))
      .optional(),
    if_exists: z.enum(["error", "update"]).optional().describe("Default 'error'. 'update' overwrites and snapshots the previous version."),
    version_note: z.string().optional().describe("Note stored on the snapshot when overwriting."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ problem, tests, starter_code, if_exists, version_note }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");

    // 1. Schema validation — hard-fail before touching DB.
    const parsed = problemSchema.safeParse(problem);
    if (!parsed.success) {
      return errResult(
        "Validation failed. Missing/invalid fields:\n" +
          JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
      );
    }
    const p = parsed.data;
    const sb = createUserSupabaseClient(ctx);

    // 2. Slug conflict check.
    const { data: existing, error: exErr } = await sb
      .from("coding_problems")
      .select("slug, title, is_published")
      .eq("slug", p.slug)
      .maybeSingle();
    if (exErr) return errResult(`Slug check failed: ${exErr.message}`);

    if (existing && (if_exists ?? "error") === "error") {
      return errResult(
        `Slug "${p.slug}" already exists (title: "${existing.title}", published: ${existing.is_published}). ` +
          `Re-call with if_exists="update" to overwrite (a version snapshot will be saved for rollback), ` +
          `or choose a different slug.`,
      );
    }

    // 3. If overwriting, snapshot current state first.
    let snapshotVersion: number | null = null;
    if (existing) {
      const [{ data: fullRow }, { data: curTests }, { data: curStarter }] = await Promise.all([
        sb.from("coding_problems").select("*").eq("slug", p.slug).maybeSingle(),
        sb.from("coding_problem_tests").select("*").eq("problem_slug", p.slug),
        sb.from("coding_problem_starter_code").select("*").eq("problem_slug", p.slug),
      ]);

      const { data: latest } = await sb
        .from("coding_problem_versions")
        .select("version_number")
        .eq("slug", p.slug)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      snapshotVersion = ((latest?.version_number as number | undefined) ?? 0) + 1;

      const { error: snapErr } = await sb.from("coding_problem_versions").insert({
        slug: p.slug,
        version_number: snapshotVersion,
        snapshot: fullRow ?? {},
        tests_snapshot: curTests ?? [],
        starter_snapshot: curStarter ?? [],
        note: version_note ?? `Auto snapshot before overwrite`,
        created_by: ctx.getUserId(),
      });
      if (snapErr) return errResult(`Snapshot failed (aborted before overwrite): ${snapErr.message}`);
    }

    // 4. Upsert the problem.
    const { error: upErr } = await sb
      .from("coding_problems")
      .upsert({ ...p, is_published: true, created_by: ctx.getUserId() }, { onConflict: "slug" });
    if (upErr) return errResult(`Publish failed: ${upErr.message}`);

    // 5. Replace tests + starter code.
    await sb.from("coding_problem_tests").delete().eq("problem_slug", p.slug);
    const { error: tErr } = await sb
      .from("coding_problem_tests")
      .insert(tests.map((t) => ({ ...t, problem_slug: p.slug })));
    if (tErr) return errResult(`Tests insert failed: ${tErr.message}`);

    if (starter_code?.length) {
      await sb.from("coding_problem_starter_code").delete().eq("problem_slug", p.slug);
      const { error: sErr } = await sb
        .from("coding_problem_starter_code")
        .insert(starter_code.map((s) => ({ ...s, problem_slug: p.slug })));
      if (sErr) return errResult(`Starter code insert failed: ${sErr.message}`);
    }

    return jsonResult(
      existing
        ? `Overwritten "${p.slug}". Previous state saved as version ${snapshotVersion}. Use rollback_coding_problem to restore.`
        : `Published new problem "${p.slug}" with ${tests.length} tests.`,
      { slug: p.slug, snapshotVersion, tests: tests.length, starters: starter_code?.length ?? 0 },
    );
  },
});

export const listCodingProblemVersionsTool = defineTool({
  name: "list_coding_problem_versions",
  title: "List coding problem versions",
  description: "List saved version snapshots for a coding problem slug (admin only).",
  inputSchema: { slug: z.string() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    const { data, error } = await sb
      .from("coding_problem_versions")
      .select("id, version_number, note, created_by, created_at")
      .eq("slug", slug)
      .order("version_number", { ascending: false });
    if (error) return errResult(error.message);
    return jsonResult(`Found ${data?.length ?? 0} versions for "${slug}":`, data);
  },
});

export const rollbackCodingProblemTool = defineTool({
  name: "rollback_coding_problem",
  title: "Rollback coding problem",
  description:
    "Restore a coding problem (and its tests + starter code) from a saved version snapshot. Also snapshots the CURRENT state before rolling back, so a rollback is itself reversible.",
  inputSchema: {
    slug: z.string(),
    version_number: z.number().int().positive(),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ slug, version_number }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);

    const { data: ver, error: vErr } = await sb
      .from("coding_problem_versions")
      .select("*")
      .eq("slug", slug)
      .eq("version_number", version_number)
      .maybeSingle();
    if (vErr) return errResult(vErr.message);
    if (!ver) return errResult(`No version ${version_number} found for "${slug}".`);

    // Snapshot current state before restoring (reversible rollback).
    const [{ data: curRow }, { data: curTests }, { data: curStarter }, { data: latest }] = await Promise.all([
      sb.from("coding_problems").select("*").eq("slug", slug).maybeSingle(),
      sb.from("coding_problem_tests").select("*").eq("problem_slug", slug),
      sb.from("coding_problem_starter_code").select("*").eq("problem_slug", slug),
      sb.from("coding_problem_versions").select("version_number").eq("slug", slug).order("version_number", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const preRollbackVersion = ((latest?.version_number as number | undefined) ?? 0) + 1;
    if (curRow) {
      await sb.from("coding_problem_versions").insert({
        slug,
        version_number: preRollbackVersion,
        snapshot: curRow,
        tests_snapshot: curTests ?? [],
        starter_snapshot: curStarter ?? [],
        note: `Auto snapshot before rollback to v${version_number}`,
        created_by: ctx.getUserId(),
      });
    }

    // Restore.
    const snap = ver.snapshot as Record<string, unknown>;
    const { error: upErr } = await sb.from("coding_problems").upsert(snap, { onConflict: "slug" });
    if (upErr) return errResult(`Restore failed: ${upErr.message}`);

    await sb.from("coding_problem_tests").delete().eq("problem_slug", slug);
    const tests = (ver.tests_snapshot as unknown[]) ?? [];
    if (tests.length) await sb.from("coding_problem_tests").insert(tests as never);

    await sb.from("coding_problem_starter_code").delete().eq("problem_slug", slug);
    const starters = (ver.starter_snapshot as unknown[]) ?? [];
    if (starters.length) await sb.from("coding_problem_starter_code").insert(starters as never);

    return jsonResult(
      `Rolled back "${slug}" to version ${version_number}. Pre-rollback state saved as version ${preRollbackVersion}.`,
      { slug, restoredVersion: version_number, preRollbackVersion },
    );
  },
});
