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

  const podium = useMemo(() => {
    const p = rows.slice(0, 3);
    // Order for visual display: [2nd, 1st, 3rd]
    const ordered = [null, null, null] as (typeof rows[0] | null)[];
    if (p[0]) ordered[1] = p[0]; // 1st
    if (p[1]) ordered[0] = p[1]; // 2nd
    if (p[2]) ordered[2] = p[2]; // 3rd
    return ordered;
  }, [rows]);

  const rest = rows.slice(3);

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
            {podium.map((p, i) => {
              if (!p) return <div key={i} className="flex flex-col items-center gap-2 opacity-0" />;
              const heights = ["h-24", "h-32", "h-16"];
              const place = [2, 1, 3][i];
              const colors = [
                "bg-slate-300 dark:bg-slate-700",
                "bg-amber-400 dark:bg-amber-600",
                "bg-orange-400 dark:bg-orange-800"
              ];
              
              return (
                <div key={p.handle} className="flex flex-col items-center gap-2">
                  <div className="relative">
                    {place === 1 && (
                      <Crown className="h-6 w-6 text-amber-400 absolute -top-5 left-1/2 -translate-x-1/2 drop-shadow-md" />
                    )}
                    <Avatar className={cn(
                      "h-16 w-16 md:h-20 md:w-20 ring-4 transition-transform hover:scale-105",
                      place === 1 ? "ring-amber-400" : place === 2 ? "ring-slate-300" : "ring-orange-400"
                    )}>
                      <AvatarImage src={p.avatar_url ?? undefined} />
                      <AvatarFallback className="text-lg">{p.handle.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm",
                      colors[i]
                    )}>
                      #{place}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-center truncate w-full mt-2">
                    {p.display_name ?? p.handle}
                  </div>
                  <div className="text-lg font-bold text-primary">{Number(p.value).toLocaleString()}</div>
                  <div className={cn(
                    "w-full rounded-t-xl bg-gradient-to-b from-muted/60 to-muted/20 flex flex-col items-center justify-end pb-2 overflow-hidden",
                    heights[i]
                  )}>
                    <div className="text-2xl font-black text-muted-foreground/30 select-none">
                      {place}
                    </div>
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
