import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errResult, jsonResult, requireAdmin } from "./_shared";

/* ────────────────────────  TOPIC ARTICLE LINKING  ────────────────────────
 * Long-form resource articles for sheet topics (DBMS, CN, OS, ...) are stored
 * as `blog_posts`. Linkage to a sheet section is done via two `blog_tags`
 * attached to the post:
 *
 *   sheet-<folder_id>        → identifies the sheet (user_folder)
 *   topic-<section-slug>     → identifies the section inside that sheet
 *
 * Querying articles for a sheet+topic = intersect posts that have both tags.
 * No schema migration required.
 * -------------------------------------------------------------------------- */

const kebab = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const sheetTagSlug = (folderId: string) => `sheet-${folderId}`;
const topicTagSlug = (sectionSlug: string) => `topic-${sectionSlug}`;

async function ensureTag(sb: any, slug: string, name: string): Promise<string> {
  const { data: existing } = await sb.from("blog_tags").select("id").eq("slug", slug).maybeSingle();
  if (existing?.id) return existing.id;
  const { data, error } = await sb.from("blog_tags").insert({ slug, name }).select("id").single();
  if (error) throw new Error(`tag ${slug}: ${error.message}`);
  return data.id;
}

async function attachTag(sb: any, postId: string, tagId: string) {
  await sb.from("blog_post_tags").upsert({ post_id: postId, tag_id: tagId }, { onConflict: "post_id,tag_id" });
}

async function detachTag(sb: any, postId: string, tagId: string) {
  await sb.from("blog_post_tags").delete().eq("post_id", postId).eq("tag_id", tagId);
}

const readingTime = (md: string) => Math.max(1, Math.round(md.trim().split(/\s+/).length / 220));

/* ─────────────────────────  publish_topic_article  ───────────────────────── */
export const publishTopicArticleTool = defineTool({
  name: "publish_topic_article",
  title: "Publish a long-form topic article and link it to a sheet section",
  description:
    "Upsert a long-form markdown article (with images inline via markdown) as a blog post and link it to a sheet + section. Idempotent by slug: existing post is updated. Set status='draft' to stage without publishing.",
  inputSchema: {
    slug: z.string().min(3).max(120).describe("Unique post slug, e.g. 'dbms-normalization-deep-dive'"),
    title: z.string().min(3).max(200),
    content_md: z.string().min(50).describe("Full markdown body. Reference images with normal ![alt](url) syntax."),
    excerpt: z.string().max(400).optional(),
    cover_image_url: z.string().url().optional(),
    status: z.enum(["draft", "published"]).optional(),
    is_featured: z.boolean().optional(),
    seo_title: z.string().max(200).optional(),
    seo_description: z.string().max(400).optional(),
    category_slug: z.string().optional().describe("Existing blog_categories slug (e.g. 'dbms','os','cn'). Auto-created if missing."),
    category_name: z.string().optional().describe("Display name if category needs to be created."),
    sheet_folder_id: z.string().uuid().describe("user_folders.id for the sheet this article belongs to"),
    section_title: z.string().min(1).describe("Section/topic title inside the sheet, e.g. 'Normalization'"),
    tags: z.array(z.string()).max(20).optional().describe("Extra free-form tag names to attach"),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const {
      slug, title, content_md, excerpt, cover_image_url, status = "published",
      is_featured = false, seo_title, seo_description,
      category_slug, category_name, sheet_folder_id, section_title, tags = [],
    } = input;

    // 1. Verify the sheet exists (folder must be visible to caller under RLS)
    const { data: folder, error: folderErr } = await sb
      .from("user_folders").select("id,name").eq("id", sheet_folder_id).maybeSingle();
    if (folderErr) return errResult(`folder lookup: ${folderErr.message}`);
    if (!folder) return errResult(`Sheet folder ${sheet_folder_id} not found or not accessible.`);

    // 2. Upsert the post by slug
    const now = new Date().toISOString();
    const postPayload: Record<string, unknown> = {
      slug, title, content_md,
      excerpt: excerpt ?? null,
      cover_image_url: cover_image_url ?? null,
      status,
      published_at: status === "published" ? now : null,
      reading_time_min: readingTime(content_md),
      seo_title: seo_title ?? title,
      seo_description: seo_description ?? excerpt ?? null,
      is_featured,
      author_id: ctx.getUserId(),
      updated_at: now,
    };
    const { data: existing } = await sb.from("blog_posts").select("id").eq("slug", slug).maybeSingle();
    let postId: string;
    if (existing?.id) {
      const { error } = await sb.from("blog_posts").update(postPayload).eq("id", existing.id);
      if (error) return errResult(`post update: ${error.message}`);
      postId = existing.id;
    } else {
      const { data, error } = await sb.from("blog_posts").insert(postPayload).select("id").single();
      if (error) return errResult(`post insert: ${error.message}`);
      postId = data.id;
    }

    // 3. Category link (optional)
    let categoryId: string | null = null;
    if (category_slug) {
      const { data: cat } = await sb.from("blog_categories").select("id").eq("slug", category_slug).maybeSingle();
      if (cat?.id) categoryId = cat.id;
      else {
        const { data: newCat, error } = await sb
          .from("blog_categories")
          .insert({ slug: category_slug, name: category_name ?? category_slug.toUpperCase() })
          .select("id").single();
        if (error) return errResult(`category: ${error.message}`);
        categoryId = newCat.id;
      }
      await sb.from("blog_post_categories").upsert(
        { post_id: postId, category_id: categoryId },
        { onConflict: "post_id,category_id" },
      );
    }

    // 4. Sheet + topic tags (the link)
    const sectionSlug = kebab(section_title);
    const sheetTagId = await ensureTag(sb, sheetTagSlug(sheet_folder_id), `Sheet: ${folder.name}`);
    const topicTagId = await ensureTag(sb, topicTagSlug(sectionSlug), section_title);
    await attachTag(sb, postId, sheetTagId);
    await attachTag(sb, postId, topicTagId);

    // 5. Extra tags
    for (const t of tags) {
      const s = kebab(t);
      if (!s) continue;
      const id = await ensureTag(sb, s, t);
      await attachTag(sb, postId, id);
    }

    return jsonResult(`Article '${title}' ${existing ? "updated" : "created"} and linked to ${folder.name} › ${section_title}.`, {
      post_id: postId,
      slug,
      status,
      url: `/blog/${slug}`,
      sheet_folder_id,
      section_title,
      section_slug: sectionSlug,
      link_tags: { sheet: sheetTagSlug(sheet_folder_id), topic: topicTagSlug(sectionSlug) },
      category_id: categoryId,
    });
  },
});

