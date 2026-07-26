import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult, requireAdmin } from "./_shared";
import { dbmsSections, dbmsMeta } from "../../../data/dbmsData";
import { cnSections, cnMeta } from "../../../data/cnData";
import { osSections, osMeta } from "../../../data/osData";

const STATIC: Record<string, { meta: any; sections: any[] }> = {
  "dbms-sheet": { meta: dbmsMeta, sections: dbmsSections },
  "cn-sheet": { meta: cnMeta, sections: cnSections },
  "os-sheet": { meta: osMeta, sections: osSections },
};

/** Update (or delete) admin overrides for a built-in frontend sheet. */
export const updateBuiltinSheetTool = defineTool({
  name: "update_builtin_sheet",
  title: "Update built-in sheet (admin)",
  description:
    "Admin/owner-only. Persist edits to a built-in frontend sheet (dbms-sheet, cn-sheet, os-sheet). Overrides title/description/sections and is merged into get_builtin_sheet responses. Pass reset=true to clear overrides.",
  inputSchema: {
    slug: z.string().min(1),
    title: z.string().optional(),
    description: z.string().optional(),
    sections: z.array(z.any()).optional().describe("Full replacement for sections array."),
    reset: z.boolean().optional(),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug, title, description, sections, reset }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;
    const key = slug.trim().toLowerCase();
    if (!STATIC[key]) return errResult(`Unknown built-in sheet "${slug}".`);

    if (reset) {
      const { error } = await sb.from("builtin_sheet_overrides").delete().eq("slug", key);
      if (error) return errResult(error.message);
      return jsonResult("Override cleared.", { slug: key });
    }

    const patch: Record<string, unknown> = { slug: key, updated_by: ctx.getUserId() };
    if (title !== undefined) patch.title = title;
    if (description !== undefined) patch.description = description;
    if (sections !== undefined) patch.sections = sections;

    const { data, error } = await sb
      .from("builtin_sheet_overrides")
      .upsert(patch, { onConflict: "slug" })
      .select()
      .single();
    if (error) return errResult(error.message);
    return jsonResult("Override saved.", data);
  },
});

/** Mirror a built-in sheet into user_folders + items so all existing sheet tools work on it. */
export const syncBuiltinSheetToDbTool = defineTool({
  name: "sync_builtin_sheet_to_db",
  title: "Sync built-in sheet into DB folder (admin)",
  description:
    "Admin/owner-only. Create or refresh a user_folders row (owned by caller) mirroring a built-in sheet's topics as folder items. After sync, use all existing sheet tools (add_problems_to_sheet, reorder_sheet_items, share_sheet, etc.) against the returned folder_id.",
  inputSchema: {
    slug: z.string().min(1).describe("dbms-sheet, cn-sheet, or os-sheet"),
    replace_items: z.boolean().optional().describe("Default true. Wipes existing items before re-inserting."),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug, replace_items }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;
    const key = slug.trim().toLowerCase();
    const src = STATIC[key];
    if (!src) return errResult(`Unknown built-in sheet "${slug}".`);
    const uid = ctx.getUserId()!;
    const name = `[Builtin] ${src.meta.title}`;

    // Find existing mirror folder for this admin
    const existing = await sb
      .from("user_folders")
      .select("id")
      .eq("user_id", uid)
      .eq("name", name)
      .maybeSingle();

    let folderId = existing.data?.id as string | undefined;
    if (!folderId) {
      const ins = await sb
        .from("user_folders")
        .insert({ user_id: uid, name, description: src.meta.description, color: "#f97316" })
        .select("id")
        .single();
      if (ins.error) return errResult(ins.error.message);
      folderId = ins.data.id;
    }

    if (replace_items !== false) {
      await sb.from("user_folder_items").delete().eq("folder_id", folderId);
    }

    // Flatten topics -> items
    const items: any[] = [];
    let ord = 0;
    for (const section of src.sections) {
      for (const sub of section.subSections ?? []) {
        for (const topic of sub.topics ?? []) {
          items.push({
            folder_id: folderId,
            question_source: "builtin",
            question_slug: topic.id ?? topic.slug ?? `${section.id}-${sub.id}-${ord}`,
            sort_order: ord++,
          });
        }
      }
    }
    let inserted = 0;
    if (items.length) {
      const { error, count } = await sb
        .from("user_folder_items")
        .insert(items, { count: "exact" });
      if (error) return errResult(error.message);
      inserted = count ?? items.length;
    }

    return jsonResult(`Synced "${src.meta.title}" into folder ${folderId}.`, {
      folder_id: folderId,
      folder_name: name,
      items_inserted: inserted,
      slug: key,
    });
  },
});

