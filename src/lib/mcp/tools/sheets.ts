import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errResult, jsonResult, requireAdmin, createUserSupabaseClient } from "./_shared";

/**
 * "Sheet" = a curated folder (user_folders) whose items are coding problems.
 * Admin/owner-only writes; reads are open to any authenticated caller so Claude
 * can list before deciding whether to create or extend an existing sheet.
 */

export const createSheetTool = defineTool({
  name: "create_sheet",
  title: "Create sheet (folder of problems)",
  description:
    "Create a new sheet (curated folder) owned by the calling admin. Returns the folder id to use with add_problems_to_sheet.",
  inputSchema: {
    name: z.string().min(2).max(120),
    description: z.string().max(1000).optional(),
    color: z.string().max(20).optional().describe("Optional hex or tailwind token."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ name, description, color }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const { data, error } = await gate.sb
      .from("user_folders")
      .insert({ name, description, color, user_id: ctx.getUserId() })
      .select("id, name")
      .single();
    if (error) return errResult(`Create failed: ${error.message}`);
    return jsonResult(`Created sheet "${data.name}" (id ${data.id}).`, data);
  },
});

export const listSheetsTool = defineTool({
  name: "list_sheets",
  title: "List sheets",
  description:
    "List sheets visible to the caller (own folders). Use to check for an existing sheet before creating a duplicate.",
  inputSchema: { search: z.string().optional() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    let q = sb
      .from("user_folders")
      .select("id, name, description, color, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);
    if (search) q = q.ilike("name", `%${search}%`);
    const { data, error } = await q;
    if (error) return errResult(error.message);
    return jsonResult(`Found ${data?.length ?? 0} sheets:`, data);
  },
});

export const addProblemsToSheetTool = defineTool({
  name: "add_problems_to_sheet",
  title: "Add coding problems to a sheet",
  description:
    "Batch-add Parikshaa coding problems (by slug) to an existing sheet. Skips slugs that don't exist and slugs already present. Returns per-slug status.",
  inputSchema: {
    folder_id: z.string().uuid(),
    slugs: z.array(z.string().min(1)).min(1).max(200),
    source: z.string().optional().describe("Question source tag. Defaults to 'parikshaa'."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ folder_id, slugs, source }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    // 1. Validate folder ownership/existence.
    const { data: folder, error: fErr } = await sb
      .from("user_folders")
      .select("id, name")
      .eq("id", folder_id)
      .maybeSingle();
    if (fErr) return errResult(fErr.message);
    if (!folder) return errResult(`Folder ${folder_id} not found or not accessible.`);

    // 2. Validate slugs exist in coding_problems.
    const { data: found, error: pErr } = await sb
      .from("coding_problems")
      .select("slug")
      .in("slug", slugs);
    if (pErr) return errResult(`Slug lookup failed: ${pErr.message}`);
    const foundSet = new Set((found ?? []).map((r) => r.slug as string));
    const missing = slugs.filter((s) => !foundSet.has(s));
    const validSlugs = slugs.filter((s) => foundSet.has(s));

    if (validSlugs.length === 0) {
      return errResult(`None of the ${slugs.length} slugs exist in coding_problems. Missing: ${missing.join(", ")}`);
    }

    // 3. Skip already-present slugs.
    const { data: existing } = await sb
      .from("user_folder_items")
      .select("question_slug")
      .eq("folder_id", folder_id)
      .in("question_slug", validSlugs);
    const existingSet = new Set((existing ?? []).map((r) => r.question_slug as string));
    const toInsert = validSlugs.filter((s) => !existingSet.has(s));

    if (toInsert.length === 0) {
      return jsonResult(`Nothing to add — all ${validSlugs.length} slugs already in sheet.`, {
        folder: folder.name,
        added: 0,
        skipped_existing: existingSet.size,
        missing,
      });
    }

    // 4. Insert.
    const rows = toInsert.map((slug, i) => ({
      folder_id,
      question_slug: slug,
      question_source: source ?? "parikshaa",
      sort_order: i,
    }));
    const { error: iErr } = await sb.from("user_folder_items").insert(rows);
    if (iErr) return errResult(`Insert failed: ${iErr.message}`);

    return jsonResult(
      `Added ${toInsert.length} problem(s) to "${folder.name}".`,
      { folder: folder.name, added: toInsert.length, skipped_existing: existingSet.size, missing },
    );
  },
});

export const removeProblemFromSheetTool = defineTool({
  name: "remove_problem_from_sheet",
  title: "Remove a problem from a sheet",
  description: "Remove one problem (by slug) from a sheet.",
  inputSchema: {
    folder_id: z.string().uuid(),
    slug: z.string().min(1),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ folder_id, slug }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const { data, error } = await gate.sb
      .from("user_folder_items")
      .delete()
      .eq("folder_id", folder_id)
      .eq("question_slug", slug)
      .select();
    if (error) return errResult(error.message);
    return jsonResult(`Removed ${data?.length ?? 0} row(s).`, { removed: data?.length ?? 0 });
  },
});

