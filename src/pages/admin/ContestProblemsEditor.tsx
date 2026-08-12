import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, GripVertical, Loader2, Plus, Save, Trash2, Eye, AlertCircle } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminContest, useAdminContestProblems } from "@/hooks/admin/useAdminContests";

type Row = {
  problem_slug: string;
  order_index: number;
  points: number;
  unlock_at: string | null; // ISO or null
  _key: string;
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(v: string): string | null {
  return v ? new Date(v).toISOString() : null;
}

function SortableRow({ row, onChange, onRemove, isMonthly }: {
  row: Row;
  onChange: (patch: Partial<Row>) => void;
  onRemove: () => void;
  isMonthly: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row._key });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="grid grid-cols-[auto_1fr_90px_220px_auto] items-center gap-2 border-b border-border p-2">
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        value={row.problem_slug}
        onChange={(e) => onChange({ problem_slug: e.target.value })}
        placeholder="problem-slug"
        className="font-mono text-xs"
      />
      <Input
        type="number"
        value={row.points}
        onChange={(e) => onChange({ points: parseInt(e.target.value) || 0 })}
        min={0}
      />
      <Input
        type="datetime-local"
        value={toLocalInput(row.unlock_at)}
        onChange={(e) => onChange({ unlock_at: fromLocalInput(e.target.value) })}
        placeholder={isMonthly ? "day N unlock" : "always open"}
      />
      <Button size="icon" variant="ghost" onClick={onRemove} className="text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function ContestProblemsEditor() {
  const { id } = useParams<{ id: string }>();
  const { data: contest, isLoading: cLoading } = useAdminContest(id);
  const { data: existing, isLoading: pLoading } = useAdminContestProblems(id);

  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [previewAt, setPreviewAt] = useState<string>(toLocalInput(new Date().toISOString()));

  useEffect(() => {
    if (existing) {
      setRows(existing.map((p, i) => ({
        problem_slug: p.problem_slug,
        order_index: p.order_index ?? i + 1,
        points: p.points ?? 100,
        unlock_at: p.unlock_at ?? null,
        _key: `${p.problem_slug}-${i}`,
      })));
    }
  }, [existing]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const isMonthly = contest?.kind === "monthly_long";

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setRows((old) => {
      const oi = old.findIndex(r => r._key === active.id);
      const ni = old.findIndex(r => r._key === over.id);
      return arrayMove(old, oi, ni).map((r, i) => ({ ...r, order_index: i + 1 }));
    });
  };

  const addRow = () => setRows((r) => [...r, {
    problem_slug: "", order_index: r.length + 1, points: 100, unlock_at: null,
    _key: `new-${Date.now()}`,
  }]);

  const autoScheduleMonthly = () => {
    if (!contest?.starts_at) return;
    const start = new Date(contest.starts_at).getTime();
    setRows((r) => r.map((row, i) => ({
      ...row, unlock_at: new Date(start + i * 24 * 3600 * 1000).toISOString(),
    })));
    toast.success("Applied day-by-day unlocks");
  };

  const validateAndSave = async () => {
    if (!id) return;
    setSaving(true);
    setMissing([]);
    try {
      const slugs = rows.map(r => r.problem_slug.trim()).filter(Boolean);
      if (new Set(slugs).size !== slugs.length) throw new Error("Duplicate problem slugs");
      if (!slugs.length) throw new Error("At least one problem required");

      const { data: found, error: qErr } = await supabase
        .from("coding_problems").select("slug").in("slug", slugs);
      if (qErr) throw qErr;
      const foundSet = new Set((found ?? []).map((r: any) => r.slug));
      const missingList = slugs.filter(s => !foundSet.has(s));
      if (missingList.length) {
        setMissing(missingList);
        throw new Error(`${missingList.length} slug(s) do not exist`);
      }

      // Replace all
      const del = await (supabase.from("contest_problems" as any).delete().eq("contest_id", id) as any);
      if (del.error) throw del.error;
      const insert = rows.map((r, i) => ({
        contest_id: id,
        problem_slug: r.problem_slug.trim(),
        order_index: i + 1,
        points: r.points,
        unlock_at: r.unlock_at,
      }));
      const { error } = await (supabase.from("contest_problems" as any).insert(insert as any) as any);
      if (error) throw error;
      toast.success("Problems saved");
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const previewTime = useMemo(() => (previewAt ? new Date(previewAt).getTime() : Date.now()), [previewAt]);
  const contestStart = contest ? new Date(contest.starts_at).getTime() : 0;
  const contestEnd = contest ? new Date(contest.ends_at).getTime() : 0;
  const contestActive = previewTime >= contestStart && previewTime <= contestEnd;

  const visibilityFor = (r: Row) => {
    if (!contestActive) return { visible: false, reason: previewTime < contestStart ? "Before start" : "After end" };
    if (!r.unlock_at) return { visible: true, reason: "Always open" };
    const u = new Date(r.unlock_at).getTime();
    if (previewTime >= u) return { visible: true, reason: "Unlocked" };
    return { visible: false, reason: `Unlocks ${format(new Date(r.unlock_at), "PP p")}` };
  };

  if (cLoading || pLoading) return <div className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>;
  if (!contest) return <div className="p-8">Contest not found. <Link to="/admin/contests" className="underline">Back</Link></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm"><Link to="/admin/contests"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link></Button>
          <h1 className="mt-2 text-2xl font-semibold">{contest.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{contest.kind}</Badge>
            <span>{format(new Date(contest.starts_at), "PP p")} → {format(new Date(contest.ends_at), "PP p")}</span>
            <Badge variant="secondary">{contest.status}</Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Problems ({rows.length})</CardTitle>
            <CardDescription>
              Drag to reorder. {isMonthly ? "Set per-day unlock times." : "Leave unlock blank so problems open at contest start."}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {isMonthly && <Button size="sm" variant="outline" onClick={autoScheduleMonthly}>Auto day-by-day</Button>}
            <Button size="sm" variant="outline" onClick={addRow}><Plus className="h-4 w-4 mr-1" />Add</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {missing.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Missing problems ({missing.length})</AlertTitle>
              <AlertDescription><code className="text-xs">{missing.join(", ")}</code></AlertDescription>
            </Alert>
          )}
          {rows.length > 0 && (
            <div className="grid grid-cols-[auto_1fr_90px_220px_auto] gap-2 border-b border-border px-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span />
              <span>Slug</span>
              <span>Points</span>
              <span>Unlock at</span>
              <span />
            </div>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={rows.map(r => r._key)} strategy={verticalListSortingStrategy}>
              {rows.map((r) => (
                <SortableRow
                  key={r._key}
                  row={r}
                  isMonthly={isMonthly}
                  onChange={(patch) => setRows(old => old.map(x => x._key === r._key ? { ...x, ...patch } : x))}
                  onRemove={() => setRows(old => old.filter(x => x._key !== r._key))}
                />
              ))}
            </SortableContext>
          </DndContext>
          <div className="flex justify-end pt-2">
            <Button onClick={validateAndSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Validate & save
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Eye className="h-4 w-4" />Public visibility preview</CardTitle>
          <CardDescription>Simulate a point in time — reflects the same RLS rule public users see.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label>Preview at</Label>
              <Input type="datetime-local" value={previewAt} onChange={(e) => setPreviewAt(e.target.value)} className="w-[240px]" />
            </div>
            <Button size="sm" variant="outline" onClick={() => setPreviewAt(toLocalInput(contest.starts_at))}>Contest start</Button>
            <Button size="sm" variant="outline" onClick={() => setPreviewAt(toLocalInput(new Date().toISOString()))}>Now</Button>
          </div>
          <div className="rounded-md border border-border">
            {rows.length === 0 && <p className="p-4 text-sm text-muted-foreground">No problems.</p>}
            {rows.map((r) => {
              const v = visibilityFor(r);
              return (
                <div key={r._key} className="flex items-center justify-between border-b border-border p-2 last:border-b-0">
                  <div className="font-mono text-xs">{r.problem_slug || <em className="text-muted-foreground">empty</em>}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={v.visible ? "default" : "outline"} className={v.visible ? "bg-emerald-500/20 text-emerald-300" : ""}>
                      {v.visible ? "Visible" : "Hidden"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{v.reason}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
