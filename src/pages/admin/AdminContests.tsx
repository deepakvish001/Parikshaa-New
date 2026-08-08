import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Loader2, Plus, CalendarClock, Trophy, AlertCircle, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminContests, useSaveContest, useDeleteContest } from "@/hooks/admin/useAdminContests";
import type { ContestKind } from "@/hooks/useContests";


const KINDS: { value: ContestKind; label: string; example: string; defaultHours: number }[] = [
  { value: "monthly_long", label: "Monthly Long (10 days)", example: "July 2026 Monthly Long Contest - 01", defaultHours: 24 * 10 },
  { value: "weekly_saturday", label: "Saturday Weekly", example: "Saturday Weekly Contest - 01", defaultHours: 2 },
  { value: "weekly_sunday", label: "Sunday Weekly", example: "Sunday Weekly Contest - 01", defaultHours: 2 },
  { value: "biweekly", label: "BiWeekly", example: "BiWeekly Contest - 01", defaultHours: 2 },
  { value: "other", label: "Other (manual title)", example: "Custom", defaultHours: 2 },
];

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminContests() {
  const { data: contests, isLoading } = useAdminContests();
  const save = useSaveContest();
  const del = useDeleteContest();

  const [kind, setKind] = useState<ContestKind>("weekly_saturday");
  const [startsAt, setStartsAt] = useState<string>(toLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
  const [customTitle, setCustomTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problemsCsv, setProblemsCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [missingSlugs, setMissingSlugs] = useState<string[]>([]);

  const kindMeta = useMemo(() => KINDS.find(k => k.value === kind)!, [kind]);

  const parsedSlugs = useMemo(
    () => Array.from(new Set(problemsCsv.split(/[\s,]+/).map(s => s.trim()).filter(Boolean))),
    [problemsCsv]
  );

  const validateSlugs = async (slugs: string[]): Promise<string[]> => {
    if (!slugs.length) return [];
    const { data, error } = await supabase
      .from("coding_problems")
      .select("slug")
      .in("slug", slugs);
    if (error) throw error;
    const found = new Set((data ?? []).map((r: any) => r.slug));
    return slugs.filter(s => !found.has(s));
  };

  const handleValidate = async () => {
    try {
      const missing = await validateSlugs(parsedSlugs);
      setMissingSlugs(missing);
      if (!missing.length) toast.success(`All ${parsedSlugs.length} slugs exist`);
      else toast.error(`${missing.length} slug(s) not found`);
    } catch (e: any) {
      toast.error(e.message ?? "Validation failed");
    }
  };

  const handleCreate = async () => {
    try {
      setBusy(true);
      setMissingSlugs([]);
      const missing = await validateSlugs(parsedSlugs);
      if (missing.length) {
        setMissingSlugs(missing);
        throw new Error(`Cannot create: ${missing.length} problem slug(s) not found`);
      }

      const start = new Date(startsAt);
      const end = new Date(start.getTime() + kindMeta.defaultHours * 3600 * 1000);
      const payload: any = {
        kind,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        status: "published",
        visibility: "public",
        description,
        title: kind === "other" ? customTitle : "",
        slug: "",
      };
      const created = await save.mutateAsync(payload);
      if (!created) throw new Error("Failed to create");

      if (parsedSlugs.length) {
        const rows = parsedSlugs.map((slug, i) => ({
          contest_id: created.id,
          problem_slug: slug,
          order_index: i + 1,
          points: 100,
          unlock_at:
            kind === "monthly_long"
              ? new Date(start.getTime() + i * 24 * 3600 * 1000).toISOString()
              : null,
        }));
        const { error } = await supabase.from("contest_problems" as any).insert(rows as any);
        if (error) throw error;
      }
      toast.success(`Created: ${created.title}`);
      setProblemsCsv("");
      setCustomTitle("");
      setDescription("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create contest");
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-amber-400" />
        <h1 className="text-2xl font-semibold">Contests</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Contest
          </CardTitle>
          <CardDescription>
            Title & number are auto-generated from the kind. Monthly Long spans 10 days with one problem unlocking per day.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Kind</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as ContestKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KINDS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Preview: <span className="font-mono">{kindMeta.example}</span></p>
          </div>

          <div className="space-y-2">
            <Label>Starts at</Label>
            <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            <p className="text-xs text-muted-foreground">Duration: {kindMeta.defaultHours}h</p>
          </div>

          {kind === "other" && (
            <div className="space-y-2 md:col-span-2">
              <Label>Custom title</Label>
              <Input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="My Special Contest" />
            </div>
          )}

          <div className="space-y-2 md:col-span-2">
            <Label>Description (optional)</Label>
            <Textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Problem slugs {kind === "monthly_long" && "(up to 10, one per day)"}</Label>
            <Textarea
              rows={3}
              value={problemsCsv}
              onChange={e => { setProblemsCsv(e.target.value); setMissingSlugs([]); }}
              placeholder="two-sum, valid-parentheses, ..."
            />
            <p className="text-xs text-muted-foreground">
              {parsedSlugs.length} slug(s) parsed. {kind === "monthly_long" ? "Problem N unlocks on day N." : "All open at start."}
            </p>
            {missingSlugs.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Missing problems ({missingSlugs.length})</AlertTitle>
                <AlertDescription>
                  <code className="text-xs">{missingSlugs.join(", ")}</code>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="md:col-span-2 flex justify-end gap-2">
            <Button variant="outline" onClick={handleValidate} disabled={!parsedSlugs.length}>
              Validate slugs
            </Button>
            <Button onClick={handleCreate} disabled={busy || (kind === "other" && !customTitle.trim())}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create contest
            </Button>
          </div>

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" /> Existing contests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
          ) : !contests?.length ? (
            <p className="text-sm text-muted-foreground">No contests yet.</p>
          ) : (
            <div className="divide-y divide-border rounded-md border border-border">
              {contests.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/contests/${c.slug}`} className="truncate font-medium hover:underline">{c.title}</Link>
                      <Badge variant="outline" className="text-[10px]">{c.kind}</Badge>
                      {c.sequence_no != null && <Badge variant="secondary" className="text-[10px]">#{String(c.sequence_no).padStart(2, "0")}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(c.starts_at), "PP p")} → {format(new Date(c.ends_at), "PP p")} · {c.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/admin/contests/${c.id}`}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`Delete "${c.title}"?`)) del.mutate({ id: c.id, slug: c.slug });
                      }}
                    >
                      Delete
                    </Button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
