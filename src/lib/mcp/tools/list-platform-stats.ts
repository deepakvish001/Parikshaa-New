import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

export default defineTool({
  name: "list_platform_stats",
  title: "List platform stats",
  description: "Synced coding platform stats (LeetCode, Codeforces, etc.) for the user.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_i, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    const { data, error } = await sb.from("user_platform_stats").select("*");
    if (error) return errResult(error.message);
    return jsonResult(`Found ${data?.length ?? 0} platform rows:`, data);
  },
});
