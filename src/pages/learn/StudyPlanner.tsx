import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Sparkles, RefreshCw, Target, Clock, Flame, TrendingUp, ExternalLink,
  BookOpen, Code2, Database, Brain, Video, FileQuestion, Repeat,
  Play, Pause, RotateCcw, SkipForward, CalendarPlus, Copy, Filter,
  Sunrise, Sun, Moon, Trophy, Lightbulb, CheckCircle2, Eye, EyeOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  plan_id: string;
  day_date: string;
  day_index: number;
  order_index: number;
  kind: string;
  topic: string | null;
  title: string;
  description: string | null;
  estimated_minutes: number;
  resource_url: string | null;
  difficulty: string | null;
  status: string;
}

interface Plan {
  id: string;
  week_start: string;
  goal: string | null;
  target_date: string | null;
  focus_topics: string[];
  weekday_minutes: number;
  weekend_minutes: number;
  readiness_snapshot: any;
  summary: string | null;
  plan_json: any;
}

const KIND_ICON: Record<string, any> = {
  dsa: Code2, sql: Database, quiz: FileQuestion, srs: Repeat,
  interview: Brain, reading: BookOpen, mock: Video,
};
const KIND_LABEL: Record<string, string> = {
  dsa: "DSA", sql: "SQL", quiz: "Quiz", srs: "Revision",
  interview: "Interview", reading: "Reading", mock: "Mock",
};
const KIND_TIP: Record<string, string> = {
  dsa: "Dry-run on paper before coding. Note edge cases first.",
  sql: "Read schema, write query, then trace on 3-row sample.",
  quiz: "Attempt without notes; review every wrong answer aloud.",
  srs: "Recall before revealing. Rate honesty > speed.",
  interview: "Answer in STAR: Situation → Task → Action → Result.",
  reading: "Summarise in 3 bullets after each section.",
  mock: "Think aloud. Simulate real interview constraints strictly.",
};
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const QUOTES = [
  "Small daily wins compound into placements.",
  "You don't rise to the interview; you fall to your practice.",
  "One focused hour beats four distracted ones.",
  "Consistency > intensity. Show up today.",
  "The problem you avoid is the one they'll ask.",
];

function todayISO() { return new Date().toISOString().slice(0, 10); }
function fmt(min: number) { const h = Math.floor(min/60), m = min%60; return h ? `${h}h ${m}m` : `${m}m`; }

// Time-of-day suggestion per task kind
function suggestSlot(kind: string): "morning" | "afternoon" | "evening" {
  if (kind === "dsa" || kind === "mock") return "morning";
  if (kind === "quiz" || kind === "sql" || kind === "interview") return "afternoon";
  return "evening";
}
const SLOT_ICON = { morning: Sunrise, afternoon: Sun, evening: Moon } as const;
const SLOT_LABEL = { morning: "Morning", afternoon: "Afternoon", evening: "Evening" } as const;

