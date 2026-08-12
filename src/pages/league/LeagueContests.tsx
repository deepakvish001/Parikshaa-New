import { useMemo, useState } from "react";
import { CalendarDays, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useExternalContests } from "@/hooks/league/useLeague";

const PLATFORMS = ["All", "AtCoder", "LeetCode", "Codeforces", "CodeChef", "HackerRank"];

function countdown(start: string) {
  const diff = new Date(start).getTime() - Date.now();
  if (diff <= 0) return "Live";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `In ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `In ${hours}h ${mins % 60}m`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "In 1 day" : `In ${days} days`;
}

function duration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h ? `${h}h` : ""}${m ? ` ${m}m` : ""}`.trim() || "—";
}

export default function LeagueContests() {
  const { data: contests = [], refetch } = useExternalContests();
  const [platform, setPlatform] = useState("All");
  const [search, setSearch] = useState("");

  const sync = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("external-contests-sync", { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await refetch();
      toast.success("Contest calendar refreshed");
    },
    onError: (e: any) => toast.error(e?.message ?? "Refresh failed"),
  });

  const shown = useMemo(
    () =>
      contests.filter(
        (c) =>
          (platform === "All" || c.platform === platform) &&
          (c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.platform.toLowerCase().includes(search.toLowerCase())),
      ),
    [contests, platform, search],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-full border bg-card/60 p-1">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium",
                platform === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            className="w-56"
            placeholder="Search contests or platforms…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
            <RefreshCw className={cn("h-4 w-4", sync.isPending && "animate-spin")} />
          </Button>
        </div>
      </div>

      {shown.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          No upcoming contests loaded. Hit refresh to fetch the latest calendar.
        </Card>
      )}

      <div className="space-y-3">
        {shown.map((c) => (
          <Card key={c.id} className="p-5 space-y-4 group hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider rounded-md px-2 py-1",
                  c.platform === "LeetCode" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                  c.platform === "Codeforces" ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" :
                  c.platform === "AtCoder" ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" :
                  "bg-muted text-muted-foreground"
                )}>
                  {c.platform}
                </span>
                {new Date(c.start_time).getTime() - Date.now() < 24 * 3600000 && (
                  <span className="flex items-center gap-1 text-[10px] font-black tracking-widest text-emerald-500 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    SOON
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {countdown(c.start_time)}
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-bold group-hover:text-primary transition-colors leading-tight">{c.title}</h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    {new Date(c.start_time).toLocaleString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{duration(c.duration_seconds)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              {c.url && (
                <a href={c.url} target="_blank" rel="noreferrer" className="block">
                  <Button size="sm" variant="outline" className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground transition-all">
                    Register Now
                    <ExternalLink className="h-3.5 w-3.5 opacity-50 group-hover/btn:opacity-100" />
                  </Button>
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
