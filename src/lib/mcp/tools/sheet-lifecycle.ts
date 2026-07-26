import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errResult, jsonResult, requireAdmin, createUserSupabaseClient } from "./_shared";

/* ────────────── bulk_remove_problems_from_sheet ────────────── */
export const bulkRemoveProblemsFromSheetTool = defineTool({
  name: "bulk_remove_problems_from_sheet",
  title: "Remove multiple problems from a sheet in one call",
  description:
    "Delete multiple slugs from a sheet in a single request. Returns per-slug status (removed | not_in_sheet | error).",
  inputSchema: {
    folder_id: z.string().uuid(),
    slugs: z.array(z.string().min(1)).min(1).max(500),
    resequence: z
      .boolean()
      .optional()
      .describe("If true (default), re-pack sort_order of remaining items 0..N-1."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ folder_id, slugs, resequence }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const { data: folder, error: fErr } = await sb
      .from("user_folders").select("id, name").eq("id", folder_id).maybeSingle();
    if (fErr) return errResult(fErr.message);
    if (!folder) return errResult(`Folder ${folder_id} not found.`);

    const uniq = Array.from(new Set(slugs));
    const { data: existing, error: eErr } = await sb
      .from("user_folder_items").select("question_slug").eq("folder_id", folder_id).in("question_slug", uniq);
    if (eErr) return errResult(eErr.message);
    const inSheet = new Set((existing ?? []).map((r) => r.question_slug as string));

    const results: Array<{ slug: string; status: string; error?: string }> = [];
    const toDelete = uniq.filter((s) => inSheet.has(s));
    for (const s of uniq.filter((s) => !inSheet.has(s))) {
      results.push({ slug: s, status: "not_in_sheet" });
    }

    if (toDelete.length > 0) {
      const { error: dErr } = await sb
        .from("user_folder_items").delete().eq("folder_id", folder_id).in("question_slug", toDelete);
      if (dErr) {
        for (const s of toDelete) results.push({ slug: s, status: "error", error: dErr.message });
      } else {
        for (const s of toDelete) results.push({ slug: s, status: "removed" });
      }
    }

    let resequenced = 0;
    if ((resequence ?? true) && toDelete.length > 0) {
      const { data: remaining } = await sb
        .from("user_folder_items").select("question_slug, sort_order")
        .eq("folder_id", folder_id).order("sort_order", { ascending: true });
      const ordered = remaining ?? [];
      for (let i = 0; i < ordered.length; i++) {
        if ((ordered[i].sort_order as number) !== i) {
          const { error } = await sb
            .from("user_folder_items").update({ sort_order: i })
            .eq("folder_id", folder_id).eq("question_slug", ordered[i].question_slug as string);
          if (!error) resequenced++;
        }
      }
    }

    const removed = results.filter((r) => r.status === "removed").length;
    return jsonResult(
      `Removed ${removed}/${uniq.length} slug(s) from "${folder.name}".`,
      { folder_id, folder_name: folder.name, results, removed, not_in_sheet: uniq.length - toDelete.length, resequenced },
    );
  },
});

/* ────────────── get_sheet_share_status ────────────── */
export const getSheetShareStatusTool = defineTool({
  name: "get_sheet_share_status",
  title: "Get a sheet's active public share status",
  description:
    "Return the active share code, is_public, allow_copy, expires_at and expiry flag for a sheet. Returns share:null if the sheet has never been shared.",
  inputSchema: { folder_id: z.string().uuid() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ folder_id }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);

    const { data: folder, error: fErr } = await sb
      .from("user_folders").select("id, name").eq("id", folder_id).maybeSingle();
    if (fErr) return errResult(fErr.message);
    if (!folder) return errResult(`Folder ${folder_id} not found.`);

    const { data: share, error: sErr } = await sb
      .from("shared_folders")
      .select("id, share_code, is_public, allow_copy, expires_at, created_at")
      .eq("folder_id", folder_id)
      .order("created_at", { ascending: false })
      .maybeSingle();
    if (sErr) return errResult(sErr.message);

    const now = Date.now();
    const expired = share?.expires_at ? new Date(share.expires_at as string).getTime() < now : false;
    return jsonResult(
      share ? `Sheet "${folder.name}" share is ${expired ? "EXPIRED" : share.is_public ? "PUBLIC" : "PRIVATE"}.` : `Sheet "${folder.name}" has no share link.`,
      {
        folder_id, folder_name: folder.name,
        share: share ?? null,
        is_expired: expired,
        is_active: !!share && !expired && !!share.is_public,
      },
    );
  },
});

/* ────────────── delete_or_archive_sheet ────────────── */
export const deleteOrArchiveSheetTool = defineTool({
  name: "delete_or_archive_sheet",
  title: "Delete or soft-archive a sheet",
  description:
    "mode='archive' (default): mark sheet as archived by prefixing name with [Archived] and setting color to gray — items/shares preserved. mode='delete': permanently remove the sheet, all its items, and any share links.",
  inputSchema: {
    folder_id: z.string().uuid(),
    mode: z.enum(["archive", "delete"]).optional(),
    unarchive: z.boolean().optional().describe("With mode='archive', if true removes the [Archived] prefix instead."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ folder_id, mode, unarchive }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;
    const op = mode ?? "archive";

    const { data: folder, error: fErr } = await sb
      .from("user_folders").select("id, name, color").eq("id", folder_id).maybeSingle();
    if (fErr) return errResult(fErr.message);
    if (!folder) return errResult(`Folder ${folder_id} not found.`);

    if (op === "delete") {
      const { data: items } = await sb
        .from("user_folder_items").select("question_slug").eq("folder_id", folder_id);
      const { error: sErr } = await sb.from("shared_folders").delete().eq("folder_id", folder_id);
      if (sErr) return errResult(`Share cleanup failed: ${sErr.message}`);
      const { error: iErr } = await sb.from("user_folder_items").delete().eq("folder_id", folder_id);
      if (iErr) return errResult(`Item cleanup failed: ${iErr.message}`);
      const { error: dErr } = await sb.from("user_folders").delete().eq("id", folder_id);
      if (dErr) return errResult(`Folder delete failed: ${dErr.message}`);
      return jsonResult(`Deleted sheet "${folder.name}" and ${items?.length ?? 0} item(s).`, {
        mode: "delete", folder_id, folder_name: folder.name, items_deleted: items?.length ?? 0,
      });
    }

    // archive / unarchive
    const isArchived = (folder.name as string).startsWith("[Archived] ");
    let newName = folder.name as string;
    if (unarchive && isArchived) newName = newName.replace(/^\[Archived\]\s+/, "");
    else if (!unarchive && !isArchived) newName = `[Archived] ${newName}`;

    const patch: Record<string, unknown> = { name: newName, updated_at: new Date().toISOString() };
    if (!unarchive) patch.color = "#6b7280";
    const { data: updated, error: uErr } = await sb
      .from("user_folders").update(patch).eq("id", folder_id).select("id, name, color").single();
    if (uErr) return errResult(`Archive update failed: ${uErr.message}`);

    return jsonResult(
      `${unarchive ? "Unarchived" : "Archived"} sheet "${folder.name}" → "${updated.name}".`,
      { mode: "archive", unarchive: !!unarchive, folder: updated },
    );
  },
});
