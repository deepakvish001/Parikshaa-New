import { useMemo } from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Gauge, Sigma, Clock, HardDrive } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { buildCurves, COMPLEXITY_CASE_COLORS, parseComplexity } from "./complexityMath";
import { scoreConfidence } from "./confidence";
import { ConfidenceMeter } from "./ConfidenceMeter";


export interface ComplexityLike {
  time?: string;
  space?: string;
  timeReason?: string;
  spaceReason?: string;
  recurrence?: string | null;
  best?: string;
  average?: string;
  worst?: string;
  notes?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complexity?: ComplexityLike | null;
}

const CASES = ["best", "average", "worst"] as const;

const fmt = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);

export function ComplexityChart({
  series,
  maxN = 64,
  height = 220,
}: {
  series: { key: string; expr?: string | null; color: string }[];
  maxN?: number;
  height?: number;
}) {
  const { points, specs } = useMemo(
    () => buildCurves(series.map((s) => ({ key: s.key, expr: s.expr })), maxN),
    [series, maxN],
  );

  if (!points.length) {
    return (
      <div className="flex h-[160px] items-center justify-center rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground">
        No parsable complexity to plot.
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
          <XAxis
            dataKey="n"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            label={{ value: "input size (n)", position: "insideBottom", offset: -2, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            height={34}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={fmt}
            width={48}
          />
          <RTooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(value: number, name: string) => [fmt(Number(value)), `${name} — O(${specs[name]?.label ?? "?"})`]}
            labelFormatter={(l) => `n = ${l}`}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series
            .filter((s) => specs[s.key])
            .map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ComplexityDrawer({ open, onOpenChange, complexity }: Props) {
  const c = complexity ?? {};
  const caseSeries = CASES.map((k) => ({
    key: k,
    expr: c[k] ?? (k === "average" ? c.time : undefined),
    color: COMPLEXITY_CASE_COLORS[k],
  }));
  const memorySeries = [
    { key: "time", expr: c.time, color: COMPLEXITY_CASE_COLORS.time },
    { key: "space", expr: c.space, color: COMPLEXITY_CASE_COLORS.space },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0">
        <SheetHeader className="border-b border-border/50 p-5 pb-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4 text-fuchsia-400" /> Complexity breakdown
          </SheetTitle>
          <SheetDescription className="text-xs">
            How this algorithm grows as the input gets bigger — best, average and worst case.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100dvh-6.5rem)]">
          <div className="space-y-6 p-5">
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Estimate confidence
              </h3>
              <ConfidenceMeter result={scoreConfidence(c)} />
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Growth across cases
              </h3>

              <div className="rounded-xl border border-border/50 bg-card/40 p-3">
                <ComplexityChart series={caseSeries} />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {CASES.map((k) => {
                  const expr = c[k] ?? (k === "average" ? c.time : undefined);
                  const spec = parseComplexity(expr);
                  return (
                    <div
                      key={k}
                      className="rounded-lg border border-border/50 bg-background/40 p-2.5"
                      style={{ borderLeft: `3px solid ${COMPLEXITY_CASE_COLORS[k]}` }}
                    >
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k} case</div>
                      <div className="font-mono text-sm text-foreground">{expr ?? "—"}</div>
                      {spec && (
                        <div className="text-[10px] text-muted-foreground">grows like {spec.label}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Time vs space
              </h3>
              <div className="rounded-xl border border-border/50 bg-card/40 p-3">
                <ComplexityChart series={memorySeries} height={190} />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-indigo-400/30 bg-indigo-500/10 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-200">
                    <Clock className="h-3.5 w-3.5" /> Time · <span className="font-mono">{c.time ?? "—"}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {c.timeReason ?? "No reasoning provided."}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-200">
                    <HardDrive className="h-3.5 w-3.5" /> Space · <span className="font-mono">{c.space ?? "—"}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {c.spaceReason ?? "No reasoning provided."}
                  </p>
                </div>
              </div>
            </section>

            {c.recurrence && (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Recurrence relation
                </h3>
                <div className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3">
                  <Sigma className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  <code className="font-mono text-sm text-amber-100">{c.recurrence}</code>
                </div>
              </section>
            )}

            {c.notes?.length ? (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Why these estimates
                </h3>
                <ul className="space-y-1.5">
                  {c.notes.map((n, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-border/50 bg-card/30 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground"
                    >
                      {n}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
