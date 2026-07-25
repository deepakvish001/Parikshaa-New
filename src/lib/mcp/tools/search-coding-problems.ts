import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

export default defineTool({
  name: "search_coding_problems",
  title: "Search coding problems",
  description: "Search Parikshaa's published coding problems by title or difficulty.",
  inputSchema: {
    query: z.string().optional().describe("Substring match against title."),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, difficulty, limit }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    let q = sb.from("coding_problems")
      .select("slug,title,difficulty,topics")
      .eq("is_published", true)
      .limit(limit ?? 25);
    if (query) q = q.ilike("title", `%${query}%`);
    if (difficulty) q = q.eq("difficulty", difficulty);
    const { data, error } = await q;
    if (error) return errResult(error.message);
    return jsonResult(`Found ${data?.length ?? 0} problems:`, data);
  },
});
