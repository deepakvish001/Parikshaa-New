import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

export default defineTool({
  name: "list_folder_items",
  title: "List folder items",
  description: "Items saved inside a specific folder owned by the signed-in user.",
  inputSchema: {
    folder_id: z.string().uuid().describe("Folder UUID (from list_folders)."),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ folder_id, limit }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    const { data, error } = await sb
      .from("user_folder_items")
      .select("*")
      .eq("folder_id", folder_id)
      .order("created_at", { ascending: false })
      .limit(limit ?? 100);
    if (error) return errResult(error.message);
    return jsonResult(`Found ${data?.length ?? 0} items:`, data);
  },
});
