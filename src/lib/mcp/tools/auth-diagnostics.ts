import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";
import { cacheGet, cacheKey, cacheSet } from "./_cache";
import { dbmsSections, dbmsMeta } from "../../../data/dbmsData";
import { cnSections, cnMeta } from "../../../data/cnData";
import { osSections, osMeta } from "../../../data/osData";
import type { Section } from "../../../data/dsaLevel1Types";

type BuiltinDef = { slug: string; route: string; title: string; sections: Section[] };
const BUILTINS: BuiltinDef[] = [
  { slug: "dbms-sheet", route: "/learn/sheets/dbms-sheet", title: dbmsMeta.title, sections: dbmsSections },
  { slug: "cn-sheet", route: "/learn/sheets/cn-sheet", title: cnMeta.title, sections: cnSections },
  { slug: "os-sheet", route: "/learn/sheets/os-sheet", title: osMeta.title, sections: osSections },
];

async function getRoles(ctx: ToolContext) {
  const sb = createUserSupabaseClient(ctx);
  const uid = ctx.getUserId();
  const [{ data: isAdmin }, { data: isOwner }] = await Promise.all([
    sb.rpc("has_role", { _user_id: uid, _role: "admin" }),
    sb.rpc("has_role", { _user_id: uid, _role: "owner" }),
  ]);
  return { sb, uid, isAdmin: Boolean(isAdmin), isOwner: Boolean(isOwner) };
}

// -------------------- 1) Sheet access matrix --------------------
export const sheetAccessMatrixTool = defineTool({
  name: "sheet_access_matrix",
  title: "Sheet access matrix",
  description:
    "List every built-in sheet slug (DBMS / CN / OS) and whether the current caller can read it, with the RLS decision reason for each row.",
  inputSchema: {
    include_overrides_check: z
      .boolean()
      .optional()
      .describe("Also probe builtin_sheet_overrides read access per slug. Defaults to true."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ include_overrides_check }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const { sb, uid, isAdmin, isOwner } = await getRoles(ctx);
    const checkOverrides = include_overrides_check ?? true;

    const rows = [];
    for (const b of BUILTINS) {
      const row: Record<string, unknown> = {
        slug: b.slug,
        title: b.title,
        route: b.route,
        source: "static-frontend",
        can_read: true, // static bundle — always readable to any authed caller
        reason:
          "Static frontend data bundled with the app. Any signed-in user can read via get_builtin_sheet.",
      };
      if (checkOverrides) {
        const { data, error } = await sb
          .from("builtin_sheet_overrides")
          .select("slug")
          .eq("slug", b.slug)
          .maybeSingle();
        row.overrides_readable = !error;
        row.overrides_present = Boolean(data);
        row.overrides_error = error?.message ?? null;
      }
      rows.push(row);
    }

    return jsonResult(`Access matrix for ${rows.length} built-in sheet(s).`, {
      caller: { auth_uid: uid, is_admin: isAdmin, is_owner: isOwner, can_write: isAdmin || isOwner },
      sheets: rows,
    });
  },
});

