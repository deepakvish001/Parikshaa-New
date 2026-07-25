// Shared right-rail widgets: ProgressRing, CalendarRoadmap, DailyPlanner.
// Extracted from src/pages/learn/LearnHub.tsx so they can be reused
// inside the GlobalRightRail (sitewide) without duplicating logic.
//
// Requires <TooltipProvider> from "@/components/ui/tooltip" higher up
// in the tree (already provided by DashboardLayout via shadcn defaults
// or by the consumer page).

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Info,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Share2,
  Trophy,
  Flame,
  Code,
  Plus,
  Maximize2,
  Minimize2,
  X,
  Trash2,
  Check,
  Pencil,
  ClipboardList as ClipboardListIcon,
  CalendarDays,
  History as HistoryIcon,
  Repeat,
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Search,
  Filter as FilterIcon,
  ArrowLeft,
  ArrowDownNarrowWide,
  CalendarClock,
  CalendarCheck2,
  Loader2,
  UserX,
  BookOpen,
  Sparkles,
  ChevronRight as ChevronRightIcon,
  LayoutGrid,
} from "lucide-react";
import { motion } from "framer-motion";
import { ActionIcon } from "@/components/common/ActionIcon";
import { BrandChipLegend } from "@/components/common/BrandChipLegend";
import { ScrollableChipStrip } from "@/components/common/ScrollableChipStrip";
import { ParikshaaChip } from "@/components/common/ParikshaaChip";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useByteskillProfileStats } from "@/hooks/useByteskillProfileStats";

import { useDailyLeaderboard, type DailyLeaderboardEntry } from "@/hooks/useDailyLeaderboard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ─────────────────────────────────────────────────────────────
// Right-rail widgets
// ─────────────────────────────────────────────────────────────

