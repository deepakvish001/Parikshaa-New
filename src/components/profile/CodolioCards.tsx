import { Link } from "react-router-dom";
import { ProfileCard, EmptyCard } from "./ProfileCard";
import {
  FileText, Calendar, ArrowUpRight, BarChart3, Award, Star, Trophy, TrendingUp,
  Code2, Terminal, Braces, BookOpen, Sparkles, Activity, Info,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { LeetCodeProfile } from "@/hooks/useLeetCodeProfile";
import type { ByteskillStats } from "@/hooks/useByteskillProfileStats";
import { formatRelative } from "@/lib/formatRelative";

/* ---------------- Big number stat card (Total Questions / Active Days) ----------------- */

export type StatBreakdownItem = {
  label: string;
  /** null = connected but no data (renders as em-dash). Omitting the entry means not connected. */
  value: number | null;
  icon?: React.ReactNode;
  /** Optional tooltip shown on the em-dash / value to explain missing data. */
  note?: string;
  /** Marks this row as permanently disabled (e.g. no public API). Renders muted with a tooltip. */
  disabled?: boolean;
};

const PLATFORM_COLORS: Record<string, string> = {
  parikshaa: "#f59e0b",
  leetcode: "#ffa116",
  codeforces: "#60a5fa",
  codechef: "#a78968",
  geeksforgeeks: "#2f8d46",
  hackerrank: "#2ec866",
  github: "#e5e7eb",
  atcoder: "#94a3b8",
};

function colorFor(label: string) {
  const key = label.toLowerCase().replace(/\s+/g, "");
  return PLATFORM_COLORS[key] ?? "#f59e0b";
}

export function BigStatCard({
  title, value, hint, icon, accent = "amber", note, breakdown,
}: {
  title: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
  accent?: "amber" | "orange";
  note?: string;
  breakdown?: StatBreakdownItem[];
}) {
  const accentGrad =
    accent === "orange"
      ? "from-orange-300 via-amber-200 to-orange-400"
      : "from-amber-200 via-amber-300 to-orange-300";
  const iconTone = accent === "orange"
    ? "text-orange-300 border-orange-400/30 bg-orange-500/10"
    : "text-amber-300 border-amber-400/30 bg-amber-500/10";

  const items = breakdown ?? [];
  const numeric = items.filter((b) => typeof b.value === "number") as (StatBreakdownItem & { value: number })[];
  const totalNumeric = numeric.reduce((s, b) => s + b.value, 0);
  const top = numeric.slice().sort((a, b) => b.value - a.value)[0];

  return (
    <ProfileCard className="!p-5">
      {/* Header row: title + info + icon */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold truncate">{title}</p>
          {note && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`About ${title}`}
                  className="text-muted-foreground/70 hover:text-amber-300 transition-colors focus-parikshaa rounded shrink-0"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="max-w-xs text-xs leading-relaxed whitespace-pre-line">
                {note}
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className={`h-9 w-9 rounded-xl border grid place-items-center shrink-0 ${iconTone}`}>
          {icon}
        </div>
      </div>

      {/* Hero: big number + top-platform highlight */}
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className={`text-[46px] leading-none font-extrabold tabular-nums bg-gradient-to-br ${accentGrad} bg-clip-text text-transparent`}>
          {value}
        </p>
        {top && totalNumeric > 0 && (
          <div className="text-right min-w-0">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Top source</p>
            <p className="text-[12px] font-semibold truncate" style={{ color: colorFor(top.label) }}>
              {top.label}
            </p>
            <p className="text-[10px] text-muted-foreground tabular-nums">
              {Math.round((top.value / totalNumeric) * 100)}% · {top.value}
            </p>
          </div>
        )}
      </div>
      {hint && <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>}

      {/* Segmented distribution bar */}
      {numeric.length > 0 && totalNumeric > 0 && (
        <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-muted/30 ring-1 ring-amber-400/10">
          {numeric.map((b) => {
            const pct = (b.value / totalNumeric) * 100;
            if (pct <= 0) return null;
            return (
              <div
                key={b.label}
                className="h-full"
                style={{ width: `${pct}%`, backgroundColor: colorFor(b.label) }}
                title={`${b.label} · ${Math.round(pct)}%`}
              />
            );
          })}
        </div>
      )}

      {/* Compact breakdown grid */}
      {items.length > 0 && (
        <ul
          className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[12px]"
          data-testid="stat-breakdown"
        >
          {items.map((b) => {
            const dash = b.value === null;
            const pct = !dash && totalNumeric > 0 ? Math.round(((b.value as number) / totalNumeric) * 100) : 0;
            const c = colorFor(b.label);
            return (
              <li
                key={b.label}
                data-testid={`stat-row-${b.label}`}
                data-disabled={b.disabled ? "true" : undefined}
                className={`flex items-center gap-2 rounded-md border px-2 py-1.5 min-w-0 ${
                  b.disabled
                    ? "border-border/30 bg-muted/10 opacity-70"
                    : "border-amber-400/10 bg-amber-500/[0.03] hover:border-amber-400/25 transition-colors"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: c,
                    boxShadow: b.disabled ? "none" : `0 0 6px ${c}80`,
                  }}
                />
                <span className="truncate font-medium text-foreground/90 flex-1">{b.label}</span>
                {b.note && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Why no data for ${b.label}?`}
                        className="text-muted-foreground/70 hover:text-amber-300 transition-colors focus-parikshaa rounded shrink-0"
                      >
                        <Info className="h-3 w-3" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="end" className="max-w-[240px] text-xs leading-relaxed">
                      {b.note}
                    </PopoverContent>
                  </Popover>
                )}
                <span className="tabular-nums font-semibold text-foreground shrink-0">
                  {dash ? <span className="text-muted-foreground">—</span> : b.value}
                </span>
                {!dash && !b.disabled && pct > 0 && (
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{pct}%</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </ProfileCard>
  );
}


/* ---------------- Active Days card (calendar-flavored) ----------------- */

export function ActiveDaysCard({
  activeDays,
  maxStreak,
  submissionsByDay,
  breakdown,
  note,
}: {
  activeDays: number;
  maxStreak: number;
  submissionsByDay: Record<string, number>;
  breakdown: StatBreakdownItem[];
  note?: string;
}) {
  // Build last 12 weeks (84 days) micro strip
  const WEEKS = 12;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells: { date: string; count: number }[] = [];
  for (let i = WEEKS * 7 - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toLocaleDateString("en-CA");
    cells.push({ date: key, count: submissionsByDay[key] ?? 0 });
  }
  const activeInStrip = cells.filter((c) => c.count > 0).length;





  // Window slices
  const last7 = cells.slice(-7).filter((c) => c.count > 0).length;
  const prev7 = cells.slice(-14, -7).filter((c) => c.count > 0).length;
  const last30 = cells.slice(-30).filter((c) => c.count > 0).length;
  const weekDelta = last7 - prev7;
  const consistency = Math.round((activeInStrip / (WEEKS * 7)) * 100);

  // Longest gap (consecutive inactive days) in window
  let curGap = 0, longestGap = 0;
  cells.forEach((c) => {
    if (c.count === 0) { curGap++; longestGap = Math.max(longestGap, curGap); }
    else curGap = 0;
  });

  // Next milestone
  const milestones = [7, 30, 60, 100, 180, 365, 730];
  const nextMilestone = milestones.find((m) => m > activeDays) ?? activeDays;
  const prevMilestone = [...milestones].reverse().find((m) => m <= activeDays) ?? 0;
  const msPct = nextMilestone > prevMilestone
    ? Math.min(100, Math.round(((activeDays - prevMilestone) / (nextMilestone - prevMilestone)) * 100))
    : 100;



  return (
    <ProfileCard className="!p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold truncate">
            Total Active Days
          </p>
          {note && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="About Total Active Days"
                  className="text-muted-foreground/70 hover:text-orange-300 transition-colors focus-parikshaa rounded shrink-0"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="max-w-xs text-xs leading-relaxed whitespace-pre-line">
                {note}
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="h-9 w-9 rounded-xl border border-orange-400/30 bg-orange-500/10 text-orange-300 grid place-items-center shrink-0">
          <Calendar className="h-5 w-5" />
        </div>
      </div>

      {/* Hero: number + streak pill */}
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[46px] leading-none font-extrabold tabular-nums bg-gradient-to-br from-orange-300 via-amber-200 to-orange-400 bg-clip-text text-transparent">
            {activeDays}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">days coding across platforms</p>
        </div>



      </div>




      {/* Stat tiles */}
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {[
          { k: "This wk", v: `${last7}d`, sub: weekDelta === 0 ? "flat" : `${weekDelta > 0 ? "+" : ""}${weekDelta} vs prev`, tone: weekDelta > 0 ? "text-emerald-300" : weekDelta < 0 ? "text-rose-300" : "text-muted-foreground" },
          { k: "30 days", v: `${last30}d`, sub: `${Math.round((last30 / 30) * 100)}%`, tone: "text-muted-foreground" },
          { k: "Consist.", v: `${consistency}%`, sub: `${WEEKS}w window`, tone: "text-muted-foreground" },
          { k: "Longest gap", v: `${longestGap}d`, sub: "inactive", tone: "text-muted-foreground" },
        ].map((t) => (
          <div key={t.k} className="rounded-md border border-amber-400/10 bg-amber-500/[0.03] px-2 py-1.5 min-w-0">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground truncate">{t.k}</p>
            <p className="text-[14px] font-bold tabular-nums text-foreground leading-tight">{t.v}</p>
            <p className={`text-[9.5px] tabular-nums truncate ${t.tone}`}>{t.sub}</p>
          </div>
        ))}
      </div>



      {/* Milestone progress */}
      <div className="mt-3 rounded-lg border border-amber-400/15 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.03] px-2.5 py-2">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="inline-flex items-center gap-1.5 text-foreground/90 font-medium">
            <Trophy className="h-3.5 w-3.5 text-amber-300" />
            Next milestone
          </span>
          <span className="tabular-nums text-muted-foreground">
            <span className="text-foreground font-semibold">{activeDays}</span>
            <span className="mx-1">/</span>
            {nextMilestone}
            <span className="ml-1.5 text-amber-300">
              {activeDays >= nextMilestone ? "reached" : `${nextMilestone - activeDays}d to go`}
            </span>
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all"
            style={{ width: `${Math.max(2, msPct)}%` }}
          />
        </div>
      </div>

      {/* Per-platform day counts (no percentages — days overlap across platforms) */}
      {breakdown.length > 0 && (

        <ul
          className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[12px]"
          data-testid="active-days-breakdown"
        >
          {breakdown.map((b) => {
            const dash = b.value === null;

            return (
              <li
                key={b.label}
                data-disabled={b.disabled ? "true" : undefined}
                className={`flex items-center gap-2 rounded-md border px-2 py-1.5 min-w-0 ${
                  b.disabled || dash
                    ? "border-border/30 bg-muted/10 opacity-70"
                    : "border-amber-400/10 bg-amber-500/[0.03] hover:border-amber-400/25 transition-colors"
                }`}
              >


                <span className="truncate font-medium text-foreground/90 flex-1">{b.label}</span>
                {b.note && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Why no data for ${b.label}?`}
                        className="text-muted-foreground/70 hover:text-amber-300 transition-colors focus-parikshaa rounded shrink-0"
                      >
                        <Info className="h-3 w-3" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="end" className="max-w-[240px] text-xs leading-relaxed">
                      {b.note}
                    </PopoverContent>
                  </Popover>
                )}
                <span className="tabular-nums font-semibold text-foreground shrink-0">
                  {dash ? <span className="text-muted-foreground">—</span> : `${b.value}d`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </ProfileCard>
  );
}





/* ---------------- Total Contests (with platform breakdown) ----------------- */

export function ContestsTotalCard({ leetcode, hasLeetcode }: {
  leetcode?: LeetCodeProfile | null; hasLeetcode: boolean;
}) {
  const lcCount = leetcode?.userContestRanking?.attendedContestsCount ?? 0;
  const total = lcCount;
  return (
    <ProfileCard className="!p-5">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-[12px] uppercase tracking-wider text-muted-foreground font-medium">Total Contests</p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-amber-300">{total}</p>
        </div>
        <ul className="space-y-1.5 text-[13px]">
          <li className="flex items-center justify-between rounded-lg border border-amber-400/15 bg-amber-500/[0.04] px-3 py-2">
            <span className="inline-flex items-center gap-2 text-foreground/90">
              <Code2 className="h-4 w-4 text-amber-300" /> LeetCode
            </span>
            <span className="tabular-nums font-semibold text-foreground">{hasLeetcode ? lcCount : "—"}</span>
          </li>
        </ul>
      </div>
    </ProfileCard>
  );
}

/* ---------------- Rating chart (LeetCode contest history) ----------------- */

export function RatingChartCard({ leetcode, hasLeetcode }: {
  leetcode?: LeetCodeProfile | null; hasLeetcode: boolean;
}) {
  const history = (leetcode?.userContestRankingHistory ?? []).filter((c) => c.attended);
  const peakRating = Math.round(leetcode?.userContestRanking?.rating ?? 0);

  if (!hasLeetcode) {
    return (
      <ProfileCard title="Rating">
        <EmptyCard message="Add a LeetCode handle to see your rating history" />
      </ProfileCard>
    );
  }
  if (history.length < 2) {
    return (
      <ProfileCard title="Rating">
        <EmptyCard message="Attend a contest to chart your rating" />
      </ProfileCard>
    );
  }

  const ratings = history.map((h) => h.rating);
  const min = Math.min(...ratings) - 20;
  const max = Math.max(...ratings) + 20;
  const W = 600, H = 180, PAD = 8;
  const stepX = (W - PAD * 2) / (ratings.length - 1);
  const points = ratings.map((r, i) => {
    const x = PAD + i * stepX;
    const y = PAD + (H - PAD * 2) * (1 - (r - min) / (max - min || 1));
    return { x, y };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${H - PAD} L${points[0].x.toFixed(1)},${H - PAD} Z`;

  const last = history[history.length - 1];
  const lastDate = new Date(last.contest.startTime * 1000).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  return (
    <ProfileCard title="Rating">
      <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
        <div>
          <div className="text-2xl font-bold tabular-nums text-amber-300">{Math.round(last.rating)}</div>
          <div className="text-[11px] text-muted-foreground">peak {peakRating}</div>
          <div className="text-[11px] text-muted-foreground mt-2">{lastDate}</div>
          <div className="text-[12px] text-foreground/90 mt-0.5 max-w-[160px] truncate" title={last.contest.title}>
            {last.contest.title}
          </div>
          <div className="text-[11px] text-muted-foreground">Rank: {last.ranking}</div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[180px]">
          <defs>
            <linearGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(38 92% 58%)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="hsl(38 92% 58%)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#ratingFill)" />
          <path d={linePath} fill="none" stroke="hsl(38 92% 58%)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="hsl(38 92% 58%)" />
          ))}
        </svg>
      </div>
    </ProfileCard>
  );
}

/* ---------------- Contest Rankings (per-platform, real data) ----------------- */

type PlatformQuery = {
  data?: { rating: number | null; solved?: { total: number } } | null;
  isLoading: boolean;
  isError?: boolean;
} | undefined;

// Codeforces tier names by rating.
const cfTier = (r: number): { label: string; cls: string } => {
  if (r >= 2400) return { label: "International Grandmaster", cls: "text-rose-300" };
  if (r >= 2300) return { label: "Grandmaster", cls: "text-rose-300" };
  if (r >= 2100) return { label: "International Master", cls: "text-orange-300" };
  if (r >= 1900) return { label: "Master", cls: "text-orange-300" };
  if (r >= 1600) return { label: "Candidate Master", cls: "text-orange-300" };
  if (r >= 1400) return { label: "Expert", cls: "text-amber-300" };
  if (r >= 1200) return { label: "Specialist", cls: "text-emerald-300" };
  return { label: "Pupil / Newbie", cls: "text-muted-foreground" };
};

function StarRow({ stars, max = 7 }: { stars: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25"}`} />
      ))}
    </div>
  );
}

const PLATFORM_TONE: Record<string, { grad: string; ring: string; text: string; dot: string }> = {
  LeetCode:      { grad: "from-orange-500/20 to-amber-500/5",  ring: "ring-orange-400/30",  text: "text-orange-200",  dot: "bg-orange-400" },
  Codeforces:    { grad: "from-sky-500/15 to-transparent",     ring: "ring-sky-400/25",     text: "text-sky-200",     dot: "bg-sky-400" },
  CodeChef:      { grad: "from-amber-700/20 to-orange-500/5",  ring: "ring-amber-500/25",   text: "text-amber-200",   dot: "bg-amber-500" },
  GeeksforGeeks: { grad: "from-emerald-500/15 to-transparent", ring: "ring-emerald-400/25", text: "text-emerald-200", dot: "bg-emerald-400" },
  HackerRank:    { grad: "from-lime-500/15 to-transparent",    ring: "ring-lime-400/25",    text: "text-lime-200",    dot: "bg-lime-400" },
};

function PlatformRankingTile({
  label, handle, profileUrl, loading, rating, subline, meta, icon,
}: {
  label: string;
  handle?: string | null;
  profileUrl?: string | null;
  loading?: boolean;
  rating?: number | null;
  subline?: React.ReactNode;
  meta?: React.ReactNode;
  icon: React.ReactNode;
}) {
  const tone = PLATFORM_TONE[label] ?? PLATFORM_TONE.LeetCode;
  const connected = !!handle;
  const hasRating = connected && !loading && rating != null;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br ${
        hasRating ? tone.grad + " ring-1 " + tone.ring : "from-muted/10 to-transparent opacity-70"
      } p-3 transition-colors`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="inline-flex items-center gap-1.5 min-w-0">
          <span className={`h-6 w-6 rounded-md grid place-items-center bg-background/40 ${tone.text}`}>{icon}</span>
          <span className="text-[11px] font-semibold text-foreground truncate">{label}</span>
        </div>
        {profileUrl && connected && (
          <a href={profileUrl} target="_blank" rel="noreferrer"
             className="text-[10px] text-muted-foreground hover:text-amber-200 inline-flex items-center gap-0.5">
            View <ArrowUpRight className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      {!connected ? (
        <p className="text-[11px] text-muted-foreground italic">Not connected</p>
      ) : loading ? (
        <p className="text-[11px] text-muted-foreground">Fetching…</p>
      ) : rating == null ? (
        <p className="text-[11px] text-muted-foreground italic">No contests yet</p>
      ) : (
        <>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-[26px] font-bold tabular-nums leading-none ${tone.text}`}>{rating}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">rating</span>
          </div>
          {subline && <div className="mt-1.5">{subline}</div>}
          {meta && <div className="text-[10px] text-muted-foreground mt-1 truncate">{meta}</div>}
        </>
      )}
    </div>
  );
}

export function ContestRankingsCard({
  leetcode, hasLeetcode, leetcodeLoading,
  codeforcesHandle, codechefHandle, geeksforgeeksHandle, hackerrankHandle,
  codeforces, codechef, geeksforgeeks, hackerrank,
}: {
  leetcode?: LeetCodeProfile | null;
  hasLeetcode: boolean;
  leetcodeLoading?: boolean;
  codeforcesHandle?: string | null;
  codechefHandle?: string | null;
  geeksforgeeksHandle?: string | null;
  hackerrankHandle?: string | null;
  codeforces?: PlatformQuery;
  codechef?: PlatformQuery;
  geeksforgeeks?: PlatformQuery;
  hackerrank?: PlatformQuery;
}) {
  const lcRating = leetcode?.userContestRanking?.rating
    ? Math.round(leetcode.userContestRanking.rating) : null;
  const lcContests = leetcode?.userContestRanking?.attendedContestsCount ?? null;
  const lcTop = leetcode?.userContestRanking?.topPercentage ?? null;
  const lcStars = lcRating ? Math.min(5, Math.max(1, Math.floor(lcRating / 400))) : 0;

  const cfRating = codeforces?.data?.rating ?? null;
  const cfInfo = cfRating ? cfTier(cfRating) : null;

  const ccRating = codechef?.data?.rating ?? null;
  const ccStars = ccRating ? Math.max(1, Math.min(7, Math.floor(ccRating / 200) - 4)) : 0;

  const gfgRating = geeksforgeeks?.data?.rating ?? null;
  const hrRating = hackerrank?.data?.rating ?? null;

  const tiles = [
    { key: "lc", label: "LeetCode", icon: <Code2 className="h-3.5 w-3.5" />, handle: hasLeetcode ? "leetcode" : null,
      profileUrl: leetcode?.matchedUser?.username ? `https://leetcode.com/u/${leetcode.matchedUser.username}/` : null,
      loading: leetcodeLoading, rating: lcRating,
      subline: lcStars > 0 ? <StarRow stars={lcStars} max={5} /> : null,
      meta: [lcContests != null ? `${lcContests} contests` : null, lcTop != null ? `Top ${lcTop.toFixed(2)}%` : null].filter(Boolean).join(" · ") },
    { key: "cf", label: "Codeforces", icon: <Trophy className="h-3.5 w-3.5" />, handle: codeforcesHandle,
      profileUrl: codeforcesHandle ?? null, loading: codeforces?.isLoading, rating: cfRating,
      subline: cfInfo && <span className={`text-[11px] font-semibold ${cfInfo.cls}`}>{cfInfo.label}</span>, meta: null },
    { key: "cc", label: "CodeChef", icon: <Terminal className="h-3.5 w-3.5" />, handle: codechefHandle,
      profileUrl: codechefHandle ?? null, loading: codechef?.isLoading, rating: ccRating,
      subline: ccStars > 0 ? <StarRow stars={ccStars} /> : null, meta: null },
    { key: "gfg", label: "GeeksforGeeks", icon: <BookOpen className="h-3.5 w-3.5" />, handle: geeksforgeeksHandle,
      profileUrl: geeksforgeeksHandle ?? null, loading: geeksforgeeks?.isLoading, rating: gfgRating,
      subline: gfgRating ? <span className="text-[11px] text-emerald-300 font-semibold">Coding Score</span> : null, meta: null },
    { key: "hr", label: "HackerRank", icon: <Braces className="h-3.5 w-3.5" />, handle: hackerrankHandle,
      profileUrl: hackerrankHandle ?? null, loading: hackerrank?.isLoading, rating: hrRating,
      subline: hrRating ? <span className="text-[11px] text-lime-300 font-semibold">Score</span> : null, meta: null },
  ];

  const connectedTiles = tiles.filter((t) => !!t.handle);
  const ratedTiles = connectedTiles.filter((t) => t.rating != null);
  const top = ratedTiles.slice().sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];

  return (
    <ProfileCard
      title="Contest Rankings"
      rightSlot={
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/25">
          {connectedTiles.length} connected
        </span>
      }
    >
      {connectedTiles.length === 0 ? (
        <EmptyCard message="Connect a coding profile to see your contest ratings" />
      ) : (
        <div className="space-y-3">
          {top && (
            <div className="relative overflow-hidden rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-500/[0.10] via-transparent to-orange-500/[0.06] p-3">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl" />
              <div className="flex items-center justify-between relative">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold inline-flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-amber-300" /> Peak rating
                  </div>
                  <div className="text-sm font-semibold text-foreground mt-0.5">{top.label}</div>
                </div>
                <div className="text-right">
                  <div className="text-[32px] font-bold tabular-nums leading-none bg-gradient-to-b from-amber-200 to-orange-300 bg-clip-text text-transparent">
                    {top.rating}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {tiles.map((t) => (
              <PlatformRankingTile key={t.key} {...t} />
            ))}
          </div>
        </div>
      )}
    </ProfileCard>
  );
}


/* ---------------- DSA Topic Analysis (horizontal bars by language as proxy) ----------------- */

export function DsaTopicAnalysisCard({ byteskill }: { byteskill: ByteskillStats }) {
  const { easy, medium, hard } = byteskill.difficulty;
  const solvedTotal = easy.solved + medium.solved + hard.solved;
  const problemsTotal = easy.total + medium.total + hard.total;
  const coverage = problemsTotal > 0 ? Math.round((solvedTotal / problemsTotal) * 100) : 0;

  // Weighted mastery: Easy×1, Medium×2, Hard×3 (out of same weighted total)
  const weightedGot = easy.solved * 1 + medium.solved * 2 + hard.solved * 3;
  const weightedMax = easy.total * 1 + medium.total * 2 + hard.total * 3;
  const mastery = weightedMax > 0 ? Math.round((weightedGot / weightedMax) * 100) : 0;

  const avgPerActiveDay =
    byteskill.activeDays > 0 ? (byteskill.totalSubmissions / byteskill.activeDays).toFixed(1) : "0";

  const rows = [
    {
      label: "Easy",
      solved: easy.solved,
      total: easy.total,
      color: "bg-emerald-500",
      ring: "text-emerald-400",
      dot: "#10b981",
      icon: <Sparkles className="h-3.5 w-3.5 text-emerald-300" />,
    },
    {
      label: "Medium",
      solved: medium.solved,
      total: medium.total,
      color: "bg-amber-500",
      ring: "text-amber-300",
      dot: "#f59e0b",
      icon: <Activity className="h-3.5 w-3.5 text-amber-300" />,
    },
    {
      label: "Hard",
      solved: hard.solved,
      total: hard.total,
      color: "bg-rose-500",
      ring: "text-rose-400",
      dot: "#f43f5e",
      icon: <Trophy className="h-3.5 w-3.5 text-rose-300" />,
    },
  ];

  // Donut math
  const R = 34, C = 2 * Math.PI * R;
  const segs = solvedTotal > 0
    ? rows.map((r) => ({ ...r, frac: r.solved / solvedTotal }))
    : [];
  let offset = 0;

  // Next milestone (25/50/100/250/500/1000)
  const milestones = [25, 50, 100, 250, 500, 1000, 2000];
  const nextMilestone = milestones.find((m) => m > solvedTotal) ?? solvedTotal;
  const toNext = Math.max(0, nextMilestone - solvedTotal);

  return (
    <ProfileCard
      title="DSA Topic Analysis"
      rightSlot={
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-[11px]">
          <BarChart3 className="h-3 w-3 text-amber-300" />
          <span className="tabular-nums font-semibold text-amber-100">{solvedTotal}</span>
          <span className="text-muted-foreground">solved</span>
        </div>
      }
    >
      {solvedTotal === 0 ? (
        <EmptyCard message="Solve problems to see your distribution" />
      ) : (
        <div className="space-y-4">
          {/* Hero: donut + summary */}
          <div className="flex items-center gap-4 rounded-xl border border-amber-400/15 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.03] p-3">
            <div className="relative h-24 w-24 shrink-0">
              <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                <circle cx="40" cy="40" r={R} className="fill-none stroke-muted/40" strokeWidth="10" />
                {segs.map((s) => {
                  const len = s.frac * C;
                  const el = (
                    <circle
                      key={s.label}
                      cx="40"
                      cy="40"
                      r={R}
                      fill="none"
                      stroke={s.dot}
                      strokeWidth="10"
                      strokeDasharray={`${len} ${C - len}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="butt"
                    />
                  );
                  offset += len;
                  return el;
                })}
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-[18px] font-extrabold tabular-nums text-foreground leading-none">{mastery}%</p>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">mastery</p>
                </div>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-muted-foreground">Coverage</span>
                <span className="tabular-nums font-semibold text-foreground">
                  {solvedTotal}
                  {problemsTotal > 0 && <span className="text-muted-foreground">/{problemsTotal}</span>}
                  {problemsTotal > 0 && <span className="ml-1 text-amber-300">({coverage}%)</span>}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-muted-foreground">Avg / active day</span>
                <span className="tabular-nums font-semibold text-foreground">{avgPerActiveDay}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-muted-foreground">Next milestone</span>
                <span className="tabular-nums font-semibold text-foreground">
                  {toNext > 0 ? (
                    <>
                      {toNext} <span className="text-muted-foreground">to {nextMilestone}</span>
                    </>
                  ) : (
                    <span className="text-emerald-300">Reached {nextMilestone}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Per-difficulty rows */}
          <div className="space-y-2">
            {rows.map((r) => {
              const pct = r.total > 0 ? Math.round((r.solved / r.total) * 100) : 0;
              const barPct = r.total > 0 ? (r.solved / r.total) * 100 : 0;
              return (
                <div key={r.label} className="rounded-lg border border-amber-400/10 bg-card/40 px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2 text-[12px] mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-foreground/90 font-medium">
                      {r.icon}
                      {r.label}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      <span className="text-foreground font-semibold">{r.solved}</span>
                      {r.total > 0 && <>/{r.total}</>}
                      {r.total > 0 && <span className="ml-1.5 text-[11px]">{pct}%</span>}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className={`h-full ${r.color} transition-all`}
                      style={{ width: `${Math.max(2, barPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interview readiness + effort */}
          {(() => {
            // Readiness: 40% coverage + 40% mastery + 20% hard emphasis
            const hardShare = solvedTotal > 0 ? (hard.solved / solvedTotal) * 100 : 0;
            const readiness = Math.min(
              100,
              Math.round(coverage * 0.4 + mastery * 0.4 + Math.min(100, hardShare * 3) * 0.2),
            );
            const verdict =
              readiness >= 75 ? { label: "Interview-ready", tone: "text-emerald-300" }
              : readiness >= 50 ? { label: "On track", tone: "text-amber-300" }
              : readiness >= 25 ? { label: "Building base", tone: "text-orange-300" }
              : { label: "Just starting", tone: "text-muted-foreground" };
            const minutesPer = easy.solved * 15 + medium.solved * 30 + hard.solved * 55;
            const hours = Math.round(minutesPer / 60);
            const avgPerActiveDay = byteskill.activeDays > 0 ? byteskill.totalSubmissions / byteskill.activeDays : 0;
            const targetWeekly = Math.max(3, Math.round(avgPerActiveDay * 5));
            return (
              <div className="rounded-xl border border-amber-400/15 bg-gradient-to-br from-amber-500/[0.05] to-orange-500/[0.02] p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold inline-flex items-center gap-1.5">
                    <Trophy className="h-3 w-3 text-amber-300" />
                    Interview Readiness
                  </span>
                  <span className={`text-[11px] font-semibold ${verdict.tone}`}>{verdict.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 transition-all"
                      style={{ width: `${Math.max(2, readiness)}%` }}
                    />
                  </div>
                  <span className="text-[13px] font-bold tabular-nums text-foreground">{readiness}%</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <div className="rounded-md border border-amber-400/10 bg-card/40 px-2 py-1.5 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Effort</p>
                    <p className="text-[13px] font-bold tabular-nums text-foreground">~{hours}h</p>
                  </div>
                  <div className="rounded-md border border-amber-400/10 bg-card/40 px-2 py-1.5 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Hard mix</p>
                    <p className="text-[13px] font-bold tabular-nums text-foreground">{Math.round(hardShare)}%</p>
                  </div>
                  <div className="rounded-md border border-amber-400/10 bg-card/40 px-2 py-1.5 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Wk target</p>
                    <p className="text-[13px] font-bold tabular-nums text-foreground">{targetWeekly}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Common patterns strip */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1.5 inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-300" />
              Common patterns to master
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Sliding Window", "Two Pointers", "Fast & Slow", "Binary Search",
                "Monotonic Stack", "Prefix Sum", "Backtracking", "BFS/DFS",
                "Union-Find", "Top-K Heap", "Kadane", "Bitmask DP",
              ].map((p) => (
                <span
                  key={p}
                  className="text-[10.5px] px-2 py-0.5 rounded-full border border-amber-400/20 bg-amber-500/[0.06] text-amber-100/90"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Topics breakdown */}
          <TopicsBreakdown mastery={mastery} solvedTotal={solvedTotal} />




          {/* Insight footer */}
          <div className="flex items-center gap-2 rounded-lg border border-amber-400/15 bg-amber-500/[0.04] px-2.5 py-1.5 text-[11px] text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-amber-300 shrink-0" />
            <span className="min-w-0">
              {hard.solved === 0 && medium.solved > 0
                ? "Great start on Medium — try your first Hard to boost mastery."
                : hard.solved > 0 && medium.solved / Math.max(1, easy.solved) < 0.5
                ? "Medium coverage is thin — balance Easy with more Mediums."
                : mastery >= 60
                ? "Strong balance across difficulties. Keep pushing Hards."
                : "Steady progress — consistency compounds mastery."}
            </span>
          </div>
        </div>
      )}
    </ProfileCard>
  );
}

/* -- Topic curriculum used by DsaTopicAnalysisCard -- */
type TopicDef = {
  key: string;
  name: string;
  examples: number;
  tier: "core" | "intermediate" | "advanced";
  blurb: string;
};

const DSA_TOPICS: TopicDef[] = [
  { key: "arrays",   name: "Arrays & Hashing", examples: 42, tier: "core",         blurb: "Two Sum, Prefix Sums, Sliding Window" },
  { key: "twoptr",   name: "Two Pointers",     examples: 18, tier: "core",         blurb: "Container Water, 3Sum, Trapping Rain" },
  { key: "stack",    name: "Stack & Queue",    examples: 16, tier: "core",         blurb: "Valid Parens, Monotonic Stack, LRU" },
  { key: "binsrch",  name: "Binary Search",    examples: 20, tier: "core",         blurb: "Rotated Sorted, Median, Koko Bananas" },
  { key: "linked",   name: "Linked List",      examples: 15, tier: "core",         blurb: "Reverse, Cycle, Merge k Lists" },
  { key: "trees",    name: "Trees & BST",      examples: 28, tier: "intermediate", blurb: "DFS/BFS, LCA, Serialize Tree" },
  { key: "heap",     name: "Heap / Priority Q",examples: 14, tier: "intermediate", blurb: "Top K, Median Stream, Task Scheduler" },
  { key: "backtrack",name: "Backtracking",     examples: 12, tier: "intermediate", blurb: "N-Queens, Subsets, Word Search" },
  { key: "graphs",   name: "Graphs",           examples: 24, tier: "intermediate", blurb: "Islands, Course Schedule, Dijkstra" },
  { key: "greedy",   name: "Greedy",           examples: 14, tier: "intermediate", blurb: "Jump Game, Gas Station, Intervals" },
  { key: "dp1d",     name: "1-D DP",           examples: 18, tier: "advanced",     blurb: "House Robber, Coin Change, LIS" },
  { key: "dp2d",     name: "2-D DP",           examples: 16, tier: "advanced",     blurb: "Unique Paths, Edit Distance, LCS" },
  { key: "bits",     name: "Bit Manipulation", examples: 10, tier: "advanced",     blurb: "Single Number, Sum of Two, Reverse Bits" },
  { key: "trie",     name: "Tries",            examples: 8,  tier: "advanced",     blurb: "Implement Trie, Word Dictionary" },
  { key: "intervals",name: "Intervals",        examples: 10, tier: "advanced",     blurb: "Merge, Insert, Meeting Rooms II" },
];

const TIER_TONE: Record<TopicDef["tier"], { chip: string; dot: string; label: string }> = {
  core:         { chip: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200", dot: "bg-emerald-400", label: "Core" },
  intermediate: { chip: "border-amber-400/25 bg-amber-500/10 text-amber-200",       dot: "bg-amber-400",   label: "Intermediate" },
  advanced:     { chip: "border-rose-400/25 bg-rose-500/10 text-rose-200",          dot: "bg-rose-400",    label: "Advanced" },
};

function TopicsBreakdown({ mastery, solvedTotal }: { mastery: number; solvedTotal: number }) {
  // Recommend next tier based on user's mastery/solved volume
  const focusTier: TopicDef["tier"] =
    solvedTotal < 30 || mastery < 25 ? "core"
    : mastery < 55 ? "intermediate"
    : "advanced";

  const recommended = DSA_TOPICS.filter((t) => t.tier === focusTier).slice(0, 3);
  const totalExamples = DSA_TOPICS.reduce((s, t) => s + t.examples, 0);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold inline-flex items-center gap-1.5">
          <BookOpen className="h-3 w-3 text-amber-300" />
          Topics Breakdown
        </h4>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {DSA_TOPICS.length} topics · {totalExamples} example problems
        </span>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {DSA_TOPICS.map((t) => {
          const tone = TIER_TONE[t.tier];
          return (
            <li
              key={t.key}
              title={t.blurb}
              className="flex items-center gap-2 rounded-md border border-amber-400/10 bg-card/40 px-2 py-1.5 min-w-0"
            >
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${tone.dot}`} />
              <span className="truncate text-[12px] font-medium text-foreground/90 flex-1">{t.name}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{t.examples}</span>
              <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0 ${tone.chip}`}>
                {tone.label[0]}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Recommended next topics */}
      <div className="rounded-lg border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.04] p-2.5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p className="text-[11px] uppercase tracking-wider text-amber-200 font-semibold inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Recommended next
          </p>
          <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${TIER_TONE[focusTier].chip}`}>
            {TIER_TONE[focusTier].label}
          </span>
        </div>
        <ul className="space-y-1">
          {recommended.map((t) => (
            <li key={t.key} className="flex items-start gap-2 text-[12px]">
              <ArrowUpRight className="h-3.5 w-3.5 text-amber-300 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground/95 truncate">
                  {t.name}
                  <span className="ml-1.5 text-[10px] text-muted-foreground tabular-nums">· {t.examples} problems</span>
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{t.blurb}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}





/* ---------------- Awards strip (uses solve milestones as awards) ----------------- */

export function AwardsStripCard({ byteskill }: { byteskill: ByteskillStats }) {
  const total = byteskill.difficulty.easy.solved + byteskill.difficulty.medium.solved + byteskill.difficulty.hard.solved;
  const tiers = [
    { label: "Starter",    threshold: 1,    color: "from-amber-500/30 to-orange-500/20", icon: <Sparkles className="h-5 w-5 text-amber-300" /> },
    { label: "10 Solved",  threshold: 10,   color: "from-amber-500/30 to-orange-500/20", icon: <Award className="h-5 w-5 text-amber-300" /> },
    { label: "50 Solved",  threshold: 50,   color: "from-orange-500/30 to-amber-500/20", icon: <Trophy className="h-5 w-5 text-orange-300" /> },
    { label: "Streak 7",   threshold: 0,    color: "from-amber-500/30 to-orange-500/20", icon: <Activity className="h-5 w-5 text-amber-300" />, met: byteskill.maxStreak >= 7 },
    { label: "Streak 30",  threshold: 0,    color: "from-orange-500/30 to-amber-500/20", icon: <TrendingUp className="h-5 w-5 text-orange-300" />, met: byteskill.maxStreak >= 30 },
  ] as const;

  const earned = tiers.filter((t: any) => t.met ?? total >= t.threshold);

  return (
    <ProfileCard title="Awards" rightSlot={<span className="text-[11px] text-muted-foreground">{earned.length} earned</span>}>
      {earned.length === 0 ? (
        <EmptyCard message="Solve your first problem to earn an award" />
      ) : (
        <div className="flex flex-wrap gap-3">
          {earned.map((t) => (
            <div key={t.label} className={`w-20 aspect-square rounded-xl bg-gradient-to-br ${t.color} border border-amber-400/25 grid place-items-center text-center p-2`}>
              <div className="flex flex-col items-center gap-1">
                {t.icon}
                <span className="text-[10px] font-medium text-amber-100/90 leading-tight">{t.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </ProfileCard>
  );
}

/* ---------------- Compact monthly heatmap (top-row) ----------------- */

export function CompactHeatmapCard({ byteskill }: { byteskill: ByteskillStats }) {
  // 12 columns × 7 rows of last 365 days
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 364);
  // Align start to Sunday
  start.setDate(start.getDate() - start.getDay());
  const days: { date: string; count: number }[] = [];
  for (let i = 0; i < 371; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    days.push({ date: iso, count: byteskill.submissionsByDay[iso] ?? 0 });
  }
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, w) => days.slice(w * 7, w * 7 + 7));
  const max = Math.max(1, ...days.map((d) => d.count));
  const intensity = (c: number) => {
    if (c === 0) return "bg-muted/20";
    const r = c / max;
    if (r < 0.25) return "bg-amber-500/30";
    if (r < 0.5)  return "bg-amber-500/55";
    if (r < 0.75) return "bg-amber-500/75";
    return "bg-amber-400";
  };

  const monthLabels: { idx: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((w, i) => {
    const first = w[0];
    if (!first) return;
    const m = new Date(first.date).getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ idx: i, label: new Date(first.date).toLocaleString("en", { month: "short" }) });
      lastMonth = m;
    }
  });

  return (
    <ProfileCard
      title="Submissions"
      rightSlot={
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>Total <b className="text-foreground tabular-nums">{byteskill.totalSubmissions}</b></span>
          <span>Streak <b className="text-foreground tabular-nums">{byteskill.maxStreak}</b></span>
          <span>Active <b className="text-foreground tabular-nums">{byteskill.activeDays}</b></span>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <div className="inline-block">
          <div className="flex gap-[10px] text-[10px] text-muted-foreground pl-1 mb-1">
            {monthLabels.map((m) => (
              <span key={m.idx} style={{ width: 12 * (monthLabels[monthLabels.indexOf(m) + 1]?.idx - m.idx || 4) }}>
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {weeks.map((w, i) => (
              <div key={i} className="flex flex-col gap-[3px]">
                {w.map((d, j) => (
                  <div
                    key={j}
                    title={`${d.date}: ${d.count} submissions`}
                    className={`h-[10px] w-[10px] rounded-sm ${intensity(d.count)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProfileCard>
  );
}

/* ---------------- Left-rail: Problem Solving Stats list ----------------- */

export const PROBLEM_SOLVING_PLATFORMS = [
  { key: "leetcode",     label: "LeetCode",     Icon: Code2 },
  { key: "geeksforgeeks", label: "GeeksForGeeks", Icon: BookOpen },
  { key: "codechef",     label: "CodeChef",     Icon: Terminal },
  { key: "codeforces",   label: "CodeForces",   Icon: Trophy },
  { key: "hackerrank",   label: "HackerRank",   Icon: Braces },
] as const;

export function ProblemSolvingStatsList({
  urls,
  updatedAt,
}: {
  urls: Partial<Record<typeof PROBLEM_SOLVING_PLATFORMS[number]["key"], string | null | undefined>>;
  updatedAt?: Partial<Record<typeof PROBLEM_SOLVING_PLATFORMS[number]["key"], number | null | undefined>>;
}) {
  const newestUpdate = updatedAt
    ? Math.max(0, ...Object.values(updatedAt).map((t) => (typeof t === "number" ? t : 0)))
    : 0;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <BarChart3 className="h-3 w-3" /> Problem Solving Stats
        </h3>
        {newestUpdate > 0 && (
          <span className="text-[10px] text-muted-foreground" title={new Date(newestUpdate).toLocaleString()}>
            {formatRelative(new Date(newestUpdate).toISOString())}
          </span>
        )}
      </div>
      <ul className="space-y-1">
        {PROBLEM_SOLVING_PLATFORMS.map(({ key, label, Icon }) => {
          const url = urls[key];
          const connected = !!url;
          const ts = updatedAt?.[key];
          return (
            <li
              key={key}
              className="flex items-center justify-between gap-2 rounded-lg border border-amber-400/15 bg-card/40 px-2.5 py-1.5 text-[12.5px]"
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <Icon className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                <span className="truncate text-foreground/90">{label}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                {connected ? (
                  <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-400" title={ts ? `Updated ${formatRelative(new Date(ts).toISOString())}` : "Linked"}>
                    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor"><path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4L8.5 12 15.3 5.3a1 1 0 0 1 1.4 0z"/></svg>
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">—</span>
                )}
                {connected && (
                  <a href={url!} target="_blank" rel="noreferrer" aria-label={`Open ${label}`} className="text-muted-foreground hover:text-amber-200">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- Left-rail: Leaderboard mini card ----------------- */

export function LeaderboardMiniCard() {
  return (
    <div className="rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.04] p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold text-foreground">Leaderboard</p>
          <p className="text-[10.5px] text-muted-foreground">Rank with peers</p>
        </div>
        <Trophy className="h-4 w-4 text-amber-300" />
      </div>
      <Link
        to="/leaderboard"
        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-[12px] font-semibold rounded-lg border border-amber-400/40 bg-gradient-to-b from-amber-500/20 to-orange-500/15 text-amber-100 px-3 py-2 hover:from-amber-500/30 hover:to-orange-500/25 transition-all"
      >
        View Leaderboard <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
