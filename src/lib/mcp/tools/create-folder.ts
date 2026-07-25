import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

export default defineTool({
  name: "create_folder",
  title: "Create folder",
  description: "Create a new custom folder for the signed-in user.",
  inputSchema: {
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    color: z.string().max(20).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ name, description, color }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    const { data, error } = await sb
      .from("user_folders")
      .insert({ user_id: ctx.getUserId(), name, description, color })
      .select()
      .single();
    if (error) return errResult(error.message);
    return jsonResult("Folder created:", data);
  },
});
