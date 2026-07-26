import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

export const invokeEdgeFunctionTool = defineTool({
  name: "invoke_edge_function",
  title: "Invoke an edge function",
  description:
    "Call any deployed Supabase edge function as the signed-in user. Use for run-code, admin utilities, integrations, etc. The function receives the caller's JWT via Authorization header.",
  inputSchema: {
    name: z.string().min(1).max(128),
    body: z.unknown().optional(),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional(),
  },
  annotations: { readOnlyHint: false, openWorldHint: true },
  handler: async ({ name, body, method }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    const { data, error } = await sb.functions.invoke(name, {
      body: body as never,
      method: method as never,
    });
    if (error) return errResult(`${error.name ?? "FunctionError"}: ${error.message}`);
    return jsonResult(`Edge function ${name} returned:`, data);
  },
});
