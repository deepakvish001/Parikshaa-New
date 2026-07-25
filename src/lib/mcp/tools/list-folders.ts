import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

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
 * list_folders — list the signed-in user's custom Parikshaa folders (from user_folders).
 * RLS scopes the result to the authenticated user.
 */
export default defineTool({
  name: "list_folders",
  title: "List my folders",
  description:
    "List the signed-in Parikshaa user's custom folders (name, description, color, timestamps). Scoped by RLS to the current user.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Max folders to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = createUserSupabaseClient(ctx);

    const { data, error } = await supabase
      .from("user_folders")
      .select("id, name, description, color, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit ?? 50);

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${data?.length ?? 0} folders:\n${JSON.stringify(data, null, 2)}`,
        },
      ],
      structuredContent: { folders: data ?? [] },
    };
  },
});
