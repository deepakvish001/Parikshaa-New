import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createUserSupabaseClient, errResult, jsonResult } from "./_shared";

const OPS = ["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "in", "is", "contains", "cs", "cd"] as const;

export const dbQueryTool = defineTool({
  name: "db_query",
  title: "Advanced query on any table",
  description:
    "Advanced SELECT with rich filter operators (eq, neq, gt, gte, lt, lte, like, ilike, in, is, contains). RLS applies — as admin/owner you can read across users where policies allow. Use this instead of db_select when you need range, pattern, or IN filters.",
  inputSchema: {
    table: z.string().min(1).max(64).regex(/^[a-z_][a-z0-9_]*$/),
    columns: z.string().optional(),
    filters: z
      .array(
        z.object({
          column: z.string(),
          op: z.enum(OPS),
          value: z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.union([z.string(), z.number()]))]),
        }),
      )
      .optional(),
    order_by: z.string().optional(),
    ascending: z.boolean().optional(),
    limit: z.number().int().min(1).max(1000).optional(),
    offset: z.number().int().min(0).optional(),
    count: z.enum(["exact", "planned", "estimated"]).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ table, columns, filters, order_by, ascending, limit, offset, count }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    const sb = createUserSupabaseClient(ctx);
    let q: any = sb.from(table).select(columns ?? "*", count ? { count } : undefined);
    for (const f of filters ?? []) {
      q = (q as any)[f.op](f.column, f.value as never);
    }
    if (order_by) q = q.order(order_by, { ascending: ascending ?? false });
    const lim = limit ?? 100;
    const off = offset ?? 0;
    q = q.range(off, off + lim - 1);
    const { data, error, count: total } = await q;
    if (error) return errResult(`${error.code ?? ""} ${error.message}`);
    return jsonResult(`Found ${data?.length ?? 0} rows${total != null ? ` (total ${total})` : ""} in ${table}:`, data);
  },
});
