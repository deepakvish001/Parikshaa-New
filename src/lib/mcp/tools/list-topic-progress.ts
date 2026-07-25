import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

export default defineTool({
  name: "list_topic_progress",
  title: "List topic progress",
  description: "Per-topic learning progress for the signed-in user.",
  inputSchema: { limit: z.number().int().min(1).max(500).optional() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    const { data, error } = await sb
      .from("user_topic_progress")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit ?? 100);
    if (error) return errResult(error.message);
    return jsonResult(`Found ${data?.length ?? 0} topics:`, data);
  },
});
