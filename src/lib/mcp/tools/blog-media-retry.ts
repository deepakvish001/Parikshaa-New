import { defineTool } from "@lovable.dev/mcp-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errResult, jsonResult, requireAdmin } from "./_shared";

const decodeBase64 = (b64: string) => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isRlsError = (msg: string) =>
  /row-level security|permission denied|not authorized|unauthorized|403/i.test(msg);

type SbLike = Awaited<ReturnType<typeof requireAdmin>> extends { sb: infer S } ? S : never;

const attemptUpload = async (
  sb: NonNullable<SbLike>,
  path: string,
  bytes: Uint8Array,
  contentType: string,
  upsert = false,
) => {
  const { error } = await sb.storage.from("blog-media").upload(path, bytes, {
    contentType,
    upsert,
  });
  if (error) throw error;
  const { data: signed, error: sErr } = await sb.storage
    .from("blog-media")
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (sErr) throw sErr;
  return { path, signed_url: signed?.signedUrl };
};

/* ───────── upload_article_image_with_retry (in-tool exponential backoff) ───────── */
export const uploadArticleImageWithRetryTool = defineTool({
  name: "upload_article_image_with_retry",
  title: "Upload image with exponential-backoff retry + optional queue fallback",
  description:
    "Upload an image to blog-media. Retries on transient/RLS errors with exponential backoff (base 500ms, factor 2, max 6 tries by default). On persistent RLS failure, optionally enqueues the payload to `blog_media_upload_queue` so a background worker (`process_blog_media_upload_queue`) can retry once policies are fixed, and returns a clear structured error the publish flow can display.",
  inputSchema: {
    filename: z.string().min(1),
    base64: z.string().min(1),
    content_type: z.string().optional(),
    folder: z.string().optional(),
    max_attempts: z.number().int().min(1).max(10).optional(),
    base_delay_ms: z.number().int().min(50).max(5000).optional(),
    enqueue_on_failure: z.boolean().optional().default(true),
    target_post_slug: z.string().optional(),
    target_field: z.string().optional().describe("e.g. 'cover_image' or 'body_image'"),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async (input, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${input.folder ?? "articles"}/${Date.now()}-${safeName}`;
    const bytes = decodeBase64(input.base64);
    const contentType = input.content_type ?? "image/png";
    const maxAttempts = input.max_attempts ?? 6;
    const base = input.base_delay_ms ?? 500;

    const attempts: Array<{ n: number; ok: boolean; ms: number; error?: string }> = [];
    let lastError: Error | null = null;

    for (let n = 1; n <= maxAttempts; n++) {
      const t0 = Date.now();
      try {
        const res = await attemptUpload(sb, path, bytes, contentType);
        attempts.push({ n, ok: true, ms: Date.now() - t0 });
        return jsonResult(`Uploaded ${res.path} on attempt ${n}.`, {
          bucket: "blog-media",
          ...res,
          markdown: `![${input.filename}](${res.signed_url})`,
          attempts,
        });
      } catch (e) {
        lastError = e as Error;
        attempts.push({ n, ok: false, ms: Date.now() - t0, error: lastError.message });
        if (n < maxAttempts) {
          const delay = Math.min(30_000, base * 2 ** (n - 1)) + Math.floor(Math.random() * 200);
          await sleep(delay);
        }
      }
    }

    const msg = lastError?.message ?? "unknown error";
    const rls = isRlsError(msg);

    let queueId: string | undefined;
    if (input.enqueue_on_failure !== false) {
      const { data, error } = await sb
        .from("blog_media_upload_queue")
        .insert({
          requested_by: ctx.getUserId(),
          file_name: safeName,
          folder: input.folder ?? "articles",
          content_type: contentType,
          base64_data: input.base64,
          target_post_slug: input.target_post_slug ?? null,
          target_field: input.target_field ?? null,
          max_attempts: 8,
          last_error: msg,
        })
        .select("id")
        .single();
      if (!error) queueId = data?.id as string;
    }

    return errResult(
      [
        rls
          ? "Image upload blocked by blog-media RLS policy after retries."
          : `Image upload failed after ${maxAttempts} attempts: ${msg}`,
        queueId
          ? `Queued for background retry (id=${queueId}). Fix bucket policies, then call \`process_blog_media_upload_queue\`.`
          : "Not enqueued (enqueue_on_failure=false).",
        `Attempts trace: ${JSON.stringify(attempts)}`,
      ].join("\n"),
    );
  },
});

