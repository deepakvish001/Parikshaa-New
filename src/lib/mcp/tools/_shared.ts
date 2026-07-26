import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

const getEnv = (name: string) => {
  const deno = (globalThis as typeof globalThis & {
    Deno?: { env?: { get?: (key: string) => string | undefined } };
  }).Deno;
  return deno?.env?.get?.(name) ?? process.env[name];
};

export const createUserSupabaseClient = (ctx: ToolContext) => {
  const url = getEnv("SUPABASE_URL");
  const key = getEnv("SUPABASE_PUBLISHABLE_KEY") ?? getEnv("SUPABASE_ANON_KEY");
  if (!url || !key) throw new Error("Backend env missing SUPABASE_URL or anon key.");
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

export const jsonResult = (label: string, data: unknown) => ({
  content: [{ type: "text" as const, text: `${label}\n${JSON.stringify(data, null, 2)}` }],
  structuredContent: { data },
});

export const errResult = (msg: string) => ({
  content: [{ type: "text" as const, text: msg }],
  isError: true as const,
});

/**
 * Gate a write/admin tool to callers with `admin` or `owner` role.
 * Returns `{ ok: true, sb }` when allowed, or `{ ok: false, error }` to return directly.
 */
export const requireAdmin = async (ctx: ToolContext) => {
  if (!ctx.isAuthenticated()) {
    return { ok: false as const, error: errResult("Not authenticated") };
  }
  const sb = createUserSupabaseClient(ctx);
  const uid = ctx.getUserId();
  const [{ data: isAdmin }, { data: isOwner }] = await Promise.all([
    sb.rpc("has_role", { _user_id: uid, _role: "admin" }),
    sb.rpc("has_role", { _user_id: uid, _role: "owner" }),
  ]);
  if (!isAdmin && !isOwner) {
    return {
      ok: false as const,
      error: errResult(
        "Access denied: this MCP tool requires an 'admin' or 'owner' role. " +
          "Call ensure_admin_access first (OAuth-client tokens only) or ask an owner to grant the role.",
      ),
    };
  }
  return { ok: true as const, sb };
};
