import { useEffect, useMemo } from "react";
import { ArrowLeft, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BlogContent } from "@/components/blog/BlogContent";
import { InlineToc } from "@/components/blog/InlineToc";
import { extractToc } from "@/lib/blog/extractToc";
import { useBlogPost } from "@/hooks/useBlog";
import { Link } from "react-router-dom";

interface SheetArticleReaderProps {
  /** Blog slug, e.g. "dbms/what-is-dbms" */
  slug: string;
  /** Optional title fallback shown while the post loads */
  fallbackTitle?: string;
  onClose: () => void;
}

function ArticleSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <Skeleton className="h-8 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className={i % 4 === 3 ? "h-4 w-3/5" : "h-4 w-full"} />
        ))}
      </div>
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className={i % 3 === 2 ? "h-4 w-4/5" : "h-4 w-full"} />
        ))}
      </div>
    </div>
  );
}

/**
 * Renders a blog article inline inside the sheet's middle content area.
 * Navigation state lives in the URL (?article=slug) so browser back/forward
 * and deep links work without a full page load.
 */
export function SheetArticleReader({ slug, fallbackTitle, onClose }: SheetArticleReaderProps) {
  const { data: post, isLoading, isError } = useBlogPost(slug);

  const toc = useMemo(() => (post?.content_md ? extractToc(post.content_md) : []), [post?.content_md]);

  // Start each article at the top of the reader, not wherever the sheet was.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to sheet
        </Button>
      </div>

      {isLoading ? (
        <ArticleSkeleton />
      ) : isError || !post ? (
        <div className="rounded-xl border border-border/60 bg-card/40 p-8 text-center">
          <p className="font-semibold">Article not available</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {fallbackTitle ? `"${fallbackTitle}" ` : ""}could not be loaded ({slug}).
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={onClose}>
            Back to sheet
          </Button>
        </div>
      ) : (
        <article className="space-y-6">
          <header className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {post.reading_time_min ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {post.reading_time_min} min read
                </span>
              ) : null}
              {(post.categories ?? []).map((c: any) => (
                <Badge key={c.id} variant="secondary">
                  {c.name}
                </Badge>
              ))}
            </div>
          </header>

          {toc.length > 1 && <InlineToc items={toc} />}

          <BlogContent source={post.content_md ?? ""} />
        </article>
      )}
    </div>
  );
}

export default SheetArticleReader;
