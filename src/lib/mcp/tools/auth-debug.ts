import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

const REAUTH_HINT =
  "If you see a 401, your MCP OAuth token is missing or expired. Reconnect: " +
  "1) In Claude, open Settings → Connectors → Parikshaa → Disconnect. " +
  "2) Sign in to https://parikshaa.org with an admin/owner account in the same browser. " +
  "3) Reconnect the Parikshaa connector — the OAuth popup will use your active session. " +
  "4) After reconnect, call `get_current_user_context` to confirm auth.uid() and roles.";

export const getCurrentUserContextTool = defineTool({
  name: "get_current_user_context",
  title: "Get current user context",
  description:
    "Return the caller's auth.uid(), email, and role flags (admin/owner). Use this to debug 401s and confirm the MCP OAuth token is valid.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return errResult(`Not authenticated (no valid OAuth token).\n\n${REAUTH_HINT}`);
    }
    const uid = ctx.getUserId();
    const email = ctx.getUserEmail() ?? null;
    const sb = createUserSupabaseClient(ctx);

    const [rolesRes, adminRes, ownerRes] = await Promise.all([
      sb.from("user_roles").select("role").eq("user_id", uid!),
      sb.rpc("has_role", { _user_id: uid, _role: "admin" }),
      sb.rpc("has_role", { _user_id: uid, _role: "owner" }),
    ]);

    const roles = (rolesRes.data ?? []).map((r: { role: string }) => r.role);
    const isAdmin = Boolean(adminRes.data);
    const isOwner = Boolean(ownerRes.data);

    return jsonResult("Current user context:", {
      auth_uid: uid,
      email,
      roles,
      is_admin: isAdmin,
      is_owner: isOwner,
      can_write: isAdmin || isOwner,
      roles_query_error: rolesRes.error?.message ?? null,
      reauth_instructions: isAdmin || isOwner ? null : REAUTH_HINT,
    });
  },
});

export const testSheetAccessTool = defineTool({
  name: "test_sheet_access",
  title: "Test sheet read access",
  description:
    "Check whether the caller can read a sheet by slug. Checks built-in frontend sheets (dbms-sheet, cn-sheet, os-sheet) and DB-backed sheets in user_folders. Explains why access is or is not granted.",
  inputSchema: {
    slug: z.string().min(1).describe("Sheet slug, e.g. dbms-sheet"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return errResult(`Not authenticated.\n\n${REAUTH_HINT}`);
    }
    const uid = ctx.getUserId();
    const sb = createUserSupabaseClient(ctx);
    const BUILTIN = new Set(["dbms-sheet", "cn-sheet", "os-sheet"]);
    const normalized = slug.trim().toLowerCase();

    const [adminRes, ownerRes] = await Promise.all([
      sb.rpc("has_role", { _user_id: uid, _role: "admin" }),
      sb.rpc("has_role", { _user_id: uid, _role: "owner" }),
    ]);
    const isAdmin = Boolean(adminRes.data);
    const isOwner = Boolean(ownerRes.data);

    const isBuiltin = BUILTIN.has(normalized);

    const { data: folder, error: folderErr } = await sb
      .from("user_folders")
      .select("id, name, user_id, created_at")
      .ilike("name", `%${normalized.replace(/-/g, " ")}%`)
      .limit(1)
      .maybeSingle();

    let itemCount: number | null = null;
    if (folder?.id) {
      const { count } = await sb
        .from("user_folder_items")
        .select("*", { count: "exact", head: true })
        .eq("folder_id", folder.id);
      itemCount = count ?? 0;
    }

    const canRead =
      isBuiltin ||
      isAdmin ||
      isOwner ||
      (folder?.user_id && folder.user_id === uid);

    const reasons: string[] = [];
    if (isBuiltin) reasons.push("Slug is a built-in frontend sheet — always readable via get_builtin_sheet.");
    if (isAdmin) reasons.push("Caller has admin role (RLS admin policy allows read).");
    if (isOwner) reasons.push("Caller has owner role (RLS admin policy allows read).");
    if (folder?.user_id === uid) reasons.push("Caller owns this folder.");
    if (!canRead) reasons.push("No matching access rule — read denied by RLS.");
    if (folderErr) reasons.push(`user_folders query error: ${folderErr.message}`);

    return jsonResult(`Access check for "${slug}":`, {
      slug: normalized,
      is_builtin_frontend_sheet: isBuiltin,
      builtin_route: isBuiltin ? `/learn/sheets/${normalized}` : null,
      recommended_tool: isBuiltin ? "get_builtin_sheet" : folder ? "get_sheet_details" : "list_sheets",
      db_folder_found: Boolean(folder),
      db_folder: folder ?? null,
      db_item_count: itemCount,
      caller: { auth_uid: uid, is_admin: isAdmin, is_owner: isOwner },
      can_read: canRead,
      reasons,
    });
  },
});
