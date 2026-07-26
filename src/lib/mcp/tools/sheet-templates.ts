import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errResult, jsonResult, requireAdmin, createUserSupabaseClient } from "./_shared";
import { publishBundleCore } from "./publish-coding-bundle";

/* ─────────────────────────  TEMPLATE REGISTRY  ─────────────────────────
 * Predefined sheet structures. Each template lists sections (headers only —
 * user_folder_items has no section column so we prepend section prefix in
 * slug ordering) and an ordered list of Parikshaa slugs.
 *
 * Slugs are matched against coding_problems at generation time; missing ones
 * are reported and skipped so a partial template still creates a usable sheet.
 * ------------------------------------------------------------------------ */

type SheetTemplate = {
  key: string;
  name: string;
  description: string;
  color?: string;
  sections: Array<{ title: string; slugs: string[] }>;
  roadmap_id?: string;
};

const TEMPLATES: SheetTemplate[] = [
  {
    key: "dsa-basics",
    name: "DSA Basics — 30 Day Starter",
    description: "Foundational DSA problems across arrays, strings, hashing and two-pointer.",
    color: "#3B82F6",
    sections: [
      { title: "Arrays", slugs: ["two-sum", "best-time-to-buy-and-sell-stock", "maximum-subarray", "move-zeroes"] },
      { title: "Strings", slugs: ["valid-anagram", "reverse-string", "longest-common-prefix"] },
      { title: "Hashing", slugs: ["contains-duplicate", "group-anagrams"] },
      { title: "Two Pointers", slugs: ["valid-palindrome", "3sum"] },
    ],
    roadmap_id: "dsa-fundamentals",
  },
  {
    key: "sde-sheet",
    name: "SDE Sheet — Interview Ready",
    description: "Curated problem set covering the interview loop: arrays, LL, trees, graphs, DP.",
    color: "#8B5CF6",
    sections: [
      { title: "Arrays & Hashing", slugs: ["two-sum", "contains-duplicate", "group-anagrams", "top-k-frequent-elements"] },
      { title: "Linked List", slugs: ["reverse-linked-list", "merge-two-sorted-lists", "linked-list-cycle"] },
      { title: "Trees", slugs: ["invert-binary-tree", "maximum-depth-of-binary-tree", "same-tree", "binary-tree-level-order-traversal"] },
      { title: "Graphs", slugs: ["number-of-islands", "clone-graph", "course-schedule"] },
      { title: "Dynamic Programming", slugs: ["climbing-stairs", "house-robber", "longest-increasing-subsequence", "coin-change"] },
    ],
    roadmap_id: "sde-interview",
  },
  {
    key: "top-75",
    name: "Top 75 — Blind Curated",
    description: "The classic 75-question interview list (subset — extend via clone).",
    color: "#10B981",
    sections: [
      { title: "Array", slugs: ["two-sum", "best-time-to-buy-and-sell-stock", "product-of-array-except-self", "maximum-subarray", "3sum"] },
      { title: "Binary", slugs: ["number-of-1-bits", "counting-bits", "missing-number", "reverse-bits"] },
      { title: "DP", slugs: ["climbing-stairs", "coin-change", "longest-increasing-subsequence", "word-break"] },
      { title: "Interval", slugs: ["merge-intervals", "insert-interval", "non-overlapping-intervals"] },
    ],
  },
];

export const listSheetTemplatesTool = defineTool({
  name: "list_sheet_templates",
  title: "List predefined sheet templates",
  description:
    "Return all built-in sheet templates (key, name, description, section titles, slug counts). Use before create_sheet_from_template.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const summary = TEMPLATES.map((t) => ({
      key: t.key,
      name: t.name,
      description: t.description,
      sections: t.sections.map((s) => ({ title: s.title, slug_count: s.slugs.length })),
      total_slugs: t.sections.reduce((n, s) => n + s.slugs.length, 0),
      roadmap_id: t.roadmap_id,
    }));
    return jsonResult(`Available templates: ${TEMPLATES.length}`, summary);
  },
});

