import React, { useMemo, useEffect, useRef } from "react";
import { Clock, Layers, CalendarDays, Sparkles, PauseCircle, CalendarOff } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { computeEtaWeeks } from "@/lib/blind75Schedule";

interface Topic {
  id: string;
  title: string;
  completed: boolean;
  difficulty: "Easy" | "Medium" | "Hard";
  estTime?: string;
}
interface SubSection { id: string; title: string; topics: Topic[] }
interface Section { id: string; title: string; subSections: SubSection[] }

export interface Blind75Prefs {
  weeks: number;
  hoursPerWeek: number;
  difficulties: string[];
  topics: string[];
  groupBy: "weeks" | "topics";
}

// Note: `hoursPerWeek` field stores hours-per-DAY (legacy key kept for back-compat).
// Weekly budget is derived as hoursPerDay * 7.
export const DEFAULT_BLIND75_PREFS: Blind75Prefs = {
  weeks: 8,
  hoursPerWeek: 2,
  difficulties: ["Easy", "Medium", "Hard"],
  topics: [],
  groupBy: "topics",
};

export function parseEstMinutes(s?: string): number {
  if (!s) return 20;
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 20;
}

const LS_KEY = "blind75-study-plan-prefs";
const SHEET_ID = "blind-75";

function sanitize(p: Partial<Blind75Prefs>, allTopics: string[]): Blind75Prefs {
  return {
    weeks: typeof p.weeks === "number" ? Math.max(0, Math.min(26, Math.floor(p.weeks))) : 8,
    hoursPerWeek: typeof p.hoursPerWeek === "number" ? Math.max(0, Math.min(12, Math.floor(p.hoursPerWeek))) : 2,
    difficulties: Array.isArray(p.difficulties) ? p.difficulties : ["Easy","Medium","Hard"],
    topics: Array.isArray(p.topics) && p.topics.length ? p.topics : allTopics,
    groupBy: p.groupBy === "weeks" ? "weeks" : "topics",
  };
}

export function loadBlind75Prefs(allTopics: string[]): Blind75Prefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return sanitize({}, allTopics);
    return sanitize(JSON.parse(raw), allTopics);
  } catch {
    return sanitize({}, allTopics);
  }
}

const DIFF_DOT: Record<string, string> = {
  Easy: "bg-emerald-500",
  Medium: "bg-amber-500",
  Hard: "bg-rose-500",
};
const DIFF_TEXT: Record<string, string> = {
  Easy: "text-emerald-500 dark:text-emerald-400",
  Medium: "text-amber-500 dark:text-amber-400",
  Hard: "text-rose-500 dark:text-rose-400",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/80 uppercase mb-2.5">
      {children}
    </p>
  );
}

