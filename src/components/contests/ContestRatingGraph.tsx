import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Trophy } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
  ReferenceDot, Brush,
} from "recharts";

interface Point {
  idx: number;
  ts: number;
  rating: number;
  delta: number;
  rank: number;
  participants: number;
  date: string;
  contestId?: string;
}

function tierOf(r: number) {
  if (r >= 2400) return { label: "Grandmaster", color: "#f43f5e" };
  if (r >= 2100) return { label: "Master", color: "#fb923c" };
  if (r >= 1900) return { label: "Candidate Master", color: "#e879f9" };
  if (r >= 1600) return { label: "Expert", color: "#38bdf8" };
  if (r >= 1400) return { label: "Specialist", color: "#22d3ee" };
  if (r >= 1200) return { label: "Pupil", color: "#34d399" };
  return { label: "Newbie", color: "#94a3b8" };
}

const RANGES: { label: string; days: number | null }[] = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "All", days: null },
];

export function ContestRatingGraph({ userId }: { userId: string }) {
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeIdx, setRangeIdx] = useState(4); // All

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("contest_rating_history" as any)
        .select("new_rating,delta,rank,participants,created_at,contest_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      const rows = (data as any[]) ?? [];
      setPoints(rows.map((r, i) => ({
        idx: i + 1,
        ts: new Date(r.created_at).getTime(),
        rating: r.new_rating,
        delta: r.delta,
        rank: r.rank,
        participants: r.participants,
        date: new Date(r.created_at).toLocaleDateString(),
        contestId: r.contest_id,
      })));
      setLoading(false);
    })();
  }, [userId]);

  const filtered = useMemo(() => {
    const days = RANGES[rangeIdx].days;
    if (!days) return points;
    const cutoff = Date.now() - days * 86400_000;
    const inRange = points.filter((p) => p.ts >= cutoff);
    return inRange.length ? inRange : points.slice(-Math.max(2, Math.min(points.length, 5)));
  }, [points, rangeIdx]);

  if (loading || points.length === 0) return null;

  const current = points[points.length - 1].rating;
  const peakPoint = points.reduce((a, b) => (b.rating > a.rating ? b : a), points[0]);
  const tier = tierOf(current);
  const currentPoint = points[points.length - 1];

  const tooltipFormatter = (_v: any, _n: any, p: any) => {
    const pl = p.payload as Point;
    const badge = pl.idx === peakPoint.idx ? "  ⭐ Peak" : pl.idx === currentPoint.idx ? "  ● Current" : "";
    return [
      `${pl.rating} (${pl.delta >= 0 ? "+" : ""}${pl.delta}) · rank ${pl.rank}/${pl.participants}${badge}`,
      "Rating",
    ];
  };

  return (
    <Card className="border-amber-400/25 bg-card/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold">Contest Rating</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Current</span>
            <span className="text-lg font-bold tabular-nums" style={{ color: tier.color }}>{current}</span>
            <Badge variant="outline" className="text-[10px]" style={{ borderColor: tier.color, color: tier.color }}>{tier.label}</Badge>
          </div>
          <span className="inline-flex items-center gap-1 text-amber-300">
            <Trophy className="h-3 w-3" /> Peak {peakPoint.rating}
          </span>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-1">
        {RANGES.map((r, i) => (
          <Button
            key={r.label}
            size="sm"
            variant={i === rangeIdx ? "default" : "outline"}
            className={`h-6 px-2 text-[10px] ${i === rangeIdx ? "bg-amber-500 text-black hover:bg-amber-400" : "border-amber-400/30"}`}
            onClick={() => setRangeIdx(i)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filtered} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="idx" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <ReferenceLine y={1200} stroke="#334155" strokeDasharray="3 3" />
            <ReferenceLine y={1600} stroke="#334155" strokeDasharray="3 3" />
            <ReferenceLine y={2100} stroke="#334155" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{ background: "rgba(3,3,5,0.9)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 8, fontSize: 12 }}
              labelFormatter={(v, payload) => {
                const pl = payload?.[0]?.payload as Point | undefined;
                return pl ? `Contest #${v} · ${pl.date}` : `Contest #${v}`;
              }}
              formatter={tooltipFormatter}
            />
            <Line
              type="monotone"
              dataKey="rating"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={(props: any) => {
                const p = props.payload as Point;
                const isPeak = p.idx === peakPoint.idx;
                const isCurrent = p.idx === currentPoint.idx;
                const color = p.delta >= 0 ? "#10b981" : "#f43f5e";
                return (
                  <circle
                    key={`d-${p.idx}`}
                    cx={props.cx}
                    cy={props.cy}
                    r={isPeak || isCurrent ? 5 : 3}
                    fill={isPeak ? "#f59e0b" : isCurrent ? "#f97316" : color}
                    stroke={isPeak || isCurrent ? "#fff" : "none"}
                    strokeWidth={isPeak || isCurrent ? 1.5 : 0}
                  />
                );
              }}
              activeDot={{ r: 6 }}
            />
            <ReferenceDot x={peakPoint.idx} y={peakPoint.rating} r={0} label={{ value: "★ Peak", position: "top", fill: "#f59e0b", fontSize: 10 }} />
            {filtered.length > 8 && (
              <Brush dataKey="idx" height={18} stroke="#f59e0b" travellerWidth={8} fill="rgba(245,158,11,0.06)" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Green markers = rating gain · red = loss · ★ peak · drag the brush to zoom.
      </p>
    </Card>
  );
}