export const createSheetFromTemplateTool = defineTool({
  name: "create_sheet_from_template",
  title: "One-click sheet from a template",
  description:
    "Generate a new sheet using a predefined template. Validates slugs against coding_problems, inserts existing ones in template order, reports missing. Optionally publishes the linked roadmap.",
  inputSchema: {
    template_key: z.string().min(1),
    name_override: z.string().max(120).optional(),
    publish_roadmap: z.boolean().optional().describe("If template defines a roadmap_id, also mark it published."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ template_key, name_override, publish_roadmap }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const tpl = TEMPLATES.find((t) => t.key === template_key);
    if (!tpl) return errResult(`Unknown template "${template_key}". Call list_sheet_templates.`);

    const allSlugs = tpl.sections.flatMap((s) => s.slugs);
    const { data: found, error: pErr } = await sb
      .from("coding_problems").select("slug").in("slug", allSlugs);
    if (pErr) return errResult(`Slug lookup failed: ${pErr.message}`);
    const foundSet = new Set((found ?? []).map((r) => r.slug as string));
    const missing = allSlugs.filter((s) => !foundSet.has(s));

    // Create folder — description carries section outline so UI can render it.
    const outline = tpl.sections
      .map((s) => `## ${s.title}\n${s.slugs.map((sl) => `- ${sl}${foundSet.has(sl) ? "" : " (missing)"}`).join("\n")}`)
      .join("\n\n");
    const { data: folder, error: fErr } = await sb
      .from("user_folders")
      .insert({
        user_id: ctx.getUserId(),
        name: name_override ?? tpl.name,
        description: `${tpl.description}\n\n${outline}`,
        color: tpl.color,
      })
      .select("id, name").single();
    if (fErr) return errResult(`Folder create failed: ${fErr.message}`);

    // Insert items preserving template order (section-major, slug order within).
    let order = 0;
    const rows: Array<Record<string, unknown>> = [];
    for (const section of tpl.sections) {
      for (const slug of section.slugs) {
        if (!foundSet.has(slug)) continue;
        rows.push({
          folder_id: folder.id,
          question_slug: slug,
          question_source: "parikshaa",
          sort_order: order++,
        });
      }
    }
    if (rows.length > 0) {
      const { error: iErr } = await sb.from("user_folder_items").insert(rows);
      if (iErr) return errResult(`Items insert failed (folder created): ${iErr.message}`);
    }

    let roadmapResult: unknown = null;
    if (publish_roadmap && tpl.roadmap_id) {
      const { data: rm } = await sb
        .from("roadmap_overrides")
        .upsert(
          { roadmap_id: tpl.roadmap_id, is_published: true, is_featured: true, updated_by: ctx.getUserId() },
          { onConflict: "roadmap_id" },
        )
        .select();
      roadmapResult = rm;
    }

    return jsonResult(
      `Created sheet "${folder.name}" from template "${tpl.key}" — ${rows.length} problems added, ${missing.length} missing.`,
      { folder_id: folder.id, added: rows.length, missing, roadmap: roadmapResult },
    );
  },
});

export const cloneSheetTool = defineTool({
  name: "clone_sheet",
  title: "Clone an existing sheet",
  description:
    "Duplicate an existing sheet's structure and items into a new sheet owned by the caller. Useful to snapshot a template sheet.",
  inputSchema: {
    source_folder_id: z.string().uuid(),
    new_name: z.string().min(2).max(120),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ source_folder_id, new_name }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const { data: src, error: srcErr } = await sb
      .from("user_folders").select("description, color").eq("id", source_folder_id).maybeSingle();
    if (srcErr) return errResult(srcErr.message);
    if (!src) return errResult(`Source folder ${source_folder_id} not found.`);

    const { data: items, error: itErr } = await sb
      .from("user_folder_items")
      .select("question_slug, question_id, question_source, sort_order")
      .eq("folder_id", source_folder_id)
      .order("sort_order", { ascending: true });
    if (itErr) return errResult(itErr.message);

    const { data: folder, error: fErr } = await sb
      .from("user_folders")
      .insert({ user_id: ctx.getUserId(), name: new_name, description: src.description, color: src.color })
      .select("id, name").single();
    if (fErr) return errResult(fErr.message);

    if (items && items.length > 0) {
      const rows = items.map((i, idx) => ({
        folder_id: folder.id,
        question_slug: i.question_slug,
        question_id: i.question_id,
        question_source: i.question_source,
        sort_order: idx,
      }));
      const { error: iErr } = await sb.from("user_folder_items").insert(rows);
      if (iErr) return errResult(`Items copy failed (folder created): ${iErr.message}`);
    }

    return jsonResult(`Cloned to "${folder.name}" — ${items?.length ?? 0} items copied.`, {
      new_folder_id: folder.id, cloned_items: items?.length ?? 0,
    });
  },
});

