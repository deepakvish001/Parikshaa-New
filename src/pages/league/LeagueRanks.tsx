import { useMemo, useState } from "react";
import { Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useLeaderboard, useTrackedHandles, type LeagueMetric } from "@/hooks/league/useLeague";

const METRICS: { key: LeagueMetric; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
  { key: "total", label: "All-Time" },
  { key: "rating", label: "Contest Rating" },
  { key: "current_streak", label: "Current Streak" },
  { key: "longest_streak", label: "Longest Streak" },
  { key: "hard", label: "Hard Problems" },
  { key: "consistency", label: "Consistency" },
];

export default function LeagueRanks() {
  const [metric, setMetric] = useState<LeagueMetric>("today");
  const { data: handles = [] } = useTrackedHandles();
  const pool = useMemo(() => handles.map((h) => h.handle), [handles]);
  const { data: rows = [] } = useLeaderboard(pool, metric);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const order = [podium[1], podium[0], podium[2]];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
              metric === m.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card/60 text-muted-foreground hover:text-foreground",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          Track some handles to populate the leaderboard.
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 items-end">
            {order.map((p, i) => {
              if (!p) return <div key={i} />;
              const heights = ["h-20", "h-28", "h-16"];
              const place = [2, 1, 3][i];
              return (
                <div key={p.handle} className="flex flex-col items-center gap-2">
                  {place === 1 && <Crown className="h-5 w-5 text-amber-400" />}
                  <Avatar className={cn("h-16 w-16 ring-2", place === 1 ? "ring-amber-400" : "ring-border")}>
                    <AvatarImage src={p.avatar_url ?? undefined} />
                    <AvatarFallback>{p.handle.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-semibold text-center truncate max-w-[10rem]">
                    {p.display_name ?? p.handle}
                  </div>
                  <div className="text-lg font-bold text-primary">{Number(p.value)}</div>
                  <div className={cn("w-full rounded-t-lg bg-muted/40 grid place-items-center text-2xl font-bold text-muted-foreground", heights[i])}>
                    {place}
                  </div>
                </div>
              );
            })}
          </div>

          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Rank</th>
                  <th className="px-4 py-3 text-left font-semibold">Member</th>
                  <th className="px-4 py-3 text-right font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((r) => (
                  <tr key={r.handle} className="border-t">
                    <td className="px-4 py-3 text-muted-foreground">{Number(r.rank)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={r.avatar_url ?? undefined} />
                          <AvatarFallback>{r.handle.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{r.display_name ?? r.handle}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{Number(r.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
