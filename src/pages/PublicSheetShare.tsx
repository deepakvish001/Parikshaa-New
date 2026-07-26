import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { dbmsSections, dbmsMeta } from "@/data/dbmsData";
import { cnSections, cnMeta } from "@/data/cnData";
import { osSections, osMeta } from "@/data/osData";
import { AccessErrorPanel } from "@/components/access/AccessErrorPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Lock, ExternalLink } from "lucide-react";

const BUILTINS: Record<string, { title: string; sections: any[] }> = {
  "dbms-sheet": { title: dbmsMeta.title, sections: dbmsSections as any[] },
  "cn-sheet": { title: cnMeta.title, sections: cnSections as any[] },
  "os-sheet": { title: osMeta.title, sections: osSections as any[] },
};

interface Link {
  id: string;
  slug: string;
  include_articles: boolean;
  expires_at: string | null;
  revoked: boolean;
  label: string | null;
}

export default function PublicSheetShare() {
  const { token } = useParams<{ token: string }>();
  const [link, setLink] = useState<Link | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Array<{ slug: string; title: string }>>([]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await (supabase.from as any)("builtin_sheet_share_links")
        .select("id,slug,include_articles,expires_at,revoked,label")
        .eq("token", token)
        .maybeSingle();
      if (error) {
        setError(error.message);
      } else if (!data) {
        setError("not_found");
      } else if (data.revoked) {
        setError("revoked");
      } else if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError("expired");
      } else {
        setLink(data as Link);
        // best-effort view counter
        (supabase.from as any)("builtin_sheet_share_links")
          .update({ view_count: 1, last_viewed_at: new Date().toISOString() })
          .eq("id", data.id)
          .then(() => {});
        if (data.include_articles) {
          const q = await (supabase.from as any)("topic_articles")
            .select("slug,title")
            .eq("sheet_slug", data.slug)
            .eq("status", "published");
          setArticles(q.data ?? []);
        }
      }
      setLoading(false);
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <AccessErrorPanel
            resourceKind="table"
            resource="builtin_sheet_share_links"
            message={
              error === "not_found"
                ? "This share link does not exist."
                : error === "revoked"
                  ? "This share link was revoked by an admin."
                  : error === "expired"
                    ? "This share link has expired."
                    : error ?? "Unable to load this shared sheet."
            }
          />
        </div>
      </div>
    );
  }

  const bundle = BUILTINS[link.slug];
  if (!bundle) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-foreground">Unknown sheet slug "{link.slug}"</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> Read-only shared view
          {link.expires_at && <span>· expires {new Date(link.expires_at).toLocaleString()}</span>}
        </div>
        <h1 className="text-3xl font-bold">{bundle.title}</h1>
        {link.label && <p className="text-muted-foreground">{link.label}</p>}

        <div className="space-y-4">
          {bundle.sections.map((s: any) => (
            <Card key={s.id ?? s.title}>
              <CardContent className="p-4">
                <h2 className="font-semibold mb-3">{s.title}</h2>
                <ul className="space-y-1 text-sm">
                  {(s.subSections ?? [{ topics: s.topics ?? [] }]).flatMap((ss: any) =>
                    (ss.topics ?? []).map((t: any) => (
                      <li key={t.id} className="text-muted-foreground">
                        · {t.title}
                      </li>
                    )),
                  )}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {link.include_articles && articles.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-3">Linked articles ({articles.length})</h2>
              <ul className="space-y-1 text-sm">
                {articles.map((a) => (
                  <li key={a.slug}>
                    <a
                      href={`/learn/articles/${a.slug}`}
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {a.title} <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
