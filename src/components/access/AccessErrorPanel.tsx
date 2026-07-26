import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type Kind = "table" | "builtin_sheet" | "user_folder" | "topic_article";

interface Props {
  resourceKind: Kind;
  resource: string;
  message?: string;
  onRetry?: () => void;
}

interface Diag {
  auth_uid: string | null;
  is_admin: boolean;
  is_owner: boolean;
  probe_ok: boolean;
  probe_error: string | null;
  probe_count: number | null;
  policy_path: string[];
}

/**
 * Renders the exact RLS decision path when a sheet or article read is blocked.
 * Mirrors the `debug_mcp_read_failure` MCP tool logic against the current
 * browser session so users get instant, in-page diagnostics.
 */
export function AccessErrorPanel({ resourceKind, resource, message, onRetry }: Props) {
  const [diag, setDiag] = useState<Diag | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id ?? null;
      let isAdmin = false;
      let isOwner = false;
      if (uid) {
        const [a, o] = await Promise.all([
          supabase.rpc("has_role", { _user_id: uid, _role: "admin" }),
          supabase.rpc("has_role", { _user_id: uid, _role: "owner" }),
        ]);
        isAdmin = Boolean(a.data);
        isOwner = Boolean(o.data);
      }

      let probe_ok = false;
      let probe_error: string | null = null;
      let probe_count: number | null = null;
      const policy_path: string[] = [];

      if (resourceKind === "builtin_sheet") {
        const builtins = ["dbms-sheet", "cn-sheet", "os-sheet"];
        probe_ok = builtins.includes(resource);
        probe_count = probe_ok ? 1 : 0;
        policy_path.push(
          "resource: static frontend bundle (no RLS)",
          probe_ok ? "slug found → readable to any signed-in user" : "unknown slug",
        );
      } else if (resourceKind === "user_folder") {
        const q = await supabase
          .from("user_folders")
          .select("id", { count: "exact", head: true })
          .eq("slug", resource);
        probe_ok = !q.error;
        probe_error = q.error?.message ?? null;
        probe_count = q.count ?? null;
        policy_path.push(
          "table: public.user_folders",
          "policy: user_id = auth.uid() OR has_role(auth.uid(),'admin'|'owner')",
          isAdmin || isOwner
            ? "→ admin/owner branch should allow"
            : "→ non-admin: only rows you own are visible",
        );
      } else if (resourceKind === "topic_article") {
        const q = await supabase
          .from("topic_articles")
          .select("id,status", { count: "exact", head: true })
          .eq("slug", resource);
        probe_ok = !q.error;
        probe_error = q.error?.message ?? null;
        probe_count = q.count ?? null;
        policy_path.push(
          "table: topic_articles",
          "policy: published visible to authenticated; draft/archived admin/owner only",
          isAdmin || isOwner ? "→ admin/owner: full read" : "→ non-admin: published only",
        );
      } else {
        policy_path.push(`table: public.${resource}`, "Inspect via MCP debug_mcp_read_failure.");
      }

      if (!cancelled) {
        setDiag({
          auth_uid: uid,
          is_admin: isAdmin,
          is_owner: isOwner,
          probe_ok,
          probe_error,
          probe_count,
          policy_path,
        });
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resourceKind, resource]);

  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-destructive">Access blocked</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {message ?? `Cannot read ${resourceKind}: ${resource}`}
            </p>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Running RLS decision trace…
          </div>
        ) : diag ? (
          <div className="rounded-md border bg-background/60 p-3 text-xs font-mono space-y-1">
            <div>
              <span className="text-muted-foreground">auth.uid:</span>{" "}
              {diag.auth_uid ?? <span className="text-destructive">null (not signed in)</span>}
            </div>
            <div>
              <span className="text-muted-foreground">roles:</span>{" "}
              admin={String(diag.is_admin)} owner={String(diag.is_owner)}
            </div>
            <div>
              <span className="text-muted-foreground">probe:</span>{" "}
              ok={String(diag.probe_ok)} count={diag.probe_count ?? "n/a"}
              {diag.probe_error && (
                <span className="text-destructive"> err={diag.probe_error}</span>
              )}
            </div>
            <div className="pt-1 text-muted-foreground">RLS decision path:</div>
            <ol className="list-decimal list-inside space-y-0.5">
              {diag.policy_path.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" /> Diagnostic unavailable.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AccessErrorPanel;
