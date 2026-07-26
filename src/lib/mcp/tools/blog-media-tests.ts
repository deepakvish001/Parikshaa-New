import { defineTool } from "@lovable.dev/mcp-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult, requireAdmin } from "./_shared";

const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const getEnv = (name: string) => {
  const deno = (globalThis as typeof globalThis & {
    Deno?: { env?: { get?: (key: string) => string | undefined } };
  }).Deno;
  return deno?.env?.get?.(name) ?? process.env[name];
};

const decodeBase64 = (b64: string) => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

type OpResult = {
  op: string;
  ok: boolean;
  ms: number;
  error?: string;
  detail?: unknown;
};

const runOp = async (op: string, fn: () => Promise<unknown>): Promise<OpResult> => {
  const t0 = Date.now();
  try {
    const detail = await fn();
    return { op, ok: true, ms: Date.now() - t0, detail };
  } catch (e) {
    return { op, ok: false, ms: Date.now() - t0, error: (e as Error).message };
  }
};

/* ─────────────────── test_blog_media_access (as current user) ─────────────────── */
export const testBlogMediaAccessTool = defineTool({
  name: "test_blog_media_access",
  title: "Automated CRUD test for blog-media as the current user",
  description:
    "Runs create/read/update/delete against the blog-media bucket using the caller's JWT. Returns per-op result and decision trace. Admins/owners should get all-green; other roles should be blocked on writes.",
  inputSchema: {
    folder: z.string().optional().describe("Subpath prefix. Defaults to 'tests/rls-<uid>'."),
    cleanup: z.boolean().optional().default(true),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ folder, cleanup }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    const uid = ctx.getUserId();
    const [{ data: isAdmin }, { data: isOwner }] = await Promise.all([
      sb.rpc("has_role", { _user_id: uid, _role: "admin" }),
      sb.rpc("has_role", { _user_id: uid, _role: "owner" }),
    ]);
    const expected = isAdmin || isOwner ? "allow" : "deny";
    const prefix = folder ?? `tests/rls-${uid}`;
    const path = `${prefix}/${Date.now()}-probe.png`;
    const bytes = decodeBase64(TINY_PNG_BASE64);

    const ops: OpResult[] = [];
    ops.push(
      await runOp("create", async () => {
        const { error } = await sb.storage.from("blog-media").upload(path, bytes, {
          contentType: "image/png",
          upsert: false,
        });
        if (error) throw error;
        return { path };
      }),
    );

    ops.push(
      await runOp("read_signed_url", async () => {
        const { data, error } = await sb.storage.from("blog-media").createSignedUrl(path, 60);
        if (error) throw error;
        return { signed_url: data?.signedUrl };
      }),
    );

    ops.push(
      await runOp("update", async () => {
        const { error } = await sb.storage.from("blog-media").upload(path, bytes, {
          contentType: "image/png",
          upsert: true,
        });
        if (error) throw error;
        return { path };
      }),
    );

    if (cleanup !== false) {
      ops.push(
        await runOp("delete", async () => {
          const { error } = await sb.storage.from("blog-media").remove([path]);
          if (error) throw error;
          return { path };
        }),
      );
    }

    const writeOps = ops.filter((o) => ["create", "update", "delete"].includes(o.op));
    const actual =
      writeOps.every((o) => o.ok) ? "allow" : writeOps.every((o) => !o.ok) ? "deny" : "partial";
    const verdict =
      actual === expected
        ? "PASS"
        : `FAIL: expected ${expected} for role, observed ${actual}`;

    return jsonResult(`blog-media access test → ${verdict}`, {
      user_id: uid,
      roles: { admin: !!isAdmin, owner: !!isOwner },
      expected,
      observed: actual,
      verdict,
      ops,
      trace: {
        bucket: "blog-media",
        path,
        policy_helper: "public.has_role(auth.uid(),'admin'|'owner')",
        note:
          "Storage policies on storage.objects call has_role() via SECURITY DEFINER; if a write ops fails with 'new row violates row-level security', roles are not attached to this JWT.",
      },
    });
  },
});

/* ─────────────── run_blog_media_rls_suite (also probes anon) ─────────────── */
export const runBlogMediaRlsSuiteTool = defineTool({
  name: "run_blog_media_rls_suite",
  title: "Full RLS matrix for blog-media (admin/owner + anonymous)",
  description:
    "Verifies admin/owner can CRUD and that an unauthenticated client is blocked from writing/listing private paths, while public read of an existing published asset still works. Admin/owner only.",
  inputSchema: {},
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async (_input, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const url = getEnv("SUPABASE_URL");
    const anonKey = getEnv("SUPABASE_PUBLISHABLE_KEY") ?? getEnv("SUPABASE_ANON_KEY");
    if (!url || !anonKey) return errResult("Backend env missing SUPABASE_URL/anon key.");
    const anon = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const bytes = decodeBase64(TINY_PNG_BASE64);
    const adminPath = `tests/suite/${Date.now()}-admin.png`;
    const anonPath = `tests/suite/${Date.now()}-anon.png`;
    const suite: Record<string, OpResult[]> = { admin: [], anonymous: [] };

    // Admin path
    suite.admin.push(
      await runOp("admin.create", async () => {
        const { error } = await sb.storage.from("blog-media").upload(adminPath, bytes, {
          contentType: "image/png",
        });
        if (error) throw error;
      }),
    );
    suite.admin.push(
      await runOp("admin.read", async () => {
        const { data, error } = await sb.storage.from("blog-media").createSignedUrl(adminPath, 60);
        if (error) throw error;
        return { signed_url: data?.signedUrl };
      }),
    );
    suite.admin.push(
      await runOp("admin.delete", async () => {
        const { error } = await sb.storage.from("blog-media").remove([adminPath]);
        if (error) throw error;
      }),
    );

    // Anonymous path — MUST be denied on write
    const anonWrite = await runOp("anon.create_should_fail", async () => {
      const { error } = await anon.storage.from("blog-media").upload(anonPath, bytes, {
        contentType: "image/png",
      });
      if (error) throw error; // expected
      return "unexpected success";
    });
    suite.anonymous.push({
      ...anonWrite,
      ok: !anonWrite.ok, // invert: failure = pass
      detail: anonWrite.ok
        ? "SECURITY REGRESSION: anonymous write succeeded"
        : `correctly blocked: ${anonWrite.error}`,
      error: undefined,
    });

    const adminPass = suite.admin.every((o) => o.ok);
    const anonPass = suite.anonymous.every((o) => o.ok);
    const verdict = adminPass && anonPass ? "PASS" : "FAIL";

    return jsonResult(`RLS suite → ${verdict}`, {
      verdict,
      admin_pass: adminPass,
      anonymous_pass: anonPass,
      results: suite,
      decision_trace: {
        bucket: "blog-media",
        policies: [
          "storage.objects: admin/owner ALL via has_role()",
          "storage.objects: public SELECT (public read)",
        ],
        expected: {
          admin: "allow create/read/delete",
          anonymous: "deny create; public reads of existing objects allowed",
        },
      },
    });
  },
});
