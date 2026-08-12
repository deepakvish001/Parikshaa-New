import { ExternalLink, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function MetricCard({
  label,
  value,
  sub,
  icon,
  accent = "text-primary",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: string;
}) {
  return (
    <Card className="p-4 flex items-center gap-4">
      {icon && (
        <div className={cn("h-10 w-10 rounded-full bg-muted/40 grid place-items-center", accent)}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {label}
        </div>
        <div className="flex items-baseline gap-2">
          <span className={cn("text-2xl font-bold", accent)}>{value}</span>
          {sub && <span className="text-xs text-muted-foreground truncate">{sub}</span>}
        </div>
      </div>
    </Card>
  );
}

export function StatTile({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-3 text-center">
      <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </div>
      <div className={cn("text-lg font-bold mt-1", accent)}>{value}</div>
    </div>
  );
}

export function DifficultyRing({
  value,
  total,
  label,
  color,
}: {
  value: number;
  total: number;
  label: string;
  color: string;
}) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(value / total, 1) : 0;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" strokeWidth="6" className="stroke-muted/40" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            stroke={color}
            strokeDasharray={`${c * pct} ${c}`}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-xl font-bold">{value}</div>
      </div>
      <div className="text-xs font-semibold tracking-wide" style={{ color }}>
        {label}
      </div>
    </div>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty?: string | null }) {
  const d = (difficulty ?? "").toLowerCase();
  const cls =
    d === "hard"
      ? "bg-destructive/15 text-destructive"
      : d === "medium"
        ? "bg-amber-500/15 text-amber-500"
        : d === "easy"
          ? "bg-emerald-500/15 text-emerald-500"
          : "bg-muted text-muted-foreground";
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", cls)}>
      {difficulty ?? "—"}
    </span>
  );
}

export function Heatmap({ data }: { data: { day: string; submissions: number }[] }) {
  const map = new Map(data.map((d) => [d.day, d.submissions]));
  const days: { key: string; n: number }[] = [];
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  for (let i = 363; i >= 0; i--) {
    const d = new Date(start.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, n: map.get(key) ?? 0 });
  }
  const max = Math.max(1, ...days.map((d) => d.n));
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)));
  const shades = [
    "bg-muted/30",
    "bg-emerald-500/25",
    "bg-emerald-500/45",
    "bg-emerald-500/70",
    "bg-emerald-500",
  ];
  return (
    <div className="grid grid-flow-col grid-rows-7 gap-[3px] overflow-x-auto pb-1">
      {days.map((d) => (
        <div
          key={d.key}
          title={`${d.key}: ${d.n} submissions`}
          className={cn("h-[10px] w-[10px] rounded-[2px]", shades[level(d.n)])}
        />
      ))}
    </div>
  );
}

export function DailyChallengeCard() {
  return (
    <Card className="p-5 flex flex-col justify-between border-primary/20 bg-primary/5">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-primary fill-primary" />
          <span className="text-[10px] font-bold tracking-wider uppercase text-primary">Daily Challenge</span>
        </div>
        <h3 className="text-lg font-bold leading-tight">Minimum Number of Operations to Sort a Binary Tree by Level</h3>
        <div className="mt-2 flex items-center gap-2">
          <DifficultyBadge difficulty="Medium" />
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Dec 23, 2024</span>
        </div>
      </div>
      <a 
        href="https://leetcode.com/problems/minimum-number-of-operations-to-sort-a-binary-tree-by-level/" 
        target="_blank" 
        rel="noreferrer"
        className="mt-4"
      >
        <Button className="w-full h-9 text-xs font-bold" variant="default">
          Solve Problem <ExternalLink className="h-3 w-3 ml-1.5" />
        </Button>
      </a>
    </Card>
  );
}