// -------------------- 2) Auth-debug log for a failed read --------------------
export const debugMcpReadFailureTool = defineTool({
  name: "debug_mcp_read_failure",
  title: "Debug MCP read failure",
  description:
    "Explain the RLS/authorization decision path for a failed read: given a table + optional row filter (or a built-in sheet slug), report the requested resource, caller identity, roles, and the likely policy path that blocked it.",
  inputSchema: {
    resource_kind: z
      .enum(["table", "builtin_sheet", "user_folder", "topic_article"])
      .describe("Category of resource that returned empty/denied."),
    resource: z.string().min(1).describe("Table name, sheet slug, folder id, or article slug."),
    filter: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
      .optional()
      .describe("Optional column=value filter to re-run and observe."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ resource_kind, resource, filter }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated (no OAuth token).");
    const { sb, uid, isAdmin, isOwner } = await getRoles(ctx);
    const steps: string[] = [];
    steps.push(`caller auth.uid()=${uid}, is_admin=${isAdmin}, is_owner=${isOwner}`);

    let probe: { ok: boolean; error: string | null; count: number | null } = {
      ok: false,
      error: null,
      count: null,
    };
    let policyPath: string[] = [];

    if (resource_kind === "builtin_sheet") {
      const b = BUILTINS.find((x) => x.slug === resource.trim().toLowerCase());
      probe = { ok: Boolean(b), error: b ? null : "unknown builtin slug", count: b ? 1 : 0 };
      policyPath = [
        "resource type: static-frontend bundle (no RLS)",
        b ? "found in BUILTIN_SHEETS map → readable" : "slug not in BUILTIN_SHEETS map → 404-equivalent",
      ];
    } else {
      let q = sb.from(resource).select("*", { count: "exact", head: true });
      if (filter) for (const [k, v] of Object.entries(filter)) q = q.eq(k, v as never);
      const { error, count } = await q;
      probe = { ok: !error, error: error?.message ?? null, count: count ?? null };

      if (resource_kind === "user_folder") {
        policyPath = [
          "table: public.user_folders",
          "policy: 'Users can view their own folders' USING (user_id = auth.uid())",
          "policy: 'Admins can view all' USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner'))",
          isAdmin || isOwner
            ? "→ admin/owner branch should allow; if blocked, check RLS enabled + row exists"
            : "→ caller is not admin/owner; only rows where user_id = auth.uid() are visible",
        ];
      } else if (resource_kind === "topic_article") {
        policyPath = [
          "table: topic_articles (published articles readable to authenticated)",
          "draft/archived: admin/owner only",
          isAdmin || isOwner ? "→ admin/owner: full read" : "→ non-admin: only status='published' visible",
        ];
      } else {
        policyPath = [
          `table: public.${resource}`,
          "Inspect via db_query('SELECT policyname, cmd, qual FROM pg_policies WHERE tablename=$1', [resource])",
          isAdmin || isOwner ? "caller has admin/owner role" : "caller has only 'authenticated' role",
        ];
      }
    }

    return jsonResult(`Auth-debug log for ${resource_kind}:${resource}`, {
      requested_resource: { kind: resource_kind, id: resource, filter: filter ?? null },
      caller: { auth_uid: uid, is_admin: isAdmin, is_owner: isOwner },
      probe_result: probe,
      rls_decision_path: policyPath,
      steps,
      hint:
        probe.ok && (probe.count ?? 0) > 0
          ? "Read succeeded at DB level; if the tool still returned empty, check tool-side filters."
          : "Read denied or empty. Verify the row exists and that a policy grants the caller's role.",
    });
  },
});

// -------------------- 3) Verify article access for a sheet --------------------
export const verifySheetArticleAccessTool = defineTool({
  name: "verify_sheet_article_access",
  title: "Verify sheet article read access",
  description:
    "For every topic_article linked to the given sheet slug, check whether the current caller can read it. Returns blocked articles with the reason (draft/archived, RLS, missing link).",
  inputSchema: {
    sheet_slug: z.string().min(1).describe("Sheet slug, e.g. dbms-sheet."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ sheet_slug }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const { sb, uid, isAdmin, isOwner } = await getRoles(ctx);
    const slug = sheet_slug.trim().toLowerCase();

    // Articles linked via tags array containing the sheet slug.
    const { data: articles, error } = await sb
      .from("topic_articles")
      .select("slug, title, status, tags, sheet_slug, section_title")
      .or(`sheet_slug.eq.${slug},tags.cs.{${slug}}`);

    if (error) {
      return jsonResult(`Could not list articles for ${slug}: ${error.message}`, {
        sheet_slug: slug,
        caller: { auth_uid: uid, is_admin: isAdmin, is_owner: isOwner },
        error: error.message,
      });
    }

    const linked = articles ?? [];
    const results = linked.map((a: { slug: string; title: string; status: string }) => {
      const status = String(a.status ?? "unknown");
      const canRead = status === "published" || isAdmin || isOwner;
      return {
        slug: a.slug,
        title: a.title,
        status,
        can_read: canRead,
        blocked_reason: canRead
          ? null
          : status === "draft"
            ? "Draft article — only admin/owner can read."
            : status === "archived"
              ? "Archived — only admin/owner can read."
              : `Status '${status}' not visible to non-admin caller.`,
      };
    });

    const blocked = results.filter((r) => !r.can_read);
    return jsonResult(
      `Checked ${results.length} article(s) linked to ${slug}. ${blocked.length} blocked.`,
      {
        sheet_slug: slug,
        caller: { auth_uid: uid, is_admin: isAdmin, is_owner: isOwner },
        total: results.length,
        readable: results.length - blocked.length,
        blocked,
        all: results,
      },
    );
  },
});
