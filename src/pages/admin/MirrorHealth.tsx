import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, CloudCog, Database, RefreshCw, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type LogRow = {
  id: string;
  kind: string;
  ok: boolean;
  details: Record<string, unknown> | null;
  created_at: string;
};

type OutboxStat = { pending: number; failed: number; oldest: string | null };

const Stat = ({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "ok" | "warn" | "bad";
}) => (
  <Card className="p-4">
    <div className="mb-1 text-xs text-muted-foreground">{label}</div>
    <div
      className={
        "text-2xl font-semibold " +
        (tone === "bad"
          ? "text-destructive"
          : tone === "warn"
            ? "text-amber-500"
            : "")
      }
    >
      {value}
    </div>
    {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
  </Card>
);

const MirrorHealth = () => {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [outbox, setOutbox] = useState<OutboxStat>({ pending: 0, failed: 0, oldest: null });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [logRes, pendingRes, failedRes, oldestRes] = await Promise.all([
      supabase
        .from("mirror_sync_log")
        .select("id, kind, ok, details, created_at")
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("mirror_outbox")
        .select("id", { count: "exact", head: true })
        .is("synced_at", null),
      supabase
        .from("mirror_outbox")
        .select("id", { count: "exact", head: true })
        .is("synced_at", null)
        .gte("attempts", 5),
      supabase
        .from("mirror_outbox")
        .select("created_at")
        .is("synced_at", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    setLogs((logRes.data ?? []) as LogRow[]);
    setOutbox({
      pending: pendingRes.count ?? 0,
      failed: failedRes.count ?? 0,
      oldest: (oldestRes.data as { created_at?: string } | null)?.created_at ?? null,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const runSync = async (kind: "drain" | "full") => {
    setSyncing(kind);
    try {
      const fn = kind === "drain" ? "mirror-drain" : "mirror-sync-full";
      const { error } = await supabase.functions.invoke(fn, { body: {} });
      if (error) throw error;
      toast.success(kind === "drain" ? "Row sync triggered" : "Full sync triggered");
      setTimeout(load, 2500);
    } catch (e) {
      toast.error((e as Error).message ?? "Sync failed");
    } finally {
      setSyncing(null);
    }
  };

  const lastOf = (kind: string) => logs.find((l) => l.kind === kind);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <CloudCog className="h-5 w-5 text-primary" /> Mirror Health
          </h1>
          <p className="text-sm text-muted-foreground">
            Backup replica status. Rows sync every 10s, storage/auth/schema every 5 min.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={"mr-1.5 h-3.5 w-3.5 " + (loading ? "animate-spin" : "")} />
            Refresh
          </Button>
          <Button size="sm" variant="secondary" onClick={() => runSync("drain")} disabled={!!syncing}>
            Sync rows now
          </Button>
          <Button size="sm" onClick={() => runSync("full")} disabled={!!syncing}>
            Full sync now
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Pending rows"
          value={outbox.pending}
          tone={outbox.pending > 500 ? "warn" : "ok"}
          hint={
            outbox.oldest
              ? `oldest ${formatDistanceToNow(new Date(outbox.oldest), { addSuffix: true })}`
              : "queue empty"
          }
        />
        <Stat
          label="Stuck rows (5+ tries)"
          value={outbox.failed}
          tone={outbox.failed > 0 ? "bad" : "ok"}
        />
        {(["storage", "auth", "schema"] as const).map((k) => {
          const l = lastOf(k);
          return (
            <Stat
              key={k}
              label={`Last ${k} sync`}
              value={l ? (l.ok ? "OK" : "Failed") : "—"}
              tone={l ? (l.ok ? "ok" : "bad") : "warn"}
              hint={
                l ? formatDistanceToNow(new Date(l.created_at), { addSuffix: true }) : "no runs yet"
              }
            />
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" /> Recent sync runs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sync runs logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{l.kind}</Badge>
                      </TableCell>
                      <TableCell>
                        {l.ok ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
                            <CheckCircle2 className="h-3.5 w-3.5" /> ok
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-destructive">
                            <XCircle className="h-3.5 w-3.5" /> failed
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[520px]">
                        <code className="block truncate text-xs text-muted-foreground">
                          {JSON.stringify(l.details ?? {})}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MirrorHealth;
