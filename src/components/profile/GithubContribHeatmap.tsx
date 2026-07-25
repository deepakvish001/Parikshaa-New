import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface Day { date: string; count: number; level: number }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// GitHub-style green palette (semantic "activity/completed" — keeps WCAG compliant w/ icons in parent card)
const LEVEL_CLASS = [
  "bg-muted/30 border-border/40",
  "bg-emerald-500/25 border-emerald-400/30",
  "bg-emerald-500/55 border-emerald-400/40",
  "bg-emerald-500/80 border-emerald-300/50",
  "bg-emerald-400 border-emerald-300/70",
];
const LEVEL_LABEL = ["No contributions", "1–3 contributions", "4–9 contributions", "10–19 contributions", "20+ contributions"];

interface HoverState { x: number; y: number; day: Day; dow: number }

export function GithubContribHeatmap({ calendar }: { calendar: Day[] }) {
  const [hover, setHover] = useState<HoverState | null>(null);

  const { weeks, monthLabels } = useMemo(() => {
    if (!calendar?.length) return { weeks: [] as (Day | null)[][], monthLabels: [] as { idx: number; label: string }[] };

    const byDate = new Map(calendar.map((d) => [d.date, d]));
    const first = new Date(calendar[0].date + "T00:00:00Z");
    const last = new Date(calendar[calendar.length - 1].date + "T00:00:00Z");

    const start = new Date(first);
    start.setUTCDate(start.getUTCDate() - start.getUTCDay());
    const end = new Date(last);
    end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()));

    const weeks: (Day | null)[][] = [];
    const monthLabels: { idx: number; label: string }[] = [];
    let cursor = new Date(start);
    let weekIdx = 0;
    let lastMonth = -1;
    while (cursor <= end) {
      const week: (Day | null)[] = [];
      for (let i = 0; i < 7; i++) {
        const iso = cursor.toISOString().slice(0, 10);
        const d = byDate.get(iso) ?? null;
        const inRange = cursor >= first && cursor <= last;
        week.push(inRange ? d ?? { date: iso, count: 0, level: 0 } : null);
        if (i === 0) {
          const m = cursor.getUTCMonth();
          if (m !== lastMonth && inRange) {
            monthLabels.push({ idx: weekIdx, label: MONTHS[m] });
            lastMonth = m;
          }
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      weeks.push(week);
      weekIdx++;
    }
    return { weeks, monthLabels };
  }, [calendar]);

  if (!calendar?.length) return null;

  const total = calendar.reduce((a, b) => a + b.count, 0);
  const activeDays = calendar.filter((d) => d.count > 0).length;
  const max = calendar.reduce((a, b) => Math.max(a, b.count), 0);
  const avg = activeDays ? Math.round((total / activeDays) * 10) / 10 : 0;

  const sorted = [...calendar].sort((a, b) => a.date.localeCompare(b.date));
  let best = 0, run = 0;
  for (const d of sorted) {
    if (d.count > 0) { run++; best = Math.max(best, run); } else run = 0;
  }
  let current = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].count > 0) current++;
    else break;
  }

  const fmtDate = (iso: string) =>
    new Date(iso + "T00:00:00Z").toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
    });

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {[
          { label: "This year", value: total.toLocaleString() },
          { label: "Active days", value: activeDays.toLocaleString() },
          { label: "Current streak", value: `${current}d` },
          { label: "Best streak", value: `${best}d` },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-emerald-400/20 bg-emerald-500/[0.05] px-2.5 py-1.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="text-sm font-bold tabular-nums text-emerald-300">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Contributions
        </p>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          avg {avg}/active day · max {max}
        </span>
      </div>

      <div className="relative rounded-lg border border-emerald-400/15 bg-emerald-500/[0.03] p-2.5 overflow-x-auto">
        <div className="inline-flex flex-col min-w-fit">
          <div className="flex gap-[3px] mb-1 pl-[18px]">
            {weeks.map((_, i) => {
              const lbl = monthLabels.find((m) => m.idx === i);
              return (
                <div key={i} className="w-[11px] text-[9px] text-muted-foreground text-left">
                  {lbl ? lbl.label : ""}
                </div>
              );
            })}
          </div>
          <div className="flex gap-[3px]">
            <div className="flex flex-col gap-[3px] pr-1">
              {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                <div key={i} className="h-[11px] text-[9px] leading-[11px] text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <div
                    key={di}
                    onMouseEnter={(e) => {
                      if (!day) return;
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const container = (e.currentTarget.closest(".relative") as HTMLElement | null)?.getBoundingClientRect();
                      setHover({
                        x: rect.left - (container?.left ?? 0) + rect.width / 2,
                        y: rect.top - (container?.top ?? 0) - 8,
                        day,
                        dow: di,
                      });
                    }}
                    onMouseLeave={() => setHover(null)}
                    aria-label={day ? `${day.count} contributions on ${day.date}` : undefined}
                    className={cn(
                      "h-[11px] w-[11px] rounded-[2px] border transition-transform hover:scale-125 hover:ring-1 hover:ring-emerald-300/60 cursor-pointer",
                      day ? LEVEL_CLASS[Math.min(4, Math.max(0, day.level))] : "bg-transparent border-transparent",
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 pl-[18px]">
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {total.toLocaleString()} contributions in the last year
            </span>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground" aria-label="Contribution level legend">
              <span>Less</span>
              {LEVEL_CLASS.map((c, i) => (
                <span
                  key={i}
                  className={cn("h-[10px] w-[10px] rounded-[2px] border", c)}
                  title={LEVEL_LABEL[i]}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Rich hover tooltip (LeetCode-style) */}
        {hover && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-emerald-400/30 bg-background/95 backdrop-blur px-3 py-2 shadow-xl"
            style={{ left: hover.x, top: hover.y }}
          >
            <div className="text-[12px] font-semibold text-emerald-300 tabular-nums">
              {hover.day.count} {hover.day.count === 1 ? "contribution" : "contributions"}
            </div>
            <div className="text-[11px] text-foreground/90 mt-0.5">{fmtDate(hover.day.date)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span
                className={cn("h-2 w-2 rounded-[2px] border inline-block", LEVEL_CLASS[Math.min(4, hover.day.level)])}
              />
              {LEVEL_LABEL[Math.min(4, hover.day.level)]}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
