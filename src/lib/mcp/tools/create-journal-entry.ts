import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

export default defineTool({
  name: "create_journal_entry",
  title: "Create DSA journal entry",
  description: "Log a solved / attempted problem to the practice journal.",
  inputSchema: {
    title: z.string().min(1).max(200),
    topic: z.string().optional(),
    pattern: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    time_taken_min: z.number().int().min(0).optional(),
    solved_clean: z.boolean().optional(),
    notes_md: z.string().optional(),
    status: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    const { data, error } = await sb
      .from("practice_journal_entries")
      .insert({ user_id: ctx.getUserId(), ...input })
      .select()
      .single();
    if (error) return errResult(error.message);
    return jsonResult("Entry created:", data);
  },
});
