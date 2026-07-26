import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errResult, jsonResult, requireAdmin } from "./_shared";

const kebab = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

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

const extractImageRefs = (md: string) => {
  const out: { alt: string; url: string; full: string }[] = [];
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md ?? "")) !== null) out.push({ alt: m[1], url: m[2], full: m[0] });
  return out;
};

/* ───────────── get_topic_articles_details_by_slugs ───────────── */
export const getTopicArticlesDetailsBySlugsTool = defineTool({
  name: "get_topic_articles_details_by_slugs",
  title: "Get details for many topic articles at once",
  description:
    "Return summary + status + tags + linked sheet/section for a list of article slugs in one call. Missing slugs are reported as not_found.",
  inputSchema: {
    slugs: z.array(z.string().min(1)).min(1).max(100),
    include_content: z.boolean().optional().describe("Include full content_md (default: excerpt/summary only)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ slugs, include_content }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const sel = include_content
      ? "id,slug,title,excerpt,content_md,status,published_at,updated_at,cover_image_url,reading_time_min"
      : "id,slug,title,excerpt,status,published_at,updated_at,cover_image_url,reading_time_min";
    const { data: posts, error } = await sb.from("blog_posts").select(sel).in("slug", slugs);
    if (error) return errResult(error.message);
    const bySlug = new Map<string, any>((posts ?? []).map((p: any) => [p.slug, p]));
    const postIds = (posts ?? []).map((p: any) => p.id);

    // Bulk tags
    const tagsByPost = new Map<string, any[]>();
    if (postIds.length) {
      const { data: tagLinks } = await sb.from("blog_post_tags").select("post_id,tag_id").in("post_id", postIds);
      const tagIds = Array.from(new Set((tagLinks ?? []).map((r: any) => r.tag_id)));
      const { data: tagRows } = tagIds.length
        ? await sb.from("blog_tags").select("id,slug,name").in("id", tagIds)
        : { data: [] as any[] };
      const tagById = new Map((tagRows ?? []).map((t: any) => [t.id, t]));
      for (const l of tagLinks ?? []) {
        const t = tagById.get(l.tag_id); if (!t) continue;
        if (!tagsByPost.has(l.post_id)) tagsByPost.set(l.post_id, []);
        tagsByPost.get(l.post_id)!.push(t);
      }
    }

    // Resolve unique sheet folder ids in one shot
    const folderIds = new Set<string>();
    for (const [, tags] of tagsByPost) {
      for (const t of tags) if (t.slug?.startsWith("sheet-")) folderIds.add(t.slug.replace(/^sheet-/, ""));
    }
    const folderById = new Map<string, any>();
    if (folderIds.size) {
      const { data: fRows } = await sb.from("user_folders").select("id,name").in("id", Array.from(folderIds));
      for (const f of fRows ?? []) folderById.set(f.id, f);
    }

    const items = slugs.map((slug) => {
      const p = bySlug.get(slug);
      if (!p) return { slug, status: "not_found" };
      const tags = tagsByPost.get(p.id) ?? [];
      const sheetTag = tags.find((t) => t.slug?.startsWith("sheet-"));
      const topicTag = tags.find((t) => t.slug?.startsWith("topic-"));
      const folderId = sheetTag?.slug?.replace(/^sheet-/, "") ?? null;
      return {
        slug,
        status: "ok",
        post: { ...p, url: `/blog/${p.slug}` },
        tags,
        linkage: {
          sheet: folderId ? folderById.get(folderId) ?? { id: folderId } : null,
          section_title: topicTag?.name ?? null,
          section_slug: topicTag?.slug?.replace(/^topic-/, "") ?? null,
        },
      };
    });

    const found = items.filter((i) => i.status === "ok").length;
    return jsonResult(`Fetched ${found}/${slugs.length} article(s).`, {
      requested: slugs.length, found, not_found: slugs.length - found, items,
    });
  },
});

/* ───────────── export_topic_articles_sitemap ───────────── */
export const exportTopicArticlesSitemapTool = defineTool({
  name: "export_topic_articles_sitemap",
  title: "Export XML sitemap for topic articles",
  description:
    "Generate an XML sitemap (Sitemap 0.9 spec) for published topic articles. Filter by category slug(s) (e.g. dbms/cn/os) or by sheet. Returns raw XML you can save to public/sitemap-articles.xml or serve directly.",
  inputSchema: {
    base_url: z.string().url().describe("e.g. https://www.parikshaa.org"),
    category_slugs: z.array(z.string()).max(20).optional().describe("Restrict to these categories. Default: all."),
    sheet_folder_id: z.string().uuid().optional(),
    path_prefix: z.string().optional().describe("Path prefix for URLs (default '/blog/')."),
    include_lastmod: z.boolean().optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (input, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;
    const { base_url, category_slugs, sheet_folder_id, path_prefix = "/blog/", include_lastmod = true } = input;

    let idsFilter: string[] | null = null;
    const intersect = (next: string[]) => {
      idsFilter = idsFilter === null ? next : idsFilter.filter((x) => next.includes(x));
    };

    if (category_slugs?.length) {
      const { data: cats } = await sb.from("blog_categories").select("id,slug").in("slug", category_slugs);
      const catIds = (cats ?? []).map((c: any) => c.id);
      if (!catIds.length) return jsonResult("No matching categories.", { xml: "", url_count: 0 });
      const { data: cLinks } = await sb.from("blog_post_categories").select("post_id").in("category_id", catIds);
      intersect((cLinks ?? []).map((r: any) => r.post_id));
    }
    if (sheet_folder_id) {
      const { data: st } = await sb.from("blog_tags").select("id").eq("slug", sheetTagSlug(sheet_folder_id)).maybeSingle();
      if (!st) return jsonResult("No articles for this sheet.", { xml: "", url_count: 0 });
      const { data: links } = await sb.from("blog_post_tags").select("post_id").eq("tag_id", st.id);
      intersect((links ?? []).map((r: any) => r.post_id));
    }
    if (idsFilter !== null && idsFilter.length === 0) {
      return jsonResult("No matching articles.", { xml: "", url_count: 0 });
    }

    let q = sb.from("blog_posts").select("slug,updated_at,published_at").eq("status", "published");
    if (idsFilter) q = q.in("id", idsFilter);
    const { data: posts, error } = await q.order("updated_at", { ascending: false });
    if (error) return errResult(error.message);

    const base = base_url.replace(/\/+$/, "");
    const prefix = path_prefix.startsWith("/") ? path_prefix : `/${path_prefix}`;
    const urls = (posts ?? []).map((p: any) => {
      const lastmod = include_lastmod ? (p.updated_at ?? p.published_at) : null;
      const loc = `${base}${prefix}${p.slug}`;
      return `  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ""}\n  </url>`;
    }).join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

    return jsonResult(`Sitemap generated with ${posts?.length ?? 0} URL(s).`, {
      xml, url_count: posts?.length ?? 0, base_url: base,
    });
  },
});

/* ───────────── reresolve_topic_article_images ─────────────
 * For each inline image whose URL points to the blog-media bucket, re-issue
 * a fresh signed URL and rewrite the markdown. Idempotent by slug: rewrites
 * in place, does not create a new post.
 * ---------------------------------------------------------------- */
export const reresolveTopicArticleImagesTool = defineTool({
  name: "reresolve_topic_article_images",
  title: "Re-resolve inline image URLs for a topic article",
  description:
    "Scan inline markdown images in a topic article, re-issue fresh signed URLs for images stored in the blog-media bucket, and rewrite the article body. Slug-idempotent (same post, updated content). External URLs are left untouched.",
  inputSchema: {
    post_slug: z.string().min(1),
    bucket: z.string().optional().describe("Storage bucket to re-sign against. Default: 'blog-media'."),
    expires_in_seconds: z.number().int().min(3600).max(60 * 60 * 24 * 365).optional(),
    dry_run: z.boolean().optional(),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ post_slug, bucket = "blog-media", expires_in_seconds, dry_run }, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;

    const { data: post } = await sb.from("blog_posts")
      .select("id,title,content_md,cover_image_url").eq("slug", post_slug).maybeSingle();
    if (!post) return errResult(`Post '${post_slug}' not found.`);

    const md: string = post.content_md ?? "";
    const refs = extractImageRefs(md);
    const expires = expires_in_seconds ?? 60 * 60 * 24 * 365;
    const results: any[] = [];
    let updatedMd = md;
    let coverUrl: string | null = post.cover_image_url ?? null;

    // Helpers to detect a URL belonging to this bucket and pull the object path
    const bucketMarker = `/storage/v1/object/`;
    const extractPath = (url: string): string | null => {
      const idx = url.indexOf(bucketMarker);
      if (idx === -1) return null;
      // …/object/(sign|public|authenticated)/<bucket>/<path>?token=…
      const tail = url.slice(idx + bucketMarker.length);
      const parts = tail.split("?")[0].split("/");
      if (parts.length < 3) return null;
      const [, b, ...rest] = parts; // parts[0] = sign|public|authenticated
      if (b !== bucket) return null;
      return rest.join("/");
    };

    const resign = async (path: string) => {
      const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, expires);
      if (error) throw new Error(error.message);
      return data?.signedUrl as string;
    };

    for (const ref of refs) {
      const path = extractPath(ref.url);
      if (!path) { results.push({ url: ref.url, status: "external_skip" }); continue; }
      try {
        const fresh = await resign(path);
        if (fresh && fresh !== ref.url) {
          const replacement = `![${ref.alt}](${fresh})`;
          updatedMd = updatedMd.split(ref.full).join(replacement);
          results.push({ url: ref.url, new_url: fresh, path, status: "resigned" });
        } else {
          results.push({ url: ref.url, path, status: "unchanged" });
        }
      } catch (e: any) {
        results.push({ url: ref.url, path, status: "error", error: e?.message ?? String(e) });
      }
    }

    if (coverUrl) {
      const path = extractPath(coverUrl);
      if (path) {
        try {
          const fresh = await resign(path);
          if (fresh && fresh !== coverUrl) coverUrl = fresh;
        } catch (e: any) {
          results.push({ url: coverUrl, path, status: "cover_error", error: e?.message ?? String(e) });
        }
      }
    }

    const changed = updatedMd !== md || coverUrl !== (post.cover_image_url ?? null);
    if (!dry_run && changed) {
      const { error } = await sb.from("blog_posts").update({
        content_md: updatedMd,
        cover_image_url: coverUrl,
        updated_at: new Date().toISOString(),
      }).eq("id", post.id);
      if (error) return errResult(`update: ${error.message}`);
    }

    return jsonResult(
      `${dry_run ? "(dry_run) " : ""}Processed ${refs.length} image(s) for '${post.title}'.`,
      { post_slug, changed, dry_run: !!dry_run, image_count: refs.length, results },
    );
  },
});

