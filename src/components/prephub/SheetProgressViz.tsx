import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Trophy, Target, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface SheetProgressRow {
  sheetId: string;
  title: string;
  total: number;
  solved: number;
  pending: number;
  time: number;
  percent: number;
}

interface SheetProgressVizProps {
  sheets: SheetProgressRow[];
  loading?: boolean;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function SheetProgressViz({ sheets, loading }: SheetProgressVizProps) {
  const chartData = sheets.map((s) => ({
    name: s.title
      .replace("Sheet", "")
      .replace("Problem Set", "")
      .replace("Training", "")
      .trim()
      .split(" ")
      .slice(0, 2)
      .join(" "),
    solved: s.solved,
    pending: s.pending,
    timeHours: Math.round(s.time / 3600),
  }));

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (sheets.length === 0) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Start a sheet to see your progress here.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stacked bar chart: solved vs pending per sheet */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="h-40"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              interval={0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              width={28}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted) / 0.15)" }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
                      <p className="font-medium mb-1">{label}</p>
                      {payload.map((p) => (
                        <div key={p.dataKey} className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: p.color }}
                          />
                          <span className="capitalize">{p.name}:</span>
                          <span className="font-bold">{p.value}</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              height={20}
              iconType="circle"
              wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}
            />
            <Bar
              dataKey="solved"
              name="Solved"
              stackId="a"
              fill="hsl(var(--primary))"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="pending"
              name="Pending"
              stackId="a"
              fill="hsl(var(--primary) / 0.22)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Per-sheet segmented progress bars */}
      <div className="space-y-4">
        {sheets.slice(0, 6).map((sheet, idx) => {
          const solvedPct = sheet.total > 0 ? (sheet.solved / sheet.total) * 100 : 0;
          const pendingPct = sheet.total > 0 ? (sheet.pending / sheet.total) * 100 : 0;
          const remainingPct = Math.max(0, 100 - solvedPct - pendingPct);

          return (
            <motion.div
              key={sheet.sheetId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.35 }}
              className="group"
            >
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium truncate">{sheet.title}</span>
                <span className="shrink-0 text-xs font-bold text-primary">
                  {sheet.percent}%
                </span>
              </div>

              {/* Segmented progress bar: solved | pending | remaining */}
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="absolute inset-0 flex h-full">
                  <div
                    className="h-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: `${solvedPct}%` }}
                  />
                  <div
                    className="h-full bg-amber-500 transition-all duration-700 ease-out"
                    style={{ width: `${pendingPct}%` }}
                  />
                  <div
                    className={cn(
                      "h-full bg-secondary transition-all duration-700 ease-out",
                      remainingPct > 0 && "border-l border-white/5"
                    )}
                    style={{ width: `${remainingPct}%` }}
                  />
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-primary" />
                  {sheet.solved} solved
                </span>
                <span className="inline-flex items-center gap-1">
                  <Target className="h-3 w-3 text-amber-500" />
                  {sheet.pending} pending
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {formatDuration(sheet.time)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default SheetProgressViz;
