import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

export default defineTool({
  name: "list_notifications",
  title: "List notifications",
  description: "Recent notifications for the signed-in user.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional(),
    unread_only: z.boolean().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, unread_only }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    let q = sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(limit ?? 25);
    if (unread_only) q = q.eq("read", false);
    const { data, error } = await q;
    if (error) return errResult(error.message);
    return jsonResult(`Found ${data?.length ?? 0} notifications:`, data);
  },
});
