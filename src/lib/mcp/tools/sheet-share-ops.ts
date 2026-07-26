import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errResult, jsonResult, requireAdmin, createUserSupabaseClient } from "./_shared";

/* ────────── update_sheet_share_settings ────────── */
export const updateSheetShareSettingsTool = defineTool({
  name: "update_sheet_share_settings",
  title: "Update share settings without regenerating share_code",
  description:
    "Patch is_public / allow_copy / expires_at on the existing shared_folders row. share_code stays the same unless regenerate:true is set.",
  inputSchema: {
    folder_id: z.string().uuid(),
    is_public: z.boolean().optional(),
    allow_copy: z.boolean().optional(),
    expires_at: z.string().datetime().nullable().optional().describe("ISO timestamp, or null to clear expiry."),
    regenerate: z.boolean().optional().describe("If true, also rotate share_code."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ folder_id, is_public, allow_copy, expires_at, regenerate }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const { data: folder, error: fErr } = await sb
      .from("user_folders").select("id, name").eq("id", folder_id).maybeSingle();
    if (fErr) return errResult(fErr.message);
    if (!folder) return errResult(`Folder ${folder_id} not found.`);

    const { data: share, error: sErr } = await sb
      .from("shared_folders").select("id, share_code")
      .eq("folder_id", folder_id).order("created_at", { ascending: false }).maybeSingle();
    if (sErr) return errResult(sErr.message);
    if (!share) return errResult(`No share link exists for "${folder.name}". Use share_sheet first.`);

    const patch: Record<string, unknown> = {};
    if (is_public !== undefined) patch.is_public = is_public;
    if (allow_copy !== undefined) patch.allow_copy = allow_copy;
    if (expires_at !== undefined) patch.expires_at = expires_at;
    if (regenerate) patch.share_code = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
    if (Object.keys(patch).length === 0) return errResult("No fields provided to update.");

    const { data, error } = await sb
      .from("shared_folders").update(patch).eq("id", share.id)
      .select("id, share_code, is_public, allow_copy, expires_at").single();
    if (error) return errResult(`Update failed: ${error.message}`);

    return jsonResult(
      `Share settings updated for "${folder.name}"${regenerate ? " (share_code rotated)" : ""}.`,
      { folder_id, folder_name: folder.name, code_rotated: !!regenerate, share: data },
    );
  },
});

/* ────────── duplicate_sheet ────────── */
export const duplicateSheetTool = defineTool({
  name: "duplicate_sheet",
  title: "Duplicate a sheet (section template + ordered items)",
  description:
    "Create a new user_folder that copies the source sheet's description (section outline) and all sheet items in the same sort_order. Does not copy share links.",
  inputSchema: {
    source_folder_id: z.string().uuid(),
    new_name: z.string().min(2).max(120).optional().describe("Defaults to '<source name> (Copy)'."),
    new_color: z.string().max(20).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ source_folder_id, new_name, new_color }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;
    const userId = ctx.getUserId();

    const { data: src, error: srcErr } = await sb
      .from("user_folders").select("id, name, description, color").eq("id", source_folder_id).maybeSingle();
    if (srcErr) return errResult(srcErr.message);
    if (!src) return errResult(`Source folder ${source_folder_id} not found.`);

    const { data: srcItems, error: iErr } = await sb
      .from("user_folder_items").select("question_slug, question_id, question_source, sort_order")
      .eq("folder_id", source_folder_id).order("sort_order", { ascending: true });
    if (iErr) return errResult(iErr.message);

    const targetName = new_name ?? `${src.name} (Copy)`;
    const { data: newFolder, error: nErr } = await sb
      .from("user_folders")
      .insert({ user_id: userId, name: targetName, description: src.description, color: new_color ?? src.color })
      .select("id, name, color").single();
    if (nErr) return errResult(`Folder create failed: ${nErr.message}`);

    let inserted = 0;
    if ((srcItems ?? []).length > 0) {
      const rows = (srcItems ?? []).map((it, idx) => ({
        folder_id: newFolder.id,
        question_slug: it.question_slug,
        question_id: it.question_id,
        question_source: it.question_source ?? "parikshaa",
        sort_order: idx,
      }));
      const { error: insErr } = await sb.from("user_folder_items").insert(rows);
      if (insErr) return errResult(`Item copy failed: ${insErr.message} (folder ${newFolder.id} was created).`);
      inserted = rows.length;
    }

    return jsonResult(
      `Duplicated "${src.name}" → "${newFolder.name}" (${inserted} items).`,
      { source: { id: src.id, name: src.name }, new_folder: newFolder, items_copied: inserted },
    );
  },
});

