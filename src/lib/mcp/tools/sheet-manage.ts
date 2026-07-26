import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errResult, jsonResult, requireAdmin, createUserSupabaseClient } from "./_shared";
import { publishBundleCore } from "./publish-coding-bundle";

/* ────────────────────────  SECTION OUTLINE HELPERS  ────────────────────────
 * Sections live inside user_folders.description as markdown:
 *
 *   {intro text}
 *
 *   ## Section Title
 *   - slug-a
 *   - slug-b (missing)
 *
 *   ## Another Section
 *   - slug-c
 *
 * The intro (everything before the first `## `) is preserved on rewrites.
 * -------------------------------------------------------------------------- */

type Section = { title: string; slugs: string[] };

const parseSections = (description: string | null | undefined): { intro: string; sections: Section[] } => {
  const text = description ?? "";
  const firstHeader = text.search(/(^|\n)## /);
  if (firstHeader === -1) return { intro: text.trim(), sections: [] };
  const intro = text.slice(0, firstHeader).trim();
  const rest = text.slice(firstHeader).replace(/^\n/, "");
  const blocks = rest.split(/\n(?=## )/);
  const sections: Section[] = blocks
    .map((b) => {
      const [head, ...lines] = b.split("\n");
      const title = head.replace(/^##\s+/, "").trim();
      const slugs = lines
        .map((l) => l.trim())
        .filter((l) => l.startsWith("- "))
        .map((l) => l.slice(2).replace(/\s*\(missing\)\s*$/i, "").trim())
        .filter(Boolean);
      return { title, slugs };
    })
    .filter((s) => s.title);
  return { intro, sections };
};

const renderSections = (intro: string, sections: Section[], missingSet?: Set<string>): string => {
  const body = sections
    .map(
      (s) =>
        `## ${s.title}\n${s.slugs
          .map((sl) => `- ${sl}${missingSet && !missingSet.has(sl) ? "" : ""}${missingSet && missingSet.has(sl) === false ? " (missing)" : ""}`)
          .join("\n")}`,
    )
    .join("\n\n");
  return intro ? `${intro}\n\n${body}` : body;
};

/* ────────────────────  regenerate_share_sheet_link  ──────────────────── */
export const regenerateShareSheetLinkTool = defineTool({
  name: "regenerate_share_sheet_link",
  title: "Revoke + regenerate a sheet's public share link",
  description:
    "Delete any existing shared_folders row for the sheet and issue a fresh share code. Old links stop working immediately.",
  inputSchema: {
    folder_id: z.string().uuid(),
    is_public: z.boolean().optional(),
    allow_copy: z.boolean().optional(),
    expires_at: z.string().datetime().optional().describe("ISO timestamp for expiry (optional)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ folder_id, is_public, allow_copy, expires_at }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const { data: folder, error: fErr } = await sb
      .from("user_folders").select("id, name").eq("id", folder_id).maybeSingle();
    if (fErr) return errResult(fErr.message);
    if (!folder) return errResult(`Folder ${folder_id} not found.`);

    const { data: oldRows, error: delErr } = await sb
      .from("shared_folders").delete().eq("folder_id", folder_id).select("share_code");
    if (delErr) return errResult(`Revoke failed: ${delErr.message}`);

    const code = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
    const row: Record<string, unknown> = {
      folder_id, share_code: code,
      is_public: is_public ?? true, allow_copy: allow_copy ?? true,
    };
    if (expires_at) row.expires_at = expires_at;

    const { data, error } = await sb
      .from("shared_folders").insert(row).select("id, share_code, is_public, allow_copy, expires_at").single();
    if (error) return errResult(`New share failed: ${error.message}`);

    return jsonResult(
      `Share link regenerated for "${folder.name}". Revoked ${oldRows?.length ?? 0} old code(s).`,
      { folder: folder.name, revoked: (oldRows ?? []).map((r) => r.share_code), new_share: data },
    );
  },
});

/* ────────────────────  update_sheet_sections  ──────────────────── */
export const updateSheetSectionsTool = defineTool({
  name: "update_sheet_sections",
  title: "Edit a sheet's section outline (add/remove/rename/reorder)",
  description:
    "Persist a new section outline into the sheet's description and, when requested, reorder actual sheet items to match section order (unlisted items append at end). Also inserts any missing slugs (that exist in coding_problems) referenced by the new outline.",
  inputSchema: {
    folder_id: z.string().uuid(),
    sections: z
      .array(z.object({ title: z.string().min(1).max(120), slugs: z.array(z.string().min(1)).default([]) }))
      .min(1)
      .max(50),
    intro: z.string().max(2000).optional().describe("Optional replacement intro (before section list)."),
    apply_to_items: z
      .boolean()
      .optional()
      .describe("If true (default), also reorder existing sheet items and insert any new outline slugs."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ folder_id, sections, intro, apply_to_items }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;
    const doApply = apply_to_items ?? true;

    const { data: folder, error: fErr } = await sb
      .from("user_folders").select("id, name, description").eq("id", folder_id).maybeSingle();
    if (fErr) return errResult(fErr.message);
    if (!folder) return errResult(`Folder ${folder_id} not found.`);

    const preservedIntro = intro !== undefined ? intro : parseSections(folder.description).intro;
    const allSlugs = Array.from(new Set(sections.flatMap((s) => s.slugs)));

    // Validate slugs exist in coding_problems (for `(missing)` annotation + item insertion).
    let foundSet = new Set<string>();
    if (allSlugs.length > 0) {
      const { data: found, error: pErr } = await sb
        .from("coding_problems").select("slug").in("slug", allSlugs);
      if (pErr) return errResult(`Slug lookup failed: ${pErr.message}`);
      foundSet = new Set((found ?? []).map((r) => r.slug as string));
    }
    const missing = allSlugs.filter((s) => !foundSet.has(s));

    // Rewrite description outline.
    const newDesc = renderSections(preservedIntro, sections as Section[], foundSet);
    const { error: upErr } = await sb
      .from("user_folders").update({ description: newDesc, updated_at: new Date().toISOString() }).eq("id", folder_id);
    if (upErr) return errResult(`Description update failed: ${upErr.message}`);

    const summary: Record<string, unknown> = {
      folder_id, folder_name: folder.name,
      sections_written: sections.length, missing_slugs: missing,
    };

    if (doApply) {
      const { data: existingItems } = await sb
        .from("user_folder_items").select("question_slug, sort_order").eq("folder_id", folder_id);
      const existingSet = new Set((existingItems ?? []).map((r) => r.question_slug as string));

      // Insert any outline slugs missing from sheet (skip slugs not in coding_problems).
      const orderedOutlineSlugs = sections.flatMap((s) => s.slugs).filter((s) => foundSet.has(s));
      const toInsert = orderedOutlineSlugs.filter((s) => !existingSet.has(s));
      if (toInsert.length > 0) {
        const rows = toInsert.map((slug) => ({
          folder_id, question_slug: slug, question_source: "parikshaa", sort_order: 0,
        }));
        const { error: iErr } = await sb.from("user_folder_items").insert(rows);
        if (iErr) return errResult(`Insert missing items failed: ${iErr.message}`);
        toInsert.forEach((s) => existingSet.add(s));
      }

      // Reorder: outline order first, then unlisted items appended (stable).
      const listed = orderedOutlineSlugs.filter((s) => existingSet.has(s));
      const tail = (existingItems ?? [])
        .filter((r) => !listed.includes(r.question_slug as string))
        .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
        .map((r) => r.question_slug as string);
      const finalOrder = [...listed, ...tail];
      for (let i = 0; i < finalOrder.length; i++) {
        const { error } = await sb
          .from("user_folder_items").update({ sort_order: i })
          .eq("folder_id", folder_id).eq("question_slug", finalOrder[i]);
        if (error) return errResult(`Reorder failed at "${finalOrder[i]}": ${error.message}`);
      }
      summary.items_inserted = toInsert.length;
      summary.items_reordered = finalOrder.length;
      summary.unlisted_tail = tail.length;
    }

    return jsonResult(`Outline updated for "${folder.name}" (${sections.length} sections).`, summary);
  },
});

/* ────────────────────  get_sheet_details  ──────────────────── */
export const getSheetDetailsTool = defineTool({
  name: "get_sheet_details",
  title: "Get full sheet structure + ordered items",
  description:
    "Return sheet metadata, parsed section outline from description, all ordered sheet items with problem metadata (title, difficulty, topics), and any active share code. Ready for direct UI rendering.",
  inputSchema: { folder_id: z.string().uuid() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ folder_id }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);

    const { data: folder, error: fErr } = await sb
      .from("user_folders")
      .select("id, name, description, color, created_at, updated_at, user_id")
      .eq("id", folder_id).maybeSingle();
    if (fErr) return errResult(fErr.message);
    if (!folder) return errResult(`Folder ${folder_id} not found.`);

    const { data: items, error: iErr } = await sb
      .from("user_folder_items")
      .select("question_slug, question_id, question_source, sort_order, created_at")
      .eq("folder_id", folder_id)
      .order("sort_order", { ascending: true });
    if (iErr) return errResult(iErr.message);

    const slugs = (items ?? []).map((r) => r.question_slug as string).filter(Boolean);
    let problemMeta: Record<string, unknown> = {};
    if (slugs.length > 0) {
      const { data: probs } = await sb
        .from("coding_problems")
        .select("slug, title, difficulty, topics, is_published")
        .in("slug", slugs);
      problemMeta = Object.fromEntries((probs ?? []).map((p) => [p.slug as string, p]));
    }

    const enrichedItems = (items ?? []).map((it) => ({
      slug: it.question_slug,
      sort_order: it.sort_order,
      source: it.question_source,
      created_at: it.created_at,
      problem: problemMeta[it.question_slug as string] ?? null,
    }));

    const { intro, sections } = parseSections(folder.description);
    const inSheet = new Set(slugs);
    const sectionsAnnotated = sections.map((s) => ({
      title: s.title,
      slugs: s.slugs.map((sl) => ({
        slug: sl,
        in_sheet: inSheet.has(sl),
        problem: problemMeta[sl] ?? null,
      })),
    }));

    const { data: share } = await sb
      .from("shared_folders")
      .select("share_code, is_public, allow_copy, expires_at, created_at")
      .eq("folder_id", folder_id).maybeSingle();

    return jsonResult(`Sheet "${folder.name}" — ${enrichedItems.length} items, ${sections.length} sections.`, {
      folder: {
        id: folder.id, name: folder.name, color: folder.color,
        created_at: folder.created_at, updated_at: folder.updated_at, owner_id: folder.user_id,
      },
      intro,
      sections: sectionsAnnotated,
      items: enrichedItems,
      share: share ?? null,
    });
  },
});

/* ────────────────────  preview_publish_sheet_bundle  ────────────────────
 * Dry-run for publish_sheet_bundle. No writes. Reports:
 *  - which slugs already exist (would overwrite / need if_exists:"update")
 *  - which slugs would be created
 *  - whether the sheet exists (reuse) or would be created
 *  - which problems would be added vs skipped (already in sheet)
 *  - any zod validation failures per problem
 * ------------------------------------------------------------------------ */
export const previewPublishSheetBundleTool = defineTool({
  name: "preview_publish_sheet_bundle",
  title: "Dry-run preview of publish_sheet_bundle",
  description:
    "Decode a publish_sheet_bundle payload and report exactly what would happen — sheets created/reused, problems inserted vs overwritten, items added vs already-in-sheet, and any validation failures — WITHOUT writing anything.",
  inputSchema: {
    sheet: z.object({
      name: z.string().min(2).max(120),
      description: z.string().max(2000).optional(),
      color: z.string().max(20).optional(),
      reuse_folder_id: z.string().uuid().optional(),
    }),
    problems: z
      .array(
        z.object({
          problem: z.object({
            slug: z.string(),
            title: z.string().optional(),
            difficulty: z.string().optional(),
          }).passthrough(),
          tests: z.array(z.record(z.unknown())).optional(),
          starter_code: z.array(z.record(z.unknown())).optional(),
          solutions: z.array(z.record(z.unknown())).optional(),
        }),
      )
      .min(1).max(50),
    if_exists: z.enum(["error", "update"]).optional(),
    roadmap: z.object({ roadmap_id: z.string() }).passthrough().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ sheet, problems, if_exists, roadmap }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);

    // Validate each problem shape (minimal — mirrors publish_sheet_bundle's requirements).
    const perProblem: Array<Record<string, unknown>> = [];
    const slugs = problems.map((p) => p.problem.slug);
    const dupSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i);

    const { data: existing } = await sb
      .from("coding_problems").select("slug").in("slug", slugs);
    const existingSet = new Set((existing ?? []).map((r) => r.slug as string));

    for (const p of problems) {
      const issues: string[] = [];
      if (!p.problem.slug || !/^[a-z0-9-]+$/.test(p.problem.slug))
        issues.push("slug must be lowercase-with-dashes");
      if (!p.tests || p.tests.length < 2) issues.push("needs >= 2 tests");
      if (!p.solutions || p.solutions.length < 1) issues.push("needs >= 1 solution");
      const conflictExists = existingSet.has(p.problem.slug);
      const wouldError = conflictExists && (if_exists ?? "error") === "error";
      perProblem.push({
        slug: p.problem.slug,
        action: wouldError
          ? "would_fail_slug_exists"
          : conflictExists
          ? "would_overwrite_with_snapshot"
          : "would_create",
        validation_issues: issues,
        would_publish: issues.length === 0 && !wouldError,
      });
    }

    // Sheet resolution.
    let sheetInfo: Record<string, unknown> = { action: "would_create", name: sheet.name };
    let existingSheetItems: string[] = [];
    if (sheet.reuse_folder_id) {
      const { data: folder } = await sb
        .from("user_folders").select("id, name").eq("id", sheet.reuse_folder_id).maybeSingle();
      if (!folder) sheetInfo = { action: "reuse_failed_not_found", folder_id: sheet.reuse_folder_id };
      else {
        const { data: items } = await sb
          .from("user_folder_items").select("question_slug").eq("folder_id", folder.id);
        existingSheetItems = (items ?? []).map((r) => r.question_slug as string);
        sheetInfo = { action: "would_reuse", folder_id: folder.id, folder_name: folder.name, current_items: existingSheetItems.length };
      }
    }

    const publishableSlugs = perProblem
      .filter((r) => r.would_publish).map((r) => r.slug as string);
    const alreadyInSheet = publishableSlugs.filter((s) => existingSheetItems.includes(s));
    const toAdd = publishableSlugs.filter((s) => !existingSheetItems.includes(s));

    return jsonResult(
      `Preview: ${perProblem.filter((r) => r.would_publish).length}/${problems.length} would publish, ${toAdd.length} would be added to sheet.`,
      {
        sheet: sheetInfo,
        problems: perProblem,
        duplicate_slugs_in_payload: Array.from(new Set(dupSlugs)),
        sheet_add_plan: { would_add: toAdd, already_in_sheet: alreadyInSheet },
        roadmap: roadmap ? { action: "would_upsert", roadmap_id: roadmap.roadmap_id } : null,
        dry_run: true,
        _note: "No writes performed. Call publish_sheet_bundle to apply.",
        // Reuse imported helper to keep tree-shaking honest — noop:
        _coreLoaded: typeof publishBundleCore === "function",
      },
    );
  },
});
