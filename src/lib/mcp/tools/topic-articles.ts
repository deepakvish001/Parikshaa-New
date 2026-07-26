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

/* ─────────────────────  set_topic_article_status  ───────────────────── */
export const setTopicArticleStatusTool = defineTool({
  name: "set_topic_article_status",
  title: "Change draft/published status of a topic article",
  description:
    "Flip a topic article between 'draft' and 'published'. Sets published_at on first publish, clears it when moved back to draft. Idempotent.",
  inputSchema: {
    post_slug: z.string().min(1),
    status: z.enum(["draft", "published", "archived"]),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ post_slug, status }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;
    const { data: post } = await sb.from("blog_posts")
      .select("id,status,published_at,title").eq("slug", post_slug).maybeSingle();
    if (!post) return errResult(`Post '${post_slug}' not found.`);
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status, updated_at: now };
    if (status === "published" && !post.published_at) patch.published_at = now;
    if (status === "draft") patch.published_at = null;
    const { error } = await sb.from("blog_posts").update(patch).eq("id", post.id);
    if (error) return errResult(`status update: ${error.message}`);
    return jsonResult(`'${post.title}' → ${status}.`, {
      post_slug, previous_status: post.status, new_status: status,
      published_at: patch.published_at ?? post.published_at ?? null,
    });
  },
});

/* ─────────────────────  update_topic_article  ─────────────────────
 * Idempotent update by slug. Preserves sheet+section linkage unless the
 * caller passes new sheet_folder_id / section_title (which will re-link).
 * Any omitted field is left untouched.
 * ------------------------------------------------------------------ */
export const updateTopicArticleTool = defineTool({
  name: "update_topic_article",
  title: "Update a published topic article (idempotent by slug)",
  description:
    "Patch a topic article's content, images, metadata, and/or tags without breaking its existing sheet+section linkage. Pass only the fields you want to change. Sheet/section link is preserved unless you pass new sheet_folder_id/section_title to re-link.",
  inputSchema: {
    slug: z.string().min(1).describe("Existing post slug (identity)."),
    title: z.string().min(3).max(200).optional(),
    content_md: z.string().min(50).optional(),
    excerpt: z.string().max(400).nullable().optional(),
    cover_image_url: z.string().url().nullable().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    is_featured: z.boolean().optional(),
    seo_title: z.string().max(200).nullable().optional(),
    seo_description: z.string().max(400).nullable().optional(),
    add_tags: z.array(z.string()).max(20).optional(),
    remove_tags: z.array(z.string()).max(20).optional(),
    category_slug: z.string().optional(),
    category_name: z.string().optional(),
    sheet_folder_id: z.string().uuid().optional().describe("Re-link to this sheet (optional)."),
    section_title: z.string().optional().describe("Re-link to this section (optional)."),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const { slug, add_tags = [], remove_tags = [], sheet_folder_id, section_title,
      category_slug, category_name, content_md, ...rest } = input as any;

    const { data: post } = await sb.from("blog_posts")
      .select("id,title,status,published_at").eq("slug", slug).maybeSingle();
    if (!post) return errResult(`Post '${slug}' not found.`);

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { updated_at: now };
    for (const k of Object.keys(rest)) if (rest[k] !== undefined) patch[k] = rest[k];
    if (content_md !== undefined) {
      patch.content_md = content_md;
      patch.reading_time_min = readingTime(content_md);
    }
    if (patch.status === "published" && !post.published_at) patch.published_at = now;
    if (patch.status === "draft") patch.published_at = null;

    const { error: upErr } = await sb.from("blog_posts").update(patch).eq("id", post.id);
    if (upErr) return errResult(`update: ${upErr.message}`);

    // Optional category re-link
    let categoryId: string | null = null;
    if (category_slug) {
      const { data: cat } = await sb.from("blog_categories").select("id").eq("slug", category_slug).maybeSingle();
      categoryId = cat?.id ?? null;
      if (!categoryId) {
        const { data: newCat, error } = await sb.from("blog_categories")
          .insert({ slug: category_slug, name: category_name ?? category_slug.toUpperCase() })
          .select("id").single();
        if (error) return errResult(`category: ${error.message}`);
        categoryId = newCat.id;
      }
      await sb.from("blog_post_categories").upsert(
        { post_id: post.id, category_id: categoryId }, { onConflict: "post_id,category_id" },
      );
    }

    // Optional re-link to sheet/section
    let relinked: { sheet: string; topic: string } | null = null;
    if (sheet_folder_id && section_title) {
      const { data: folder } = await sb.from("user_folders").select("id,name").eq("id", sheet_folder_id).maybeSingle();
      if (!folder) return errResult(`Sheet folder ${sheet_folder_id} not found.`);
      const sectionSlug = kebab(section_title);
      const sheetTagId = await ensureTag(sb, sheetTagSlug(sheet_folder_id), `Sheet: ${folder.name}`);
      const topicTagId = await ensureTag(sb, topicTagSlug(sectionSlug), section_title);
      await attachTag(sb, post.id, sheetTagId);
      await attachTag(sb, post.id, topicTagId);
      relinked = { sheet: sheetTagSlug(sheet_folder_id), topic: topicTagSlug(sectionSlug) };
    }

    // Add / remove free-form tags
    const added: string[] = [];
    for (const t of add_tags) {
      const s = kebab(t); if (!s) continue;
      const id = await ensureTag(sb, s, t);
      await attachTag(sb, post.id, id);
      added.push(t);
    }
    const removed: string[] = [];
    for (const t of remove_tags) {
      const s = kebab(t); if (!s) continue;
      const { data: tag } = await sb.from("blog_tags").select("id").eq("slug", s).maybeSingle();
      if (tag?.id) { await detachTag(sb, post.id, tag.id); removed.push(t); }
    }

    return jsonResult(`Updated '${post.title}'.`, {
      post_id: post.id, slug, patched_fields: Object.keys(patch),
      relinked, added_tags: added, removed_tags: removed, category_id: categoryId,
    });
  },
});