export const reorderSheetItemsTool = defineTool({
  name: "reorder_sheet_items",
  title: "Reorder problems in a sheet (drag-drop equivalent)",
  description:
    "Set the exact order of problems in a sheet by passing slugs in the desired order. Any slug in the sheet but omitted from `order` is appended at the end preserving its relative order.",
  inputSchema: {
    folder_id: z.string().uuid(),
    order: z.array(z.string().min(1)).min(1).max(500),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ folder_id, order }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const { data: current, error: curErr } = await sb
      .from("user_folder_items")
      .select("question_slug, sort_order")
      .eq("folder_id", folder_id);
    if (curErr) return errResult(curErr.message);
    if (!current || current.length === 0) return errResult("Sheet is empty or not accessible.");

    const currentSet = new Set(current.map((r) => r.question_slug as string));
    const missing = order.filter((s) => !currentSet.has(s));
    const orderedInSheet = order.filter((s) => currentSet.has(s));
    const tail = current
      .filter((r) => !orderedInSheet.includes(r.question_slug as string))
      .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
      .map((r) => r.question_slug as string);
    const finalOrder = [...orderedInSheet, ...tail];

    // Apply new sort_order one slug at a time (small N, keeps RLS/audit clean).
    let updated = 0;
    for (let i = 0; i < finalOrder.length; i++) {
      const { error } = await sb
        .from("user_folder_items")
        .update({ sort_order: i })
        .eq("folder_id", folder_id)
        .eq("question_slug", finalOrder[i]);
      if (error) return errResult(`Reorder failed at slug "${finalOrder[i]}": ${error.message}`);
      updated++;
    }
    return jsonResult(
      `Reordered ${updated} items. Missing from sheet (ignored): ${missing.length}. Appended tail: ${tail.length}.`,
      { updated, missing, appended_tail: tail },
    );
  },
});

/* ─────────────  MEGA MEGA MEGA — publish_sheet_bundle  ─────────────
 * Single call: publishes N coding_problem bundles, creates (or reuses) a
 * sheet, adds all published slugs to it in given order, optionally publishes
 * a roadmap. Every step is best-effort — partial failures reported per slug.
 * ---------------------------------------------------------------------- */
