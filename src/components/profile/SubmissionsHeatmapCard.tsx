import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ProfileCard, SourcePill } from "./ProfileCard";
import { cn } from "@/lib/utils";
import type { LeetCodeProfile } from "@/hooks/useLeetCodeProfile";
import { useLeetCodeYearCalendar, useLeetCodeYearsCalendars } from "@/hooks/useLeetCodeProfile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";


const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""]; // 0=Sun..6=Sat
const CELL = 12; // px
const GAP = 3;   // px

function startOfDay(d: Date) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}
function isoLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Cell = { date: string; count: number; future: boolean; inRange: boolean; inMonth: boolean };
type MonthBlock = { year: number; month: number; label: string; weeks: Cell[][] };

function buildMonthBlocks(
  byDay: Record<string, number>,
  rangeStart: Date,
  rangeEnd: Date,
): MonthBlock[] {
  const today = startOfDay(new Date());
  const blocks: MonthBlock[] = [];
  const cursorMonth = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  const lastMonth = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);

  while (cursorMonth <= lastMonth) {
    const y = cursorMonth.getFullYear();
    const m = cursorMonth.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    // Align to Sunday on/before the 1st of the month
    const gridStart = new Date(firstDay);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());
    // Align to Saturday on/after the last day
    const gridEnd = new Date(lastDay);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

    const weeks: Cell[][] = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      const col: Cell[] = [];
      for (let d = 0; d < 7; d++) {
        const inMonth = cursor.getMonth() === m && cursor.getFullYear() === y;
        const inRange = inMonth && cursor >= rangeStart && cursor <= rangeEnd;
        const future = cursor > today;
        const key = isoLocal(cursor);
        const count = inRange && !future ? (byDay[key] ?? 0) : 0;
        col.push({ date: key, count, future, inRange, inMonth });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(col);
    }
    blocks.push({ year: y, month: m, label: MONTHS[m], weeks });
    cursorMonth.setMonth(cursorMonth.getMonth() + 1);
  }
  return blocks;
}

function intensity(count: number): string {
  if (count <= 0) return "bg-white/[0.04] border border-white/[0.05]";
  if (count === 1) return "bg-emerald-700/55";
  if (count <= 3) return "bg-emerald-600/75";
  if (count <= 6) return "bg-emerald-500/90";
  return "bg-emerald-400 shadow-[0_0_4px_-1px_hsl(152_76%_50%/0.7)]";
}

function parseLeetCodeCalendar(raw?: string | null, expectedYear?: number | null) {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw) as Record<string, number>;
    const out: Record<string, number> = {};
    Object.entries(obj).forEach(([ts, c]) => {
      const stamp = Number(ts);
      if (!Number.isFinite(stamp)) return;
      const d = new Date(stamp * 1000).toISOString().slice(0, 10);
      if (expectedYear && Number(d.slice(0, 4)) !== expectedYear) return;
      out[d] = (out[d] ?? 0) + Number(c || 0);
    });
    return out;
  } catch {
    return {};
  }
}

/** Compute active days, max streak, and total submissions for a given year from a byDay map. */
function statsForYear(byDay: Record<string, number>, year: number) {
  const days = Object.keys(byDay)
    .filter((k) => Number(k.slice(0, 4)) === year && (byDay[k] ?? 0) > 0)
    .sort();
  let total = 0;
  for (const k of days) total += byDay[k] ?? 0;
  let best = days.length > 0 ? 1 : 0;
  let cur = days.length > 0 ? 1 : 0;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1] + "T00:00:00");
    const curr = new Date(days[i] + "T00:00:00");
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) { cur += 1; best = Math.max(best, cur); }
    else { cur = 1; }
  }
  return { activeDays: days.length, maxStreak: best, total };
}

interface Props {
  byteskill: { submissionsByDay: Record<string, number>; activeDays: number; maxStreak: number; totalSubmissions: number };
  leetcode?: LeetCodeProfile | null;
  leetcodeHandle?: string | null;
  hasLeetcode: boolean;
  leetcodeLoading?: boolean;
  leetcodeError?: string | null;
}

