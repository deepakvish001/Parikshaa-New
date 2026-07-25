import { useEffect, useMemo, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Trophy, Calendar, Hash, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProfileCard, EmptyCard } from "./ProfileCard";
import { ActionIcon } from "@/components/common/ActionIcon";
import type { LeetCodeProfile } from "@/hooks/useLeetCodeProfile";
import { extractLeetCodeUsername } from "@/hooks/useLeetCodeProfile";
import { useRatingHistory, type RatingPoint, type RatingSeries } from "@/hooks/useRatingHistory";

type SeriesKey = "leetcode" | "codeforces" | "codechef";

const SERIES_META: Record<SeriesKey, { label: string; stroke: string }> = {
  leetcode:   { label: "LeetCode",   stroke: "hsl(38 92% 58%)"  },
  codeforces: { label: "Codeforces", stroke: "hsl(24 95% 60%)"  },
  codechef:   { label: "CodeChef",   stroke: "hsl(160 70% 45%)" },
};

/** Codeforces-style rating tiers used as background bands (works as a generic visual scale). */
const TIERS: { from: number; to: number; color: string; label: string }[] = [
  { from: 0,    to: 1200, color: "hsl(0 0% 55% / 0.10)",   label: "Newbie" },
  { from: 1200, to: 1400, color: "hsl(120 60% 45% / 0.12)", label: "Pupil" },
  { from: 1400, to: 1600, color: "hsl(180 60% 45% / 0.12)", label: "Specialist" },
  { from: 1600, to: 1900, color: "hsl(220 70% 55% / 0.14)", label: "Expert" },
  { from: 1900, to: 2100, color: "hsl(280 60% 55% / 0.14)", label: "Candidate Master" },
  { from: 2100, to: 2400, color: "hsl(30 90% 55% / 0.16)",  label: "Master" },
  { from: 2400, to: 4000, color: "hsl(0 80% 55% / 0.18)",   label: "Grandmaster" },
];

function leetcodeSeries(lc?: LeetCodeProfile | null): RatingSeries | null {
  const hist = (lc?.userContestRankingHistory ?? []).filter((c) => c.attended);
  if (hist.length === 0) return null;
  let prev: number | null = null;
  const points: RatingPoint[] = hist.map((h) => {
    const rating = Math.round(h.rating);
    const delta = prev == null ? 0 : rating - prev;
    prev = rating;
    return { ts: h.contest.startTime, rating, label: h.contest.title, rank: h.ranking, delta };
  });
  return {
    platform: "leetcode",
    handle: lc?.matchedUser?.username ?? "",
    points,
    peak: Math.max(...points.map((p) => p.rating)),
    sync_status: "ok",
  };
}