/* ─────────────────────  get_topic_article_details  ───────────────────── */
export const getTopicArticleDetailsTool = defineTool({
  name: "get_topic_article_details",
  title: "Get full details of a topic article",
  description:
    "Return complete article details in one call: post row, extracted inline images, all tags (including sheet/topic linkage), categories, and resolved sheet+section metadata.",
  inputSchema: { post_slug: z.string().min(1) },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ post_slug }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const { data: post, error } = await sb.from("blog_posts")
      .select("id,slug,title,excerpt,content_md,cover_image_url,status,published_at,updated_at,reading_time_min,is_featured,seo_title,seo_description,author_id")
      .eq("slug", post_slug).maybeSingle();
    if (error) return errResult(error.message);
    if (!post) return errResult(`Post '${post_slug}' not found.`);

    // Tags
    const { data: tagLinks } = await sb.from("blog_post_tags").select("tag_id").eq("post_id", post.id);
    const tagIds = (tagLinks ?? []).map((r: any) => r.tag_id);
    let tags: any[] = [];
    if (tagIds.length) {
      const { data } = await sb.from("blog_tags").select("id,slug,name").in("id", tagIds);
      tags = data ?? [];
    }
    // Categories
    const { data: catLinks } = await sb.from("blog_post_categories").select("category_id").eq("post_id", post.id);
    const catIds = (catLinks ?? []).map((r: any) => r.category_id);
    let categories: any[] = [];
    if (catIds.length) {
      const { data } = await sb.from("blog_categories").select("id,slug,name").in("id", catIds);
      categories = data ?? [];
    }

    // Extract sheet + topic linkage from tags
    const sheetTag = tags.find((t) => t.slug?.startsWith("sheet-"));
    const topicTag = tags.find((t) => t.slug?.startsWith("topic-"));
    let sheet: { id: string; name: string } | null = null;
    if (sheetTag) {
      const folderId = sheetTag.slug.replace(/^sheet-/, "");
      const { data: f } = await sb.from("user_folders").select("id,name").eq("id", folderId).maybeSingle();
      if (f) sheet = f;
    }

    // Extract inline images from markdown
    const images: { alt: string; url: string }[] = [];
    const re = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(post.content_md ?? "")) !== null) images.push({ alt: m[1], url: m[2] });

    return jsonResult(`Details for '${post.title}'.`, {
      post: { ...post, url: `/blog/${post.slug}` },
      images,
      tags,
      categories,
      linkage: {
        sheet, section_title: topicTag?.name ?? null, section_slug: topicTag?.slug?.replace(/^topic-/, "") ?? null,
      },
    });
  },
});