export function SubmissionsHeatmapCard({ byteskill, leetcode, leetcodeHandle, hasLeetcode, leetcodeLoading, leetcodeError }: Props) {
  const [source, setSource] = useState<"byteskill" | "leetcode">("byteskill");
  const [compareMode, setCompareMode] = useState(false);
  const effective = source;


  // Tooltip state (with pinned flag for tap-to-pin on mobile)
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
    visible: boolean;
    pinned?: boolean;
  } | null>(null);

  // Day detail modal
  const [dayModal, setDayModal] = useState<{ date: string; count: number; future: boolean } | null>(null);

  const lcByDay = useMemo(() => {
    const raw = leetcode?.matchedUser?.userCalendar?.submissionCalendar;
    return parseLeetCodeCalendar(raw);
  }, [leetcode]);

  // Year selector state (declared early so we can drive the year-specific LC fetch)
  const currentYear = new Date().getFullYear();
  const [yearMode, setYearMode] = useState<"last12" | number>(currentYear);

  // LeetCode active years from the main profile payload (authoritative list).
  const leetcodeActiveYears = useMemo(() => {
    const fromProfile = leetcode?.matchedUser?.userCalendar?.activeYears ?? [];
    return Array.from(new Set(fromProfile))
      .filter((year): year is number => Number.isInteger(year) && year >= 2015 && year <= currentYear)
      .sort((a, b) => b - a);
  }, [currentYear, leetcode]);

  // Only allow year fetch for years LeetCode reports as active.
  const yearIsValidForLC =
    effective === "leetcode" &&
    typeof yearMode === "number" &&
    leetcodeActiveYears.includes(yearMode);

  const yearFetchActive = effective === "leetcode" && hasLeetcode && yearIsValidForLC;
  const yearQuery = useLeetCodeYearCalendar(
    yearFetchActive ? leetcodeHandle ?? null : null,
    yearFetchActive ? (yearMode as number) : null,
  );

  const lcYearByDay = useMemo(() => {
    const raw = yearQuery.data?.matchedUser?.userCalendar?.submissionCalendar;
    return parseLeetCodeCalendar(raw, typeof yearMode === "number" ? yearMode : null);
  }, [yearMode, yearQuery.data]);

  const byDay = effective === "leetcode"
    ? (yearFetchActive ? lcYearByDay : lcByDay)
    : byteskill.submissionsByDay;

  // Available years in the dropdown:
  //  - leetcode mode: only years LC reports as active
  //  - parikshaa mode: 2018..current + any year present in data
  const availableYears = useMemo(() => {
    if (effective === "leetcode") {
      return leetcodeActiveYears;
    }
    const years = new Set<number>();
    for (let y = currentYear; y >= 2018; y--) years.add(y);
    Object.keys(byDay).forEach((k) => {
      const y = Number(k.slice(0, 4));
      if (!isNaN(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [byDay, currentYear, effective, leetcodeActiveYears]);

  // Keep yearMode within the valid range for the current source.
  useEffect(() => {
    if (effective === "leetcode") {
      if (leetcodeActiveYears.length === 0) return; // empty state will render
      if (yearMode === "last12" || !leetcodeActiveYears.includes(yearMode as number)) {
        setYearMode(leetcodeActiveYears[0]);
      }
    } else {
      if (yearMode !== "last12" && !availableYears.includes(yearMode as number)) {
        setYearMode("last12");
      }
    }
  }, [availableYears, effective, leetcodeActiveYears, yearMode]);


  const { rangeStart, rangeEnd } = useMemo(() => {
    if (yearMode === "last12") {
      const end = startOfDay(new Date());
      const start = new Date(end);
      start.setFullYear(end.getFullYear() - 1);
      start.setDate(start.getDate() + 1);
      return { rangeStart: start, rangeEnd: end };
    }
    const y = yearMode as number;
    return { rangeStart: startOfDay(new Date(y, 0, 1)), rangeEnd: startOfDay(new Date(y, 11, 31)) };
  }, [yearMode]);

  const blocks = useMemo(() => buildMonthBlocks(byDay, rangeStart, rangeEnd), [byDay, rangeStart, rangeEnd]);

  const rangeByDay = useMemo(() => {
    const out: Record<string, number> = {};
    blocks.forEach((b) => b.weeks.forEach((w) => w.forEach((c) => {
      if (c.inRange && c.count) out[c.date] = c.count;
    })));
    return out;
  }, [blocks]);

  const max = useMemo(() => Math.max(1, ...Object.values(rangeByDay)), [rangeByDay]);
  const total = useMemo(() => Object.values(rangeByDay).reduce((a, b) => a + b, 0), [rangeByDay]);
  const activeDaysInRange = useMemo(() => Object.keys(rangeByDay).length, [rangeByDay]);

  const activeDays =
    yearMode === "last12" && effective === "leetcode"
      ? (leetcode?.matchedUser?.userCalendar?.totalActiveDays ?? activeDaysInRange)
      : yearMode === "last12" && effective === "byteskill"
        ? byteskill.activeDays
        : activeDaysInRange;

  // Compute max consecutive-day streak within the selected range from rangeByDay.
  const computedRangeMaxStreak = useMemo(() => {
    const days = Object.keys(rangeByDay).sort();
    if (days.length === 0) return 0;
    let best = 1;
    let cur = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1] + "T00:00:00");
      const curr = new Date(days[i] + "T00:00:00");
      const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diff === 1) { cur += 1; best = Math.max(best, cur); }
      else { cur = 1; }
    }
    return best;
  }, [rangeByDay]);

  const maxStreak =
    yearMode === "last12"
      ? (effective === "leetcode" ? (leetcode?.matchedUser?.userCalendar?.streak ?? 0) : byteskill.maxStreak)
      : computedRangeMaxStreak;

  const totalWeeks = blocks.reduce((n, b) => n + b.weeks.length, 0);

  // Responsive sizing: fit Jan–Dec inside container width with no scrollbar
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setContainerWidth(e.contentRect.width);
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const { cell: CELL_PX, gap: GAP_PX, monthGap: MONTH_GAP } = useMemo(() => {
    const dayLabelsW = 0;
    const intraGaps = Math.max(0, totalWeeks - blocks.length); // week gaps inside months
    const interGaps = Math.max(0, blocks.length - 1); // gaps between months
    // Try preferred sizes, then shrink to fit
    const candidates: Array<{ cell: number; gap: number; monthGap: number }> = [
      { cell: 12, gap: 3, monthGap: 14 },
      { cell: 11, gap: 3, monthGap: 12 },
      { cell: 10, gap: 2, monthGap: 10 },
      { cell: 9,  gap: 2, monthGap: 9 },
      { cell: 8,  gap: 2, monthGap: 8 },
      { cell: 7,  gap: 2, monthGap: 7 },
      { cell: 6,  gap: 1, monthGap: 6 },
      { cell: 5,  gap: 1, monthGap: 5 },
    ];
    const W = containerWidth || 800;
    for (const c of candidates) {
      const needed =
        dayLabelsW + totalWeeks * c.cell + intraGaps * c.gap + interGaps * c.monthGap;
      if (needed <= W) return c;
    }
    return candidates[candidates.length - 1];
  }, [containerWidth, totalWeeks, blocks.length]);

  const titleSuffix = yearMode === "last12" ? "in the last 12 months" : `in ${yearMode}`;

  // Compute a single, clear empty/error state for the LeetCode view.
  // null means "render the heatmap".
  const lcEmptyState: { title: string; detail: string } | null = (() => {
    if (effective !== "leetcode") return null;
    if (!hasLeetcode) {
      return {
        title: "No LeetCode account linked",
        detail: "Connect your LeetCode username in Settings to see your submissions heatmap here.",
      };
    }
    if (leetcodeLoading) return null; // wait for initial load
    if (leetcodeError) {
      return {
        title: "Couldn't reach LeetCode",
        detail: `Fetch failed: ${leetcodeError}. Try again in a moment.`,
      };
    }
    if (!leetcode?.matchedUser) {
      return {
        title: "LeetCode profile not found",
        detail: "We couldn't find this LeetCode handle. Double-check it in Settings.",
      };
    }
    if (leetcodeActiveYears.length === 0) {
      return {
        title: "Year calendar unavailable",
        detail: "LeetCode hasn't published any active years for this profile yet.",
      };
    }
    if (yearFetchActive) {
      if (yearQuery.isLoading) return null;
      if (yearQuery.error) {
        return {
          title: "Couldn't load this year",
          detail: `Fetch failed: ${String((yearQuery.error as Error)?.message || yearQuery.error)}.`,
        };
      }
      const rawYear = yearQuery.data?.matchedUser?.userCalendar?.submissionCalendar;
      if (rawYear && Object.keys(lcYearByDay).length === 0) {
        return {
          title: "Couldn't read this year",
          detail: "LeetCode returned a calendar we couldn't parse for this year.",
        };
      }
    }
    return null;
  })();

  // "refreshing…" only while we're actually waiting on initial data for what's
  // being displayed (not on background refetches).
  const isInitialLoading =
    effective === "leetcode" &&
    ((!leetcode && !!leetcodeLoading) || (yearFetchActive && yearQuery.isLoading));

  return (
    <ProfileCard
      title={`${total} submissions ${titleSuffix}${isInitialLoading ? " · refreshing…" : ""}`}
      rightSlot={
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setCompareMode((v) => !v)}
            aria-pressed={compareMode}
            className={cn(
              "text-[11px] rounded-md px-2 py-1 border transition-colors",
              compareMode
                ? "bg-amber-500/15 border-amber-400/40 text-amber-200"
                : "bg-white/[0.04] border-white/10 text-foreground hover:bg-white/[0.08]",
            )}
          >
            {compareMode ? "Heatmap" : "Compare years"}
          </button>
          {!compareMode && (
            <select
              value={String(yearMode)}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "last12") { setYearMode("last12"); return; }
                const n = Number(v);
                if (!Number.isFinite(n)) return;
                if (effective === "leetcode" && !leetcodeActiveYears.includes(n)) return;
                if (effective !== "leetcode" && !availableYears.includes(n)) return;
                setYearMode(n);
              }}
              className="text-[11px] rounded-md bg-white/[0.04] border border-white/10 px-2 py-1 text-foreground hover:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-amber-400/40 disabled:opacity-50"
              aria-label="Filter heatmap by year"
              disabled={effective === "leetcode" && leetcodeActiveYears.length === 0}
            >
              {effective !== "leetcode" && <option value="last12">Last 12 months</option>}
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
              {effective === "leetcode" && leetcodeActiveYears.length === 0 && (
                <option value="last12">No years available</option>
              )}
            </select>
          )}
          <SourcePill
            options={[
              { value: "byteskill", label: "Parikshaa" },
              { value: "leetcode", label: "LeetCode" },
            ]}
            value={effective}
            onChange={(v) => setSource(v as any)}
          />
        </div>
      }
    >
      {compareMode ? (
        <CompareYearsTable
          source={effective}
          byteskillByDay={byteskill.submissionsByDay}
          leetcodeHandle={leetcodeHandle ?? null}
          leetcodeActiveYears={leetcodeActiveYears}
          parikshaaYears={availableYears.filter((y): y is number => typeof y === "number")}
          hasLeetcode={hasLeetcode}
        />
      ) : lcEmptyState ? (
        <div className="flex flex-col items-center justify-center text-center py-10 px-6 gap-2 rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
          <div className="text-sm font-medium text-foreground">{lcEmptyState.title}</div>
          <p className="text-xs text-muted-foreground max-w-xs">{lcEmptyState.detail}</p>
        </div>
      ) : (

      <div ref={containerRef} className="overflow-hidden w-full">

        <div className="flex">


          <div className="flex-1 min-w-0">
            {/* Month blocks: Jan–Dec with gaps */}
            <div className="flex items-start" style={{ gap: MONTH_GAP }}>
              {blocks.map((block) => {
                const blockWidth = block.weeks.length * (CELL_PX + GAP_PX) - GAP_PX;
                return (
                  <div key={`${block.year}-${block.month}`} className="flex flex-col">
                    <div
                      className="text-[10px] text-muted-foreground mb-1 whitespace-nowrap overflow-hidden"
                      style={{ width: blockWidth, height: 16, lineHeight: "16px" }}
                    >
                      {block.label}
                    </div>
                    <div className="flex" style={{ gap: GAP_PX }}>
                      {block.weeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col" style={{ gap: GAP_PX }}>
                          {week.map((cell, di) => {
                            // Padding day outside this month → invisible spacer
                            if (!cell.inMonth) {
                              return <div key={di} style={{ width: CELL_PX, height: CELL_PX }} className="opacity-0" />;
                            }
                            const dObj = new Date(cell.date);
                            const dateStr = `${MONTHS[dObj.getMonth()]} ${dObj.getDate()}, ${dObj.getFullYear()}`;
                            const positionFrom = (el: HTMLElement) => {
                              const rect = el.getBoundingClientRect();
                              return { x: rect.left + rect.width / 2, y: rect.top };
                            };
                            const showTip = (text: string) => (e: React.MouseEvent<HTMLDivElement>) => {
                              const target = e.currentTarget;
                              if (!target) return;
                              const { x, y } = positionFrom(target);
                              setTooltip((prev) => {
                                if (prev?.pinned) return prev; // don't override a pinned tooltip on hover
                                return { text, x, y, visible: true };
                              });
                            };
                            const hideTip = () => setTooltip((t) => (t && !t.pinned ? { ...t, visible: false } : t));
                            const handleClick = (text: string) => (e: React.MouseEvent<HTMLDivElement>) => {
                              // Pin tooltip (useful on touch / mobile)
                              const { x, y } = positionFrom(e.currentTarget);
                              setTooltip({ text, x, y, visible: true, pinned: true });
                              // Open detail modal
                              setDayModal({ date: cell.date, count: cell.count, future: cell.future || !cell.inRange });
                            };
                            // Future / out-of-range day → empty muted box (still visible)
                            if (cell.future || !cell.inRange) {
                              const tip = `${dateStr} · upcoming`;
                              return (
                                <div
                                  key={di}
                                  onMouseEnter={showTip(tip)}
                                  onMouseLeave={hideTip}
                                  onClick={handleClick(tip)}
                                  role="button"
                                  tabIndex={0}
                                  aria-label={tip}
                                  style={{ width: CELL_PX, height: CELL_PX }}
                                  className="rounded-[2px] bg-white/[0.02] border border-white/[0.04] cursor-pointer"
                                />
                              );
                            }
                            const tip = `${dateStr} · ${cell.count} submission${cell.count === 1 ? "" : "s"}`;
                            return (
                              <div
                                key={di}
                                onMouseEnter={showTip(tip)}
                                onMouseLeave={hideTip}
                                onClick={handleClick(tip)}
                                role="button"
                                tabIndex={0}
                                aria-label={tip}
                                style={{ width: CELL_PX, height: CELL_PX }}
                                className={cn("rounded-[2px] transition-colors cursor-pointer", intensity(cell.count))}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      )}
      {!compareMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-[11px]">
          <div className="flex gap-4 text-muted-foreground">
            <span>Active Days · <span className="text-foreground font-medium tabular-nums">{activeDays}</span></span>
            {maxStreak !== undefined && (
              <span>Max Streak · <span className="text-foreground font-medium tabular-nums">{maxStreak}</span></span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Less</span>
            {[
              "bg-white/[0.04] border border-white/[0.05]",
              "bg-emerald-700/55",
              "bg-emerald-600/75",
              "bg-emerald-500/85",
              "bg-emerald-400",
            ].map((c, i) => (
              <span key={i} className={cn("rounded-[2px]", c)} style={{ width: CELL, height: CELL }} />
            ))}
            <span className="text-muted-foreground">More</span>
          </div>
        </div>
      )}
      {effective === "leetcode" && hasLeetcode && leetcode?.recentAcSubmissionList?.length ? (
        <div className="mt-4 border-t border-border/50 pt-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Recent Accepted Submissions</div>
          <ul className="space-y-1.5">
            {leetcode.recentAcSubmissionList.slice(0, 8).map((s) => {
              const when = new Date(Number(s.timestamp) * 1000);
              const diffMs = Date.now() - when.getTime();
              const rel =
                diffMs < 3600_000 ? `${Math.max(1, Math.round(diffMs / 60_000))}m ago`
                : diffMs < 86400_000 ? `${Math.round(diffMs / 3600_000)}h ago`
                : `${Math.round(diffMs / 86400_000)}d ago`;
              return (
                <li key={s.id}>
                  <a
                    href={`https://leetcode.com/problems/${s.titleSlug}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 text-[12px] rounded-md px-2 py-1.5 border border-transparent hover:border-amber-400/30 hover:bg-amber-500/5 transition-colors"
                  >
                    <span className="truncate text-foreground/90">{s.title}</span>
                    <span className="shrink-0 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="rounded px-1.5 py-0.5 bg-amber-500/10 text-amber-200 border border-amber-400/20 uppercase tracking-wide">{s.lang}</span>
                      <span className="tabular-nums">{rel}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {/* Custom hover tooltip */}
      {tooltip && typeof document !== "undefined" && createPortal(
        <div
          className={cn(
            "fixed pointer-events-none px-2 py-1 rounded-md text-[11px] leading-tight whitespace-nowrap",
            "bg-[#0a0a0f]/95 border border-white/10 text-foreground shadow-lg backdrop-blur-sm",
            "transition-opacity duration-150",
            tooltip.visible ? "opacity-100" : "opacity-0"
          )}
          style={{ left: tooltip.x, top: tooltip.y - 28, transform: "translateX(-50%)", zIndex: 2147483647 }}
        >
          {tooltip.text}
        </div>,
        document.body
      )}



      {/* Day detail modal */}
      <Dialog
        open={!!dayModal}
        onOpenChange={(o) => {
          if (!o) {
            setDayModal(null);
            setTooltip(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          {dayModal && (() => {
            const d = new Date(dayModal.date);
            const monthName = MONTHS_FULL[d.getMonth()];
            const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
            const dateLong = `${weekday}, ${monthName} ${d.getDate()}, ${d.getFullYear()}`;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{dateLong}</DialogTitle>
                  <DialogDescription>
                    {monthName} {d.getFullYear()}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Submissions</span>
                  {dayModal.future ? (
                    <span className="text-sm text-muted-foreground italic">Upcoming</span>
                  ) : (
                    <span className="text-2xl font-semibold tabular-nums text-foreground">
                      {dayModal.count}
                    </span>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </ProfileCard>
  );
}

interface CompareYearsTableProps {
  source: "byteskill" | "leetcode";
  byteskillByDay: Record<string, number>;
  leetcodeHandle: string | null;
  leetcodeActiveYears: number[];
  parikshaaYears: number[];
  hasLeetcode: boolean;
}

function CompareYearsTable({
  source,
  byteskillByDay,
  leetcodeHandle,
  leetcodeActiveYears,
  parikshaaYears,
  hasLeetcode,
}: CompareYearsTableProps) {
  const years = source === "leetcode" ? leetcodeActiveYears : parikshaaYears;

  const lcQueries = useLeetCodeYearsCalendars(
    source === "leetcode" ? leetcodeHandle : null,
    source === "leetcode" ? years : [],
  );

  if (source === "leetcode" && !hasLeetcode) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 px-6 gap-2 rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
        <div className="text-sm font-medium text-foreground">No LeetCode account linked</div>
        <p className="text-xs text-muted-foreground max-w-xs">Link a LeetCode handle in Settings to compare years.</p>
      </div>
    );
  }

  if (years.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 px-6 gap-2 rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
        <div className="text-sm font-medium text-foreground">No years to compare</div>
        <p className="text-xs text-muted-foreground max-w-xs">No active years are available for this profile yet.</p>
      </div>
    );
  }

  const rows = years.map((year, i) => {
    if (source === "leetcode") {
      const q = lcQueries[i];
      const raw = q?.data?.matchedUser?.userCalendar?.submissionCalendar;
      const byDay = parseLeetCodeCalendar(raw, year);
      const stats = statsForYear(byDay, year);
      const loading = q?.isLoading ?? false;
      const error = q?.error ? String((q.error as Error)?.message || q.error) : null;
      return { year, ...stats, loading, error };
    }
    const stats = statsForYear(byteskillByDay, year);
    return { year, ...stats, loading: false, error: null as string | null };
  });

  const maxByMetric = {
    active: Math.max(0, ...rows.map((r) => r.activeDays)),
    streak: Math.max(0, ...rows.map((r) => r.maxStreak)),
    total: Math.max(0, ...rows.map((r) => r.total)),
  };

  return (
    <div className="w-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2 font-medium">Year</th>
            <th className="px-3 py-2 font-medium text-right">Active Days</th>
            <th className="px-3 py-2 font-medium text-right">Max Streak</th>
            <th className="px-3 py-2 font-medium text-right">Submissions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.year} className="border-t border-white/[0.06]">
              <td className="px-3 py-2 tabular-nums text-foreground/90">{r.year}</td>
              <td className={cn(
                "px-3 py-2 tabular-nums text-right",
                r.activeDays > 0 && r.activeDays === maxByMetric.active ? "text-amber-200 font-medium" : "text-foreground/85",
              )}>
                {r.loading ? "…" : r.error ? "—" : r.activeDays}
              </td>
              <td className={cn(
                "px-3 py-2 tabular-nums text-right",
                r.maxStreak > 0 && r.maxStreak === maxByMetric.streak ? "text-amber-200 font-medium" : "text-foreground/85",
              )}>
                {r.loading ? "…" : r.error ? "—" : r.maxStreak}
              </td>
              <td className={cn(
                "px-3 py-2 tabular-nums text-right",
                r.total > 0 && r.total === maxByMetric.total ? "text-amber-200 font-medium" : "text-foreground/85",
              )}>
                {r.loading ? "…" : r.error ? "—" : r.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 text-[10px] text-muted-foreground border-t border-white/[0.06]">
        Best per metric is highlighted in amber.
      </div>
    </div>
  );
}
