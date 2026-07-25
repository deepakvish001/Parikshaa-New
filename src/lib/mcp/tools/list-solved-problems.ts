import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

export default defineTool({
  name: "list_solved_problems",
  title: "List solved problems",
  description: "Coding problem solutions saved by the signed-in user.",
  inputSchema: { limit: z.number().int().min(1).max(200).optional() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    const { data, error } = await sb
      .from("user_problem_solutions")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit ?? 50);
    if (error) return errResult(error.message);
    return jsonResult(`Found ${data?.length ?? 0} solutions:`, data);
  },
});