/* ─────────────────────────  list_topic_articles  ───────────────────────── */
export const listTopicArticlesTool = defineTool({
  name: "list_topic_articles",
  title: "List articles linked to a sheet (optionally filtered by section)",
  description: "Return articles linked to a given sheet folder, optionally narrowed to a specific section title.",
  inputSchema: {
    sheet_folder_id: z.string().uuid(),
    section_title: z.string().optional(),
    include_drafts: z.boolean().optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ sheet_folder_id, section_title, include_drafts }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const { data: sheetTag } = await sb
      .from("blog_tags").select("id").eq("slug", sheetTagSlug(sheet_folder_id)).maybeSingle();
    if (!sheetTag) return jsonResult("No articles linked to this sheet yet.", { items: [] });

    let topicTagId: string | null = null;
    if (section_title) {
      const { data: tt } = await sb.from("blog_tags").select("id")
        .eq("slug", topicTagSlug(kebab(section_title))).maybeSingle();
      if (!tt) return jsonResult("No articles for this section yet.", { items: [] });
      topicTagId = tt.id;
    }

    // Posts with the sheet tag
    const { data: sheetLinks, error } = await sb
      .from("blog_post_tags").select("post_id").eq("tag_id", sheetTag.id);
    if (error) return errResult(error.message);
    let postIds = (sheetLinks ?? []).map((r: any) => r.post_id);

    if (topicTagId && postIds.length) {
      const { data: topicLinks } = await sb
        .from("blog_post_tags").select("post_id").eq("tag_id", topicTagId).in("post_id", postIds);
      postIds = (topicLinks ?? []).map((r: any) => r.post_id);
    }
    if (!postIds.length) return jsonResult("No matching articles.", { items: [] });

    let q = sb.from("blog_posts")
      .select("id,slug,title,excerpt,status,published_at,updated_at,cover_image_url,reading_time_min,is_featured")
      .in("id", postIds).order("published_at", { ascending: false, nullsFirst: false });
    if (!include_drafts) q = q.eq("status", "published");
    const { data: posts, error: pErr } = await q;
    if (pErr) return errResult(pErr.message);

    return jsonResult(`Found ${posts?.length ?? 0} article(s).`, {
      items: (posts ?? []).map((p: any) => ({ ...p, url: `/blog/${p.slug}` })),
    });
  },
});