/** Admin-only: list ALL sheets (built-in + every DB folder across all users). */
export const listAllSheetsAdminTool = defineTool({
  name: "list_all_sheets_admin",
  title: "List every sheet (admin)",
  description:
    "Admin/owner-only. Returns every built-in frontend sheet plus every user_folders row across all users, with owner user_id and item counts. Use to discover sheets you did not create.",
  inputSchema: {
    search: z.string().optional(),
    limit: z.number().int().min(1).max(1000).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const q = (search ?? "").trim().toLowerCase();
    const builtins = Object.entries(STATIC)
      .filter(([k, v]) => !q || `${k} ${v.meta.title}`.toLowerCase().includes(q))
      .map(([k, v]) => ({
        kind: "builtin" as const,
        slug: k,
        name: v.meta.title,
        route: `/learn/sheets/${k}`,
        total_topics: v.meta.totalProblems,
      }));

    let folderQuery = sb
      .from("user_folders")
      .select("id, user_id, name, description, color, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit ?? 200);
    if (q) folderQuery = folderQuery.ilike("name", `%${q}%`);
    const { data: folders, error } = await folderQuery;
    if (error) return errResult(error.message);

    const results: any[] = [];
    for (const f of folders ?? []) {
      const { count } = await sb
        .from("user_folder_items")
        .select("*", { count: "exact", head: true })
        .eq("folder_id", f.id);
      results.push({ kind: "db_folder", ...f, item_count: count ?? 0 });
    }

    return jsonResult(`Found ${builtins.length} built-in + ${results.length} DB sheets.`, {
      builtins,
      db_folders: results,
    });
  },
});

/** Admin-only: patch any user_folders row regardless of owner. */
export const adminUpdateSheetTool = defineTool({
  name: "admin_update_sheet",
  title: "Update any sheet (admin)",
  description:
    "Admin/owner-only. Update name/description/color on any user_folders row across owners. Use folder_id from list_all_sheets_admin.",
  inputSchema: {
    folder_id: z.string().uuid(),
    name: z.string().optional(),
    description: z.string().optional(),
    color: z.string().optional(),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ folder_id, name, description, color }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) patch.name = name;
    if (description !== undefined) patch.description = description;
    if (color !== undefined) patch.color = color;
    const { data, error } = await gate.sb
      .from("user_folders")
      .update(patch)
      .eq("id", folder_id)
      .select()
      .single();
    if (error) return errResult(error.message);
    return jsonResult("Sheet updated.", data);
  },
});

/** Admin-only: hard-delete any user_folders row and its items. */
export const adminDeleteSheetTool = defineTool({
  name: "admin_delete_sheet",
  title: "Delete any sheet (admin)",
  description: "Admin/owner-only. Permanently deletes a user_folders row (and its items via cascade) regardless of owner.",
  inputSchema: { folder_id: z.string().uuid() },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false, destructiveHint: true },
  handler: async ({ folder_id }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    await gate.sb.from("user_folder_items").delete().eq("folder_id", folder_id);
    const { error } = await gate.sb.from("user_folders").delete().eq("id", folder_id);
    if (error) return errResult(error.message);
    return jsonResult("Sheet deleted.", { folder_id });
  },
});
