import React, { useMemo, useState, useEffect } from "react";
import {
  CalendarClock,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Flame,
  Trophy,
  Sparkles,
  Minus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  addDays,
  format,
  subDays,
  startOfDay,
  startOfWeek,
  differenceInCalendarWeeks,
  differenceInCalendarDays,
} from "date-fns";
import { cn } from "@/lib/utils";

interface ACMPaceCalculatorProps {
  sheetId: string;
  totalProblems: number;
  completedCount: number;
}

type Mode = "pace" | "target";

const PRESET_PACES = [5, 10, 15, 20, 30];

const ACMPaceCalculator: React.FC<ACMPaceCalculatorProps> = ({
  sheetId,
  totalProblems,
  completedCount,
}) => {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<{ week: string; count: number }[]>([]);
  const [mode, setMode] = useState<Mode>("pace");
  const [pace, setPace] = useState<number>(10);
  const [paceTouched, setPaceTouched] = useState(false);
  const [targetDate, setTargetDate] = useState<string>(
    format(addDays(new Date(), 90), "yyyy-MM-dd"),
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_topic_progress")
        .select("completed_at")
        .eq("user_id", user.id)
        .eq("sheet_id", sheetId)
        .eq("completed", true)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: true });

      if (!data || data.length === 0) {
        setWeeklyData([]);
        return;
      }

      // Group by Monday-start weeks
      const weeks: Record<string, number> = {};
      data.forEach((row) => {
        const ws = startOfWeek(new Date(row.completed_at!), { weekStartsOn: 1 });
        const key = format(ws, "yyyy-MM-dd");
        weeks[key] = (weeks[key] || 0) + 1;
      });

      // Backfill empty weeks between first & current so the chart shows zeros
      const sortedKeys = Object.keys(weeks).sort();
      const first = new Date(sortedKeys[0]);
      const last = startOfWeek(new Date(), { weekStartsOn: 1 });
      const filled: { week: string; count: number }[] = [];
      let cursor = first;
      while (cursor <= last) {
        const key = format(cursor, "yyyy-MM-dd");
        filled.push({ week: key, count: weeks[key] || 0 });
        cursor = addDays(cursor, 7);
      }
      setWeeklyData(filled);
    })();
  }, [user, sheetId, completedCount]);

  // Derived analytics
  const analytics = useMemo(() => {
    const remaining = Math.max(0, totalProblems - completedCount);
    const recent4 = weeklyData.slice(-4);
    const prev4 = weeklyData.slice(-8, -4);
    const recent12 = weeklyData.slice(-12);

    const avgRecent =
      recent4.length > 0
        ? recent4.reduce((s, w) => s + w.count, 0) / recent4.length
        : 0;
    const avgPrev =
      prev4.length > 0 ? prev4.reduce((s, w) => s + w.count, 0) / prev4.length : 0;
    const avg12 =
      recent12.length > 0
        ? recent12.reduce((s, w) => s + w.count, 0) / recent12.length
        : 0;

    const trendPct =
      avgPrev > 0 ? Math.round(((avgRecent - avgPrev) / avgPrev) * 100) : 0;

    const bestWeek = weeklyData.reduce(
      (best, w) => (w.count > best.count ? w : best),
      { week: "", count: 0 },
    );

    // Streak of consecutive non-zero weeks ending at current week
    let streak = 0;
    for (let i = weeklyData.length - 1; i >= 0; i--) {
      if (weeklyData[i].count > 0) streak++;
      else break;
    }

    const thisWeek = weeklyData[weeklyData.length - 1]?.count ?? 0;

    // Contribution breakdown (last 12 weeks) — which weeks pushed the avg up
    const sum12 = recent12.reduce((s, w) => s + w.count, 0);
    const contributions = recent12
      .map((w) => ({
        week: w.week,
        count: w.count,
        pct: sum12 > 0 ? Math.round((w.count / sum12) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Zero-week impact
    const zerosIn4 = recent4.filter((w) => w.count === 0).length;
    const zerosIn12 = recent12.filter((w) => w.count === 0).length;
    const nonZero4 = recent4.filter((w) => w.count > 0);
    const nonZero12 = recent12.filter((w) => w.count > 0);
    const avgNoZero4 =
      nonZero4.length > 0
        ? nonZero4.reduce((s, w) => s + w.count, 0) / nonZero4.length
        : 0;
    const avgNoZero12 =
      nonZero12.length > 0
        ? nonZero12.reduce((s, w) => s + w.count, 0) / nonZero12.length
        : 0;
    const dragPct4 =
      avgNoZero4 > 0
        ? Math.round(((avgNoZero4 - avgRecent) / avgNoZero4) * 100)
        : 0;

    return {
      remaining,
      avgRecent: Math.round(avgRecent * 10) / 10,
      avg12: Math.round(avg12 * 10) / 10,
      trendPct,
      bestWeek,
      streak,
      thisWeek,
      contributions,
      zerosIn4,
      zerosIn12,
      avgNoZero4: Math.round(avgNoZero4 * 10) / 10,
      avgNoZero12: Math.round(avgNoZero12 * 10) / 10,
      dragPct4,
    };
  }, [weeklyData, completedCount, totalProblems]);


  // Resolve effective pace based on mode
  const { effectivePace, etaDate, weeksLeft, requiredPace } = useMemo(() => {
    const remaining = analytics.remaining;
    if (mode === "target") {
      const td = new Date(targetDate);
      const daysToTarget = Math.max(1, differenceInCalendarDays(td, new Date()));
      const weeksToTarget = Math.max(1, daysToTarget / 7);
      const required = remaining > 0 ? Math.ceil(remaining / weeksToTarget) : 0;
      return {
        effectivePace: required,
        etaDate: td,
        weeksLeft: Math.ceil(weeksToTarget),
        requiredPace: required,
      };
    }
    // pace mode
    const usePace = paceTouched || pace !== 10 ? pace : Math.max(1, Math.round(analytics.avgRecent || 10));
    const wl = usePace > 0 ? Math.ceil(remaining / usePace) : Infinity;
    const eta = usePace > 0 ? addDays(new Date(), wl * 7) : null;
    return {
      effectivePace: usePace,
      etaDate: eta,
      weeksLeft: wl,
      requiredPace: usePace,
    };
  }, [mode, pace, paceTouched, targetDate, analytics.remaining, analytics.avgRecent]);

  // On-track status: compare current avg pace to required pace
  const status = useMemo(() => {
    if (analytics.remaining === 0)
      return { label: "Sheet completed", tone: "done" as const };
    if (analytics.avgRecent === 0)
      return { label: "Not started yet", tone: "idle" as const };
    if (analytics.avgRecent >= requiredPace * 1.05)
      return { label: "Ahead of schedule", tone: "ahead" as const };
    if (analytics.avgRecent >= requiredPace * 0.85)
      return { label: "On track", tone: "track" as const };
    return { label: "Behind schedule", tone: "behind" as const };
  }, [analytics.remaining, analytics.avgRecent, requiredPace]);

  const maxBar = Math.max(...weeklyData.map((w) => w.count), requiredPace || 1, 1);
  const chartWeeks = weeklyData.slice(-12);
  const thisWeekProgress = requiredPace > 0
    ? Math.min(100, Math.round((analytics.thisWeek / requiredPace) * 100))
    : 0;

  const toneStyles: Record<typeof status.tone, string> = {
    done: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    ahead: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    track: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    behind: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    idle: "bg-muted/40 text-muted-foreground border-border/50",
  };

  return (
    <div className="space-y-5">
      {/* HERO: ETA + status */}
      <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-background p-4 sm:p-5">
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                  toneStyles[status.tone],
                )}
              >
                <Sparkles className="h-3 w-3" />
                {status.label}
              </span>
              {analytics.trendPct !== 0 && analytics.avgRecent > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                    analytics.trendPct > 0
                      ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                      : "border-rose-500/30 text-rose-400 bg-rose-500/5",
                  )}
                >
                  {analytics.trendPct > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {analytics.trendPct > 0 ? "+" : ""}
                  {analytics.trendPct}% vs prior 4w
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {etaDate ? format(etaDate, "MMM d, yyyy") : "—"}
              </p>
              <span className="text-xs text-muted-foreground">
                estimated finish
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.remaining > 0
                ? `${analytics.remaining} problems left · ${weeksLeft === Infinity ? "—" : `${weeksLeft} weeks`} at ${requiredPace}/wk`
                : "All problems completed — great work!"}
            </p>
          </div>

          {/* This-week ring */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative h-16 w-16">
              <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="url(#paceGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${thisWeekProgress * 0.974} 97.4`}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="paceGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold">{analytics.thisWeek}</span>
                <span className="text-[9px] text-muted-foreground -mt-0.5">
                  /{requiredPace}
                </span>
              </div>
            </div>
            <div className="text-left">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                This week
              </p>
              <p className="text-xs text-foreground">
                {analytics.thisWeek >= requiredPace
                  ? "Target hit ✨"
                  : `${Math.max(0, requiredPace - analytics.thisWeek)} to go`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODE PICKER */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList className="grid grid-cols-2 w-full max-w-sm">
          <TabsTrigger value="pace" className="text-xs gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Set weekly pace
          </TabsTrigger>
          <TabsTrigger value="target" className="text-xs gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Set target date
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pace" className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2">
              <Target className="h-4 w-4 text-primary" />
              <Input
                type="number"
                min={1}
                max={100}
                value={pace}
                onChange={(e) => {
                  setPace(Math.max(1, Math.min(100, Number(e.target.value) || 1)));
                  setPaceTouched(true);
                }}
                className="w-16 h-7 text-sm font-semibold border-0 bg-transparent p-0 focus-visible:ring-0"
              />
              <span className="text-xs text-muted-foreground">problems / week</span>
            </div>
            {analytics.avgRecent > 0 && (
              <button
                onClick={() => {
                  setPace(Math.max(1, Math.round(analytics.avgRecent)));
                  setPaceTouched(true);
                }}
                className="text-[11px] px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15 transition"
              >
                Use my avg ({Math.round(analytics.avgRecent)}/wk)
              </button>
            )}
            <div className="flex items-center gap-1 ml-auto">
              {PRESET_PACES.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPace(p);
                    setPaceTouched(true);
                  }}
                  className={cn(
                    "text-[11px] h-7 px-2.5 rounded-md border transition",
                    pace === p
                      ? "border-primary/50 bg-primary/15 text-primary font-semibold"
                      : "border-border/60 bg-card/30 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="target" className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2">
              <Calendar className="h-4 w-4 text-primary" />
              <Input
                type="date"
                value={targetDate}
                min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                onChange={(e) => setTargetDate(e.target.value)}
                className="h-7 text-sm border-0 bg-transparent p-0 focus-visible:ring-0"
              />
            </div>
            <div className="flex items-center gap-1">
              {[30, 60, 90, 180, 365].map((d) => (
                <button
                  key={d}
                  onClick={() => setTargetDate(format(addDays(new Date(), d), "yyyy-MM-dd"))}
                  className="text-[11px] h-7 px-2.5 rounded-md border border-border/60 bg-card/30 text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
                >
                  +{d}d
                </button>
              ))}
            </div>
            <p className="basis-full text-xs text-muted-foreground">
              You'll need to solve{" "}
              <span className="font-semibold text-amber-300">
                {requiredPace} problems / week
              </span>{" "}
              to finish by {format(new Date(targetDate), "MMM d, yyyy")}.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          {
            icon: TrendingUp,
            value: analytics.avgRecent || "—",
            label: "Avg / week (4w)",
            sub: `12w avg ${analytics.avg12 || "—"}`,
            color: "text-amber-400",
          },
          {
            icon: Target,
            value: requiredPace || "—",
            label: mode === "target" ? "Required pace" : "Your target",
            sub: `${analytics.remaining} remaining`,
            color: "text-primary",
          },
          {
            icon: Trophy,
            value: analytics.bestWeek.count || "—",
            label: "Best week",
            sub: analytics.bestWeek.week
              ? format(new Date(analytics.bestWeek.week), "MMM d")
              : "No data",
            color: "text-orange-400",
          },
          {
            icon: Flame,
            value: analytics.streak || 0,
            label: "Active weeks",
            sub: analytics.streak > 0 ? "Keep it going" : "Start this week",
            color: "text-rose-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-border/50 bg-card/30 p-3"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className={cn("h-3.5 w-3.5", s.color)} />
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                {s.label}
              </p>
            </div>
            <p className="text-xl font-bold text-foreground leading-tight">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* WEEKLY CHART */}
      {chartWeeks.length > 0 ? (
        <div className="space-y-2 rounded-lg border border-border/50 bg-card/30 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-foreground">Weekly activity</p>
              <span className="text-[10px] text-muted-foreground">
                last {chartWeeks.length} weeks
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-gradient-to-t from-amber-500 to-orange-400" />
                solved
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-[2px] w-3 bg-primary/70" />
                target
              </span>
            </div>
          </div>
          <div className="relative flex items-end gap-1 h-20 pt-3">
            {/* Target line */}
            <div
              className="absolute left-0 right-0 border-t border-dashed border-primary/50 pointer-events-none"
              style={{ bottom: `${(requiredPace / maxBar) * 80}px` }}
            />
            {chartWeeks.map((w) => {
              const h = Math.max(2, (w.count / maxBar) * 80);
              const hitTarget = w.count >= requiredPace && requiredPace > 0;
              return (
                <div
                  key={w.week}
                  className="group flex-1 flex flex-col items-center justify-end gap-0.5 h-full relative"
                  title={`Week of ${format(new Date(w.week), "MMM d")} — ${w.count} solved`}
                >
                  <span className="text-[9px] text-muted-foreground group-hover:text-foreground transition">
                    {w.count}
                  </span>
                  <div
                    className={cn(
                      "w-full rounded-t-sm transition-all",
                      hitTarget
                        ? "bg-gradient-to-t from-amber-500 to-orange-400"
                        : w.count > 0
                        ? "bg-gradient-to-t from-amber-500/60 to-amber-400/40"
                        : "bg-muted/40",
                    )}
                    style={{ height: `${h}px` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground pt-1">
            <span>{format(new Date(chartWeeks[0].week), "MMM d")}</span>
            <span>{format(new Date(chartWeeks[chartWeeks.length - 1].week), "MMM d")}</span>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/60 bg-card/20 p-6 text-center">
          <Minus className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Start solving problems to see your pace, trend & estimated completion.
          </p>
        </div>
      )}

      {/* CONTRIBUTION & ZERO-WEEK IMPACT BREAKDOWN */}
      {chartWeeks.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-5">
          {/* Top contributing weeks */}
          <div className="lg:col-span-3 rounded-lg border border-border/50 bg-card/30 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-3.5 w-3.5 text-orange-400" />
                <p className="text-xs font-semibold text-foreground">
                  Top contributing weeks
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground">
                share of last 12w solves
              </span>
            </div>
            {analytics.contributions.filter((c) => c.count > 0).length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-2">
                No solves in the last 12 weeks yet.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {analytics.contributions
                  .filter((c) => c.count > 0)
                  .slice(0, 5)
                  .map((c, i) => (
                    <li key={c.week} className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "text-[10px] font-bold w-4 text-center rounded",
                          i === 0
                            ? "text-amber-300"
                            : i === 1
                            ? "text-orange-300"
                            : "text-muted-foreground",
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="text-[11px] text-muted-foreground w-16 shrink-0">
                        {format(new Date(c.week), "MMM d")}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                          style={{ width: `${Math.max(4, c.pct)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-foreground tabular-nums w-8 text-right">
                        {c.count}
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums w-10 text-right">
                        {c.pct}%
                      </span>
                    </li>
                  ))}
              </ul>
            )}
            <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/40">
              {analytics.contributions[0]?.count > 0 && analytics.avg12 > 0
                ? `Your top week alone accounts for ${analytics.contributions[0].pct}% of all solves in this window.`
                : "Spread effort across more weeks to lift your rolling average."}
            </p>
          </div>

          {/* Zero-week drag */}
          <div className="lg:col-span-2 rounded-lg border border-border/50 bg-card/30 p-3.5 space-y-2.5">
            <div className="flex items-center gap-2">
              <Minus className="h-3.5 w-3.5 text-rose-400" />
              <p className="text-xs font-semibold text-foreground">
                Inactive-week drag
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border border-border/40 bg-background/40 p-2">
                <p className="text-[10px] text-muted-foreground">Last 4w</p>
                <p className="text-lg font-bold text-rose-400">
                  {analytics.zerosIn4}
                  <span className="text-[10px] font-normal text-muted-foreground ml-1">
                    /4
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground">zero weeks</p>
              </div>
              <div className="rounded-md border border-border/40 bg-background/40 p-2">
                <p className="text-[10px] text-muted-foreground">Last 12w</p>
                <p className="text-lg font-bold text-rose-400">
                  {analytics.zerosIn12}
                  <span className="text-[10px] font-normal text-muted-foreground ml-1">
                    /12
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground">zero weeks</p>
              </div>
            </div>
            <div className="rounded-md bg-background/40 border border-border/40 p-2 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Reported avg (4w)</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {analytics.avgRecent}/wk
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">
                  Avg on active weeks
                </span>
                <span className="font-semibold text-amber-300 tabular-nums">
                  {analytics.avgNoZero4}/wk
                </span>
              </div>
              {analytics.dragPct4 > 0 ? (
                <p className="text-[10px] text-rose-400 pt-1">
                  Inactive weeks drag your 4w avg down by{" "}
                  <span className="font-semibold">{analytics.dragPct4}%</span>.
                  Close any zero week to lift the trend fast.
                </p>
              ) : analytics.zerosIn4 === 0 && analytics.avgRecent > 0 ? (
                <p className="text-[10px] text-emerald-400 pt-1">
                  No inactive weeks in the last 4 — your trend is honest.
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground pt-1">
                  Log a solve this week to start lifting the rolling avg.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

export default ACMPaceCalculator;