/* ─────────────────────  bulk_publish_topic_articles  ───────────────────── */
export const bulkPublishTopicArticlesTool = defineTool({
  name: "bulk_publish_topic_articles",
  title: "Publish multiple topic articles at once (linked to a sheet)",
  description:
    "Upsert an array of long-form topic articles in one call. Each is linked to its own section inside the given sheet. Per-article success/failure report. Ideal for seeding a full DBMS/CN/OS sheet with articles.",
  inputSchema: {
    sheet_folder_id: z.string().uuid(),
    category_slug: z.string().optional(),
    category_name: z.string().optional(),
    default_status: z.enum(["draft", "published"]).optional(),
    articles: z.array(z.object({
      slug: z.string().min(3).max(120),
      title: z.string().min(3).max(200),
      section_title: z.string().min(1),
      content_md: z.string().min(50),
      excerpt: z.string().max(400).optional(),
      cover_image_url: z.string().url().optional(),
      status: z.enum(["draft", "published"]).optional(),
      is_featured: z.boolean().optional(),
      seo_title: z.string().max(200).optional(),
      seo_description: z.string().max(400).optional(),
      tags: z.array(z.string()).max(20).optional(),
    })).min(1).max(50),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const { sheet_folder_id, category_slug, category_name, default_status = "published", articles } = input;

    const { data: folder } = await sb.from("user_folders").select("id,name").eq("id", sheet_folder_id).maybeSingle();
    if (!folder) return errResult(`Sheet folder ${sheet_folder_id} not found.`);

    // Resolve/create category once
    let categoryId: string | null = null;
    if (category_slug) {
      const { data: cat } = await sb.from("blog_categories").select("id").eq("slug", category_slug).maybeSingle();
      categoryId = cat?.id ?? null;
      if (!categoryId) {
        const { data: newCat, error } = await sb.from("blog_categories")
          .insert({ slug: category_slug, name: category_name ?? category_slug.toUpperCase() })
          .select("id").single();
        if (error) return errResult(`category: ${error.message}`);
        categoryId = newCat.id;
      }
    }

    const sheetTagId = await ensureTag(sb, sheetTagSlug(sheet_folder_id), `Sheet: ${folder.name}`);
    const results: any[] = [];
    let created = 0, updated = 0, failed = 0;

    for (const a of articles) {
      try {
        const now = new Date().toISOString();
        const status = a.status ?? default_status;
        const payload: Record<string, unknown> = {
          slug: a.slug, title: a.title, content_md: a.content_md,
          excerpt: a.excerpt ?? null, cover_image_url: a.cover_image_url ?? null,
          status, published_at: status === "published" ? now : null,
          reading_time_min: readingTime(a.content_md),
          seo_title: a.seo_title ?? a.title,
          seo_description: a.seo_description ?? a.excerpt ?? null,
          is_featured: a.is_featured ?? false,
          author_id: ctx.getUserId(), updated_at: now,
        };
        const { data: existing } = await sb.from("blog_posts").select("id").eq("slug", a.slug).maybeSingle();
        let postId: string;
        let action: "created" | "updated";
        if (existing?.id) {
          const { error } = await sb.from("blog_posts").update(payload).eq("id", existing.id);
          if (error) throw new Error(error.message);
          postId = existing.id; action = "updated"; updated++;
        } else {
          const { data, error } = await sb.from("blog_posts").insert(payload).select("id").single();
          if (error) throw new Error(error.message);
          postId = data.id; action = "created"; created++;
        }

        if (categoryId) {
          await sb.from("blog_post_categories").upsert(
            { post_id: postId, category_id: categoryId }, { onConflict: "post_id,category_id" },
          );
        }
        const sectionSlug = kebab(a.section_title);
        const topicTagId = await ensureTag(sb, topicTagSlug(sectionSlug), a.section_title);
        await attachTag(sb, postId, sheetTagId);
        await attachTag(sb, postId, topicTagId);
        for (const t of a.tags ?? []) {
          const s = kebab(t); if (!s) continue;
          const id = await ensureTag(sb, s, t);
          await attachTag(sb, postId, id);
        }

        results.push({ slug: a.slug, status: action, post_id: postId, section: a.section_title, url: `/blog/${a.slug}` });
      } catch (e: any) {
        failed++;
        results.push({ slug: a.slug, status: "failed", error: e?.message ?? String(e) });
      }
    }

    return jsonResult(
      `Bulk publish: ${created} created, ${updated} updated, ${failed} failed → ${folder.name}.`,
      { sheet_folder_id, sheet_name: folder.name, created, updated, failed, results },
    );
  },
});

