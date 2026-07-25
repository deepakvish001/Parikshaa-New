import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

export default defineTool({
  name: "get_progress_stats",
  title: "Get progress stats",
  description: "Total XP, level, and recent XP transactions for the signed-in user.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    const userId = ctx.getUserId();
    const [txRes, recentRes] = await Promise.all([
      sb.from("xp_transactions").select("amount").eq("user_id", userId!),
      sb.from("xp_transactions").select("*").eq("user_id", userId!).order("created_at", { ascending: false }).limit(10),
    ]);
    if (txRes.error) return errResult(txRes.error.message);
    const totalXp = (txRes.data ?? []).reduce((s, r: { amount: number | null }) => s + (r.amount ?? 0), 0);
    return jsonResult("Progress:", { totalXp, recent: recentRes.data ?? [] });
  },
});
