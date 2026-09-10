import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

/**
 * Reports whether the signed-in MCP user already holds admin/owner.
 *
 * Self-granting was removed: the backing SECURITY DEFINER function
 * public.grant_admin_to_self() allowed ANY signed-in user to escalate to
 * admin/owner, so it was dropped. Roles must now be granted by an existing
 * owner (admin UI or admin_grant_role).
 */
export const ensureAdminAccessTool = defineTool({
  name: "ensure_admin_access",
  title: "Check admin access for this MCP client",
  description:
    "Report whether the signed-in MCP user has the 'admin' or 'owner' role. Self-granting is disabled; an existing owner must grant the role.",
  inputSchema: {},
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    const uid = ctx.getUserId();
    const [{ data: isAdmin }, { data: isOwner }] = await Promise.all([
      sb.rpc("has_role", { _user_id: uid, _role: "admin" }),
      sb.rpc("has_role", { _user_id: uid, _role: "owner" }),
    ]);
    if (!isAdmin && !isOwner) {
      return errResult(
        `User ${uid} has neither 'admin' nor 'owner'. Self-granting is disabled for security; ask an owner to grant the role.`,
      );
    }
    return jsonResult(`Admin access confirmed for user ${uid}.`, {
      user_id: uid,
      admin: !!isAdmin,
      owner: !!isOwner,
    });
  },
});

