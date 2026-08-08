import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

/**
 * verify_sheet_write_access — probes create/update/delete permission on
 * the sheet's folder, its section overrides, and every linked topic_article.
 * No rows are actually mutated (uses head:true / eq to a non-matching id).
 */
export const verifySheetWriteAccessTool = defineTool({
  name: "verify_sheet_write_access",
  title: "Verify sheet write access",
  description:
    "For a given sheet slug, check whether the current caller can create/update/delete sections and every linked topic_article. Returns per-item allow/block with reasons.",
  inputSchema: {
    sheet_slug: z.string().min(1).describe("Sheet slug (built-in like dbms-sheet, or DB folder slug)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ sheet_slug }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    const uid = ctx.getUserId();
    const [{ data: isAdmin }, { data: isOwner }] = await Promise.all([
      sb.rpc("has_role", { _user_id: uid, _role: "admin" }),
      sb.rpc("has_role", { _user_id: uid, _role: "owner" }),
    ]);
    const canWriteRole = Boolean(isAdmin || isOwner);

    const results: Array<Record<string, unknown>> = [];

    // 1) Sheet-level (builtin override or user_folder)
    const { error: ovErr } = await sb
      .from("builtin_sheet_overrides")
      .select("slug", { head: true, count: "exact" })
      .eq("slug", sheet_slug);
    results.push({
      target: "builtin_sheet_overrides",
      op: "update/delete",
      allowed: canWriteRole && !ovErr,
      reason: canWriteRole
        ? ovErr?.message ?? "admin/owner policy grants write"
        : "requires admin or owner role",
    });

    // 2) Folder (DB-backed sheet)
    const { data: folder, error: fErr } = await sb
      .from("user_folders")
      .select("id, name, user_id")
      .eq("slug", sheet_slug)
      .maybeSingle();
    if (folder) {
      const canFolder = canWriteRole || folder.user_id === uid;
      results.push({
        target: `user_folders:${folder.id}`,
        op: "update/delete",
        allowed: canFolder,
        reason: canFolder
          ? "owner of folder or admin/owner role"
          : "not folder owner and not admin/owner",
      });
    } else if (fErr) {
      results.push({ target: "user_folders", op: "lookup", allowed: false, reason: fErr.message });
    }

    // 3) Linked topic_articles
    const linked = await sb
      .from("topic_articles")
      .select("id, slug, status, sheet_slug")
      .eq("sheet_slug", sheet_slug);
    const articles = linked.data ?? [];
    for (const a of articles) {
      const canRead =
        canWriteRole || a.status === "published";
      const canWrite = canWriteRole;
      results.push({
        target: `topic_articles:${a.slug}`,
        op: "update/delete",
        allowed: canWrite,
        reason: canWrite
          ? "admin/owner policy grants write"
          : `blocked: needs admin/owner (status=${a.status}, readable=${canRead})`,
      });
    }

    const blocked = results.filter((r) => !r.allowed);
    return jsonResult(
      `Write-access probe for "${sheet_slug}": ${results.length - blocked.length}/${results.length} allowed.`,
      {
        caller: { auth_uid: uid, is_admin: !!isAdmin, is_owner: !!isOwner, can_write: canWriteRole },
        sheet_slug,
        checked: results.length,
        blocked_count: blocked.length,
        blocked,
        all: results,
      },
    );
  },
});
