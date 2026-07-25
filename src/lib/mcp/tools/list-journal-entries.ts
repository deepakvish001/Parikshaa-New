import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

export default defineTool({
  name: "list_journal_entries",
  title: "List DSA journal entries",
  description: "Practice journal entries (problems logged, notes, difficulty, revisions).",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional(),
    status: z.string().optional().describe("Optional status filter (e.g. 'solved')."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, status }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    let q = sb.from("practice_journal_entries")
      .select("id,title,topic,pattern,difficulty,status,tags,solved_clean,time_taken_min,next_revision_at,is_favorite,created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return errResult(error.message);
    return jsonResult(`Found ${data?.length ?? 0} entries:`, data);
  },
});