export const publishSheetBundleTool = defineTool({
  name: "publish_sheet_bundle",
  title: "Publish coding problems + sheet + roadmap (mega)",
  description:
    "One-shot: publish an array of coding_problem bundles (problem + tests + starter + solutions), then create (or reuse) a sheet and add all successfully-published slugs in order, and optionally publish a roadmap. Returns per-slug outcome.",
  inputSchema: {
    sheet: z.object({
      name: z.string().min(2).max(120),
      description: z.string().max(2000).optional(),
      color: z.string().max(20).optional(),
      reuse_folder_id: z.string().uuid().optional().describe("If passed, add problems to this existing sheet instead of creating a new one."),
    }),
    problems: z
      .array(
        z.object({
          problem: z.object({
            slug: z.string(),
            title: z.string(),
            difficulty: z.string(),
            description: z.string(),
            topics: z.array(z.string()),
            examples: z.array(z.record(z.unknown())),
            constraints: z.array(z.string()).optional(),
            hints: z.array(z.string()).optional(),
            cpu_time_limit_sec: z.number().optional(),
            memory_limit_kb: z.number().int().optional(),
            mcq: z.record(z.unknown()).optional(),
            is_contest_pool: z.boolean().optional(),
          }),
          tests: z
            .array(
              z.object({
                input: z.string(),
                expected_output: z.string(),
                is_sample: z.boolean().optional(),
                weight: z.number().optional(),
              }),
            )
            .min(2),
          starter_code: z.array(z.object({ language: z.string(), code: z.string() })).optional(),
          solutions: z.array(z.object({ lang_id: z.string(), code: z.string() })).min(1),
        }),
      )
      .min(1)
      .max(50),
    if_exists: z.enum(["error", "update"]).optional(),
    roadmap: z
      .object({
        roadmap_id: z.string(),
        is_published: z.boolean().optional(),
        is_featured: z.boolean().optional(),
        sort_order: z.number().int().optional(),
      })
      .optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ sheet, problems, if_exists, roadmap }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;
    const uid = ctx.getUserId();

    // 1. Publish each bundle.
    const perProblem: Array<{ slug: string; ok: boolean; snapshotVersion?: number | null; error?: string }> = [];
    for (const p of problems) {
      const r = await publishBundleCore(sb, uid, {
        problem: p.problem,
        tests: p.tests,
        starter_code: p.starter_code,
        solutions: p.solutions,
        if_exists,
      });
      perProblem.push({ slug: r.slug, ok: r.ok, snapshotVersion: r.snapshotVersion, error: r.error });
    }
    const published = perProblem.filter((r) => r.ok).map((r) => r.slug);
    if (published.length === 0) {
      return errResult(`All bundles failed:\n${JSON.stringify(perProblem, null, 2)}`);
    }

    // 2. Create or reuse sheet.
    let folderId = sheet.reuse_folder_id;
    let folderName = sheet.name;
    if (!folderId) {
      const { data: folder, error: fErr } = await sb
        .from("user_folders")
        .insert({ user_id: uid, name: sheet.name, description: sheet.description, color: sheet.color })
        .select("id, name").single();
      if (fErr) return errResult(`Sheet create failed (bundles already published): ${fErr.message}`);
      folderId = folder.id;
      folderName = folder.name;
    } else {
      const { data: existing } = await sb.from("user_folders").select("name").eq("id", folderId).maybeSingle();
      folderName = existing?.name ?? folderName;
    }

    // 3. Skip already-present, insert rest at end.
    const { data: existingItems } = await sb
      .from("user_folder_items").select("question_slug, sort_order").eq("folder_id", folderId);
    const existingSet = new Set((existingItems ?? []).map((r) => r.question_slug as string));
    const maxOrder = (existingItems ?? []).reduce((m, r) => Math.max(m, r.sort_order as number), -1);
    const toInsert = published.filter((s) => !existingSet.has(s));
    if (toInsert.length > 0) {
      const rows = toInsert.map((slug, i) => ({
        folder_id: folderId,
        question_slug: slug,
        question_source: "parikshaa",
        sort_order: maxOrder + 1 + i,
      }));
      const { error: iErr } = await sb.from("user_folder_items").insert(rows);
      if (iErr) return errResult(`Add-to-sheet failed: ${iErr.message}`);
    }

    // 4. Roadmap (optional).
    let roadmapResult: unknown = null;
    if (roadmap) {
      const patch: Record<string, unknown> = { roadmap_id: roadmap.roadmap_id, updated_by: uid };
      if (roadmap.is_published !== undefined) patch.is_published = roadmap.is_published;
      if (roadmap.is_featured !== undefined) patch.is_featured = roadmap.is_featured;
      if (roadmap.sort_order !== undefined) patch.sort_order = roadmap.sort_order;
      const { data: rm, error: rErr } = await sb
        .from("roadmap_overrides").upsert(patch, { onConflict: "roadmap_id" }).select();
      roadmapResult = rErr ? { error: rErr.message } : rm;
    }

    return jsonResult(
      `Mega-published: ${published.length}/${problems.length} problems, sheet "${folderName}" (+${toInsert.length}), roadmap=${roadmap ? "yes" : "no"}.`,
      {
        folder_id: folderId,
        folder_name: folderName,
        published,
        failed: perProblem.filter((r) => !r.ok),
        added_to_sheet: toInsert.length,
        already_in_sheet: published.length - toInsert.length,
        roadmap: roadmapResult,
      },
    );
  },
});
