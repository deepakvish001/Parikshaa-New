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