/* ─────────────────  bulk_set_topic_article_status  ───────────────── */
export const bulkSetTopicArticleStatusTool = defineTool({
  name: "bulk_set_topic_article_status",
  title: "Change status of multiple topic articles at once",
  description:
    "Set draft/published/archived for many articles by slug in a single call. Per-slug result: status/previous_status or error.",
  inputSchema: {
    slugs: z.array(z.string().min(1)).min(1).max(100),
    status: z.enum(["draft", "published", "archived"]),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ slugs, status }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;
    const now = new Date().toISOString();
    const results: any[] = [];
    let ok = 0, failed = 0, notFound = 0;
    for (const slug of slugs) {
      const { data: post } = await sb.from("blog_posts")
        .select("id,status,published_at").eq("slug", slug).maybeSingle();
      if (!post) { notFound++; results.push({ slug, status: "not_found" }); continue; }
      const patch: Record<string, unknown> = { status, updated_at: now };
      if (status === "published" && !post.published_at) patch.published_at = now;
      if (status === "draft") patch.published_at = null;
      const { error } = await sb.from("blog_posts").update(patch).eq("id", post.id);
      if (error) { failed++; results.push({ slug, status: "error", error: error.message }); continue; }
      ok++; results.push({ slug, status: "ok", previous_status: post.status, new_status: status });
    }
    return jsonResult(`Bulk status → ${status}: ${ok} ok, ${notFound} not_found, ${failed} failed.`,
      { requested: slugs.length, ok, not_found: notFound, failed, results });
  },
});

/* ─────────────────  preview_topic_article  ───────────────── */
export const previewTopicArticleTool = defineTool({
  name: "preview_topic_article",
  title: "Render a topic article to sanitized HTML for visual review",
  description:
    "Render the article markdown to HTML (with a strict sanitizer: strips <script>/<iframe>/on*=/javascript: URLs) and returns resolved inline image URLs, so you can eyeball it before publishing. Does not modify anything.",
  inputSchema: {
    post_slug: z.string().min(1),
    include_toc: z.boolean().optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ post_slug, include_toc }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;
    const { data: post } = await sb.from("blog_posts")
      .select("id,slug,title,excerpt,content_md,cover_image_url,status,updated_at,reading_time_min")
      .eq("slug", post_slug).maybeSingle();
    if (!post) return errResult(`Post '${post_slug}' not found.`);

    // @ts-ignore npm: specifier resolved by Deno at runtime
    const { marked } = await import(/* @vite-ignore */ "npm:marked@12");
    let html = await marked.parse(post.content_md ?? "", { async: true });
    // strict sanitizer: kill dangerous constructs
    html = String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/ on[a-z]+="[^"]*"/gi, "")
      .replace(/ on[a-z]+='[^']*'/gi, "")
      .replace(/javascript:/gi, "");

    const images: { alt: string; url: string }[] = [];
    const re = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(post.content_md ?? "")) !== null) images.push({ alt: m[1], url: m[2] });

    let toc: { level: number; text: string; id: string }[] | undefined;
    if (include_toc) {
      toc = [];
      const hRe = /^(#{1,6})\s+(.+)$/gm;
      let h: RegExpExecArray | null;
      while ((h = hRe.exec(post.content_md ?? "")) !== null) {
        toc.push({ level: h[1].length, text: h[2].trim(), id: kebab(h[2]) });
      }
    }

    return jsonResult(`Preview for '${post.title}'.`, {
      post: { slug: post.slug, title: post.title, status: post.status, updated_at: post.updated_at,
        reading_time_min: post.reading_time_min, cover_image_url: post.cover_image_url },
      html, images, toc,
    });
  },
});

