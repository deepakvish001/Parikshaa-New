import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

export default defineTool({
  name: "add_folder_item",
  title: "Add item to folder",
  description: "Save an item (question/problem) to one of the user's folders.",
  inputSchema: {
    folder_id: z.string().uuid(),
    item_type: z.string().min(1).describe("e.g. 'dsa', 'sql', 'interview', 'coding-problem'"),
    item_id: z.string().min(1).describe("Slug or UUID of the item."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ folder_id, item_type, item_id }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    const { data, error } = await sb
      .from("user_folder_items")
      .insert({ folder_id, item_type, item_id })
      .select()
      .single();
    if (error) return errResult(error.message);
    return jsonResult("Item added:", data);
  },
});