export function RatingsOverTimeCard({
  leetcode,
  hasLeetcode,
  codeforcesHandle,
  codechefHandle,
}: {
  leetcode?: LeetCodeProfile | null;
  hasLeetcode: boolean;
  codeforcesHandle?: string | null;
  codechefHandle?: string | null;
}) {
  const ratingHistory = useRatingHistory({ codeforces: codeforcesHandle, codechef: codechefHandle });
  const queryClient = useQueryClient();
  const lcUsername = extractLeetCodeUsername(leetcode?.matchedUser?.username);
  const [lastUpdated, setLastUpdated] = useState<number>(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [, forceTick] = useState(0);

  // Real-time: refresh on Supabase Realtime broadcast, BroadcastChannel
  // (cross-tab), window focus, and network reconnect — no polling timers.
  useEffect(() => {
    if (!hasLeetcode || !lcUsername) return;
    const invalidateLc = () =>
      queryClient.invalidateQueries({ queryKey: ["leetcode-profile", lcUsername] });

    const channel = supabase
      .channel(`leetcode-profile:${lcUsername}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "refresh" }, invalidateLc)
      .subscribe();

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(`leetcode-profile:${lcUsername}`);
      bc.onmessage = invalidateLc;
    } catch { /* unsupported */ }

    const onFocus = () => invalidateLc();
    const onOnline = () => invalidateLc();
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    return () => {
      supabase.removeChannel(channel);
      bc?.close();
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [hasLeetcode, lcUsername, queryClient]);

  // Track last refresh time whenever any series data updates.
  useEffect(() => {
    setLastUpdated(Date.now());
  }, [leetcode, ratingHistory.codeforces?.data, ratingHistory.codechef?.data]);

  // Re-render "x s ago" label each 15s.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 15 * 1000);
    return () => clearInterval(id);
  }, []);

  const isFetching =
    !!ratingHistory.codeforces?.isFetching ||
    !!ratingHistory.codechef?.isFetching ||
    refreshing;

  const errors = [
    ratingHistory.codeforces?.isError ? { key: "codeforces" as const, refetch: ratingHistory.codeforces.refetch } : null,
    ratingHistory.codechef?.isError ? { key: "codechef" as const, refetch: ratingHistory.codechef.refetch } : null,
  ].filter(Boolean) as { key: "codeforces" | "codechef"; refetch: () => void }[];

  const handleManualRefresh = async () => {
    setRefreshing(true);
    // Optimistic: immediately bump "last updated" so the UI feels responsive.
    setLastUpdated(Date.now());
    try {
      await Promise.all([
        lcUsername
          ? queryClient.invalidateQueries({ queryKey: ["leetcode-profile", lcUsername] })
          : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: ["rating-history"] }),
      ]);
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  const ago = (() => {
    const s = Math.max(0, Math.floor((Date.now() - lastUpdated) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return `${h}h ago`;
  })();

  const series: { key: SeriesKey; data: RatingSeries }[] = useMemo(() => {
    const arr: { key: SeriesKey; data: RatingSeries }[] = [];
    if (hasLeetcode) {
      const s = leetcodeSeries(leetcode);
      if (s && s.points.length) arr.push({ key: "leetcode", data: s });
    }
    const cf = ratingHistory.codeforces?.data;
    if (cf && Array.isArray(cf.points) && cf.points.length) arr.push({ key: "codeforces", data: cf });
    const cc = ratingHistory.codechef?.data;
    if (cc && Array.isArray(cc.points) && cc.points.length) arr.push({ key: "codechef", data: cc });
    return arr;
  }, [leetcode, hasLeetcode, ratingHistory.codeforces?.data, ratingHistory.codechef?.data]);

  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set());
  const [hover, setHover] = useState<{ key: SeriesKey; idx: number; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const visible = series.filter((s) => !hidden.has(s.key));

  const W = 900;
  const H = 300;
  const PAD_L = 38;
  const PAD_R = 14;
  const PAD_T = 18;
  const PAD_B = 28;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const { paths, tMin, tMax, rMin, rMax, scale, lastByKey } = useMemo(() => {
    if (visible.length === 0) {
      return { paths: [] as any[], tMin: 0, tMax: 0, rMin: 0, rMax: 0, scale: { x: (_: number) => 0, y: (_: number) => 0 }, lastByKey: {} as Record<SeriesKey, RatingPoint | undefined> };
    }
    let tMin = Infinity, tMax = -Infinity, rMin = Infinity, rMax = -Infinity;
    for (const s of visible) {
      for (const p of s.data?.points ?? []) {
        if (p.ts < tMin) tMin = p.ts;
        if (p.ts > tMax) tMax = p.ts;
        if (p.rating < rMin) rMin = p.rating;
        if (p.rating > rMax) rMax = p.rating;
      }
    }
    rMin = Math.max(0, rMin - 60);
    rMax = rMax + 60;
    const tSpan = Math.max(1, tMax - tMin);
    const rSpan = Math.max(1, rMax - rMin);
    const x = (t: number) => PAD_L + ((t - tMin) / tSpan) * innerW;
    const y = (r: number) => PAD_T + (1 - (r - rMin) / rSpan) * innerH;

    const paths = visible.map((s) => {
      const pts = [...(s.data?.points ?? [])].sort((a, b) => a.ts - b.ts);
      const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.ts).toFixed(1)},${y(p.rating).toFixed(1)}`).join(" ");
      const area = pts.length
        ? `${d} L${x(pts[pts.length - 1].ts).toFixed(1)},${PAD_T + innerH} L${x(pts[0].ts).toFixed(1)},${PAD_T + innerH} Z`
        : "";
      return { key: s.key, line: d, area, pts };
    });
    const lastByKey: Record<string, RatingPoint | undefined> = {};
    paths.forEach((p) => { lastByKey[p.key] = p.pts[p.pts.length - 1]; });
    return { paths, tMin, tMax, rMin, rMax, scale: { x, y }, lastByKey };
  }, [visible, innerW, innerH]);

  if (series.length === 0) {
    const loading =
      (hasLeetcode && !leetcode) ||
      ratingHistory.codeforces?.isLoading ||
      ratingHistory.codechef?.isLoading;
    return (
      <ProfileCard title="Ratings Over Time" rightSlot={<TrendingUp className="h-4 w-4 text-muted-foreground" />}>
        <EmptyCard
          message={
            loading
              ? "Loading contest history…"
              : "Connect LeetCode, Codeforces, or CodeChef and attend a contest to see your rating chart"
          }
        />
      </ProfileCard>
    );
  }

  const fmtDate = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  const fmtFull = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  // Y-axis ticks: 4 evenly spaced
  const yTicks = (() => {
    if (rMax <= rMin) return [] as number[];
    const step = (rMax - rMin) / 4;
    return [0, 1, 2, 3, 4].map((i) => Math.round(rMin + step * i));
  })();

  // Visible tier bands (clipped to view range)
  const tierBands = TIERS
    .map((t) => ({ ...t, from: Math.max(t.from, rMin), to: Math.min(t.to, rMax) }))
    .filter((t) => t.to > t.from);

  const totalContests = visible.reduce((s, v) => s + (v.data?.points?.length ?? 0), 0);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || visible.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    // Convert to viewBox space
    const vx = ((e.clientX - rect.left) / rect.width) * W;
    if (vx < PAD_L || vx > W - PAD_R) { setHover(null); return; }
    // Find nearest point across all visible series
    let best: { key: SeriesKey; idx: number; dx: number; px: number; py: number } | null = null;
    for (const p of paths) {
      p.pts.forEach((pt: RatingPoint, idx: number) => {
        const px = scale.x(pt.ts);
        const dx = Math.abs(px - vx);
        if (!best || dx < best.dx) best = { key: p.key, idx, dx, px, py: scale.y(pt.rating) };
      });
    }
    if (best) setHover({ key: best.key, idx: best.idx, x: best.px, y: best.py });
  };

  const hoverPoint = hover
    ? (paths.find((p) => p.key === hover.key)?.pts[hover.idx] as RatingPoint | undefined)
    : undefined;

  return (
    <ProfileCard
      title="Ratings Over Time"
      rightSlot={
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums"
            title={
              isFetching
                ? "Fetching latest ratings…"
                : `Live updates via realtime · last updated ${ago}`
            }
          >
            {isFetching ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin text-amber-400" />
            ) : (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
            )}
            {isFetching ? "Updating…" : `Live · ${ago}`}
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {totalContests} contest{totalContests === 1 ? "" : "s"}
          </span>
          <ActionIcon
            icon={RefreshCw}
            label="Refresh ratings now"
            tooltip="Refresh now"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className={refreshing ? "[&_svg]:animate-spin" : ""}
          />

        </div>
      }
    >
      {errors.length > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">
            Couldn't refresh {errors.map((e) => e.key).join(" & ")}. Showing last cached data.
          </span>
          <button
            type="button"
            onClick={() => errors.forEach((e) => e.refetch())}
            className="rounded-md border border-rose-400/40 px-2 py-0.5 font-medium text-rose-200 hover:bg-rose-500/20 focus-parikshaa"
          >
            Retry
          </button>
        </div>
      )}
      {/* Legend / toggles */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {series.map((s) => {
          const meta = SERIES_META[s.key];
          const off = hidden.has(s.key);
          const last = s.data.points[s.data.points.length - 1];
          return (
            <button
              key={s.key}
              type="button"
              aria-pressed={!off}
              onClick={() => {
                setHidden((prev) => {
                  const next = new Set(prev);
                  if (next.has(s.key)) next.delete(s.key);
                  else next.add(s.key);
                  return next;
                });
              }}
              className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] focus-parikshaa transition-all ${
                off
                  ? "border-border/40 text-muted-foreground/60 bg-transparent opacity-60"
                  : "border-amber-400/40 bg-amber-500/10 text-foreground"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.stroke }} />
              <span className="font-medium">{meta.label}</span>
              {last && (
                <span className="tabular-nums text-muted-foreground">{last.rating}</span>
              )}
              {s.data.peak != null && (
                <span className="inline-flex items-center gap-0.5 tabular-nums text-amber-400/90">
                  <Trophy className="h-3 w-3" />
                  {s.data.peak}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="relative w-full min-w-0">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-[300px] cursor-crosshair"
          role="img"
          aria-label="Multi-platform contest rating chart"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            {Object.entries(SERIES_META).map(([key, meta]) => (
              <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={meta.stroke} stopOpacity="0.35" />
                <stop offset="100%" stopColor={meta.stroke} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* Rating tier bands */}
          {tierBands.map((t, i) => {
            const y1 = scale.y(t.to);
            const y2 = scale.y(t.from);
            return <rect key={i} x={PAD_L} y={y1} width={innerW} height={Math.max(0, y2 - y1)} fill={t.color} />;
          })}

          {/* Y grid + labels */}
          {yTicks.map((r, i) => {
            const yy = scale.y(r);
            return (
              <g key={i}>
                <line x1={PAD_L} y1={yy} x2={W - PAD_R} y2={yy} stroke="hsl(0 0% 100% / 0.06)" strokeWidth="1" />
                <text x={PAD_L - 6} y={yy + 3} textAnchor="end" fontSize="9" fill="hsl(0 0% 60%)" className="tabular-nums">
                  {r}
                </text>
              </g>
            );
          })}

          {/* Axes baselines */}
          <line x1={PAD_L} y1={PAD_T + innerH} x2={W - PAD_R} y2={PAD_T + innerH} stroke="hsl(0 0% 100% / 0.12)" />

          {/* Series: area + line + dots */}
          {paths.map((p) => {
            const meta = SERIES_META[p.key as SeriesKey];
            return (
              <g key={p.key} data-series={p.key}>
                {p.area && <path d={p.area} fill={`url(#fill-${p.key})`} />}
                <path d={p.line} fill="none" stroke={meta.stroke} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
                {p.pts.map((pt: RatingPoint, i: number) => (
                  <circle
                    key={i}
                    cx={scale.x(pt.ts)}
                    cy={scale.y(pt.rating)}
                    r={hover?.key === p.key && hover.idx === i ? 4.5 : 2.5}
                    fill="hsl(var(--background))"
                    stroke={meta.stroke}
                    strokeWidth="1.75"
                  />
                ))}
                {/* Peak marker */}
                {p.data?.peak != null && (() => {
                  const peakPt = p.pts.find((pt: RatingPoint) => pt.rating === p.data.peak);
                  if (!peakPt) return null;
                  return (
                    <g transform={`translate(${scale.x(peakPt.ts)}, ${scale.y(peakPt.rating) - 10})`}>
                      <circle r="3" fill={meta.stroke} />
                    </g>
                  );
                })()}
              </g>
            );
          })}

          {/* Hover crosshair */}
          {hover && (
            <g>
              <line x1={hover.x} y1={PAD_T} x2={hover.x} y2={PAD_T + innerH} stroke="hsl(0 0% 100% / 0.25)" strokeDasharray="3 3" />
              <circle cx={hover.x} cy={hover.y} r="5.5" fill="hsl(var(--background))" stroke={SERIES_META[hover.key].stroke} strokeWidth="2" />
            </g>
          )}
        </svg>

        {/* Tooltip card */}
        {hover && hoverPoint && (
          <div
            className="absolute z-10 pointer-events-none rounded-lg border border-border/60 bg-background/95 backdrop-blur px-3 py-2 text-[11px] shadow-xl min-w-[180px]"
            style={{
              left: `min(calc(100% - 200px), max(0px, ${(hover.x / W) * 100}% - 90px))`,
              top: `min(calc(100% - 88px), max(0px, ${(hover.y / H) * 100}% - 96px))`,
            }}
          >
            <div className="flex items-center gap-1.5 font-semibold">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SERIES_META[hover.key].stroke }} />
              {SERIES_META[hover.key].label}
            </div>
            <div className="text-foreground/90 mt-1 line-clamp-2">{hoverPoint.label ?? "Contest"}</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1.5 text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtFull(hoverPoint.ts)}</span>
              <span className="tabular-nums text-foreground font-semibold">{hoverPoint.rating}</span>
              {hoverPoint.rank != null && (
                <span className="inline-flex items-center gap-1"><Hash className="h-3 w-3" />Rank {hoverPoint.rank}</span>
              )}
              {hoverPoint.delta != null && hoverPoint.delta !== 0 && (
                <span
                  className={`inline-flex items-center gap-1 tabular-nums font-semibold ${
                    hoverPoint.delta > 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {hoverPoint.delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {hoverPoint.delta > 0 ? "+" : ""}{hoverPoint.delta}
                </span>
              )}
            </div>
          </div>
        )}

        {/* X-axis date range */}
        {tMin !== tMax && (
          <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums mt-1 px-1">
            <span>{fmtDate(tMin)}</span>
            <span>{fmtDate(tMax)}</span>
          </div>
        )}
      </div>

      {/* Per-series summary strip */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {series.map((s) => {
          const meta = SERIES_META[s.key];
          const pts = s.data.points;
          const last = pts[pts.length - 1];
          const first = pts[0];
          const net = last && first ? last.rating - first.rating : 0;
          return (
            <div key={s.key} className="rounded-lg border border-border/40 bg-card/40 p-2">
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.stroke }} />
                <span className="font-semibold">{meta.label}</span>
                <span className="ml-auto text-muted-foreground">{pts.length} contest{pts.length === 1 ? "" : "s"}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-3">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Current</div>
                  <div className="text-base font-bold tabular-nums">{last?.rating ?? "—"}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Peak</div>
                  <div className="text-base font-bold tabular-nums text-amber-400">{s.data.peak ?? "—"}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Net</div>
                  <div className={`text-sm font-semibold tabular-nums ${net > 0 ? "text-emerald-400" : net < 0 ? "text-rose-400" : "text-muted-foreground"}`}>
                    {net > 0 ? "+" : ""}{net}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ProfileCard>
  );
}