export const listSheetItemsTool = defineTool({
  name: "list_sheet_items",
  title: "List problems in a sheet",
  description: "List all coding problems inside a given sheet, ordered by sort_order.",
  inputSchema: { folder_id: z.string().uuid() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ folder_id }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    const { data, error } = await sb
      .from("user_folder_items")
      .select("question_slug, question_id, question_source, sort_order, created_at")
      .eq("folder_id", folder_id)
      .order("sort_order", { ascending: true });
    if (error) return errResult(error.message);
    return jsonResult(`Sheet contains ${data?.length ?? 0} items:`, data);
  },
});

export const shareSheetTool = defineTool({
  name: "share_sheet",
  title: "Create/refresh a public share link for a sheet",
  description:
    "Generate a shareable code for a sheet. If a share row already exists it's reused. Returns the share code.",
  inputSchema: {
    folder_id: z.string().uuid(),
    is_public: z.boolean().optional(),
    allow_copy: z.boolean().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ folder_id, is_public, allow_copy }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const { data: existing } = await sb
      .from("shared_folders")
      .select("id, share_code")
      .eq("folder_id", folder_id)
      .maybeSingle();
    if (existing) {
      return jsonResult(`Sheet already shared.`, existing);
    }

    const code = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
    const { data, error } = await sb
      .from("shared_folders")
      .insert({
        folder_id,
        share_code: code,
        is_public: is_public ?? true,
        allow_copy: allow_copy ?? true,
      })
      .select("id, share_code, is_public, allow_copy")
      .single();
    if (error) return errResult(error.message);
    return jsonResult(`Sheet shared with code ${data.share_code}.`, data);
  },
});

/* ─────────────────────────  ROADMAP TOOLS  ───────────────────────── */

export const publishRoadmapTool = defineTool({
  name: "publish_roadmap",
  title: "Publish / feature a roadmap",
  description:
    "Toggle publish + feature flags for a roadmap by id in roadmap_overrides (upsert). Sort order optional.",
  inputSchema: {
    roadmap_id: z.string().min(1),
    is_published: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    sort_order: z.number().int().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ roadmap_id, is_published, is_featured, sort_order }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const patch: Record<string, unknown> = { roadmap_id, updated_by: ctx.getUserId() };
    if (is_published !== undefined) patch.is_published = is_published;
    if (is_featured !== undefined) patch.is_featured = is_featured;
    if (sort_order !== undefined) patch.sort_order = sort_order;
    const { data, error } = await gate.sb
      .from("roadmap_overrides")
      .upsert(patch, { onConflict: "roadmap_id" })
      .select();
    if (error) return errResult(error.message);
    return jsonResult(`Roadmap "${roadmap_id}" updated.`, data);
  },
});

export const listRoadmapsTool = defineTool({
  name: "list_roadmap_overrides",
  title: "List roadmap overrides",
  description: "List all roadmap_overrides rows (publish/feature flags per roadmap id).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    const { data, error } = await sb
      .from("roadmap_overrides")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) return errResult(error.message);
    return jsonResult(`Found ${data?.length ?? 0} roadmap overrides:`, data);
  },
});
