import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errResult, jsonResult, requireAdmin } from "./_shared";

const bucket = z.string().min(1).max(128);

export const storageListTool = defineTool({
  name: "storage_list",
  title: "List files in a storage bucket",
  description: "List files/folders inside a Supabase Storage bucket path. Bucket RLS applies.",
  inputSchema: {
    bucket,
    path: z.string().optional(),
    limit: z.number().int().min(1).max(1000).optional(),
    offset: z.number().int().min(0).optional(),
    search: z.string().optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ bucket, path, limit, offset, search }, ctx: ToolContext) => {
    const _gate = await requireAdmin(ctx);
    if (!_gate.ok) return _gate.error;
    const sb = _gate.sb;
    const { data, error } = await sb.storage.from(bucket).list(path ?? "", { limit: limit ?? 100, offset: offset ?? 0, search });
    if (error) return errResult(error.message);
    return jsonResult(`Found ${data?.length ?? 0} entries in ${bucket}/${path ?? ""}:`, data);
  },
});

export const storageUploadTool = defineTool({
  name: "storage_upload",
  title: "Upload a file to storage",
  description: "Upload text or base64 content to a storage bucket path. Use `encoding: base64` for binary; otherwise text is stored as UTF-8.",
  inputSchema: {
    bucket,
    path: z.string().min(1),
    content: z.string(),
    encoding: z.enum(["utf8", "base64"]).optional(),
    content_type: z.string().optional(),
    upsert: z.boolean().optional(),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ bucket, path, content, encoding, content_type, upsert }, ctx: ToolContext) => {
    const _gate = await requireAdmin(ctx);
    if (!_gate.ok) return _gate.error;
    const sb = _gate.sb;
    let bytes: Uint8Array;
    if (encoding === "base64") {
      const bin = atob(content);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } else {
      bytes = new TextEncoder().encode(content);
    }
    const { data, error } = await sb.storage.from(bucket).upload(path, bytes, {
      contentType: content_type ?? (encoding === "base64" ? "application/octet-stream" : "text/plain"),
      upsert: upsert ?? true,
    });
    if (error) return errResult(error.message);
    return jsonResult(`Uploaded to ${bucket}/${path}:`, data);
  },
});

export const storageDeleteTool = defineTool({
  name: "storage_delete",
  title: "Delete files from storage",
  description: "Delete one or more files by path from a bucket.",
  inputSchema: { bucket, paths: z.array(z.string().min(1)).min(1) },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ bucket, paths }, ctx: ToolContext) => {
    const _gate = await requireAdmin(ctx);
    if (!_gate.ok) return _gate.error;
    const sb = _gate.sb;
    const { data, error } = await sb.storage.from(bucket).remove(paths);
    if (error) return errResult(error.message);
    return jsonResult(`Deleted ${data?.length ?? 0} objects from ${bucket}:`, data);
  },
});

export const storageSignedUrlTool = defineTool({
  name: "storage_signed_url",
  title: "Create a signed URL for a stored file",
  description: "Return a time-limited signed URL for downloading a file from a private bucket.",
  inputSchema: {
    bucket,
    path: z.string().min(1),
    expires_in_seconds: z.number().int().min(60).max(60 * 60 * 24 * 7).optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ bucket, path, expires_in_seconds }, ctx: ToolContext) => {
    const _gate = await requireAdmin(ctx);
    if (!_gate.ok) return _gate.error;
    const sb = _gate.sb;
    const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, expires_in_seconds ?? 3600);
    if (error) return errResult(error.message);
    return jsonResult(`Signed URL for ${bucket}/${path}:`, data);
  },
});
