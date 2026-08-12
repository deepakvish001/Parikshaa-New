import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Flame, Trophy, GitCompare, X, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DifficultyBadge,
  DifficultyRing,
  StatTile,
} from "@/components/league/LeagueBits";
import {
  useSnapshots,
  useTrackedHandles,
} from "@/hooks/league/useLeague";
import { cn } from "@/lib/utils";

export default function LeagueCompare() {
  const { data: handles = [] } = useTrackedHandles();
  const [selectedHandles, setSelectedHandles] = useState<string[]>([]);
  
  const { data: snapshots = [] } = useSnapshots(selectedHandles);
  const snapBy = useMemo(() => new Map(snapshots.map((s) => [s.handle, s])), [snapshots]);

  const toggleHandle = (handle: string) => {
    setSelectedHandles(prev => 
      prev.includes(handle) 
        ? prev.filter(h => h !== handle) 
        : prev.length < 4 ? [...prev, handle] : prev
    );
  };

  const metrics = [
    { label: "Total Solved", key: "total_solved", accent: "text-emerald-500", icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: "Rating", key: "contest_rating", accent: "text-sky-500", icon: <Trophy className="h-4 w-4" /> },
    { label: "Streak", key: "current_streak", accent: "text-amber-500", icon: <Flame className="h-4 w-4" /> },
    { label: "Rank", key: "global_ranking", accent: "text-purple-400" },
    { label: "Hard", key: "hard_solved", accent: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/league/friends" className="flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Friends
          </Link>
          <span>/</span>
          <span className="font-semibold text-foreground">Compare</span>
        </div>
        <div className="flex -space-x-2 overflow-hidden">
          {selectedHandles.map(h => (
            <Avatar key={h} className="h-8 w-8 ring-2 ring-background">
              <AvatarImage src={snapBy.get(h)?.avatar_url ?? undefined} />
              <AvatarFallback>{h.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-bold uppercase mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Select handles to compare (up to 4)
        </h3>
        <div className="flex flex-wrap gap-2">
          {handles.map((h) => (
            <button
              key={h.handle}
              onClick={() => toggleHandle(h.handle)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                selectedHandles.includes(h.handle)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              )}
            >
              {h.display_name ?? h.handle}
              {selectedHandles.includes(h.handle) && <X className="h-3 w-3" />}
            </button>
          ))}
        </div>
      </Card>

      {selectedHandles.length === 0 ? (
        <Card className="p-20 text-center text-muted-foreground bg-muted/5 border-dashed">
          <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-20" />
          Select at least one handle to see the comparison.
        </Card>
      ) : (
        <div className="grid gap-6">
          <div className="grid grid-cols-[120px_repeat(auto-fit,minmax(0,1fr))] gap-4">
            <div />
            {selectedHandles.map(handle => {
              const s = snapBy.get(handle);
              return (
                <div key={handle} className="text-center space-y-2">
                  <Avatar className="h-16 w-16 mx-auto">
                    <AvatarImage src={s?.avatar_url ?? undefined} />
                    <AvatarFallback>{handle.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="font-bold truncate text-sm">{s?.display_name ?? handle}</div>
                </div>
              );
            })}
          </div>

          {metrics.map(m => (
            <Card key={m.key} className="p-4 bg-card/50">
              <div className="grid grid-cols-[120px_repeat(auto-fit,minmax(0,1fr))] gap-4 items-center">
                <div className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                  {m.icon} {m.label}
                </div>
                {selectedHandles.map(handle => {
                  const s = snapBy.get(handle) as any;
                  const val = s?.[m.key];
                  return (
                    <div key={handle} className={cn("text-center text-lg font-bold", m.accent)}>
                      {val !== undefined && val !== null ? (m.key === 'global_ranking' ? `#${val}` : val) : "—"}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}

          <Card className="p-6">
            <h3 className="text-sm font-bold uppercase mb-6 text-center">Difficulty Breakdown</h3>
            <div className="grid grid-cols-[120px_repeat(auto-fit,minmax(0,1fr))] gap-4">
              <div className="flex flex-col justify-around py-4">
                <div className="text-[10px] font-bold text-emerald-500 uppercase">Easy</div>
                <div className="text-[10px] font-bold text-amber-500 uppercase">Medium</div>
                <div className="text-[10px] font-bold text-destructive uppercase">Hard</div>
              </div>
              {selectedHandles.map(handle => {
                const s = snapBy.get(handle);
                return (
                  <div key={handle} className="flex flex-col items-center gap-6">
                    <DifficultyRing 
                      value={s?.easy_solved ?? 0} 
                      total={s?.total_easy ?? 1} 
                      label="" 
                      color="hsl(150 70% 45%)" 
                    />
                    <DifficultyRing 
                      value={s?.medium_solved ?? 0} 
                      total={s?.total_medium ?? 1} 
                      label="" 
                      color="hsl(38 92% 55%)" 
                    />
                    <DifficultyRing 
                      value={s?.hard_solved ?? 0} 
                      total={s?.total_hard ?? 1} 
                      label="" 
                      color="hsl(0 84% 60%)" 
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