export default function StudyPlanner() {
  const { user, authReady } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(() => (new Date().getDay() + 6) % 7);
  const [kindFilter, setKindFilter] = useState<string | null>(null);
  const [hideDone, setHideDone] = useState(false);

  // Pomodoro state (per-active-task)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const tickRef = useRef<number | null>(null);

  // Reflections & notes (localStorage-backed, no schema change)
  const reflectKey = (date: string) => `sp:reflect:${date}`;
  const noteKey = (id: string) => `sp:note:${id}`;
  const [reflection, setReflection] = useState<{ mood: number; note: string }>({ mood: 0, note: "" });
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: planRows } = await supabase
      .from("study_plans" as any).select("*").eq("user_id", user.id)
      .eq("is_active", true).order("week_start", { ascending: false }).limit(1);
    const p = planRows?.[0] as any as Plan | undefined;
    setPlan(p ?? null);
    if (p) {
      const { data: t } = await supabase
        .from("study_plan_tasks" as any).select("*").eq("plan_id", p.id)
        .order("day_index", { ascending: true }).order("order_index", { ascending: true });
      setTasks((t ?? []) as any as Task[]);
    } else setTasks([]);
    setLoading(false);
  };

  useEffect(() => { if (authReady) load(); }, [authReady, user?.id]);

  // Load reflection when day changes
  useEffect(() => {
    if (!plan) return;
    const key = reflectKey(dayDate(selectedDay));
    try {
      const raw = localStorage.getItem(key);
      setReflection(raw ? JSON.parse(raw) : { mood: 0, note: "" });
    } catch { setReflection({ mood: 0, note: "" }); }
     
  }, [selectedDay, plan?.id]);

  // Pomodoro tick
  useEffect(() => {
    if (!running) return;
    tickRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          toast.success("Focus block complete! Take a 5-min break.");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [running]);

  const generate = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-study-plan", { body: {} });
      if (error) throw error;
      toast.success("Your personalized weekly plan is ready!");
      await load();
    } catch (e: any) {
      const msg = e?.message ?? "Failed to generate plan";
      if (msg.includes("402") || msg.toLowerCase().includes("credit")) toast.error("AI credits exhausted. Add credits in workspace settings.");
      else if (msg.includes("429")) toast.error("Rate limited. Please try again in a moment.");
      else toast.error(msg);
    } finally { setGenerating(false); }
  };

  const setTaskStatus = async (task: Task, newStatus: "pending" | "done" | "skipped") => {
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));
    const { error } = await supabase.from("study_plan_tasks" as any)
      .update({ status: newStatus, completed_at: newStatus === "done" ? new Date().toISOString() : null })
      .eq("id", task.id);
    if (error) {
      toast.error("Could not update task");
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: task.status } : t));
    } else if (newStatus === "done") {
      toast.success("Nice! Task completed 🔥");
    }
  };

  const deferTask = async (task: Task) => {
    const newIdx = Math.min(6, task.day_index + 1);
    if (newIdx === task.day_index) return toast.info("Already on last day of the week.");
    const newDate = dayDate(newIdx);
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, day_index: newIdx, day_date: newDate } : t));
    const { error } = await supabase.from("study_plan_tasks" as any)
      .update({ day_index: newIdx, day_date: newDate }).eq("id", task.id);
    if (error) { toast.error("Could not move task"); load(); }
    else toast.success(`Moved to ${WEEKDAYS[newIdx]}`);
  };

  const saveNote = (taskId: string, val: string) => {
    try {
      if (val.trim()) localStorage.setItem(noteKey(taskId), val);
      else localStorage.removeItem(noteKey(taskId));
    } catch {}
  };
  const getNote = (taskId: string) => {
    try { return localStorage.getItem(noteKey(taskId)) ?? ""; } catch { return ""; }
  };

  const saveReflection = (r: { mood: number; note: string }) => {
    setReflection(r);
    try { localStorage.setItem(reflectKey(dayDate(selectedDay)), JSON.stringify(r)); } catch {}
  };

  const startFocus = (task: Task) => {
    setActiveTaskId(task.id);
    setSecondsLeft(Math.min(task.estimated_minutes, 50) * 60 || 25 * 60);
    setRunning(true);
    toast.info(`Focus started · ${task.title}`);
  };

  const weekStart = plan ? new Date(plan.week_start) : null;
  const dayDate = (idx: number) => {
    if (!weekStart) return "";
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + idx);
    return d.toISOString().slice(0, 10);
  };
  const todayIdx = (() => {
    if (!plan) return -1;
    const t = todayISO();
    for (let i = 0; i < 7; i++) if (dayDate(i) === t) return i;
    return -1;
  })();

  const dayGroups = useMemo(() => {
    const g: Record<number, Task[]> = {};
    tasks.forEach((t) => { g[t.day_index] ??= []; g[t.day_index].push(t); });
    return g;
  }, [tasks]);

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.status === "done").length;
    const total = tasks.length;
    const totalMin = tasks.reduce((s, t) => s + (t.estimated_minutes ?? 0), 0);
    const doneMin = tasks.filter((t) => t.status === "done").reduce((s, t) => s + (t.estimated_minutes ?? 0), 0);
    let streak = 0;
    for (let i = 0; i < 7; i++) {
      const dt = (dayGroups[i] ?? []);
      if (dt.some((t) => t.status === "done")) streak++;
      else if (i <= todayIdx) break;
    }
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0, totalMin, doneMin, streak };
  }, [tasks, dayGroups, todayIdx]);

  const readinessScore = plan?.readiness_snapshot?.score ?? plan?.readiness_snapshot?.computed_score ?? 0;

  const rawDayTasks = dayGroups[selectedDay] ?? [];
  const currentDayTasks = rawDayTasks
    .filter((t) => (kindFilter ? t.kind === kindFilter : true))
    .filter((t) => (hideDone ? t.status !== "done" : true));

  // Group by suggested slot
  const bySlot = useMemo(() => {
    const g: Record<"morning" | "afternoon" | "evening", Task[]> = { morning: [], afternoon: [], evening: [] };
    currentDayTasks.forEach((t) => g[suggestSlot(t.kind)].push(t));
    return g;
  }, [currentDayTasks]);

  const nextUp = rawDayTasks.find((t) => t.status === "pending");

  const kindsInDay = Array.from(new Set(rawDayTasks.map((t) => t.kind)));
  const dayDoneCount = rawDayTasks.filter((t) => t.status === "done").length;
  const dayTotalMin = rawDayTasks.reduce((s, t) => s + t.estimated_minutes, 0);
  const dayDoneMin = rawDayTasks.filter((t) => t.status === "done").reduce((s, t) => s + t.estimated_minutes, 0);
  const dailyBudget = selectedDay >= 5 ? (plan?.weekend_minutes ?? 120) : (plan?.weekday_minutes ?? 60);

  const quote = QUOTES[(new Date().getDate() + selectedDay) % QUOTES.length];

  const copyMarkdown = () => {
    if (!plan) return;
    const lines = [`# Weekly Study Plan — week of ${plan.week_start}`, plan.summary ?? "", ""];
    for (let i = 0; i < 7; i++) {
      const dt = dayGroups[i] ?? [];
      if (!dt.length) continue;
      lines.push(`## ${WEEKDAYS[i]} (${dayDate(i)})`);
      dt.forEach((t) => lines.push(`- [${t.status === "done" ? "x" : " "}] **${KIND_LABEL[t.kind] ?? t.kind}** · ${t.title} _(${t.estimated_minutes}m${t.difficulty ? ", " + t.difficulty : ""})_`));
      lines.push("");
    }
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Plan copied as markdown");
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;

  return (
    <div className="min-h-screen bg-transparent">
      <Helmet>
        <title>Study Planner · Personalized Weekly Plan | Parikshaa</title>
        <meta name="description" content="AI-powered personalized weekly study plan with focus timer, daily reflections, and adaptive tasks built from your weak topics and readiness score." />
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
              <Sparkles className="h-6 w-6 text-amber-400" />
              Personalized Study Planner
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              AI-crafted weekly plan with focus timer, daily reflections & adaptive scheduling.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {plan && (
              <Button variant="outline" size="sm" onClick={copyMarkdown} className="border-amber-400/30">
                <Copy className="mr-2 h-4 w-4" /> Export
              </Button>
            )}
            <Button
              onClick={generate}
              disabled={generating || !user}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:opacity-90"
            >
              {generating ? (<><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Generating…</>)
                : plan ? (<><RefreshCw className="mr-2 h-4 w-4" /> Regenerate</>)
                : (<><Sparkles className="mr-2 h-4 w-4" /> Generate my plan</>)}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>
        ) : !plan ? (
          <Card className="border-amber-400/30 bg-gradient-to-br from-amber-500/[0.05] to-orange-500/[0.03] p-8 text-center">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-amber-400" />
            <h2 className="mb-2 text-lg font-semibold">No plan yet</h2>
            <p className="mx-auto mb-4 max-w-md text-sm text-muted-foreground">
              Generate your first personalized weekly plan. It uses your weak sheets, due SRS cards,
              recent quiz scores, and study time budget to build a realistic daily checklist.
            </p>
            <p className="text-xs text-muted-foreground">
              Tip: set your goal & daily minutes in <Link to="/settings" className="text-amber-300 underline-offset-2 hover:underline">Settings</Link> for a sharper plan.
            </p>
          </Card>
        ) : (
          <>
            {/* Stats row */}
            <div className="mb-6 grid gap-3 md:grid-cols-5">
              <Card className="border-amber-400/25 bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Readiness</div>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{readinessScore}<span className="text-sm text-muted-foreground">/100</span></div>
                <Progress value={readinessScore} className="mt-2 h-1.5" />
              </Card>
              <Card className="border-amber-400/25 bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Weekly progress</div>
                  <Flame className="h-4 w-4 text-orange-400" />
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{stats.done}/{stats.total}</div>
                <Progress value={stats.pct} className="mt-2 h-1.5" />
              </Card>
              <Card className="border-amber-400/25 bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Time this week</div>
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{fmt(stats.doneMin)}<span className="text-sm text-muted-foreground"> / {fmt(stats.totalMin)}</span></div>
              </Card>
              <Card className="border-amber-400/25 bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Consistency</div>
                  <Trophy className="h-4 w-4 text-amber-400" />
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{stats.streak}<span className="text-sm text-muted-foreground"> day{stats.streak === 1 ? "" : "s"}</span></div>
                <div className="mt-1 text-[11px] text-muted-foreground">Days with ≥1 completed task</div>
              </Card>
              <Card className="border-amber-400/25 bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Focus areas</div>
                  <Target className="h-4 w-4 text-amber-400" />
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(plan.focus_topics ?? []).slice(0, 4).map((t) => (
                    <Badge key={t} variant="outline" className="border-amber-400/30 text-[10px]">{t}</Badge>
                  ))}
                </div>
              </Card>
            </div>

            {/* Summary + Quote */}
            <div className="mb-6 grid gap-3 md:grid-cols-3">
              {plan.summary && (
                <Card className="border-amber-400/25 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.02] p-4 md:col-span-2">
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <p className="text-sm leading-relaxed text-foreground/90">{plan.summary}</p>
                  </div>
                </Card>
              )}
              <Card className="border-amber-400/20 bg-card/50 p-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <p className="text-xs italic leading-relaxed text-muted-foreground">"{quote}"</p>
                </div>
              </Card>
            </div>

            {/* Next-up spotlight */}
            {nextUp && (
              <Card className="mb-4 border-emerald-400/25 bg-gradient-to-r from-emerald-500/[0.06] to-transparent p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-md bg-emerald-500/15 p-2"><Play className="h-4 w-4 text-emerald-300" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-wider text-emerald-300/80">Next up · {WEEKDAYS[selectedDay]}</div>
                    <div className="truncate text-sm font-medium">{nextUp.title}</div>
                    <div className="text-[11px] text-muted-foreground">{KIND_LABEL[nextUp.kind]} · {nextUp.estimated_minutes}m · {KIND_TIP[nextUp.kind]}</div>
                  </div>
                  <Button size="sm" onClick={() => startFocus(nextUp)} className="bg-emerald-500 text-black hover:bg-emerald-400">
                    Start focus
                  </Button>
                </div>
              </Card>
            )}

            {/* Pomodoro bar */}
            {activeTask && (
              <Card className="mb-4 border-amber-400/40 bg-amber-500/[0.06] p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="font-mono text-2xl tabular-nums text-amber-200">{mm}:{ss}</div>
                  <div className="min-w-0 flex-1 truncate text-xs text-muted-foreground">Focus · {activeTask.title}</div>
                  <Button size="sm" variant="outline" onClick={() => setRunning((r) => !r)} className="border-amber-400/40">
                    {running ? <><Pause className="mr-1 h-3.5 w-3.5" /> Pause</> : <><Play className="mr-1 h-3.5 w-3.5" /> Resume</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setSecondsLeft(25*60); setRunning(false); }} className="border-amber-400/40">
                    <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setActiveTaskId(null); setRunning(false); }} className="border-border/40">
                    Close
                  </Button>
                </div>
              </Card>
            )}

            {/* Day tabs */}
            <div className="mb-4 grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((wd, i) => {
                const dt = dayGroups[i] ?? [];
                const dn = dt.filter((t) => t.status === "done").length;
                const pct = dt.length ? Math.round((dn / dt.length) * 100) : 0;
                const isToday = i === todayIdx;
                const isSelected = i === selectedDay;
                return (
                  <button key={i} onClick={() => setSelectedDay(i)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-all",
                      isSelected ? "border-amber-400/60 bg-amber-500/10 text-amber-100"
                        : "border-border/40 bg-card/40 text-muted-foreground hover:border-amber-400/30 hover:text-foreground",
                      isToday && !isSelected && "ring-1 ring-amber-400/40",
                    )}>
                    <span className="font-semibold">{wd}</span>
                    <span className="text-[10px] tabular-nums">{dn}/{dt.length}</span>
                    <div className="h-1 w-full overflow-hidden rounded bg-border/40">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400" style={{ width: `${pct}%` }} />
                    </div>
                    {isToday && <span className="text-[9px] uppercase text-amber-300">Today</span>}
                  </button>
                );
              })}
            </div>

            {/* Day toolbar */}
            <Card className="mb-3 border-amber-400/25 bg-card/50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  {WEEKDAYS[selectedDay]} · <span className="text-muted-foreground font-normal">{dayDate(selectedDay)}</span>
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="tabular-nums">{dayDoneCount}/{rawDayTasks.length} done</span>
                  <span>·</span>
                  <span className="tabular-nums">{fmt(dayDoneMin)} / {fmt(dayTotalMin)} planned</span>
                  <span>·</span>
                  <span className="tabular-nums">budget {fmt(dailyBudget)}</span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <button
                  onClick={() => setKindFilter(null)}
                  className={cn("rounded-full border px-2 py-0.5 text-[10px]",
                    !kindFilter ? "border-amber-400/60 bg-amber-500/10 text-amber-100" : "border-border/40 text-muted-foreground")}>
                  All
                </button>
                {kindsInDay.map((k) => {
                  const Icon = KIND_ICON[k] ?? BookOpen;
                  const active = kindFilter === k;
                  return (
                    <button key={k} onClick={() => setKindFilter(active ? null : k)}
                      className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]",
                        active ? "border-amber-400/60 bg-amber-500/10 text-amber-100" : "border-border/40 text-muted-foreground hover:border-amber-400/30")}>
                      <Icon className="h-3 w-3" /> {KIND_LABEL[k] ?? k}
                    </button>
                  );
                })}
                <button onClick={() => setHideDone((v) => !v)}
                  className={cn("ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]",
                    hideDone ? "border-amber-400/60 bg-amber-500/10 text-amber-100" : "border-border/40 text-muted-foreground hover:border-amber-400/30")}>
                  {hideDone ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />} {hideDone ? "Hidden" : "Show"} done
                </button>
              </div>
            </Card>

            {/* Tasks grouped by suggested slot */}
            {rawDayTasks.length === 0 ? (
              <Card className="border-amber-400/25 bg-card/50 p-8 text-center text-sm text-muted-foreground">
                Rest day. Recover — walk, sleep well, come back stronger.
              </Card>
            ) : (
              <div className="space-y-3">
                {(["morning", "afternoon", "evening"] as const).map((slot) => {
                  const items = bySlot[slot];
                  if (!items.length) return null;
                  const SIcon = SLOT_ICON[slot];
                  const slotMin = items.reduce((s, t) => s + t.estimated_minutes, 0);
                  return (
                    <Card key={slot} className="border-amber-400/25 bg-card/50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <SIcon className="h-4 w-4 text-amber-400" /> {SLOT_LABEL[slot]}
                        </div>
                        <span className="text-[11px] text-muted-foreground tabular-nums">{fmt(slotMin)}</span>
                      </div>
                      <ul className="space-y-2">
                        {items.map((task) => {
                          const Icon = KIND_ICON[task.kind] ?? BookOpen;
                          const done = task.status === "done";
                          const skipped = task.status === "skipped";
                          const noteOpen = expandedNoteId === task.id;
                          return (
                            <li key={task.id}
                              className={cn(
                                "group rounded-lg border border-border/40 bg-background/40 p-3 transition-all",
                                done && "opacity-60",
                                skipped && "opacity-50",
                                activeTaskId === task.id && "border-amber-400/60 ring-1 ring-amber-400/30",
                              )}>
                              <div className="flex items-start gap-3">
                                <Checkbox checked={done} onCheckedChange={() => setTaskStatus(task, done ? "pending" : "done")} className="mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="border-amber-400/30 text-[10px]">
                                      <Icon className="mr-1 h-3 w-3" />{KIND_LABEL[task.kind] ?? task.kind}
                                    </Badge>
                                    {task.topic && <Badge variant="secondary" className="text-[10px]">{task.topic}</Badge>}
                                    {task.difficulty && (
                                      <Badge variant="outline" className={cn("text-[10px]",
                                        task.difficulty === "easy" && "border-emerald-400/40 text-emerald-300",
                                        task.difficulty === "medium" && "border-amber-400/40 text-amber-300",
                                        task.difficulty === "hard" && "border-rose-400/40 text-rose-300")}>
                                        {task.difficulty}
                                      </Badge>
                                    )}
                                    {skipped && <Badge variant="outline" className="border-muted/40 text-[10px] text-muted-foreground">skipped</Badge>}
                                    <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
                                      <Clock className="mr-0.5 inline h-3 w-3" />{task.estimated_minutes}m
                                    </span>
                                  </div>
                                  <h3 className={cn("mt-1.5 text-sm font-medium", done && "line-through")}>{task.title}</h3>
                                  {task.description && <p className="mt-0.5 text-xs text-muted-foreground">{task.description}</p>}
                                  <p className="mt-1 flex items-start gap-1 text-[11px] italic text-amber-200/70">
                                    <Lightbulb className="mt-0.5 h-3 w-3 shrink-0" /> {KIND_TIP[task.kind]}
                                  </p>

                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    {!done && (
                                      <Button size="sm" variant="outline" onClick={() => startFocus(task)} className="h-7 border-amber-400/30 px-2 text-[11px]">
                                        <Play className="mr-1 h-3 w-3" /> Focus
                                      </Button>
                                    )}
                                    {task.resource_url && (
                                      <Link to={task.resource_url}
                                        className="inline-flex items-center gap-1 rounded-md border border-border/40 px-2 py-1 text-[11px] text-amber-300 hover:border-amber-400/40 hover:text-amber-200">
                                        Open <ExternalLink className="h-3 w-3" />
                                      </Link>
                                    )}
                                    {!done && !skipped && (
                                      <Button size="sm" variant="ghost" onClick={() => setTaskStatus(task, "skipped")} className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground">
                                        <SkipForward className="mr-1 h-3 w-3" /> Skip
                                      </Button>
                                    )}
                                    {!done && (
                                      <Button size="sm" variant="ghost" onClick={() => deferTask(task)} className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground">
                                        <CalendarPlus className="mr-1 h-3 w-3" /> Tomorrow
                                      </Button>
                                    )}
                                    <Button size="sm" variant="ghost" onClick={() => setExpandedNoteId(noteOpen ? null : task.id)}
                                      className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground">
                                      {noteOpen ? "Hide note" : "Add note"}
                                    </Button>
                                  </div>

                                  {noteOpen && (
                                    <Textarea
                                      defaultValue={getNote(task.id)}
                                      onBlur={(e) => saveNote(task.id, e.target.value)}
                                      placeholder="Quick note — insight, blocker, or link to your solution."
                                      className="mt-2 min-h-[70px] text-xs"
                                    />
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Daily reflection */}
            <Card className="mt-4 border-amber-400/25 bg-card/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold">End-of-day reflection</h3>
                <span className="ml-auto text-[11px] text-muted-foreground">Private · saved on this device</span>
              </div>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Energy today:</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => saveReflection({ ...reflection, mood: n })}
                    className={cn("h-7 w-7 rounded-full border text-xs font-semibold",
                      reflection.mood === n ? "border-amber-400/60 bg-amber-500/15 text-amber-100" : "border-border/40 text-muted-foreground hover:border-amber-400/30")}>
                    {n}
                  </button>
                ))}
              </div>
              <Textarea
                value={reflection.note}
                onChange={(e) => saveReflection({ ...reflection, note: e.target.value })}
                placeholder="What went well? What blocked you? One thing to fix tomorrow."
                className="min-h-[70px] text-xs"
              />
            </Card>

            {/* Gaps */}
            {plan.readiness_snapshot?.gaps?.length > 0 && (
              <Card className="mt-4 border-amber-400/20 bg-card/40 p-4">
                <h3 className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Gaps to close</h3>
                <div className="flex flex-wrap gap-1.5">
                  {plan.readiness_snapshot.gaps.slice(0, 12).map((g: string) => (
                    <Badge key={g} variant="outline" className="border-rose-400/30 text-rose-200/90">{g}</Badge>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
