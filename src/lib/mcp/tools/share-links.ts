import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult, requireAdmin } from "./_shared";

const genToken = () =>
  (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)).replace(/-/g, "") +
  Math.random().toString(36).slice(2, 8);

const KNOWN_BUILTINS = new Set(["dbms-sheet", "cn-sheet", "os-sheet"]);

/* ────────── create_builtin_share_link ────────── */
export const createBuiltinShareLinkTool = defineTool({
  name: "create_builtin_share_link",
  title: "Create read-only share link for a built-in sheet",
  description:
    "Generate a public read-only share token for a built-in sheet slug (dbms-sheet, cn-sheet, os-sheet). Optionally include linked articles and set an expiry.",
  inputSchema: {
    slug: z.string().min(1),
    include_articles: z.boolean().optional().default(true),
    expires_in_hours: z.number().int().positive().optional(),
    label: z.string().optional(),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ slug, include_articles, expires_in_hours, label }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    if (!KNOWN_BUILTINS.has(slug))
      return errResult(`Unknown built-in slug "${slug}". Expected one of ${[...KNOWN_BUILTINS].join(", ")}.`);
    const token = genToken();
    const expires_at = expires_in_hours
      ? new Date(Date.now() + expires_in_hours * 3600_000).toISOString()
      : null;
    const { data, error } = await gate.sb
      .from("builtin_sheet_share_links")
      .insert({
        slug,
        token,
        include_articles: include_articles ?? true,
        expires_at,
        label: label ?? null,
        created_by: ctx.getUserId(),
      })
      .select("*")
      .single();
    if (error) return errResult(error.message);
    return jsonResult("Share link created.", {
      link: data,
      public_url: `/share/sheet/${token}`,
    });
  },
});

/* ────────── revoke_builtin_share_link ────────── */
export const revokeBuiltinShareLinkTool = defineTool({
  name: "revoke_builtin_share_link",
  title: "Revoke a built-in sheet share link",
  description: "Set revoked=true on the given share token so it stops resolving.",
  inputSchema: { token: z.string().min(1) },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ token }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const { data, error } = await gate.sb
      .from("builtin_sheet_share_links")
      .update({ revoked: true })
      .eq("token", token)
      .select("*")
      .single();
    if (error) return errResult(error.message);
    return jsonResult("Revoked.", { link: data });
  },
});

/* ────────── list_builtin_share_links ────────── */
export const listBuiltinShareLinksTool = defineTool({
  name: "list_builtin_share_links",
  title: "List built-in sheet share links",
  description: "List all share links (optionally filter by slug).",
  inputSchema: { slug: z.string().optional() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    let q = gate.sb.from("builtin_sheet_share_links").select("*").order("created_at", { ascending: false });
    if (slug) q = q.eq("slug", slug);
    const { data, error } = await q;
    if (error) return errResult(error.message);
    return jsonResult(`Found ${data?.length ?? 0} link(s).`, { links: data ?? [] });
  },
});

/* ────────── validate_share_link_access ────────── */
export const validateShareLinkAccessTool = defineTool({
  name: "validate_share_link_access",
  title: "Validate a share link",
  description:
    "Public: check whether a share token resolves. Returns the slug, include_articles flag, expiry, revoked state, and whether the caller can currently open it.",
  inputSchema: { token: z.string().min(1) },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ token }, ctx: ToolContext) => {
    const sb = createUserSupabaseClient(ctx);
    const { data, error } = await sb
      .from("builtin_sheet_share_links")
      .select("id, slug, include_articles, expires_at, revoked, view_count, label, created_at")
      .eq("token", token)
      .maybeSingle();
    if (error) return errResult(error.message);
    if (!data) return jsonResult("Not found.", { valid: false, reason: "no_such_token" });
    const expired = data.expires_at && new Date(data.expires_at) < new Date();
    const valid = !data.revoked && !expired;
    return jsonResult(valid ? "Valid." : "Invalid.", {
      valid,
      reason: data.revoked ? "revoked" : expired ? "expired" : "ok",
      link: data,
      public_url: `/share/sheet/${token}`,
    });
  },
});