/* ─────────────────  search_topic_articles  ───────────────── */
export const searchTopicArticlesTool = defineTool({
  name: "search_topic_articles",
  title: "Search topic articles by category / sheet / section",
  description:
    "Filter topic articles by any combination of category slug (dbms/cn/os), sheet folder id, section title, status, and free-text title query. Paginated.",
  inputSchema: {
    category_slug: z.string().optional(),
    sheet_folder_id: z.string().uuid().optional(),
    section_title: z.string().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    query: z.string().optional().describe("Case-insensitive substring match on title."),
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (input, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;
    const { category_slug, sheet_folder_id, section_title, status, query,
      limit = 25, offset = 0 } = input;

    let idsFilter: string[] | null = null;
    const intersect = (next: string[]) => {
      idsFilter = idsFilter === null ? next : idsFilter.filter((x) => next.includes(x));
    };

    if (sheet_folder_id) {
      const { data: st } = await sb.from("blog_tags").select("id")
        .eq("slug", sheetTagSlug(sheet_folder_id)).maybeSingle();
      if (!st) return jsonResult("No articles for this sheet.", { total: 0, items: [] });
      const { data: links } = await sb.from("blog_post_tags").select("post_id").eq("tag_id", st.id);
      intersect((links ?? []).map((r: any) => r.post_id));
    }
    if (section_title) {
      const { data: tt } = await sb.from("blog_tags").select("id")
        .eq("slug", topicTagSlug(kebab(section_title))).maybeSingle();
      if (!tt) return jsonResult("No articles for this section.", { total: 0, items: [] });
      const { data: links } = await sb.from("blog_post_tags").select("post_id").eq("tag_id", tt.id);
      intersect((links ?? []).map((r: any) => r.post_id));
    }
    if (category_slug) {
      const { data: cat } = await sb.from("blog_categories").select("id").eq("slug", category_slug).maybeSingle();
      if (!cat) return jsonResult("No such category.", { total: 0, items: [] });
      const { data: links } = await sb.from("blog_post_categories").select("post_id").eq("category_id", cat.id);
      intersect((links ?? []).map((r: any) => r.post_id));
    }
    if (idsFilter !== null && idsFilter.length === 0) {
      return jsonResult("No matching articles.", { total: 0, items: [] });
    }

    let q = sb.from("blog_posts")
      .select("id,slug,title,excerpt,status,published_at,updated_at,cover_image_url,reading_time_min,is_featured",
        { count: "exact" });
    if (idsFilter) q = q.in("id", idsFilter);
    if (status) q = q.eq("status", status);
    if (query) q = q.ilike("title", `%${query}%`);
    q = q.order("updated_at", { ascending: false }).range(offset, offset + limit - 1);
    const { data, count, error } = await q;
    if (error) return errResult(error.message);
    return jsonResult(`Found ${count ?? data?.length ?? 0} article(s).`, {
      total: count ?? data?.length ?? 0, limit, offset,
      items: (data ?? []).map((p: any) => ({ ...p, url: `/blog/${p.slug}` })),
    });
  },
});

/* ─────────────────  verify_topic_article_linkage  ───────────────── */
export const verifyTopicArticleLinkageTool = defineTool({
  name: "verify_topic_article_linkage",
  title: "Audit topic article linkage for a sheet",
  description:
    "Scan all articles tagged for a sheet (and optionally a section) and report link health: missing sheet tag, missing topic tag, orphaned topic tags whose section no longer exists in the sheet outline, and articles with no category.",
  inputSchema: {
    sheet_folder_id: z.string().uuid(),
    section_title: z.string().optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ sheet_folder_id, section_title }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const { data: folder } = await sb.from("user_folders")
      .select("id,name,description").eq("id", sheet_folder_id).maybeSingle();
    if (!folder) return errResult(`Sheet folder ${sheet_folder_id} not found.`);

    // Extract known section slugs from the folder description outline
    const knownSections = new Set<string>();
    const desc: string = folder.description ?? "";
    for (const line of desc.split("\n")) {
      const m = line.match(/^#{1,6}\s+(.+?)\s*$/);
      if (m) knownSections.add(kebab(m[1]));
    }

    const { data: sheetTag } = await sb.from("blog_tags")
      .select("id").eq("slug", sheetTagSlug(sheet_folder_id)).maybeSingle();
    if (!sheetTag) return jsonResult("No sheet tag exists yet — no articles linked.",
      { sheet_folder_id, healthy: 0, issues: [], articles_checked: 0 });

    const { data: links } = await sb.from("blog_post_tags").select("post_id").eq("tag_id", sheetTag.id);
    let postIds = (links ?? []).map((r: any) => r.post_id);

    let targetTopicSlug: string | null = null;
    if (section_title) {
      targetTopicSlug = topicTagSlug(kebab(section_title));
      const { data: tt } = await sb.from("blog_tags").select("id").eq("slug", targetTopicSlug).maybeSingle();
      if (tt) {
        const { data: tLinks } = await sb.from("blog_post_tags")
          .select("post_id").eq("tag_id", tt.id).in("post_id", postIds);
        postIds = (tLinks ?? []).map((r: any) => r.post_id);
      } else {
        postIds = [];
      }
    }
    if (!postIds.length) return jsonResult("No articles to audit.",
      { sheet_folder_id, sheet_name: folder.name, healthy: 0, issues: [], articles_checked: 0 });

    const { data: posts } = await sb.from("blog_posts")
      .select("id,slug,title,status").in("id", postIds);

    // Gather each post's tags + categories in bulk
    const { data: allTagLinks } = await sb.from("blog_post_tags").select("post_id,tag_id").in("post_id", postIds);
    const tagIdSet = new Set((allTagLinks ?? []).map((r: any) => r.tag_id));
    const { data: tagRows } = await sb.from("blog_tags").select("id,slug,name").in("id", Array.from(tagIdSet));
    const tagById = new Map((tagRows ?? []).map((t: any) => [t.id, t]));
    const tagsByPost = new Map<string, any[]>();
    for (const l of allTagLinks ?? []) {
      const t = tagById.get(l.tag_id); if (!t) continue;
      if (!tagsByPost.has(l.post_id)) tagsByPost.set(l.post_id, []);
      tagsByPost.get(l.post_id)!.push(t);
    }
    const { data: catLinks } = await sb.from("blog_post_categories").select("post_id").in("post_id", postIds);
    const hasCat = new Set((catLinks ?? []).map((r: any) => r.post_id));

    const issues: any[] = [];
    let healthy = 0;
    for (const p of posts ?? []) {
      const tags = tagsByPost.get(p.id) ?? [];
      const sheetTagPresent = tags.some((t) => t.slug === sheetTagSlug(sheet_folder_id));
      const topicTags = tags.filter((t) => t.slug?.startsWith("topic-"));
      const problems: string[] = [];
      if (!sheetTagPresent) problems.push("missing_sheet_tag");
      if (topicTags.length === 0) problems.push("missing_topic_tag");
      const orphaned = topicTags
        .map((t) => t.slug.replace(/^topic-/, ""))
        .filter((slug) => knownSections.size > 0 && !knownSections.has(slug));
      if (orphaned.length) problems.push(`orphaned_topics:${orphaned.join(",")}`);
      if (!hasCat.has(p.id)) problems.push("no_category");
      if (targetTopicSlug && !tags.some((t) => t.slug === targetTopicSlug)) problems.push("missing_requested_topic_tag");
      if (problems.length === 0) { healthy++; continue; }
      issues.push({
        slug: p.slug, title: p.title, status: p.status,
        problems, topic_tags: topicTags.map((t) => t.slug),
      });
    }

    return jsonResult(
      `Audited ${posts?.length ?? 0} article(s): ${healthy} healthy, ${issues.length} with issues.`,
      { sheet_folder_id, sheet_name: folder.name,
        known_sections: Array.from(knownSections),
        articles_checked: posts?.length ?? 0, healthy, issues },
    );
  },
});