export function ProgressRing() {
  const { user } = useAuth();
  const stats = useByteskillProfileStats(user?.id);
  const easy = stats.difficulty.easy;
  const med = stats.difficulty.medium;
  const hard = stats.difficulty.hard;
  const total = easy.total + med.total + hard.total;
  const done = easy.solved + med.solved + hard.solved;
  const progress = {
    total,
    done,
    easy: { d: easy.solved, t: easy.total },
    med: { d: med.solved, t: med.total },
    hard: { d: hard.solved, t: hard.total },
  };
  const pct = progress.total ? progress.done / progress.total : 0;

  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="learn-home-panel rr-hero-frame rr-progress-card relative isolate overflow-visible rounded-2xl border border-white/[0.06] bg-[hsl(var(--card))]/40 backdrop-blur-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 0%, hsl(var(--primary)/0.28), transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-30deg, transparent 0 60px, hsl(var(--primary)/0.35) 60px 61px)",
          maskImage:
            "radial-gradient(ellipse 65% 60% at 50% 20%, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 60% at 50% 20%, black, transparent 75%)",
        }}
      />
      <div className="rr-progress-header relative flex h-7 items-center justify-center px-8">
        <span className="rr-hero-eyebrow">
          DSA Progress
        </span>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="About DSA Progress"
              className="rr-static-btn absolute right-0 h-7 w-7 rounded-full flex items-center justify-center hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors"
            >
              <Info className="h-4 w-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="left" align="start" sideOffset={12} collisionPadding={20} avoidCollisions className="z-[2147483647] max-w-[min(320px,calc(100vw-2rem))] overflow-visible rounded-xl border-border/60 bg-popover p-4 text-xs leading-relaxed backdrop-blur-sm">
            <p className="font-semibold text-foreground text-sm mb-2">About Progress</p>
            <ol className="list-decimal pl-4 space-y-1.5 text-muted-foreground">
              <li>Reflects your <span className="text-amber-400 font-semibold">global progress</span> across the entire platform.</li>
              <li>Only <span className="text-amber-400 font-semibold">DSA problems</span> count — other subjects don't add here.</li>
              <li>Once a problem is solved, its progress <span className="text-amber-400 font-semibold">cannot be reset</span>.</li>
            </ol>
            <p className="mt-3 pt-2 border-t border-border/60 text-foreground/90">Keep solving to push your progress higher!</p>
          </PopoverContent>
        </Popover>

      </div>
      <div className="rr-progress-body flex items-center gap-4">
        <div className="rr-progress-ring relative shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="8" opacity="0.45" />
            <circle
              cx="50" cy="50" r={r} fill="none"
              stroke="url(#prsGrad)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - pct)}
            />
            <defs>
              <linearGradient id="prsGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(40 95% 60%)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="rr-hero-heading rr-hero-value text-2xl">{progress.done}</div>
            <div className="rr-hero-label text-[9px] uppercase tracking-[0.15em] tabular-nums mt-1">of {progress.total}</div>
          </div>
        </div>
        <div className="rr-progress-stats flex-1 text-sm">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" /><span className="text-muted-foreground">Easy</span><span className="ml-auto tabular-nums font-semibold text-foreground/90">{progress.easy.d}/{progress.easy.t}</span></div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary/75" /><span className="text-muted-foreground">Medium</span><span className="ml-auto tabular-nums font-semibold text-foreground/90">{progress.med.d}/{progress.med.t}</span></div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary/50" /><span className="text-muted-foreground">Hard</span><span className="ml-auto tabular-nums font-semibold text-foreground/90">{progress.hard.d}/{progress.hard.t}</span></div>
        </div>
      </div>
    </div>
  );
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// Convert a Date to IST YYYY-MM-DD key.
const istDateKey = (d: Date) => {
  // Shift the absolute UTC instant by +5:30 and read UTC parts,
  // so the result is the IST calendar date regardless of viewer timezone.
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, "0")}-${String(ist.getUTCDate()).padStart(2, "0")}`;
};
const istToday = () => istDateKey(new Date());

export function CalendarRoadmap() {
  const { user } = useAuth();
  const todayKey = istToday();
  const [cursor, setCursor] = useState(() => {
    const [y, m] = todayKey.split("-").map(Number);
    return { y, m: m - 1 };
  });
  const [solvedDays, setSolvedDays] = useState<Set<string>>(new Set());
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  // Fetch user's Accepted DSA submissions and bucket them by IST day.
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setSolvedDays(new Set());
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("code_submissions")
        .select("created_at")
        .eq("user_id", user.id)
        .eq("verdict", "Accepted")
        .limit(5000);
      if (cancelled || error) return;
      const set = new Set<string>();
      (data ?? []).forEach((r: any) => {
        if (r?.created_at) set.add(istDateKey(new Date(r.created_at)));
      });
      setSolvedDays(set);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const last = new Date(cursor.y, cursor.m + 1, 0);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();
    const prevLast = new Date(cursor.y, cursor.m, 0).getDate();

    type Cell = { day: number; inMonth: boolean; isToday: boolean; isPast: boolean; solved: boolean };
    const cells: Cell[] = [];
    const key = (y: number, m: number, d: number) =>
      `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push({ day: prevLast - i, inMonth: false, isToday: false, isPast: false, solved: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const k = key(cursor.y, cursor.m, d);
      cells.push({
        day: d,
        inMonth: true,
        isToday: k === todayKey,
        isPast: k < todayKey,
        solved: solvedDays.has(k),
      });
    }
    let trailing = 1;
    while (cells.length % 7 !== 0 || cells.length < 42) {
      cells.push({ day: trailing++, inMonth: false, isToday: false, isPast: false, solved: false });
    }
    return cells.slice(0, 42);
  }, [cursor, solvedDays, todayKey]);

  // Current streak (consecutive IST days ending today or yesterday) derived from solvedDays.
  const currentStreak = useMemo(() => {
    if (solvedDays.size === 0) return 0;
    let streak = 0;
    const d = new Date();
    // If today isn't solved yet, start counting from yesterday so an active streak still shows.
    if (!solvedDays.has(istDateKey(d))) {
      d.setDate(d.getDate() - 1);
      if (!solvedDays.has(istDateKey(d))) return 0;
    }
    while (solvedDays.has(istDateKey(d))) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }, [solvedDays]);

  const handleShareStreak = async () => {
    // `solvedDays` = unique IST days with at least one Accepted submission — count DAYS, not problems.
    const activeDays = solvedDays.size;
    const url = "https://www.parikshaa.org";
    const text = currentStreak > 0
      ? `🔥 I'm on a ${currentStreak}-day coding streak on Parikshaa — ${activeDays} active day${activeDays === 1 ? "" : "s"} of practice so far. Join me: ${url}`
      : activeDays > 0
        ? `I've practiced on ${activeDays} day${activeDays === 1 ? "" : "s"} on Parikshaa — building the habit. Join me: ${url}`
        : `I'm starting my coding journey on Parikshaa. Join me: ${url}`;

    // Prefer native share; fall back to clipboard; final fallback shows the text so the action never silently fails.
    const canNativeShare =
      typeof navigator !== "undefined" &&
      typeof (navigator as any).share === "function";
    if (canNativeShare) {
      try {
        await (navigator as any).share({ title: "My Parikshaa streak", text, url });
        return;
      } catch (e: any) {
        if (e?.name === "AbortError") return; // user cancelled — that's fine
        // fall through to clipboard
      }
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success("Streak copied to clipboard");
        return;
      }
      throw new Error("Clipboard API unavailable");
    } catch {
      toast.error("Could not share streak — please copy manually", { description: text });
    }
  };



  const move = (delta: number) => {
    const nm = cursor.m + delta;
    setCursor({ y: cursor.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 });
  };

  const [ty, tm] = todayKey.split("-").map(Number);
  const isCurrentMonth = cursor.y === ty && cursor.m === tm - 1;
  const goToday = () => setCursor({ y: ty, m: tm - 1 });

  return (
    <div className="learn-home-panel rr-hero-frame relative isolate overflow-hidden rounded-2xl border border-white/[0.06] bg-[hsl(var(--card))]/40 backdrop-blur-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 0%, hsl(var(--primary)/0.28), transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-30deg, transparent 0 60px, hsl(var(--primary)/0.35) 60px 61px)",
          maskImage:
            "radial-gradient(ellipse 65% 60% at 50% 20%, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 60% at 50% 20%, black, transparent 75%)",
        }}
      />
      <div className="relative flex h-8 items-center justify-center px-9 mb-3">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="About streak calendar"
              className="rr-static-btn absolute left-0 h-7 w-7 rounded-full flex items-center justify-center hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors"
            >
              <Info className="h-4 w-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" align="start" sideOffset={12} collisionPadding={20} avoidCollisions className="z-[2147483647] max-w-[min(320px,calc(100vw-2rem))] overflow-visible rounded-xl border-border/60 bg-popover p-4 text-xs leading-relaxed backdrop-blur-sm">
            <p className="font-semibold text-foreground text-sm mb-2">Keep in mind</p>
            <ol className="list-decimal pl-4 space-y-1.5 text-muted-foreground">
              <li>For DSA, only <span className="text-amber-400 font-semibold">accepted submissions</span> count as completed.</li>
              <li>Completing <span className="text-amber-400 font-semibold">Core Subjects</span> & <span className="text-amber-400 font-semibold">Design</span> problems also adds to your streak.</li>
              <li>For Aptitude, finish an <span className="text-amber-400 font-semibold">entire set</span> in a category to earn streak credit.</li>
            </ol>
            <div className="mt-3 pt-2 border-t border-border/60">
              <p className="text-foreground/90">Streaks reset at <span className="font-semibold text-amber-400">12:00 AM IST</span> — submit before then to count for the day.</p>
              <p className="mt-1.5 text-muted-foreground italic">Thanks for your dedication — keep going & happy learning!</p>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1">
          <button type="button" onClick={() => move(-1)} aria-label="Previous month" className="h-7 w-7 shrink-0 rounded-full hover:bg-muted/50 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="rr-hero-heading text-xs min-w-[70px] text-center tabular-nums">
            {MONTHS[cursor.m].slice(0, 3)} {cursor.y}
          </span>
          <button type="button" onClick={() => move(1)} aria-label="Next month" className="h-7 w-7 shrink-0 rounded-full hover:bg-muted/50 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
            <ChevronRight className="h-4 w-4" />
          </button>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={goToday}
                disabled={isCurrentMonth}
                aria-label="Jump to current month"
                aria-pressed={isCurrentMonth}
                className={cn(
                  "h-7 px-2 rounded-full text-[10px] font-semibold tabular-nums leading-none inline-flex items-center gap-1 shrink-0 transition-colors focus-visible:outline-none focus-parikshaa",
                  isCurrentMonth
                    ? "bg-primary/10 text-primary border border-primary/40 cursor-default"
                    : "bg-card/45 text-muted-foreground border border-border/60 hover:text-primary hover:border-primary/50",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", isCurrentMonth ? "bg-primary" : "bg-muted-foreground/60")} />
                Today
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="text-[11px] px-2 py-1 rounded-md border-border/60 bg-popover backdrop-blur-sm">
              {isCurrentMonth ? "You're on the current month" : "Jump to current month"}
            </TooltipContent>
          </Tooltip>
        </div>

        <button type="button" onClick={handleShareStreak} aria-label="Share streak" title="Share your streak" className="rr-static-btn absolute right-0 h-7 w-7 rounded-full hover:bg-muted/50 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
          <Share2 className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="mx-auto w-full max-w-[20rem] sm:max-w-none">
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center mb-1.5">
          {WEEKDAYS.map((d) => (
            <div key={d} className="rr-hero-label text-[10px] font-semibold uppercase tracking-wider">{d.slice(0,1)}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
          {grid.map((c, i) => {
            const showSolved = c.inMonth && c.solved;
            const showMissed = c.inMonth && c.isPast && !c.solved;
            const showToday = c.inMonth && c.isToday && !c.solved;
            const showFuture = c.inMonth && !c.isPast && !c.isToday && !c.solved;
            const status = !c.inMonth
              ? `${MONTHS[(cursor.m + (i < 7 ? -1 : 1) + 12) % 12]} ${c.day} — outside month`
              : showSolved
                ? `Solved on ${MONTHS[cursor.m]} ${c.day} — streak counted`
                : showToday
                  ? `Today, ${MONTHS[cursor.m]} ${c.day} — solve a problem to keep your streak`
                  : showMissed
                    ? `${MONTHS[cursor.m]} ${c.day} — no submission`
                    : `${MONTHS[cursor.m]} ${c.day} — upcoming`;
            return (
              <Tooltip key={i} delayDuration={120}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={status}
                    tabIndex={c.inMonth ? 0 : -1}
                    className={cn(
                      "relative aspect-square rounded-full flex items-center justify-center leading-none antialiased text-[11px] tabular-nums font-medium",
                      "transform-gpu transition-[transform,background-color,color] duration-300 ease-out",
                      "focus-visible:outline-none focus-parikshaa",
                      !c.inMonth && "text-muted-foreground/30 cursor-default",
                      showFuture && "text-foreground/55 bg-card/45 ring-1 ring-primary/[0.08] hover:ring-primary/30",
                      showMissed && "bg-card/55 ring-1 ring-primary/[0.08] hover:ring-orange-500/30",
                      showSolved && "bg-card/55 ring-1 ring-primary/40 hover:scale-[1.08] z-10",
                      showToday && "bg-card/65 ring-1 ring-primary/70 hover:scale-[1.08] z-10",
                    )}
                  >
                    {showSolved ? (
                      <span aria-hidden className="block text-[15px] sm:text-[17px] leading-none [font-family:'Apple_Color_Emoji','Segoe_UI_Emoji','Noto_Color_Emoji',sans-serif]">🔥</span>
                    ) : showToday ? (
                      <span aria-hidden className="block text-[15px] sm:text-[17px] leading-none [font-family:'Apple_Color_Emoji','Segoe_UI_Emoji','Noto_Color_Emoji',sans-serif]">⏱️</span>
                    ) : showMissed ? (
                      <span aria-hidden className="block text-[15px] sm:text-[17px] leading-none [font-family:'Apple_Color_Emoji','Segoe_UI_Emoji','Noto_Color_Emoji',sans-serif]">😭</span>
                    ) : (
                      <span className="block leading-none">{c.day}</span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6} className="text-[11px] px-2 py-1 rounded-md border-border/60 bg-popover backdrop-blur-sm">
                  {status}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[10px] sm:text-[11px] text-muted-foreground/85">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1.5 cursor-help">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-card/55 ring-1 ring-primary/40 text-[11px] leading-none">🔥</span>
                <span>Solved</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} className="text-[11px] px-2 py-1.5 max-w-[220px] rounded-md border-border/60 bg-popover backdrop-blur-sm">
              You submitted an accepted solution on this day — streak counted.
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1.5 cursor-help">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-card/65 ring-1 ring-primary/70 text-[11px] leading-none">⏱️</span>
                <span>Today</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} className="text-[11px] px-2 py-1.5 max-w-[220px] rounded-md border-border/60 bg-popover backdrop-blur-sm">
              Today — solve at least one problem before midnight IST to keep your streak alive.
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1.5 cursor-help">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-card/55 ring-1 ring-primary/10 text-[11px] leading-none">😭</span>
                <span>Missed</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} className="text-[11px] px-2 py-1.5 max-w-[220px] rounded-md border-border/60 bg-popover backdrop-blur-sm">
              No submission recorded on this day — streak broken.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Streak footer */}
      <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/30 text-xs">
          <span className="text-muted-foreground">Current</span>
          <Flame className="h-3.5 w-3.5 text-orange-400" />
          <span className="font-semibold tabular-nums">0</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/30 text-xs">
          <span className="text-muted-foreground">Max</span>
          <Code className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold tabular-nums">0</span>
        </div>
        <button
          type="button"
          onClick={() => setLeaderboardOpen(true)}
          className="ml-auto inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border/60 hover:border-primary/60 hover:text-primary transition-colors text-[11px] focus-visible:outline-none focus-parikshaa"
        >
          <Trophy className="h-3.5 w-3.5 text-amber-400" />
          Leaderboard
        </button>
      </div>

      {/* Leaderboard preview (merged into same card) */}
      <div className="mt-3 pt-3 border-t border-border/60">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => setLeaderboardOpen(true)}
            aria-label="Open leaderboard"
            className="flex-1 grid grid-cols-3 gap-2 rounded-lg p-1 -m-1 hover:bg-muted/30 focus-visible:outline-none focus-parikshaa transition-colors"
          >
            {[
              { rank: "Rank 1", from: "#fde047", to: "#f59e0b", ribbon: "#f59e0b" },
              { rank: "Rank 2", from: "#fef3c7", to: "#fbbf24", ribbon: "#d97706" },
              { rank: "Rank 3", from: "#fb923c", to: "#f97316", ribbon: "#f97316" },
            ].map((r) => (
              <div key={r.rank} className="flex flex-col items-center gap-1">
                <RosetteBadge from={r.from} to={r.to} ribbon={r.ribbon} />
                <span className="text-[10px] text-muted-foreground">{r.rank}</span>
              </div>
            ))}
          </button>
          <div className="self-stretch w-px bg-amber-400/20" />
          <Tooltip delayDuration={120}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setLeaderboardOpen(true)}
                aria-label="Minimum current streak of 2 days is required to be on the leaderboard"
                className="flex flex-col items-center gap-1 w-14 rounded-lg p-1 -m-1 hover:bg-muted/30 focus-visible:outline-none focus-parikshaa transition-colors"
              >
                <RosetteBadge from="#92400e" to="#431407" ribbon="#431407" muted />
                <span className="text-[10px] text-muted-foreground tabular-nums">****</span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={8}
              className="max-w-[240px] text-[11px] leading-relaxed rounded-xl border-amber-400/40 bg-popover/95 backdrop-blur-xl p-2.5 shadow-[0_18px_60px_-18px_hsl(var(--primary)/0.45)]"
            >
              Minimum current streak of <span className="font-semibold text-amber-400">2 days</span> is required to be on the leaderboard.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <LeaderboardModal open={leaderboardOpen} onOpenChange={setLeaderboardOpen} />
    </div>
  );
}

function RosetteBadge({ from, to, ribbon, muted = false }: { from: string; to: string; ribbon: string; muted?: boolean }) {
  const gid = `rosette-${from}-${to}`.replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 48 60" className={cn("h-11 w-9 drop-shadow-md", muted && "opacity-70")} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      {/* Ribbon tails */}
      <polygon points="16,36 10,58 18,52 24,58 24,40" fill={ribbon} opacity="0.92" />
      <polygon points="32,36 38,58 30,52 24,58 24,40" fill={ribbon} opacity="0.78" />
      {/* Rosette (12-point star) */}
      <g transform="translate(24 22)">
        <path
          d="M0,-18 L3.5,-11 L11,-14.5 L9.5,-7 L17,-5.5 L11,0 L17,5.5 L9.5,7 L11,14.5 L3.5,11 L0,18 L-3.5,11 L-11,14.5 L-9.5,7 L-17,5.5 L-11,0 L-17,-5.5 L-9.5,-7 L-11,-14.5 L-3.5,-11 Z"
          fill={`url(#${gid})`}
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="0.5"
        />
        <circle r="9.5" fill="rgba(0,0,0,0.28)" />
        <circle r="9" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
        {/* User silhouette */}
        <circle cy="-2" r="2.6" fill="rgba(255,255,255,0.9)" />
        <path d="M-5.2,6 C-5.2,2.5 -2.8,0.8 0,0.8 C2.8,0.8 5.2,2.5 5.2,6 Z" fill="rgba(255,255,255,0.9)" />
      </g>
    </svg>
  );
}

type LbRow = { rank: number; name: string; current: number; max: number; problems: number; avatarHue: number };

const TOP3_STYLES = [
  { from: "#fef3c7", to: "#fbbf24", ribbon: "#d97706", pedestal: "from-amber-800/60 to-amber-950/70", height: "h-24", place: 2 as const },
  { from: "#fde047", to: "#f59e0b", ribbon: "#f59e0b", pedestal: "from-amber-700/70 to-amber-900/70", height: "h-32", place: 1 as const },
  { from: "#fb923c", to: "#f97316", ribbon: "#f97316", pedestal: "from-orange-800/70 to-amber-950/70", height: "h-20", place: 3 as const },
];

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

function entryDisplayName(e: DailyLeaderboardEntry): string {
  return e.username || e.display_name || "Anonymous";
}

const PAGE_SIZE = 6;

function LeaderboardModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { entries, loading } = useDailyLeaderboard(50);

  // Reset state when modal opens.
  useEffect(() => {
    if (!open) return;
    setSearch("");
    setPage(1);
  }, [open]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  // Build TOP3 (sorted 2-1-3 for podium layout) and REST.
  const sorted = entries; // already ordered by streak desc
  const topRaw = sorted.slice(0, 3);
  const podiumOrder = [topRaw[1], topRaw[0], topRaw[2]]; // left=2nd, center=1st, right=3rd
  const top3 = podiumOrder.map((e, i) => {
    const style = TOP3_STYLES[i];
    if (!e) return { ...style, name: "—", max: 0, current: 0, empty: true as const };
    return { ...style, name: entryDisplayName(e), max: e.current_streak, current: e.current_streak, empty: false as const };
  });

  const restRows: LbRow[] = sorted.slice(3).map((e, idx) => ({
    rank: idx + 4,
    name: entryDisplayName(e),
    current: e.current_streak,
    max: e.current_streak,
    problems: e.total_completions,
    avatarHue: hashHue(entryDisplayName(e)),
  }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return restRows;
    return restRows.filter((r) => r.name.toLowerCase().includes(q));
  }, [search, restRows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);


  // Compact page-number window (max 5 buttons).
  const pageNumbers = useMemo(() => {
    const nums: number[] = [];
    const start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, start + 4);
    const realStart = Math.max(1, end - 4);
    for (let i = realStart; i <= end; i++) nums.push(i);
    return nums;
  }, [safePage, totalPages]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden border-primary/30 bg-gradient-to-b from-primary/10 via-background/95 to-background/95 backdrop-blur-xl">
        {/* Podium */}
        <div className="relative pt-10 pb-6 px-6">
          <div
            className="absolute inset-x-0 top-0 h-32 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at top, hsl(38 92% 50% / 0.22), hsl(38 92% 50% / 0.05) 50%, transparent 75%)" }}
          />
          <div className="relative grid grid-cols-3 items-end gap-3">
            {top3.map((p, idx) => (
              <div key={`${p.name}-${idx}`} className="flex flex-col items-center">
                <div className={cn("relative", p.place === 1 && "-mb-1", p.empty && "opacity-50")}>
                  <RosetteBadge from={p.from} to={p.to} ribbon={p.ribbon} muted={p.empty} />
                  {p.place === 1 && !p.empty && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-amber-300">
                      <Sparkles className="h-3 w-3" />
                    </div>
                  )}
                </div>
                <div className={cn(
                  "mt-2 w-full rounded-t-xl px-3 py-3 text-center bg-gradient-to-b border border-amber-400/20",
                  p.pedestal,
                  p.height,
                )}>
                  <div className="text-sm font-semibold text-foreground truncate">{p.name}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">Max Streak: <span className="text-foreground/90 font-medium">{p.max}</span></div>
                  <div className="text-[11px] text-muted-foreground">Current Streak: <span className="text-foreground/90 font-medium">{p.current}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pt-1 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name…"
              aria-label="Search leaderboard users by name"
              className="h-9 pl-8 bg-background/40 border-amber-400/20 focus-visible:ring-amber-400/40 focus-visible:border-amber-400/40 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="px-2 sm:px-4 pb-2">
          <div className="grid grid-cols-[60px_1fr_110px_110px_110px] gap-2 px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
            <div>Rank</div>
            <div>Name</div>
            <div className="text-right">Current Streak</div>
            <div className="text-right">Max Streak</div>
            <div className="text-right">DSA Problem</div>
          </div>
          <div className="max-h-[280px] overflow-y-auto" aria-busy={loading}>
            {loading ? (
              <div className="py-2" role="status" aria-label="Loading leaderboard">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[60px_1fr_110px_110px_110px] gap-2 items-center px-3 py-2.5"
                  >
                    <div className="h-3.5 w-6 rounded bg-muted/40 animate-pulse" />
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-muted/40 animate-pulse" />
                      <div className="h-3.5 w-32 rounded bg-muted/40 animate-pulse" />
                    </div>
                    <div className="h-3.5 w-12 ml-auto rounded bg-muted/40 animate-pulse" />
                    <div className="h-3.5 w-12 ml-auto rounded bg-muted/40 animate-pulse" />
                    <div className="h-3.5 w-10 ml-auto rounded bg-muted/40 animate-pulse" />
                  </div>
                ))}
                <span className="sr-only">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading leaderboard…
                </span>
              </div>
            ) : pageRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10 px-6">
                <div className="h-12 w-12 rounded-full grid place-items-center bg-amber-400/10 border border-amber-400/25 text-amber-300 mb-3">
                  <UserX className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold text-foreground">No users found</div>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                  {search.trim()
                    ? <>No one matches “<span className="text-foreground/80">{search}</span>”. Try a different name.</>
                    : "The leaderboard is empty right now. Solve a problem to appear here."}
                </p>
                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-3 text-xs text-amber-300 hover:text-amber-200 underline-offset-4 hover:underline focus-parikshaa rounded"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              pageRows.map((r) => (
                <div key={r.rank} className="grid grid-cols-[60px_1fr_110px_110px_110px] gap-2 items-center px-3 py-2.5 text-sm hover:bg-muted/30 rounded-lg">
                  <div className="text-muted-foreground">#{r.rank}</div>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold text-primary-foreground bg-gradient-to-br from-primary to-orange-500">
                      {r.name.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="truncate text-foreground/90">{r.name}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1 tabular-nums">
                    <Flame className="h-3.5 w-3.5 text-orange-400" />
                    <span>{r.current}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1 tabular-nums">
                    <Code className="h-3.5 w-3.5 text-amber-400" />
                    <span>{r.max}</span>
                  </div>
                  <div className="text-right tabular-nums text-foreground/90">{r.problems}</div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-1 border-t border-border/40">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {loading
                ? "Loading…"
                : filtered.length === 0
                ? "0 users"
                : <>Showing <span className="text-foreground/80">{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}</span> of {filtered.length}</>}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous page"
                disabled={loading || safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 w-7 rounded-full border border-border/60 hover:border-amber-400/60 hover:text-amber-300 flex items-center justify-center disabled:opacity-40 disabled:hover:border-border/60 disabled:hover:text-current focus-parikshaa"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  disabled={loading}
                  aria-current={n === safePage ? "page" : undefined}
                  className={cn(
                    "h-7 min-w-7 px-2 rounded-full text-xs tabular-nums border flex items-center justify-center focus-parikshaa",
                    n === safePage
                      ? "border-amber-400/60 bg-amber-400/15 text-amber-200"
                      : "border-border/60 text-muted-foreground hover:border-amber-400/60 hover:text-amber-300",
                    "disabled:opacity-40",
                  )}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                aria-label="Next page"
                disabled={loading || safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 w-7 rounded-full border border-border/60 hover:border-amber-400/60 hover:text-amber-300 flex items-center justify-center disabled:opacity-40 disabled:hover:border-border/60 disabled:hover:text-current focus-parikshaa"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}





function LeaderboardCard() {
  return (
    <div className="learn-home-panel rounded-2xl border border-amber-400/30 backdrop-blur-xl p-4 ring-1 ring-amber-400/10 space-y-3">
      <div className="relative flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-foreground/90">Leaderboard</span>
        </div>
        <Link
          to="/learn/leaderboard"
          className="absolute right-0 top-1/2 -translate-y-1/2 text-[11px] px-2 py-1 rounded-lg border border-border/60 hover:border-amber-400/60 hover:text-amber-300 transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-1">
        {[
          { rank: "Rank 1", color: "bg-gradient-to-br from-amber-400 to-orange-500" },
          { rank: "Rank 2", color: "bg-gradient-to-br from-amber-200 to-amber-500" },
          { rank: "Rank 3", color: "bg-gradient-to-br from-orange-400 to-primary" },
          { rank: "****", color: "bg-gradient-to-br from-muted to-muted/60" },
        ].map((r) => (
          <div key={r.rank} className="flex flex-col items-center gap-1">
            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-primary-foreground shadow-md", r.color)}>
              <Trophy className="h-4 w-4" />
            </div>
            <span className="text-[10px] text-muted-foreground">{r.rank}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// Daily Planner — local-first persistent task planner
// ─────────────────────────────────────────────────────────────

type Recurrence = "none" | "daily" | "weekly" | "monthly" | "custom";
type RecurrenceUnit = "days" | "weeks" | "months";

type TaskHistoryChange = {
  field: "title" | "notes" | "startDate" | "endDate" | "recurrence";
  from: string;
  to: string;
};

type TaskHistoryEntry = {
  at: string; // ISO
  source: "edit" | "quick-edit" | "recurrence";
  changes: TaskHistoryChange[];
};

type PlannerTask = {
  id: string;
  title: string;
  notes?: string;
  startDate: string; // YYYY-MM-DD (IST)
  endDate: string;   // YYYY-MM-DD (IST)
  /** @deprecated kept for backward compat with previously persisted tasks */
  dueDate?: string;
  completedAt: string | null; // ISO
  createdAt: string; // ISO
  recurrence?: Recurrence;
  recurrenceInterval?: number; // used when recurrence === "custom"
  recurrenceUnit?: RecurrenceUnit; // used when recurrence === "custom"
  recurrenceParentId?: string;
  history?: TaskHistoryEntry[];
};

const PLANNER_KEY = (uid: string | undefined | null) => `byteskill.planner.${uid || "guest"}`;

function normalizeTask(raw: any): PlannerTask | null {
  if (!raw || typeof raw !== "object" || !raw.id || !raw.title) return null;
  const start = raw.startDate || raw.dueDate;
  const end = raw.endDate || raw.dueDate || start;
  if (!start || !end) return null;
  const rec: Recurrence = ["daily", "weekly", "monthly", "custom"].includes(raw.recurrence) ? raw.recurrence : "none";
  const unit: RecurrenceUnit = ["days", "weeks", "months"].includes(raw.recurrenceUnit) ? raw.recurrenceUnit : "days";
  const interval = Number.isFinite(raw.recurrenceInterval) && raw.recurrenceInterval > 0
    ? Math.min(365, Math.floor(raw.recurrenceInterval))
    : undefined;
  return {
    id: String(raw.id),
    title: String(raw.title),
    notes: typeof raw.notes === "string" ? raw.notes : undefined,
    startDate: start,
    endDate: end,
    completedAt: raw.completedAt || null,
    createdAt: raw.createdAt || new Date().toISOString(),
    recurrence: rec,
    recurrenceInterval: rec === "custom" ? (interval || 1) : interval,
    recurrenceUnit: rec === "custom" ? unit : (raw.recurrenceUnit ? unit : undefined),
    recurrenceParentId: raw.recurrenceParentId || undefined,
    history: Array.isArray(raw.history) ? raw.history : [],
  };
}

function loadPlannerTasks(uid: string | undefined | null): PlannerTask[] {
  try {
    const raw = localStorage.getItem(PLANNER_KEY(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeTask).filter((t): t is PlannerTask => t !== null);
  } catch {
    return [];
  }
}

function savePlannerTasks(uid: string | undefined | null, tasks: PlannerTask[]) {
  try {
    localStorage.setItem(PLANNER_KEY(uid), JSON.stringify(tasks));
  } catch {
    /* quota exceeded */
  }
}

const formatHumanDate = (yyyyMmDd: string) => {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st" :
    day % 10 === 2 && day !== 12 ? "nd" :
    day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${MONTHS[date.getMonth()]} ${day}${suffix}, ${date.getFullYear()}`;
};

// Convert YYYY-MM-DD <-> Date for the shadcn Calendar (local time, no tz drift)
const isoToDate = (yyyyMmDd: string): Date | undefined => {
  if (!yyyyMmDd) return undefined;
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};
const dateToIso = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// Recurrence helpers — work on YYYY-MM-DD using UTC math to avoid tz drift
function addDaysISO(yyyyMmDd: string, days: number) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}
function addMonthsISO(yyyyMmDd: string, months: number) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1 + months, d || 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}
function nextOccurrence(start: string, end: string, r: Recurrence | undefined, interval?: number, unit?: RecurrenceUnit) {
  if (!r || r === "none") return null;
  if (r === "monthly") return { start: addMonthsISO(start, 1), end: addMonthsISO(end, 1) };
  if (r === "daily") return { start: addDaysISO(start, 1), end: addDaysISO(end, 1) };
  if (r === "weekly") return { start: addDaysISO(start, 7), end: addDaysISO(end, 7) };
  // custom
  const n = Math.max(1, Math.floor(interval || 1));
  const u: RecurrenceUnit = unit || "days";
  if (u === "months") return { start: addMonthsISO(start, n), end: addMonthsISO(end, n) };
  const days = u === "weeks" ? n * 7 : n;
  return { start: addDaysISO(start, days), end: addDaysISO(end, days) };
}

const recurrenceLabel = (r: Recurrence | undefined, interval?: number, unit?: RecurrenceUnit) => {
  switch (r) {
    case "daily": return "Daily";
    case "weekly": return "Weekly";
    case "monthly": return "Monthly";
    case "custom": {
      const n = Math.max(1, Math.floor(interval || 1));
      const u: RecurrenceUnit = unit || "days";
      const noun = n === 1 ? u.replace(/s$/, "") : u;
      return n === 1 ? `Every ${noun}` : `Every ${n} ${noun}`;
    }
    default: return "None";
  }
};

type RecurrenceShape = { recurrence?: Recurrence; recurrenceInterval?: number; recurrenceUnit?: RecurrenceUnit };

function diffTaskFields(
  prev: { title: string; notes?: string; startDate: string; endDate: string } & RecurrenceShape,
  next: { title: string; notes?: string; startDate: string; endDate: string } & RecurrenceShape,
): TaskHistoryChange[] {
  const changes: TaskHistoryChange[] = [];
  if (prev.title !== next.title) changes.push({ field: "title", from: prev.title, to: next.title });
  if ((prev.notes || "") !== (next.notes || "")) changes.push({ field: "notes", from: prev.notes || "", to: next.notes || "" });
  if (prev.startDate !== next.startDate) changes.push({ field: "startDate", from: prev.startDate, to: next.startDate });
  if (prev.endDate !== next.endDate) changes.push({ field: "endDate", from: prev.endDate, to: next.endDate });
  const prevR = recurrenceLabel(prev.recurrence, prev.recurrenceInterval, prev.recurrenceUnit);
  const nextR = recurrenceLabel(next.recurrence, next.recurrenceInterval, next.recurrenceUnit);
  if (prevR !== nextR) {
    changes.push({ field: "recurrence", from: prevR, to: nextR });
  }
  return changes;
}

export function DailyPlanner({
  expanded,
  onExpand,
  onCollapse,
}: {
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}) {
  const { user } = useAuth();
  const uid = user?.id;
  const todayKey = istToday();

  const [tasks, setTasks] = useState<PlannerTask[]>(() => loadPlannerTasks(uid));
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState<"ongoing" | "completed" | "missed">("ongoing");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState(todayKey);
  const [endDate, setEndDate] = useState(todayKey);
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(1);
  const [recurrenceUnit, setRecurrenceUnit] = useState<RecurrenceUnit>("days");
  const [pendingDelete, setPendingDelete] = useState<PlannerTask | null>(null);
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
  const [formSnapshot, setFormSnapshot] = useState<{ title: string; notes: string; startDate: string; endDate: string; recurrence: Recurrence; recurrenceInterval: number; recurrenceUnit: RecurrenceUnit }>({
    title: "", notes: "", startDate: todayKey, endDate: todayKey, recurrence: "none", recurrenceInterval: 1, recurrenceUnit: "days",
  });
  const [discardOpen, setDiscardOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [quickEdit, setQuickEdit] = useState<{ id: string; field: "title" | "notes" } | null>(null);
  const [quickValue, setQuickValue] = useState("");
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyAction, setHistoryAction] = useState<"all" | "edit" | "quick-edit" | "recurrence">("all");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [historySort, setHistorySort] = useState<"newest" | "oldest" | "task-az" | "task-za">("newest");
  const [taskQuickFilter, setTaskQuickFilter] = useState<"all" | "starts-today" | "ends-today" | "recurring" | "with-history">("all");

  // Re-load when user changes
  useEffect(() => {
    setTasks(loadPlannerTasks(uid));
  }, [uid]);

  // Persist
  useEffect(() => {
    savePlannerTasks(uid, tasks);
  }, [uid, tasks]);

  const buckets = useMemo(() => {
    const ongoing: PlannerTask[] = [];
    const completed: PlannerTask[] = [];
    const missed: PlannerTask[] = [];
    for (const t of tasks) {
      if (t.completedAt) completed.push(t);
      else if (t.endDate < todayKey) missed.push(t);
      else ongoing.push(t);
    }
    const byStart = (a: PlannerTask, b: PlannerTask) => a.startDate.localeCompare(b.startDate);
    return {
      ongoing: ongoing.sort(byStart),
      completed: completed.sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || "")),
      missed: missed.sort(byStart),
    };
  }, [tasks, todayKey]);

  const dateError = endDate < startDate ? "End date can't be before start date" : null;

  const isDirty = (() => {
    return (
      title !== formSnapshot.title ||
      notes !== formSnapshot.notes ||
      startDate !== formSnapshot.startDate ||
      endDate !== formSnapshot.endDate ||
      recurrence !== formSnapshot.recurrence ||
      (recurrence === "custom" && (
        recurrenceInterval !== formSnapshot.recurrenceInterval ||
        recurrenceUnit !== formSnapshot.recurrenceUnit
      ))
    );
  })();

  const resetForm = () => {
    setTitle("");
    setNotes("");
    setStartDate(todayKey);
    setEndDate(todayKey);
    setRecurrence("none");
    setRecurrenceInterval(1);
    setRecurrenceUnit("days");
    setEditingTask(null);
    setFormSnapshot({ title: "", notes: "", startDate: todayKey, endDate: todayKey, recurrence: "none", recurrenceInterval: 1, recurrenceUnit: "days" });
  };

  const requestCloseForm = () => {
    if (isDirty) {
      setDiscardOpen(true);
    } else {
      resetForm();
      setShowAdd(false);
    }
  };

  const confirmDiscard = () => {
    setDiscardOpen(false);
    resetForm();
    setShowAdd(false);
  };

  const addTask = () => {
    const t = title.trim();
    if (!t) {
      toast.error("Please enter a task title");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Pick start and end dates");
      return;
    }
    if (dateError) {
      toast.error(dateError);
      return;
    }
    if (recurrence === "custom" && (!Number.isFinite(recurrenceInterval) || recurrenceInterval < 1)) {
      toast.error("Custom interval must be at least 1");
      return;
    }
    const recurrenceFields = recurrence === "custom"
      ? { recurrence, recurrenceInterval: Math.max(1, Math.floor(recurrenceInterval)), recurrenceUnit }
      : { recurrence, recurrenceInterval: undefined, recurrenceUnit: undefined };
    if (editingTask) {
      const nextFields = { title: t, notes: notes.trim() || undefined, startDate, endDate, ...recurrenceFields };
      const changes = diffTaskFields(
        { title: editingTask.title, notes: editingTask.notes, startDate: editingTask.startDate, endDate: editingTask.endDate, recurrence: editingTask.recurrence, recurrenceInterval: editingTask.recurrenceInterval, recurrenceUnit: editingTask.recurrenceUnit },
        nextFields,
      );
      setTasks((prev) =>
        prev.map((x) =>
          x.id === editingTask.id
            ? {
                ...x,
                ...nextFields,
                history: changes.length
                  ? [...(x.history || []), { at: new Date().toISOString(), source: "edit", changes }]
                  : x.history || [],
              }
            : x,
        ),
      );
      const targetTab: "ongoing" | "missed" = endDate < todayKey ? "missed" : "ongoing";
      resetForm();
      setShowAdd(false);
      setTab(targetTab);
      toast.success("Task updated");
      return;
    }
    const newTask: PlannerTask = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: t,
      notes: notes.trim() || undefined,
      startDate,
      endDate,
      completedAt: null,
      createdAt: new Date().toISOString(),
      ...recurrenceFields,
      history: [],
    };
    setTasks((prev) => [newTask, ...prev]);
    const targetTab: "ongoing" | "missed" = endDate < todayKey ? "missed" : "ongoing";
    resetForm();
    setShowAdd(false);
    setTab(targetTab);
    toast.success("Task added");
  };

  const toggleComplete = (id: string) => {
    setTasks((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;
      const wasCompleted = !!target.completedAt;
      const updated = prev.map((t) =>
        t.id === id ? { ...t, completedAt: wasCompleted ? null : new Date().toISOString() } : t,
      );
      // If completing a recurring task, spawn the next occurrence (only on completion, not undo)
      if (!wasCompleted && target.recurrence && target.recurrence !== "none") {
        const next = nextOccurrence(target.startDate, target.endDate, target.recurrence, target.recurrenceInterval, target.recurrenceUnit);
        if (next) {
          const spawned: PlannerTask = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title: target.title,
            notes: target.notes,
            startDate: next.start,
            endDate: next.end,
            completedAt: null,
            createdAt: new Date().toISOString(),
            recurrence: target.recurrence,
            recurrenceInterval: target.recurrenceInterval,
            recurrenceUnit: target.recurrenceUnit,
            recurrenceParentId: target.recurrenceParentId || target.id,
            history: [
              {
                at: new Date().toISOString(),
                source: "recurrence",
                changes: [
                  { field: "startDate", from: target.startDate, to: next.start },
                  { field: "endDate", from: target.endDate, to: next.end },
                ],
              },
            ],
          };
          toast.success(`Next ${recurrenceLabel(target.recurrence, target.recurrenceInterval, target.recurrenceUnit).toLowerCase()} occurrence scheduled`);
          return [spawned, ...updated];
        }
      }
      return updated;
    });
  };

  const confirmRemove = () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setPendingDelete(null);
    toast.success("Task removed");
  };

  const openEdit = (t: PlannerTask) => {
    const snap = {
      title: t.title,
      notes: t.notes || "",
      startDate: t.startDate,
      endDate: t.endDate,
      recurrence: (t.recurrence || "none") as Recurrence,
      recurrenceInterval: t.recurrenceInterval || 1,
      recurrenceUnit: (t.recurrenceUnit || "days") as RecurrenceUnit,
    };
    setEditingTask(t);
    setTitle(snap.title);
    setNotes(snap.notes);
    setStartDate(snap.startDate);
    setEndDate(snap.endDate);
    setRecurrence(snap.recurrence);
    setRecurrenceInterval(snap.recurrenceInterval);
    setRecurrenceUnit(snap.recurrenceUnit);
    setFormSnapshot(snap);
    setShowAdd(true);
  };

  const TITLE_MAX = 120;
  const NOTES_MAX = 500;
  const quickEditError: string | null = (() => {
    if (!quickEdit) return null;
    if (quickEdit.field === "title") {
      if (!quickValue.trim()) return "Title can't be empty";
      if (quickValue.length > TITLE_MAX) return `Title must be ≤ ${TITLE_MAX} characters`;
    } else {
      if (quickValue.length > NOTES_MAX) return `Notes must be ≤ ${NOTES_MAX} characters`;
    }
    return null;
  })();

  const cancelQuickEdit = () => {
    setQuickEdit(null);
    setQuickValue("");
  };

  const commitQuickEdit = () => {
    if (!quickEdit) return;
    if (quickEditError) {
      toast.error(quickEditError);
      return;
    }
    const val = quickValue;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== quickEdit.id) return t;
        if (quickEdit.field === "title") {
          const nv = val.trim();
          if (!nv || nv === t.title) return t;
          return {
            ...t,
            title: nv,
            history: [
              ...(t.history || []),
              { at: new Date().toISOString(), source: "quick-edit", changes: [{ field: "title", from: t.title, to: nv }] },
            ],
          };
        } else {
          const nv = val;
          const prevNotes = t.notes || "";
          if (nv === prevNotes) return t;
          return {
            ...t,
            notes: nv.trim() ? nv : undefined,
            history: [
              ...(t.history || []),
              { at: new Date().toISOString(), source: "quick-edit", changes: [{ field: "notes", from: prevNotes, to: nv }] },
            ],
          };
        }
      }),
    );
    setQuickEdit(null);
    setQuickValue("");
    toast.success("Saved");
  };

  const rawVisible = buckets[tab];
  const visibleTasks = useMemo(() => {
    if (taskQuickFilter === "all") return rawVisible;
    return rawVisible.filter((t) => {
      switch (taskQuickFilter) {
        case "starts-today": return t.startDate === todayKey;
        case "ends-today": return t.endDate === todayKey;
        case "recurring": return !!t.recurrence && t.recurrence !== "none";
        case "with-history": return (t.history?.length || 0) > 0;
        default: return true;
      }
    });
  }, [rawVisible, taskQuickFilter, todayKey]);
  const counts = {
    ongoing: buckets.ongoing.length,
    completed: buckets.completed.length,
    missed: buckets.missed.length,
  };

  const filteredHistory = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    const groups = tasks
      .map((t) => {
        const entries = (t.history || []).filter((h) => {
          if (historyAction !== "all" && h.source !== historyAction) return false;
          const day = (h.at || "").slice(0, 10);
          if (historyFrom && day < historyFrom) return false;
          if (historyTo && day > historyTo) return false;
          if (q) {
            const hay = (
              t.title + " " + h.changes.map((c) => `${c.field} ${c.from} ${c.to}`).join(" ")
            ).toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        });
        return { task: t, entries };
      })
      .filter((x) => x.entries.length > 0);

    // Sort entries inside each task by date (newest/oldest controls direction)
    const ascEntries = historySort === "oldest";
    groups.forEach((g) => {
      g.entries.sort((a, b) => ascEntries ? a.at.localeCompare(b.at) : b.at.localeCompare(a.at));
    });

    // Sort groups
    if (historySort === "task-az") {
      groups.sort((a, b) => a.task.title.localeCompare(b.task.title));
    } else if (historySort === "task-za") {
      groups.sort((a, b) => b.task.title.localeCompare(a.task.title));
    } else {
      // newest/oldest — order groups by their most recent activity, matching direction
      groups.sort((a, b) => {
        const aMax = a.entries[0].at;
        const bMax = b.entries[0].at;
        return ascEntries ? aMax.localeCompare(bMax) : bMax.localeCompare(aMax);
      });
    }
    return groups;
  }, [tasks, historyQuery, historyAction, historyFrom, historyTo, historySort]);

  const totalHistoryEntries = useMemo(
    () => tasks.reduce((acc, t) => acc + (t.history?.length || 0), 0),
    [tasks],
  );
  const filteredEntryCount = useMemo(
    () => filteredHistory.reduce((acc, x) => acc + x.entries.length, 0),
    [filteredHistory],
  );
  const historyFiltersActive =
    !!historyQuery.trim() || historyAction !== "all" || !!historyFrom || !!historyTo || historySort !== "newest";
  const clearHistoryFilters = () => {
    setHistoryQuery("");
    setHistoryAction("all");
    setHistoryFrom("");
    setHistoryTo("");
    setHistorySort("newest");
  };

  const fieldLabel = (f: TaskHistoryChange["field"]) => {
    switch (f) {
      case "title": return "Title";
      case "notes": return "Notes";
      case "startDate": return "Start date";
      case "endDate": return "End date";
      case "recurrence": return "Recurrence";
    }
  };

  // ─── Collapsed (compact bar) ───
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className="learn-home-panel w-full group flex items-center justify-between rounded-2xl border backdrop-blur-sm px-4 py-3.5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="rr-hero-heading text-sm">Daily Planner</span>
          <span className="rr-hero-value inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary/10 text-[11px]">
            {counts.ongoing}
          </span>
        </div>
        <Maximize2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </button>
    );
  }

  // ─── Expanded (full panel) ───
  return (
    <div className="learn-home-panel relative isolate flex flex-col h-full min-h-0 rounded-2xl border border-white/[0.06] bg-[hsl(var(--card))]/40 backdrop-blur-sm overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 0%, hsl(var(--primary)/0.28), transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-30deg, transparent 0 60px, hsl(var(--primary)/0.35) 60px 61px)",
          maskImage:
            "radial-gradient(ellipse 65% 60% at 50% 20%, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 60% at 50% 20%, black, transparent 75%)",
        }}
      />
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <span className="rr-hero-eyebrow">
          Daily Planner
        </span>
        <div className="flex items-center gap-1.5">
          <ActionIcon
            icon={showAdd ? X : Plus}
            label={showAdd ? "Close add task" : "Add task"}
            tooltip={showAdd ? "Close" : "Add task"}
            tone={showAdd ? "rose" : "amber"}
            strokeWidth={showAdd ? 2 : 2.5}
            onClick={() => {
              if (showAdd) requestCloseForm();
              else setShowAdd(true);
            }}
          />
          <ActionIcon
            icon={HistoryIcon}
            label={historyOpen ? "Close task history" : "Open task history"}
            tooltip="Task history"
            active={historyOpen}
            onClick={() => setHistoryOpen((v) => !v)}
          />
          <ActionIcon
            icon={Minimize2}
            label="Collapse planner"
            tooltip="Collapse"
            onClick={onCollapse}
          />
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="px-4 py-3 border-b border-dashed border-border/50 space-y-2.5"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addTask();
              if (e.key === "Escape") requestCloseForm();
            }}
            placeholder="Task title"
            autoFocus
            className="w-full px-3 py-2 rounded-lg bg-background/80 border border-border/60 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 transition-colors"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-background/80 border border-border/60 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 transition-colors resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground antialiased">Start</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Start date: ${formatHumanDate(startDate)}. Click to change.`}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg bg-background/80 border text-sm cursor-pointer hover:border-amber-400/40 transition-colors text-left w-full focus:outline-none focus:ring-2 focus:ring-amber-400/30",
                      dateError ? "border-rose-500/60" : "border-border/60",
                    )}
                  >
                    <CalendarDays className="h-4 w-4 text-amber-400 shrink-0" />
                    <span className="flex-1 truncate text-foreground antialiased text-xs">{formatHumanDate(startDate)}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0 z-[60]">
                  <CalendarPicker
                    mode="single"
                    selected={isoToDate(startDate)}
                    onSelect={(d) => {
                      if (!d) return;
                      const v = dateToIso(d);
                      setStartDate(v);
                      if (endDate < v) setEndDate(v);
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground antialiased">End</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label={`End date: ${formatHumanDate(endDate)}. Click to change.`}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg bg-background/80 border text-sm cursor-pointer hover:border-amber-400/40 transition-colors text-left w-full focus:outline-none focus:ring-2 focus:ring-amber-400/30",
                      dateError ? "border-rose-500/60" : "border-border/60",
                    )}
                  >
                    <CalendarDays className="h-4 w-4 text-amber-400 shrink-0" />
                    <span className="flex-1 truncate text-foreground antialiased text-xs">{formatHumanDate(endDate)}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0 z-[60]">
                  <CalendarPicker
                    mode="single"
                    selected={isoToDate(endDate)}
                    onSelect={(d) => {
                      if (!d) return;
                      setEndDate(dateToIso(d));
                    }}
                    disabled={(d) => {
                      const min = isoToDate(startDate);
                      return min ? d < min : false;
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {dateError && (
            <div className="flex items-center gap-1.5 text-[11px] text-rose-400 antialiased">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{dateError}</span>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground antialiased flex items-center gap-1">
              <Repeat className="h-3 w-3" /> Recurrence
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["none", "daily", "weekly", "monthly", "custom"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRecurrence(r)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors antialiased capitalize",
                    recurrence === r
                      ? "border-amber-400/60 bg-amber-500/15 text-amber-300"
                      : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  )}
                >
                  {r === "custom" ? "Custom" : recurrenceLabel(r)}
                </button>
              ))}
            </div>
            {recurrence === "custom" && (
              <div className="flex items-center gap-2 mt-1 px-2.5 py-2 rounded-lg bg-background/60 border border-amber-400/30">
                <span className="text-[11px] text-muted-foreground antialiased">Every</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
                  className="w-16 px-2 py-1 rounded-md bg-background/80 border border-border/60 text-xs text-foreground focus:outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 tabular-nums"
                />
                <select
                  value={recurrenceUnit}
                  onChange={(e) => setRecurrenceUnit(e.target.value as RecurrenceUnit)}
                  className="px-2 py-1 rounded-md bg-background/80 border border-border/60 text-xs text-foreground focus:outline-none focus:border-amber-400/60"
                >
                  <option value="days">{recurrenceInterval === 1 ? "day" : "days"}</option>
                  <option value="weeks">{recurrenceInterval === 1 ? "week" : "weeks"}</option>
                  <option value="months">{recurrenceInterval === 1 ? "month" : "months"}</option>
                </select>
                <span className="ml-auto text-[10px] text-amber-300/80 antialiased font-medium">
                  {recurrenceLabel("custom", recurrenceInterval, recurrenceUnit)}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={requestCloseForm}
              className="px-3 py-2 rounded-lg text-xs font-semibold border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addTask}
              disabled={!!dateError || !title.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-amber-400/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 hover:border-amber-400/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-500/15"
            >
              {editingTask ? "Save changes" : "Add task"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-2 border-b border-border/40">
        {(
          [
            { key: "ongoing", label: "Ongoing", count: counts.ongoing },
            { key: "completed", label: "Completed", count: counts.completed },
            { key: "missed", label: "Missed", count: counts.missed },
          ] as const
        ).map((t) => {
          const active = tab === t.key;
          return (
            <ParikshaaChip
              key={t.key}
              variant="ghost"
              selected={active}
              onClick={() => setTab(t.key)}
              aria-label={`${t.label} tab`}
              className="px-3 py-1.5 text-xs"
            >
              {t.label} ({t.count})
            </ParikshaaChip>
          );
        })}
      </div>

      {/* Quick filter chips (horizontally scrollable) + color legend */}
      <div className="px-3 pt-2 pb-2 border-b border-border/30">
        <ScrollableChipStrip
          ariaLabel="Task quick filters"
          trailing={<BrandChipLegend triggerClassName="ml-1" />}
        >
          {(
            [
              { key: "all", label: "All", icon: LayoutGrid },
              { key: "starts-today", label: "Starts today", icon: CalendarClock },
              { key: "ends-today", label: "Ends today", icon: CalendarCheck2 },
              { key: "recurring", label: "Recurring", icon: Repeat },
              { key: "with-history", label: "With history", icon: HistoryIcon },
            ] as const
          ).map((f) => {
            const Icon = f.icon;
            const active = taskQuickFilter === f.key;
            return (
              <ParikshaaChip
                key={f.key}
                variant="solid"
                selected={active}
                onClick={() => setTaskQuickFilter(f.key)}
                aria-label={`Filter: ${f.label}`}
                className="shrink-0 snap-start text-[10px]"
              >
                <Icon className="h-2.5 w-2.5" />
                {f.label}
              </ParikshaaChip>
            );
          })}
        </ScrollableChipStrip>
      </div>


      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] px-3 py-3">
        {visibleTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-8">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 ring-1 ring-amber-400/30 flex items-center justify-center mb-3 shadow-inner">
              <ClipboardListIcon className="h-6 w-6 text-amber-400" />
            </div>
            <p className="rr-hero-heading text-sm">Plan your daily tasks here</p>
            <p className="rr-hero-label mt-1">Track, manage, and complete accordingly</p>
            {tab === "ongoing" && (
              <ParikshaaChip
                variant="outline"
                onClick={() => setShowAdd(true)}
                aria-label="Add your first task"
                className="mt-4 px-3 py-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add your first task
              </ParikshaaChip>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {visibleTasks.map((t) => {
              const isCompleted = !!t.completedAt;
              const isMissed = !isCompleted && t.endDate < todayKey;
              const sameDay = t.startDate === t.endDate;
              const editingTitle = quickEdit?.id === t.id && quickEdit.field === "title";
              const editingNotes = quickEdit?.id === t.id && quickEdit.field === "notes";
              return (
                <li
                  key={t.id}
                  className={cn(
                    "group flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-colors",
                    isCompleted
                      ? "border-emerald-500/25 bg-emerald-500/5"
                      : isMissed
                        ? "border-rose-500/25 bg-rose-500/5"
                        : "border-border/60 bg-background/40 hover:border-amber-400/40 hover:bg-amber-500/5",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleComplete(t.id)}
                    aria-label={isCompleted ? "Mark as not done" : "Mark as done"}
                    className={cn(
                      "shrink-0 mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-colors",
                      isCompleted
                        ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-300"
                        : "border-border hover:border-amber-400/60 hover:bg-amber-500/10",
                    )}
                  >
                    {isCompleted && <Check className="h-3 w-3" strokeWidth={3} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    {editingTitle ? (
                      <div className="space-y-1">
                        <div className="flex items-start gap-1.5">
                          <input
                            autoFocus
                            value={quickValue}
                            maxLength={TITLE_MAX + 20}
                            aria-label="Edit task title"
                            aria-invalid={!!quickEditError}
                            aria-describedby={`qe-title-${t.id}-help`}
                            onChange={(e) => setQuickValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); commitQuickEdit(); }
                              else if (e.key === "Escape") { e.preventDefault(); cancelQuickEdit(); }
                            }}
                            className={cn(
                              "flex-1 min-w-0 px-2 py-1 -mx-0.5 rounded-md bg-background/90 border text-sm text-foreground focus:outline-none focus:ring-2 transition-colors",
                              quickEditError
                                ? "border-rose-500/60 focus:ring-rose-400/30"
                                : "border-amber-400/60 focus:ring-amber-400/30",
                            )}
                          />
                          <ActionIcon
                            icon={Check}
                            label="Save quick edit"
                            tooltip="Save (Enter)"
                            tone="emerald"
                            size={7}
                            iconSize={3.5}
                            strokeWidth={3}
                            disabled={!!quickEditError}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={commitQuickEdit}
                            className="shrink-0"
                          />
                          <ActionIcon
                            icon={X}
                            label="Cancel quick edit"
                            tooltip="Cancel (Esc)"
                            size={7}
                            iconSize={3.5}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={cancelQuickEdit}
                            className="shrink-0 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-400/40"
                          />
                        </div>
                        <div id={`qe-title-${t.id}-help`} className="flex items-center justify-between gap-2 text-[10px] antialiased">
                          {quickEditError ? (
                            <span className="inline-flex items-center gap-1 text-rose-400">
                              <AlertCircle className="h-3 w-3" />
                              {quickEditError}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/70">Enter to save · Esc to cancel</span>
                          )}
                          <span className={cn(
                            "tabular-nums",
                            quickValue.length > TITLE_MAX ? "text-rose-400" : "text-muted-foreground/70",
                          )}>
                            {quickValue.length}/{TITLE_MAX}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p
                        onDoubleClick={() => {
                          setQuickEdit({ id: t.id, field: "title" });
                          setQuickValue(t.title);
                        }}
                        title="Double-click to quick-edit"
                        className={cn(
                          "text-sm font-medium antialiased leading-snug break-words cursor-text",
                          isCompleted ? "line-through text-muted-foreground" : "text-foreground",
                        )}
                      >
                        {t.title}
                      </p>
                    )}
                    {editingNotes ? (
                      <div className="mt-1 space-y-1">
                        <textarea
                          autoFocus
                          rows={2}
                          value={quickValue}
                          maxLength={NOTES_MAX + 50}
                          aria-label="Edit task notes"
                          aria-invalid={!!quickEditError}
                          aria-describedby={`qe-notes-${t.id}-help`}
                          onChange={(e) => setQuickValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); commitQuickEdit(); }
                            else if (e.key === "Escape") { e.preventDefault(); cancelQuickEdit(); }
                          }}
                          className={cn(
                            "w-full px-2 py-1 rounded-md bg-background/90 border text-[11px] text-foreground focus:outline-none focus:ring-2 resize-none transition-colors",
                            quickEditError
                              ? "border-rose-500/60 focus:ring-rose-400/30"
                              : "border-amber-400/60 focus:ring-amber-400/30",
                          )}
                        />
                        <div id={`qe-notes-${t.id}-help`} className="flex items-center justify-between gap-2 text-[10px] antialiased">
                          {quickEditError ? (
                            <span className="inline-flex items-center gap-1 text-rose-400">
                              <AlertCircle className="h-3 w-3" />
                              {quickEditError}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/70">⌘/Ctrl + Enter to save · Esc to cancel</span>
                          )}
                          <span className={cn(
                            "tabular-nums",
                            quickValue.length > NOTES_MAX ? "text-rose-400" : "text-muted-foreground/70",
                          )}>
                            {quickValue.length}/{NOTES_MAX}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={cancelQuickEdit}
                            className="h-6 px-2 rounded-md text-[10px] font-semibold border border-border/60 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={commitQuickEdit}
                            disabled={!!quickEditError}
                            className="h-6 px-2 rounded-md text-[10px] font-semibold border border-emerald-400/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : t.notes ? (
                      <p
                        onDoubleClick={() => {
                          setQuickEdit({ id: t.id, field: "notes" });
                          setQuickValue(t.notes || "");
                        }}
                        title="Double-click to quick-edit"
                        className="text-[11px] text-muted-foreground mt-0.5 leading-snug break-words line-clamp-2 antialiased cursor-text"
                      >
                        {t.notes}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setQuickEdit({ id: t.id, field: "notes" });
                          setQuickValue("");
                        }}
                        className="text-[11px] text-muted-foreground/60 hover:text-amber-300 mt-0.5 antialiased opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        + Add note
                      </button>
                    )}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap min-w-0 max-w-full">
                      {(() => {
                        const startIsToday = t.startDate === todayKey;
                        const endIsToday = t.endDate === todayKey;
                        const endIsPast = t.endDate < todayKey;
                        // Semantic tones via ParikshaaChip — same hover/active/focus
                        // logic across all chips, only the hue changes per state.
                        // Icons paired with each tone satisfy WCAG 1.4.1.
                        const startToneKey: "completed" | "today" | "brand" = isCompleted
                          ? "completed"
                          : startIsToday
                            ? "today"
                            : "brand";
                        const endToneKey: "completed" | "missed" | "today" | "future" = isCompleted
                          ? "completed"
                          : isMissed || endIsPast
                            ? "missed"
                            : endIsToday
                              ? "today"
                              : "future";
                        const StartStateIcon = isCompleted ? CheckCircle2 : CalendarClock;
                        const EndStateIcon = isCompleted
                          ? CheckCircle2
                          : isMissed || endIsPast
                            ? AlertCircle
                            : CalendarCheck2;
                        const chipClass = "text-[10px] py-0.5 px-2 tabular-nums max-w-full truncate";
                        if (sameDay) {
                          return (
                            <ParikshaaChip as="span" variant="solid" tone={endToneKey} className={chipClass}>
                              <EndStateIcon className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{formatHumanDate(t.startDate)}</span>
                              {endIsToday && !isCompleted && (
                                <span className="ml-1 px-1 rounded-sm bg-amber-400/30 text-amber-100 text-[9px] shrink-0">Today</span>
                              )}
                            </ParikshaaChip>
                          );
                        }
                        return (
                          <>
                            <ParikshaaChip as="span" variant="solid" tone={startToneKey} className={chipClass}>
                              <StartStateIcon className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{formatHumanDate(t.startDate)}</span>
                              {startIsToday && !isCompleted && (
                                <span className="ml-0.5 px-1 rounded-sm bg-amber-400/30 text-amber-100 text-[9px] shrink-0">Today</span>
                              )}
                            </ParikshaaChip>
                            <ChevronRightIcon className="h-3 w-3 text-amber-300/50 shrink-0" />
                            <ParikshaaChip as="span" variant="solid" tone={endToneKey} className={chipClass}>
                              <EndStateIcon className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{formatHumanDate(t.endDate)}</span>
                              {endIsToday && !isCompleted && (
                                <span className="ml-0.5 px-1 rounded-sm bg-amber-400/30 text-amber-100 text-[9px] shrink-0">Today</span>
                              )}
                            </ParikshaaChip>
                          </>
                        );
                      })()}
                      {t.recurrence && t.recurrence !== "none" && (
                        <ParikshaaChip as="span" variant="outline" className="text-[10px] max-w-full truncate">
                          <Repeat className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{recurrenceLabel(t.recurrence, t.recurrenceInterval, t.recurrenceUnit)}</span>
                        </ParikshaaChip>
                      )}
                      {(t.history?.length || 0) > 0 && (
                        <ParikshaaChip as="span" variant="outline" tone="future" className="text-[10px] tabular-nums shrink-0">
                          <HistoryIcon className="h-2.5 w-2.5" />
                          {t.history!.length}
                        </ParikshaaChip>
                      )}
                    </div>

                  </div>
                  <ActionIcon
                    icon={Pencil}
                    label="Edit task"
                    tooltip="Edit task"
                    size={7}
                    iconSize={3.5}
                    onClick={() => openEdit(t)}
                    className="shrink-0 border-transparent bg-transparent text-muted-foreground/60 hover:text-amber-300 hover:bg-amber-500/10 hover:border-amber-400/30 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  />
                  <ActionIcon
                    icon={Trash2}
                    label="Delete task"
                    tooltip="Delete task"
                    size={7}
                    iconSize={3.5}
                    onClick={() => setPendingDelete(t)}
                    className="shrink-0 border-transparent bg-transparent text-muted-foreground/60 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-400/30 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? `"${pendingDelete.title}" will be removed permanently.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discard unsaved changes confirmation */}
      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved edits to this task. Closing the form will lose them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDiscard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Task history — inline overlay inside the planner rail */}
      {historyOpen && (
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-x-0 top-[49px] bottom-0 z-10 flex flex-col bg-card/95 backdrop-blur-xl border-t border-amber-400/20"
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <ActionIcon
                icon={ArrowLeft}
                label="Back to planner"
                tooltip="Back"
                size={7}
                iconSize={3.5}
                onClick={() => setHistoryOpen(false)}
              />
              <span className="text-xs font-semibold text-foreground antialiased flex items-center gap-1.5">
                <HistoryIcon className="h-3.5 w-3.5 text-amber-400" />
                Task history
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums antialiased">
              {filteredEntryCount}/{totalHistoryEntries}
            </span>
          </div>


          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 [scrollbar-width:thin]">
          {/* Filters toolbar */}
          <div className="space-y-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={historyQuery}
                onChange={(e) => setHistoryQuery(e.target.value)}
                placeholder="Search by task or changed value…"
                aria-label="Search history"
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-background/80 border border-border/60 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20"
              />
            </div>

            {/* Icon-popover toolbar */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                {/* Sort popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <span>
                      <ActionIcon
                        icon={ArrowDownNarrowWide}
                        label={`Sort: ${
                          historySort === "newest" ? "Newest first" :
                          historySort === "oldest" ? "Oldest first" :
                          historySort === "task-az" ? "Task A → Z" : "Task Z → A"
                        }`}
                        tooltip="Sort"
                        size={7}
                        iconSize={3.5}
                        active={historySort !== "newest"}
                      />
                    </span>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-48 p-1 z-[60]">
                    {(
                      [
                        { key: "newest", label: "Newest first" },
                        { key: "oldest", label: "Oldest first" },
                        { key: "task-az", label: "Task name (A → Z)" },
                        { key: "task-za", label: "Task name (Z → A)" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setHistorySort(opt.key)}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 rounded-md text-xs antialiased flex items-center gap-2 transition-colors",
                          historySort === opt.key
                            ? "bg-amber-500/15 text-amber-300"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                        )}
                      >
                        {historySort === opt.key && <Check className="h-3 w-3" strokeWidth={3} />}
                        <span className={cn(historySort !== opt.key && "pl-5")}>{opt.label}</span>
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>

                {/* Action filter popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <span>
                      <ActionIcon
                        icon={FilterIcon}
                        label={`Action filter: ${historyAction === "all" ? "All" : historyAction}`}
                        tooltip="Filter by action"
                        size={7}
                        iconSize={3.5}
                        active={historyAction !== "all"}
                      />
                    </span>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-48 p-1 z-[60]">
                    {(
                      [
                        { key: "all", label: "All actions" },
                        { key: "edit", label: "Edit" },
                        { key: "quick-edit", label: "Quick edit" },
                        { key: "recurrence", label: "Recurrence" },
                      ] as const
                    ).map((a) => (
                      <button
                        key={a.key}
                        type="button"
                        onClick={() => setHistoryAction(a.key)}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 rounded-md text-xs antialiased flex items-center gap-2 transition-colors",
                          historyAction === a.key
                            ? "bg-amber-500/15 text-amber-300"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                        )}
                      >
                        {historyAction === a.key && <Check className="h-3 w-3" strokeWidth={3} />}
                        <span className={cn(historyAction !== a.key && "pl-5")}>{a.label}</span>
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>

                {/* Date range popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <span>
                      <ActionIcon
                        icon={CalendarDays}
                        label={
                          historyFrom || historyTo
                            ? `Date range: ${historyFrom || "…"} → ${historyTo || "…"}`
                            : "Filter by date range"
                        }
                        tooltip="Date range"
                        size={7}
                        iconSize={3.5}
                        active={!!(historyFrom || historyTo)}
                      />
                    </span>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-60 p-3 z-[60] space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-0.5">
                        <span className="text-[9px] uppercase tracking-wide font-semibold text-muted-foreground">From</span>
                        <input
                          type="date"
                          value={historyFrom}
                          onChange={(e) => setHistoryFrom(e.target.value)}
                          className="px-2 py-1.5 rounded-md bg-background/80 border border-border/60 text-[11px] text-foreground focus:outline-none focus:border-amber-400/60"
                        />
                      </label>
                      <label className="flex flex-col gap-0.5">
                        <span className="text-[9px] uppercase tracking-wide font-semibold text-muted-foreground">To</span>
                        <input
                          type="date"
                          value={historyTo}
                          min={historyFrom || undefined}
                          onChange={(e) => setHistoryTo(e.target.value)}
                          className="px-2 py-1.5 rounded-md bg-background/80 border border-border/60 text-[11px] text-foreground focus:outline-none focus:border-amber-400/60"
                        />
                      </label>
                    </div>
                    {(historyFrom || historyTo) && (
                      <button
                        type="button"
                        onClick={() => { setHistoryFrom(""); setHistoryTo(""); }}
                        className="w-full text-[10px] font-semibold text-muted-foreground hover:text-amber-300 transition-colors"
                      >
                        Clear date range
                      </button>
                    )}
                  </PopoverContent>
                </Popover>

                {historyFiltersActive && (
                  <ActionIcon
                    icon={X}
                    label="Clear all filters"
                    tooltip="Clear filters"
                    tone="rose"
                    size={7}
                    iconSize={3.5}
                    onClick={clearHistoryFilters}
                  />
                )}
              </div>

              <span className="text-[10px] text-muted-foreground tabular-nums antialiased">
                {filteredEntryCount} of {totalHistoryEntries} {totalHistoryEntries === 1 ? "entry" : "entries"}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {totalHistoryEntries === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground antialiased">
                No edits yet. Changes to tasks will appear here.
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground antialiased">
                No edits match your filters.
              </div>
            ) : (
              filteredHistory.map(({ task: t, entries }) => (
                <div key={t.id} className="rounded-xl border border-border/60 bg-card/60 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-foreground antialiased truncate">{t.title}</p>
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                      {entries.length} of {t.history!.length}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {[...entries].reverse().map((h, idx) => (
                      <li key={idx} className="rounded-lg bg-background/60 border border-border/40 px-2.5 py-2">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={cn(
                            "text-[10px] uppercase tracking-wide font-semibold antialiased",
                            h.source === "recurrence" ? "text-orange-300" : h.source === "quick-edit" ? "text-amber-200" : "text-amber-300",
                          )}>
                            {h.source === "recurrence" ? "Recurrence" : h.source === "quick-edit" ? "Quick edit" : "Edit"}
                          </span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {new Date(h.at).toLocaleString()}
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {h.changes.map((c, i) => (
                            <li key={i} className="text-[11px] antialiased">
                              <span className="text-muted-foreground">{fieldLabel(c.field)}:</span>{" "}
                              <span className="line-through text-rose-400/80 break-words">{c.from || "—"}</span>
                              <span className="text-muted-foreground mx-1">→</span>
                              <span className="text-emerald-400 break-words">{c.to || "—"}</span>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
