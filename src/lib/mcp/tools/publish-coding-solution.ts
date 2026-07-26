import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errResult, jsonResult, requireAdmin } from "./_shared";

/**
 * Publish (upsert) reference solutions for an existing coding problem.
 * Admin-only via RLS on coding_problem_reference_solutions.
 * Accepts one or many (lang_id, code) pairs — one row per language.
 */
export const publishCodingSolutionTool = defineTool({
  name: "publish_coding_solution",
  title: "Publish coding problem reference solution",
  description:
    "Upsert reference solution(s) for a published coding problem. Provide `problem_slug` and one or more `{ lang_id, code }` entries. Common lang_id values: 'python', 'javascript', 'cpp', 'java'. Existing solutions for the same (slug, lang_id) are overwritten.",
  inputSchema: {
    problem_slug: z.string().min(2),
    solutions: z
      .array(
        z.object({
          lang_id: z.string().min(1).describe("Language identifier (e.g. python, javascript, cpp, java)"),
          code: z.string().min(1),
        }),
      )
      .min(1, "at least one solution required"),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ problem_slug, solutions }, ctx: ToolContext) => {
    const _gate = await requireAdmin(ctx);
    if (!_gate.ok) return _gate.error;
    const sb = _gate.sb;

    // Ensure the problem exists.
    const { data: exists, error: exErr } = await sb
      .from("coding_problems")
      .select("slug")
      .eq("slug", problem_slug)
      .maybeSingle();
    if (exErr) return errResult(`Problem lookup failed: ${exErr.message}`);
    if (!exists) return errResult(`No coding problem with slug "${problem_slug}". Publish the problem first with publish_coding_problem.`);

    const rows = solutions.map((s) => ({
      problem_slug,
      lang_id: s.lang_id,
      code: s.code,
      updated_at: new Date().toISOString(),
    }));

    const { error: upErr } = await sb
      .from("coding_problem_reference_solutions")
      .upsert(rows, { onConflict: "problem_slug,lang_id" });
    if (upErr) return errResult(`Publish solution failed: ${upErr.message}`);

    return jsonResult(
      `Published ${rows.length} reference solution(s) for "${problem_slug}".`,
      { problem_slug, languages: rows.map((r) => r.lang_id) },
    );
  },
});
