import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

const getEnv = (name: string) => {
  const deno = (globalThis as typeof globalThis & {
    Deno?: { env?: { get?: (key: string) => string | undefined } };
  }).Deno;
  const denoValue = deno?.env?.get?.(name);
  if (denoValue) return denoValue;
  return process.env[name];
};

const createUserSupabaseClient = (ctx: ToolContext) => {
  const supabaseUrl = getEnv("SUPABASE_URL");
  const supabaseKey = getEnv("SUPABASE_PUBLISHABLE_KEY") ?? getEnv("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Backend environment is missing SUPABASE_URL or anon key.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

/**
 * whoami — returns the signed-in user's id, email, and (if available) their profile.
 * Verifies the OAuth token flow is working end-to-end.
 */
export default defineTool({
  name: "whoami",
  title: "Who am I",
  description:
    "Return the signed-in Parikshaa user's id, email, and profile summary. Use this to confirm the MCP connection is authenticated.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const userId = ctx.getUserId();
    const email = ctx.getUserEmail() ?? null;

    const supabase = createUserSupabaseClient(ctx);

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("user_id", userId!)
      .maybeSingle();

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    const payload = { user_id: userId, email, profile: profile ?? null };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
