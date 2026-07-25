import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

export default defineTool({
  name: "mark_notifications_read",
  title: "Mark notifications read",
  description: "Mark specific notifications (or all) as read for the signed-in user.",
  inputSchema: {
    notification_ids: z.array(z.string().uuid()).optional().describe("If omitted, marks ALL unread as read."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ notification_ids }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    let q = sb.from("notifications").update({ read: true }).eq("user_id", ctx.getUserId()!).eq("read", false);
    if (notification_ids?.length) q = q.in("id", notification_ids);
    const { data, error } = await q.select("id");
    if (error) return errResult(error.message);
    return jsonResult(`Marked ${data?.length ?? 0} as read.`, data);
  },
});
