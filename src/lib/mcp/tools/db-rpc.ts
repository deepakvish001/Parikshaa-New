import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

export const dbRpcTool = defineTool({
  name: "db_rpc",
  title: "Call any database function (RPC)",
  description:
    "Invoke any Postgres function exposed via PostgREST. Use for admin RPCs like admin_list_users, award_xp, get_quiz_leaderboard, grant_admin_to_self, etc. Access is enforced by GRANT + SECURITY DEFINER checks in the DB.",
  inputSchema: {
    name: z.string().min(1).max(128).regex(/^[a-z_][a-z0-9_]*$/, "Invalid function name"),
    args: z.record(z.unknown()).optional().describe("Named arguments for the RPC (matches function parameters)."),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ name, args }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    const { data, error } = await sb.rpc(name, (args ?? {}) as never);
    if (error) return errResult(`${error.code ?? ""} ${error.message}${error.hint ? ` (hint: ${error.hint})` : ""}`);
    return jsonResult(`RPC ${name} returned:`, data);
  },
});