/* ───────── process_blog_media_upload_queue (worker) ───────── */
export const processBlogMediaUploadQueueTool = defineTool({
  name: "process_blog_media_upload_queue",
  title: "Process pending blog-media upload retries",
  description:
    "Background-worker style tool. Fetches pending queue entries whose `next_attempt_at` has passed, retries them, updates status, and — when `target_post_slug` + `target_field` are set — patches the blog_posts row with the new signed URL. Returns per-entry outcomes. Safe to call repeatedly (idempotent per-row via attempts counter).",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().default(10),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const { data: rows, error } = await sb
      .from("blog_media_upload_queue")
      .select("*")
      .eq("status", "pending")
      .lte("next_attempt_at", new Date().toISOString())
      .order("next_attempt_at", { ascending: true })
      .limit(limit ?? 10);
    if (error) return errResult(`fetch queue: ${error.message}`);

    const outcomes: unknown[] = [];
    for (const row of rows ?? []) {
      const r = row as Record<string, unknown>;
      const attempts = ((r.attempts as number) ?? 0) + 1;
      const maxA = (r.max_attempts as number) ?? 8;
      const safeName = (r.file_name as string).replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${r.folder}/${Date.now()}-${safeName}`;
      const bytes = decodeBase64(r.base64_data as string);

      try {
        const res = await attemptUpload(sb, path, bytes, r.content_type as string);

        // Optional: patch the target post
        if (r.target_post_slug && r.target_field) {
          const patch: Record<string, unknown> = {
            [r.target_field as string]: res.signed_url,
            updated_at: new Date().toISOString(),
          };
          await sb.from("blog_posts").update(patch).eq("slug", r.target_post_slug);
        }

        await sb
          .from("blog_media_upload_queue")
          .update({
            status: "succeeded",
            attempts,
            resolved_path: res.path,
            resolved_signed_url: res.signed_url,
            last_error: null,
          })
          .eq("id", r.id as string);

        outcomes.push({ id: r.id, ok: true, path: res.path, signed_url: res.signed_url });
      } catch (e) {
        const msg = (e as Error).message;
        const dead = attempts >= maxA;
        const delayMs = Math.min(60 * 60 * 1000, 1000 * 2 ** attempts);
        const next = new Date(Date.now() + delayMs).toISOString();
        await sb
          .from("blog_media_upload_queue")
          .update({
            status: dead ? "dead" : "pending",
            attempts,
            last_error: msg,
            next_attempt_at: next,
          })
          .eq("id", r.id as string);
        outcomes.push({ id: r.id, ok: false, attempts, dead, error: msg, next_attempt_at: next });
      }
    }

    return jsonResult(`Processed ${outcomes.length} queue entries.`, {
      processed: outcomes.length,
      outcomes,
    });
  },
});

/* ───────── list_blog_media_upload_queue ───────── */
export const listBlogMediaUploadQueueTool = defineTool({
  name: "list_blog_media_upload_queue",
  title: "List queued blog-media upload retries",
  description: "Inspect the retry queue. Filter by status.",
  inputSchema: {
    status: z.enum(["pending", "succeeded", "failed", "dead"]).optional(),
    limit: z.number().int().min(1).max(200).optional().default(50),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;
    let q = sb
      .from("blog_media_upload_queue")
      .select(
        "id,file_name,folder,status,attempts,max_attempts,last_error,next_attempt_at,resolved_path,resolved_signed_url,target_post_slug,target_field,created_at,updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return errResult(`list: ${error.message}`);
    return jsonResult(`${data?.length ?? 0} entries.`, { entries: data });
  },
});
