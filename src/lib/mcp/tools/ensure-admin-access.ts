import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

/**
 * Self-grant admin role for the currently signed-in MCP user.
 * Gated at the MCP layer: only OAuth-client tokens (i.e. Claude / ChatGPT
 * connecting via the MCP server) may call this. Password sessions from the
 * app are rejected — a normal end-user cannot elevate themselves.
 *
 * Backing DB function: public.grant_admin_to_self() (SECURITY DEFINER).
 */
export const ensureAdminAccessTool = defineTool({
  name: "ensure_admin_access",
  title: "Ensure admin access for this MCP client",
  description:
    "Grant the signed-in MCP user the 'admin' role so publish tools work. Idempotent — safe to call at the start of every session. Only OAuth-client tokens (Claude, ChatGPT connectors) are allowed; regular app sessions are rejected.",
  inputSchema: {},
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const clientId = ctx.getClientId?.();
    if (!clientId) {
      return errResult(
        "This tool is only callable by OAuth MCP clients (Claude, ChatGPT). Your token has no client_id claim.",
      );
    }
    const sb = createUserSupabaseClient(ctx);
    const { error } = await sb.rpc("grant_admin_to_self");
    if (error) return errResult(`grant_admin_to_self failed: ${error.message}`);
    return jsonResult(
      `Admin role ensured for user ${ctx.getUserId()} (client=${clientId}).`,
      { user_id: ctx.getUserId(), client_id: clientId, role: "admin" },
    );
  },
});