export default function Blind75StudyPlan({
  sections,
  prefs,
  onChange,
}: {
  sections: Section[];
  prefs: Blind75Prefs;
  onChange: (p: Blind75Prefs) => void;
}) {
  const { user } = useAuth();
  const allTopics: string[] = useMemo(() => sections.map((s) => s.title), [sections]);
  const hydratedRef = useRef(false);

  // Persist locally on every change
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(prefs)); } catch {}
  }, [prefs]);

  // Hydrate from Supabase once per user mount (server wins if newer than localStorage)
  useEffect(() => {
    if (!user || hydratedRef.current) return;
    hydratedRef.current = true;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("user_sheet_prefs")
        .select("prefs")
        .eq("user_id", user.id)
        .eq("sheet_id", SHEET_ID)
        .maybeSingle();
      if (cancelled || error || !data?.prefs) return;
      const remote = sanitize(data.prefs as Partial<Blind75Prefs>, allTopics);
      onChange(remote);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Debounced upsert to Supabase
  const upsertTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!user) return;
    if (upsertTimer.current) window.clearTimeout(upsertTimer.current);
    upsertTimer.current = window.setTimeout(() => {
      supabase
        .from("user_sheet_prefs")
        .upsert(
          { user_id: user.id, sheet_id: SHEET_ID, prefs: prefs as any },
          { onConflict: "user_id,sheet_id" }
        )
        .then(() => {});
    }, 600);
    return () => {
      if (upsertTimer.current) window.clearTimeout(upsertTimer.current);
    };
  }, [prefs, user]);

  const flat = useMemo(() => {
    const out: { id: string; topic: string; difficulty: string; completed: boolean; estTime?: string }[] = [];
    sections.forEach((sec) =>
      sec.subSections.forEach((sub) =>
        sub.topics.forEach((t) =>
          out.push({ id: t.id, topic: sec.title, difficulty: t.difficulty, completed: t.completed, estTime: t.estTime })
        )
      )
    );
    return out;
  }, [sections]);

  const diffSet = new Set(prefs.difficulties);
  const topicSet = new Set(prefs.topics.length ? prefs.topics : allTopics);

  const filtered = useMemo(
    () => flat.filter((t) => diffSet.has(t.difficulty) && topicSet.has(t.topic)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flat, prefs.difficulties, prefs.topics]
  );

  const neededMinutes = filtered.reduce((s, t) => s + parseEstMinutes(t.estTime), 0);
  const neededHours = Math.round(neededMinutes / 60);
  const hoursPerDay = prefs.hoursPerWeek; // legacy field name, now per-day
  const weeklyHours = hoursPerDay * 7;
  const scheduleHours = prefs.weeks * weeklyHours;
  const scheduleMinutes = scheduleHours * 60;
  const notScheduled = prefs.weeks === 0 || hoursPerDay === 0;
  const fits = !notScheduled && scheduleMinutes >= neededMinutes;
  const overBudget = !notScheduled && scheduleMinutes < neededMinutes;

  const etaWeeks = computeEtaWeeks(neededMinutes, weeklyHours);
  const extraHours = overBudget ? Math.ceil((neededMinutes - scheduleMinutes) / 60) : 0;
  const coveragePct = neededMinutes > 0
    ? Math.min(100, Math.round((Math.min(scheduleMinutes, neededMinutes) / neededMinutes) * 100))
    : 0;

  // Pacing strip — share the same bucketer that Week Wise uses

  const diffCounts = { Easy: 0, Medium: 0, Hard: 0 } as Record<string, number>;
  const topicCounts: Record<string, number> = {};
  filtered.forEach((t) => {
    diffCounts[t.difficulty] = (diffCounts[t.difficulty] || 0) + 1;
    topicCounts[t.topic] = (topicCounts[t.topic] || 0) + 1;
  });

  const completedCount = filtered.filter((t) => t.completed).length;
  const totalCount = filtered.length;
  const completedPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const allSelected = topicSet.size === allTopics.length;

  const toggleDifficulty = (d: string) => {
    const s = new Set(prefs.difficulties);
    if (s.has(d)) s.delete(d); else s.add(d);
    onChange({ ...prefs, difficulties: Array.from(s) });
  };
  const toggleTopic = (t: string) => {
    const s = new Set(topicSet);
    if (s.has(t)) s.delete(t); else s.add(t);
    onChange({ ...prefs, topics: Array.from(s) });
  };

  const statusChip = notScheduled
    ? { cls: "border-border/60 bg-muted/40 text-muted-foreground", label: prefs.weeks === 0 ? "Not scheduled" : "Paused" }
    : fits
      ? { cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500", label: "On track" }
      : { cls: "border-rose-500/30 bg-rose-500/10 text-rose-500", label: "Over budget" };

  return (
    <div className="space-y-5">
      {/* Group-by segmented toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Personalize how the problems table groups & flows.</span>
        </div>
        <div className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 p-1">
          {[
            { v: "topics", label: "Topics", icon: Layers },
            { v: "weeks", label: "Weeks", icon: CalendarDays },
          ].map(({ v, label, icon: Icon }) => {
            const active = prefs.groupBy === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => onChange({ ...prefs, groupBy: v as "weeks" | "topics" })}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all",
                  active
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Preferences */}
        <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-card/60 to-card/30 p-5 space-y-6">
          <div>
            <SectionLabel>Schedule</SectionLabel>
            <div className="space-y-4">
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Weeks</span>
                  <span className={cn("text-sm font-semibold", prefs.weeks === 0 ? "text-muted-foreground" : "text-primary")}>
                    {prefs.weeks === 0 ? "Not scheduled" : prefs.weeks}
                  </span>
                </div>
                <Slider value={[prefs.weeks]} min={0} max={26} step={1}
                  onValueChange={(v) => onChange({ ...prefs, weeks: v[0] })} />
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Hours / day</span>
                  <span className={cn("text-sm font-semibold", hoursPerDay === 0 ? "text-muted-foreground" : "text-primary")}>
                    {hoursPerDay === 0 ? "Paused" : `${hoursPerDay}h`}
                  </span>
                </div>
                <Slider value={[hoursPerDay]} min={0} max={12} step={1}
                  onValueChange={(v) => onChange({ ...prefs, hoursPerWeek: v[0] })} />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                <Clock className="h-3 w-3" />
                <span>Budget: <span className="text-foreground font-medium">{scheduleHours}h</span>
                  {!notScheduled && <span className="ml-1">· {hoursPerDay}h/day × 7 × {prefs.weeks}w</span>}
                </span>
              </div>
            </div>
          </div>

          <div className="h-px bg-border/40" />

          <div>
            <SectionLabel>Difficulty</SectionLabel>
            <div className="space-y-2">
              {(["Easy","Medium","Hard"] as const).map((d) => (
                <label key={d} className="flex items-center justify-between gap-2 cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <Checkbox checked={diffSet.has(d)} onCheckedChange={() => toggleDifficulty(d)} />
                    <span className="flex items-center gap-2 text-sm">
                      <span className={cn("h-2 w-2 rounded-full", DIFF_DOT[d])} />
                      <span className={DIFF_TEXT[d]}>{d}</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{diffCounts[d]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="h-px bg-border/40" />

          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/80 uppercase">
                Topics
              </p>
              <button type="button" className="text-[11px] text-primary hover:underline"
                onClick={() => onChange({ ...prefs, topics: allSelected ? [] : allTopics })}>
                {allSelected ? "Clear" : "Select all"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allTopics.map((t) => {
                const on = topicSet.has(t);
                return (
                  <button key={t} type="button" onClick={() => toggleTopic(t)}
                    className={cn(
                      "text-[11px] px-2.5 py-1 rounded-full border transition-all",
                      on
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                    )}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-card/60 to-card/30 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Questions Summary</p>
            <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-medium", statusChip.cls)}>
              {statusChip.label}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {/* ETA tile */}
            <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-3.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-amber-600 dark:text-amber-400 uppercase">
                <Clock className="h-3 w-3" /> Time to finish
              </div>
              {notScheduled ? (
                <>
                  <p className="text-2xl font-bold mt-1.5 flex items-center gap-1.5">
                    {prefs.weeks === 0 ? <CalendarOff className="h-5 w-5 text-muted-foreground" /> : <PauseCircle className="h-5 w-5 text-muted-foreground" />}
                    <span className="text-muted-foreground">—</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {prefs.weeks === 0 ? "Set weeks to plan an ETA" : "Set hours / day to resume"}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold mt-1.5">
                    ~{etaWeeks}<span className="text-sm font-medium text-muted-foreground ml-1">weeks</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {neededHours}h work · {hoursPerDay}h/day ({weeklyHours}h/week)
                  </p>
                  <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                      style={{ width: `${coveragePct}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                    {overBudget
                      ? `Need ~${extraHours}h more than your ${scheduleHours}h plan`
                      : `${coveragePct}% scheduled of ${neededHours}h`}
                  </p>
                </>
              )}
            </div>

            {/* Difficulty tile */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-2">Difficulty</p>
              <div className="space-y-1.5">
                {(["Easy","Medium","Hard"] as const).map((d) => {
                  const total = filtered.length || 1;
                  const pct = (diffCounts[d] / total) * 100;
                  return (
                    <div key={d} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={DIFF_TEXT[d]}>{d}</span>
                        <span className="text-muted-foreground tabular-nums">{diffCounts[d]}</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full", DIFF_DOT[d])} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total tile */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 flex flex-col">
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Problems</p>
              <p className="text-2xl font-bold mt-1.5">
                {filtered.length}<span className="text-sm font-medium text-muted-foreground ml-1">/ {flat.length}</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {Object.keys(topicCounts).length} topics
              </p>
            </div>
          </div>


          {/* Topic chips */}
          <div className="mb-4">
            <SectionLabel>Topics in plan</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(topicCounts).map(([t, n]) => (
                <Badge key={t} variant="outline"
                  className="text-[11px] font-normal bg-background/40 border-border/60">
                  {t} <span className="text-muted-foreground ml-1">· {n}</span>
                </Badge>
              ))}
              {Object.keys(topicCounts).length === 0 && (
                <span className="text-xs text-muted-foreground">No topics selected.</span>
              )}
            </div>
          </div>

          {/* Completion */}
          <div className="mt-auto pt-3 border-t border-border/40">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                Completed
              </span>
              <span className="text-xs tabular-nums">
                <span className="font-semibold text-foreground">{completedCount}</span>
                <span className="text-muted-foreground"> / {totalCount} · {completedPct}%</span>
              </span>
            </div>
            <Progress value={completedPct} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
