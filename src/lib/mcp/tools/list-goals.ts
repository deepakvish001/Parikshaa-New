import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

export default defineTool({
  name: "list_goals",
  title: "List user goals",
  description: "Active learning goals for the signed-in user.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_i, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    const { data, error } = await sb.from("user_goals").select("*").order("created_at", { ascending: false });
    if (error) return errResult(error.message);
    return jsonResult(`Found ${data?.length ?? 0} goals:`, data);
  },
});
