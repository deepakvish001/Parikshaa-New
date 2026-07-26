import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

const roleEnum = z.enum(["admin", "owner", "moderator", "user"]);

export const adminManageRoleTool = defineTool({
  name: "admin_manage_role",
  title: "Assign or remove a role for any user",
  description:
    "Grant or revoke a role on public.user_roles for any user. Caller must be admin/owner (RLS enforced). Use action='grant' or 'revoke'.",
  inputSchema: {
    user_id: z.string().uuid(),
    role: roleEnum,
    action: z.enum(["grant", "revoke"]),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ user_id, role, action }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    if (action === "grant") {
      const { data, error } = await sb
        .from("user_roles")
        .upsert({ user_id, role } as never, { onConflict: "user_id,role" })
        .select();
      if (error) return errResult(`${error.code ?? ""} ${error.message}`);
      return jsonResult(`Granted ${role} to ${user_id}:`, data);
    }
    const { data, error } = await sb
      .from("user_roles")
      .delete()
      .eq("user_id", user_id)
      .eq("role", role as never)
      .select();
    if (error) return errResult(`${error.code ?? ""} ${error.message}`);
    return jsonResult(`Revoked ${role} from ${user_id}:`, data);
  },
});
