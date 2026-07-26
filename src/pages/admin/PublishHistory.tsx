import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, History as HistoryIcon, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ProblemRow = {
  slug: string;
  title: string;
  difficulty: string | null;
  is_published: boolean | null;
  updated_at: string;
  created_at: string;
};

type VersionRow = {
  id: string;
  slug: string;
  version_number: number;
  note: string | null;
  created_at: string;
  created_by: string | null;
};

type SolutionRow = {
  problem_slug: string;
  lang_id: string;
  updated_at: string | null;
};

export default function PublishHistory() {
  const [problems, setProblems] = useState<ProblemRow[]>([]);
  const [versions, setVersions] = useState<Record<string, VersionRow[]>>({});
  const [solutions, setSolutions] = useState<Record<string, SolutionRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    const sb = supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          order?: (col: string, opts: { ascending: boolean }) => any;
          limit?: (n: number) => any;
        };
      };
    };
    const [probsRes, versRes, solsRes] = await Promise.all([
      sb
        .from("coding_problems")
        .select("slug, title, difficulty, is_published, updated_at, created_at")
        .order!("updated_at", { ascending: false })
        .limit(200),
      sb
        .from("coding_problem_versions")
        .select("id, slug, version_number, note, created_at, created_by")
        .order!("created_at", { ascending: false })
        .limit(1000),
      sb.from("coding_problem_reference_solutions").select("problem_slug, lang_id, updated_at"),
    ]);
    setProblems(((probsRes as { data: ProblemRow[] | null }).data ?? []) as ProblemRow[]);
    const vers = (versRes as { data: VersionRow[] | null }).data ?? [];
    const sols = (solsRes as { data: SolutionRow[] | null }).data ?? [];
    const vMap: Record<string, VersionRow[]> = {};
    for (const v of (vers ?? []) as VersionRow[]) {
      (vMap[v.slug] ||= []).push(v);
    }
    setVersions(vMap);
    const sMap: Record<string, SolutionRow[]> = {};
    for (const s of (sols ?? []) as SolutionRow[]) {
      (sMap[s.problem_slug] ||= []).push(s);
    }
    setSolutions(sMap);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return problems;
    return problems.filter(
      (p) => p.slug.toLowerCase().includes(q) || p.title.toLowerCase().includes(q),
    );
  }, [problems, query]);

  const totalVersions = Object.values(versions).reduce((n, arr) => n + arr.length, 0);
  const totalSolutions = Object.values(solutions).reduce((n, arr) => n + arr.length, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <HistoryIcon className="h-6 w-6" /> Publish History
          </h1>
          <p className="text-sm text-muted-foreground">
            Problem versions, reference solutions, and last published time.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Problems</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{problems.length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Version snapshots</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{totalVersions}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Reference solutions</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{totalSolutions}</CardContent></Card>
      </div>

      <Input
        placeholder="Filter by slug or title…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-md"
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Problem</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Versions</TableHead>
                <TableHead>Solutions</TableHead>
                <TableHead>Last published</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No problems found.</TableCell></TableRow>
              )}
              {!loading && filtered.map((p) => {
                const vArr = versions[p.slug] ?? [];
                const sArr = solutions[p.slug] ?? [];
                const isOpen = !!openRows[p.slug];
                return (
                  <Collapsible key={p.slug} asChild open={isOpen} onOpenChange={(o) => setOpenRows((s) => ({ ...s, [p.slug]: o }))}>
                    <>
                      <TableRow>
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{p.title}</div>
                          <div className="text-xs text-muted-foreground font-mono">{p.slug}</div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{p.difficulty ?? "—"}</Badge></TableCell>
                        <TableCell>
                          {p.is_published
                            ? <Badge className="bg-green-600">Published</Badge>
                            : <Badge variant="secondary">Draft</Badge>}
                        </TableCell>
                        <TableCell>{vArr.length}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {sArr.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                            {sArr.map((s) => (
                              <Badge key={s.lang_id} variant="outline" className="text-xs">{s.lang_id}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/admin/problems/${p.slug}/edit`}>Edit</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow>
                          <TableCell colSpan={8} className="bg-muted/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                              <div>
                                <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Version snapshots</div>
                                {vArr.length === 0 && <div className="text-sm text-muted-foreground">No snapshots yet.</div>}
                                <div className="space-y-1">
                                  {vArr.map((v) => (
                                    <div key={v.id} className="flex items-start gap-2 text-sm">
                                      <Badge variant="outline" className="shrink-0">v{v.version_number}</Badge>
                                      <div className="flex-1">
                                        <div>{v.note ?? <em className="text-muted-foreground">no note</em>}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Reference solutions</div>
                                {sArr.length === 0 && <div className="text-sm text-muted-foreground">No reference solutions.</div>}
                                <div className="space-y-1">
                                  {sArr.map((s) => (
                                    <div key={s.lang_id} className="flex items-center gap-2 text-sm">
                                      <Badge variant="outline">{s.lang_id}</Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {s.updated_at ? formatDistanceToNow(new Date(s.updated_at), { addSuffix: true }) : "—"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