/* ───────────── fix_topic_article_linkage ─────────────
 * Consumes the same signals as verify_topic_article_linkage and automatically
 * repairs missing/incorrect sheet+section links.
 * -------------------------------------------------------------- */
export const fixTopicArticleLinkageTool = defineTool({
  name: "fix_topic_article_linkage",
  title: "Auto-repair sheet+section linkage issues for topic articles",
  description:
    "Fix issues surfaced by verify_topic_article_linkage: attach missing sheet tag, attach a topic tag when a target section_title is provided, and remove orphaned topic tags whose slug is not present in the sheet outline. Optionally attach a category to articles missing one.",
  inputSchema: {
    sheet_folder_id: z.string().uuid(),
    section_title: z.string().optional().describe("When set, ensures every audited article carries this topic tag."),
    default_category_slug: z.string().optional().describe("Attach this category to articles missing any category."),
    default_category_name: z.string().optional(),
    remove_orphan_topic_tags: z.boolean().optional().describe("Default: true. Detach topic tags not in sheet outline."),
    dry_run: z.boolean().optional(),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx: ToolContext) => {
    const gate = await requireAdmin(ctx);
    if (!gate.ok) return gate.error;
    const sb = gate.sb;
    const {
      sheet_folder_id, section_title, default_category_slug, default_category_name,
      remove_orphan_topic_tags = true, dry_run,
    } = input;

    const { data: folder } = await sb.from("user_folders")
      .select("id,name,description").eq("id", sheet_folder_id).maybeSingle();
    if (!folder) return errResult(`Sheet folder ${sheet_folder_id} not found.`);

    // Known sections from outline
    const knownSections = new Set<string>();
    for (const line of (folder.description ?? "").split("\n")) {
      const m = line.match(/^#{1,6}\s+(.+?)\s*$/);
      if (m) knownSections.add(kebab(m[1]));
    }

    // Ensure sheet tag exists
    const sheetTagId = await ensureTag(sb, sheetTagSlug(sheet_folder_id), `Sheet: ${folder.name}`);

    // Target topic tag (only when caller narrows to a section)
    let targetTopicSlug: string | null = null;
    let targetTopicTagId: string | null = null;
    if (section_title) {
      targetTopicSlug = topicTagSlug(kebab(section_title));
      targetTopicTagId = await ensureTag(sb, targetTopicSlug, section_title);
    }

    // Ensure default category exists (if requested)
    let defaultCategoryId: string | null = null;
    if (default_category_slug) {
      const { data: cat } = await sb.from("blog_categories").select("id").eq("slug", default_category_slug).maybeSingle();
      defaultCategoryId = cat?.id ?? null;
      if (!defaultCategoryId && !dry_run) {
        const { data: newCat, error } = await sb.from("blog_categories")
          .insert({ slug: default_category_slug, name: default_category_name ?? default_category_slug.toUpperCase() })
          .select("id").single();
        if (error) return errResult(`category: ${error.message}`);
        defaultCategoryId = newCat.id;
      }
    }

    // Candidate posts: those already linked to this sheet OR to the target topic slug
    const candidateIds = new Set<string>();
    const { data: sLinks } = await sb.from("blog_post_tags").select("post_id").eq("tag_id", sheetTagId);
    (sLinks ?? []).forEach((r: any) => candidateIds.add(r.post_id));
    if (targetTopicTagId) {
      const { data: tLinks } = await sb.from("blog_post_tags").select("post_id").eq("tag_id", targetTopicTagId);
      (tLinks ?? []).forEach((r: any) => candidateIds.add(r.post_id));
    }
    const postIds = Array.from(candidateIds);
    if (!postIds.length) {
      return jsonResult("No articles to repair.", { sheet_folder_id, fixed: 0, actions: [] });
    }

    const { data: posts } = await sb.from("blog_posts").select("id,slug,title").in("id", postIds);
    const { data: allTagLinks } = await sb.from("blog_post_tags").select("post_id,tag_id").in("post_id", postIds);
    const tagIdSet = Array.from(new Set((allTagLinks ?? []).map((r: any) => r.tag_id)));
    const { data: tagRows } = tagIdSet.length
      ? await sb.from("blog_tags").select("id,slug,name").in("id", tagIdSet)
      : { data: [] as any[] };
    const tagById = new Map((tagRows ?? []).map((t: any) => [t.id, t]));
    const tagsByPost = new Map<string, any[]>();
    for (const l of allTagLinks ?? []) {
      const t = tagById.get(l.tag_id); if (!t) continue;
      if (!tagsByPost.has(l.post_id)) tagsByPost.set(l.post_id, []);
      tagsByPost.get(l.post_id)!.push(t);
    }
    const { data: catLinks } = await sb.from("blog_post_categories").select("post_id").in("post_id", postIds);
    const hasCat = new Set((catLinks ?? []).map((r: any) => r.post_id));

    const actions: any[] = [];
    let fixed = 0;

    for (const p of posts ?? []) {
      const tags = tagsByPost.get(p.id) ?? [];
      const perPost: string[] = [];
      const sheetPresent = tags.some((t) => t.slug === sheetTagSlug(sheet_folder_id));
      const topicTags = tags.filter((t) => t.slug?.startsWith("topic-"));

      if (!sheetPresent) {
        if (!dry_run) await attachTag(sb, p.id, sheetTagId);
        perPost.push("attached_sheet_tag");
      }
      if (targetTopicTagId && !tags.some((t) => t.id === targetTopicTagId)) {
        if (!dry_run) await attachTag(sb, p.id, targetTopicTagId);
        perPost.push(`attached_topic_tag:${section_title}`);
      }
      if (remove_orphan_topic_tags && knownSections.size > 0) {
        for (const tt of topicTags) {
          const slug = tt.slug.replace(/^topic-/, "");
          if (!knownSections.has(slug)) {
            if (!dry_run) await detachTag(sb, p.id, tt.id);
            perPost.push(`detached_orphan:${slug}`);
          }
        }
      }
      if (defaultCategoryId && !hasCat.has(p.id)) {
        if (!dry_run) {
          await sb.from("blog_post_categories").upsert(
            { post_id: p.id, category_id: defaultCategoryId }, { onConflict: "post_id,category_id" },
          );
        }
        perPost.push(`attached_category:${default_category_slug}`);
      }

      if (perPost.length) {
        fixed++;
        actions.push({ slug: p.slug, title: p.title, actions: perPost });
      }
    }

    return jsonResult(
      `${dry_run ? "(dry_run) " : ""}Repaired ${fixed}/${posts?.length ?? 0} article(s) in ${folder.name}.`,
      { sheet_folder_id, sheet_name: folder.name, dry_run: !!dry_run,
        articles_scanned: posts?.length ?? 0, fixed, actions,
        known_sections: Array.from(knownSections) },
    );
  },
});
