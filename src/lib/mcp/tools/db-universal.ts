import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errResult, jsonResult, requireAdmin } from "./_shared";

const tableSchema = z.string().min(1).max(64).regex(/^[a-z_][a-z0-9_]*$/, "Invalid table name");
const filterSchema = z
  .record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
  .optional()
  .describe("Equality filters: { column: value }. RLS scopes results to the signed-in user.");

export const dbSelectTool = defineTool({
  name: "db_select",
  title: "Query any table",
  description:
    "SELECT from any public table. RLS scopes results to the signed-in user. Use for reading ANY feature's data (quizzes, goals, folders, journal, contests, achievements, notifications, resume, outreach, blog, jobs, ratings, etc.).",
  inputSchema: {
    table: tableSchema,
    columns: z.string().optional().describe("Comma-separated columns (default '*')."),
    filters: filterSchema,
    order_by: z.string().optional().describe("Column name to order by."),
    ascending: z.boolean().optional(),
    limit: z.number().int().min(1).max(500).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ table, columns, filters, order_by, ascending, limit }, ctx: ToolContext) => {
    const _gate = await requireAdmin(ctx);
    if (!_gate.ok) return _gate.error;
    const sb = _gate.sb;
    let q = sb.from(table).select(columns ?? "*").limit(limit ?? 50);
    if (filters) for (const [k, v] of Object.entries(filters)) q = q.eq(k, v as never);
    if (order_by) q = q.order(order_by, { ascending: ascending ?? false });
    const { data, error } = await q;
    if (error) return errResult(`${error.code ?? ""} ${error.message}`);
    return jsonResult(`Found ${data?.length ?? 0} rows in ${table}:`, data);
  },
});

export const dbInsertTool = defineTool({
  name: "db_insert",
  title: "Insert into any table",
  description:
    "INSERT rows into any public table. RLS's WITH CHECK enforces ownership — if user_id is required, set it to the signed-in user's id (returned by whoami).",
  inputSchema: {
    table: tableSchema,
    values: z.record(z.unknown()).describe("Column → value object for the new row."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ table, values }, ctx: ToolContext) => {
    const _gate = await requireAdmin(ctx);
    if (!_gate.ok) return _gate.error;
    const sb = _gate.sb;
    const { data, error } = await sb.from(table).insert(values as never).select();
    if (error) return errResult(`${error.code ?? ""} ${error.message}`);
    return jsonResult(`Inserted into ${table}:`, data);
  },
});

export const dbUpdateTool = defineTool({
  name: "db_update",
  title: "Update rows in any table",
  description:
    "UPDATE rows in any public table matching the given filters. RLS restricts which rows can be modified.",
  inputSchema: {
    table: tableSchema,
    filters: z
      .record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
      .describe("Equality filters selecting which rows to update. Required to prevent full-table updates."),
    values: z.record(z.unknown()).describe("Columns → new values."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ table, filters, values }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    if (!filters || Object.keys(filters).length === 0)
      return errResult("Refusing to update without filters.");
    const sb = createUserSupabaseClient(ctx);
    let q = sb.from(table).update(values as never);
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v as never);
    const { data, error } = await q.select();
    if (error) return errResult(`${error.code ?? ""} ${error.message}`);
    return jsonResult(`Updated ${data?.length ?? 0} rows in ${table}:`, data);
  },
});

export const dbDeleteTool = defineTool({
  name: "db_delete",
  title: "Delete rows from any table",
  description:
    "DELETE rows from any public table matching the given filters. RLS restricts which rows can be deleted. Filters are required.",
  inputSchema: {
    table: tableSchema,
    filters: z
      .record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
      .describe("Equality filters selecting which rows to delete. Required."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ table, filters }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) return errResult("Not authenticated");
    if (!filters || Object.keys(filters).length === 0)
      return errResult("Refusing to delete without filters.");
    const sb = createUserSupabaseClient(ctx);
    let q = sb.from(table).delete();
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v as never);
    const { data, error } = await q.select();
    if (error) return errResult(`${error.code ?? ""} ${error.message}`);
    return jsonResult(`Deleted ${data?.length ?? 0} rows from ${table}:`, data);
  },
});