/* ────────── export_sheet_items_csv ────────── */
const csvEscape = (v: unknown): string => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const parseSectionsForLookup = (description: string | null | undefined): Record<string, string> => {
  const text = description ?? "";
  const firstHeader = text.search(/(^|\n)## /);
  if (firstHeader === -1) return {};
  const rest = text.slice(firstHeader).replace(/^\n/, "");
  const map: Record<string, string> = {};
  for (const block of rest.split(/\n(?=## )/)) {
    const [head, ...lines] = block.split("\n");
    const title = head.replace(/^##\s+/, "").trim();
    for (const l of lines) {
      const t = l.trim();
      if (t.startsWith("- ")) {
        const slug = t.slice(2).replace(/\s*\(missing\)\s*$/i, "").trim();
        if (slug && !map[slug]) map[slug] = title;
      }
    }
  }
  return map;
};

export const exportSheetItemsCsvTool = defineTool({
  name: "export_sheet_items_csv",
  title: "Export sheet items to CSV (title, slug, sort_order, section)",
  description:
    "Return the sheet's items as a CSV string with columns: sort_order, section, slug, title, difficulty, topics, is_published. Section is derived from the sheet description outline.",
  inputSchema: { folder_id: z.string().uuid() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ folder_id }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);

    const { data: folder, error: fErr } = await sb
      .from("user_folders").select("id, name, description").eq("id", folder_id).maybeSingle();
    if (fErr) return errResult(fErr.message);
    if (!folder) return errResult(`Folder ${folder_id} not found.`);

    const { data: items, error: iErr } = await sb
      .from("user_folder_items").select("question_slug, sort_order")
      .eq("folder_id", folder_id).order("sort_order", { ascending: true });
    if (iErr) return errResult(iErr.message);

    const slugs = (items ?? []).map((r) => r.question_slug as string).filter(Boolean);
    let meta: Record<string, { title?: string; difficulty?: string; topics?: string[]; is_published?: boolean }> = {};
    if (slugs.length > 0) {
      const { data: probs } = await sb
        .from("coding_problems").select("slug, title, difficulty, topics, is_published").in("slug", slugs);
      meta = Object.fromEntries((probs ?? []).map((p) => [p.slug as string, p as never]));
    }

    const sectionOf = parseSectionsForLookup(folder.description);
    const header = ["sort_order", "section", "slug", "title", "difficulty", "topics", "is_published"];
    const lines = [header.join(",")];
    for (const it of items ?? []) {
      const slug = it.question_slug as string;
      const m = meta[slug] ?? {};
      lines.push([
        it.sort_order, sectionOf[slug] ?? "", slug,
        m.title ?? "", m.difficulty ?? "",
        Array.isArray(m.topics) ? m.topics.join("|") : "",
        m.is_published === undefined ? "" : String(m.is_published),
      ].map(csvEscape).join(","));
    }
    const csv = lines.join("\n");
    return jsonResult(
      `CSV export ready — ${items?.length ?? 0} rows from "${folder.name}".`,
      { folder_id, folder_name: folder.name, row_count: items?.length ?? 0, csv, filename: `${folder.name.replace(/[^a-z0-9]+/gi, "_")}.csv` },
    );
  },
});

/* ────────── list_public_share_codes ────────── */
export const listPublicShareCodesTool = defineTool({
  name: "list_public_share_codes",
  title: "List all active public share codes for my sheets",
  description:
    "Return every shared_folders row for the caller's sheets with share_code, is_public, allow_copy, expires_at, and computed is_expired / is_active flags.",
  inputSchema: {
    include_private: z.boolean().optional().describe("If true, also include is_public=false rows."),
    include_expired: z.boolean().optional().describe("If true, include already-expired rows."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ include_private, include_expired }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    const userId = ctx.getUserId();

    const { data: folders, error: fErr } = await sb
      .from("user_folders").select("id, name").eq("user_id", userId);
    if (fErr) return errResult(fErr.message);
    const folderIds = (folders ?? []).map((f) => f.id as string);
    if (folderIds.length === 0) return jsonResult("You have no sheets.", { shares: [] });

    const nameById = Object.fromEntries((folders ?? []).map((f) => [f.id as string, f.name as string]));
    const { data: shares, error: sErr } = await sb
      .from("shared_folders")
      .select("id, folder_id, share_code, is_public, allow_copy, expires_at, created_at")
      .in("folder_id", folderIds)
      .order("created_at", { ascending: false });
    if (sErr) return errResult(sErr.message);

    const now = Date.now();
    const rows = (shares ?? []).map((s) => {
      const expired = s.expires_at ? new Date(s.expires_at as string).getTime() < now : false;
      return {
        folder_id: s.folder_id, folder_name: nameById[s.folder_id as string] ?? "(unknown)",
        share_code: s.share_code, is_public: s.is_public, allow_copy: s.allow_copy,
        expires_at: s.expires_at, created_at: s.created_at,
        is_expired: expired, is_active: !!s.is_public && !expired,
      };
    });
    const filtered = rows.filter((r) =>
      (include_private ? true : r.is_public) && (include_expired ? true : !r.is_expired)
    );

    return jsonResult(
      `${filtered.length} share code(s) across ${folderIds.length} sheet(s).`,
      { total_sheets: folderIds.length, total_shares: rows.length, returned: filtered.length, shares: filtered },
    );
  },
});