/* ─────────────────────  link_article_to_sheet_topic  ───────────────────── */
export const linkArticleToSheetTopicTool = defineTool({
  name: "link_article_to_sheet_topic",
  title: "Attach an existing article to a sheet section",
  description: "Link an already-published blog post (by slug) to a sheet folder + section by attaching the sheet/topic tags.",
  inputSchema: {
    post_slug: z.string().min(1),
    sheet_folder_id: z.string().uuid(),
    section_title: z.string().min(1),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ post_slug, sheet_folder_id, section_title }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const { data: post } = await sb.from("blog_posts").select("id,title").eq("slug", post_slug).maybeSingle();
    if (!post) return errResult(`Post '${post_slug}' not found.`);
    const { data: folder } = await sb.from("user_folders").select("id,name").eq("id", sheet_folder_id).maybeSingle();
    if (!folder) return errResult(`Sheet folder ${sheet_folder_id} not found.`);

    const sectionSlug = kebab(section_title);
    const sheetTagId = await ensureTag(sb, sheetTagSlug(sheet_folder_id), `Sheet: ${folder.name}`);
    const topicTagId = await ensureTag(sb, topicTagSlug(sectionSlug), section_title);
    await attachTag(sb, post.id, sheetTagId);
    await attachTag(sb, post.id, topicTagId);

    return jsonResult(`Linked '${post.title}' → ${folder.name} › ${section_title}.`, {
      post_id: post.id, post_slug, sheet_folder_id, section_title, section_slug: sectionSlug,
    });
  },
});

/* ────────────────────  unlink_article_from_sheet_topic  ──────────────────── */
export const unlinkArticleFromSheetTopicTool = defineTool({
  name: "unlink_article_from_sheet_topic",
  title: "Detach an article from a sheet section",
  description: "Remove the sheet and/or topic tag from a post. Pass `unlink_sheet:true` to remove the sheet link entirely.",
  inputSchema: {
    post_slug: z.string().min(1),
    sheet_folder_id: z.string().uuid(),
    section_title: z.string().optional(),
    unlink_sheet: z.boolean().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ post_slug, sheet_folder_id, section_title, unlink_sheet }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const { data: post } = await sb.from("blog_posts").select("id").eq("slug", post_slug).maybeSingle();
    if (!post) return errResult(`Post '${post_slug}' not found.`);

    const removed: string[] = [];
    if (section_title) {
      const { data: tt } = await sb.from("blog_tags").select("id")
        .eq("slug", topicTagSlug(kebab(section_title))).maybeSingle();
      if (tt) { await detachTag(sb, post.id, tt.id); removed.push(`topic:${section_title}`); }
    }
    if (unlink_sheet) {
      const { data: st } = await sb.from("blog_tags").select("id")
        .eq("slug", sheetTagSlug(sheet_folder_id)).maybeSingle();
      if (st) { await detachTag(sb, post.id, st.id); removed.push(`sheet:${sheet_folder_id}`); }
    }
    return jsonResult(`Detached ${removed.length} link(s).`, { post_slug, removed });
  },
});

/* ─────────────────────────  upload_article_image  ───────────────────────── */
export const uploadArticleImageTool = defineTool({
  name: "upload_article_image",
  title: "Upload an image for a topic article",
  description:
    "Upload a base64-encoded image to the blog-media bucket and return a signed URL you can embed in article markdown as ![alt](url). Signed URL default expiry: 1 year.",
  inputSchema: {
    filename: z.string().min(1).describe("e.g. 'normalization-diagram.png'"),
    base64: z.string().min(1).describe("Raw base64 (no data: prefix)"),
    content_type: z.string().optional(),
    folder: z.string().optional().describe("Subpath inside bucket, e.g. 'dbms/normalization'. Defaults to 'articles'."),
    expires_in_seconds: z.number().int().min(3600).max(60 * 60 * 24 * 365).optional(),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ filename, base64, content_type, folder, expires_in_seconds }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${folder ?? "articles"}/${Date.now()}-${safeName}`;
    const { error: upErr } = await sb.storage.from("blog-media").upload(path, bytes, {
      contentType: content_type ?? "image/png",
      upsert: false,
    });
    if (upErr) return errResult(`upload: ${upErr.message}`);

    const { data: signed, error: sErr } = await sb.storage
      .from("blog-media").createSignedUrl(path, expires_in_seconds ?? 60 * 60 * 24 * 365);
    if (sErr) return errResult(`sign: ${sErr.message}`);

    return jsonResult(`Uploaded ${path}.`, {
      bucket: "blog-media", path,
      signed_url: signed?.signedUrl,
      markdown: `![${filename}](${signed?.signedUrl})`,
    });
  },
});

/* ─────────────────────────  delete_topic_article  ───────────────────────── */
export const deleteTopicArticleTool = defineTool({
  name: "delete_topic_article",
  title: "Delete a topic article",
  description: "Permanently delete a blog post (and its tag links) by slug.",
  inputSchema: { post_slug: z.string().min(1) },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ post_slug }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;
    const { data: post } = await sb.from("blog_posts").select("id,title").eq("slug", post_slug).maybeSingle();
    if (!post) return errResult(`Post '${post_slug}' not found.`);
    await sb.from("blog_post_tags").delete().eq("post_id", post.id);
    await sb.from("blog_post_categories").delete().eq("post_id", post.id);
    const { error } = await sb.from("blog_posts").delete().eq("id", post.id);
    if (error) return errResult(`delete: ${error.message}`);
    return jsonResult(`Deleted '${post.title}'.`, { post_slug });
  },
});
