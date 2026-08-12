import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ExternalLink, Flame, Trophy } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DifficultyBadge,
  DifficultyRing,
  Heatmap,
  MetricCard,
  StatTile,
} from "@/components/league/LeagueBits";
import {
  useActivityFeed,
  useContestHistory,
  useDailyActivity,
  useSnapshot,
  useTrackedHandles,
} from "@/hooks/league/useLeague";

export default function LeagueFriendDetail() {
  const { handle = "" } = useParams();
  const { data: snap } = useSnapshot(handle);
  const { data: activity = [] } = useDailyActivity(handle);
  const { data: history = [] } = useContestHistory(handle);
  const { data: solves = [] } = useActivityFeed([handle], 20);
  const { data: handles = [] } = useTrackedHandles();
  const self = handles.find((h) => h.is_self);
  const { data: mine } = useSnapshot(self?.handle);

  const ratingSeries = useMemo(
    () => history.map((h) => ({ date: h.start_time.slice(0, 10), rating: h.rating ?? 0 })),
    [history],
  );

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Link to="/league/friends" className="flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Friends
          </Link>
          <span>/</span>
          <span className="font-semibold text-foreground">{handle}</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={snap?.avatar_url ?? undefined} />
              <AvatarFallback>{handle.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{snap?.display_name ?? handle}</h1>
              <p className="text-sm text-muted-foreground">@{handle}</p>
            </div>
          </div>
          <a href={`https://leetcode.com/u/${handle}/`} target="_blank" rel="noreferrer">
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" /> View Profile
            </Button>
          </a>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Total Solved" value={snap?.total_solved ?? 0} icon={<CheckCircle2 className="h-5 w-5" />} accent="text-emerald-500" />
        <MetricCard label="Current Streak" value={`${snap?.current_streak ?? 0}d`} sub={`Best: ${snap?.longest_streak ?? 0}d`} icon={<Flame className="h-5 w-5" />} accent="text-amber-500" />
        <MetricCard label="Rating" value={snap?.contest_rating ?? "—"} sub="LeetCode" icon={<Trophy className="h-5 w-5" />} accent="text-sky-500" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="text-sm font-bold uppercase mb-4">Difficulty Breakdown</h3>
          <div className="flex justify-around">
            <DifficultyRing value={snap?.easy_solved ?? 0} total={snap?.total_easy ?? 1} label="EASY" color="hsl(150 70% 45%)" />
            <DifficultyRing value={snap?.medium_solved ?? 0} total={snap?.total_medium ?? 1} label="MEDIUM" color="hsl(38 92% 55%)" />
            <DifficultyRing value={snap?.hard_solved ?? 0} total={snap?.total_hard ?? 1} label="HARD" color="hsl(0 84% 60%)" />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-bold uppercase mb-4">Global Standing</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Global Rank" value={snap?.global_ranking ? `#${snap.global_ranking}` : "—"} />
            <StatTile label="Contest Rating" value={snap?.contest_rating ?? "—"} accent="text-sky-500" />
            <StatTile label="Acceptance Rate" value={`${snap?.acceptance_rate ?? 0}%`} />
            <StatTile label="Solved Count" value={snap?.total_solved ?? 0} accent="text-emerald-500" />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-bold uppercase mb-4">Solving Pace</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Today" value={snap?.solved_today ?? 0} accent="text-emerald-500" />
            <StatTile label="This Week" value={snap?.solved_this_week ?? 0} />
            <StatTile label="Avg / Active" value={snap?.avg_per_active_day ?? 0} />
            <StatTile label="Peak Day" value={snap?.peak_day ?? "—"} />
          </div>
        </Card>
      </div>

      {mine && (
        <Card className="p-5">
          <h3 className="text-sm font-bold uppercase mb-4">Compare with me</h3>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["Total Solved", mine.total_solved, snap?.total_solved ?? 0],
              ["Hard Solved", mine.hard_solved, snap?.hard_solved ?? 0],
              ["Rating", mine.contest_rating ?? 0, snap?.contest_rating ?? 0],
              ["Streak", mine.current_streak, snap?.current_streak ?? 0],
            ].map(([label, a, b]) => (
              <div key={label as string} className="rounded-lg border bg-muted/10 p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
                <div className="mt-1 flex items-center justify-center gap-2 text-sm">
                  <span className="font-bold text-primary">{a as number}</span>
                  <span className="text-muted-foreground">vs</span>
                  <span className="font-bold">{b as number}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <h3 className="text-sm font-bold mb-4">Contest Rating Progress</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ratingSeries}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="rating" dot={false} stroke="hsl(210 90% 60%)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-bold">Submission Activity Heatmap</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Current Streak" value={snap?.current_streak ?? 0} accent="text-emerald-500" />
          <StatTile label="Longest Streak" value={snap?.longest_streak ?? 0} accent="text-emerald-500" />
          <StatTile label="Active Days" value={snap?.active_days ?? 0} accent="text-emerald-500" />
        </div>
        <Heatmap data={activity} />
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-bold mb-4">Recent Solved Problems</h3>
        <div className="space-y-2">
          {solves.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border bg-muted/10 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{s.title}</div>
                <div className="text-xs text-muted-foreground">
                  {s.lang ?? "—"} · {new Date(s.solved_at).toLocaleDateString()}
                </div>
              </div>
              <DifficultyBadge difficulty={s.difficulty} />
            </div>
          ))}
          {solves.length === 0 && <p className="text-sm text-muted-foreground">No recent solves synced.</p>}
        </div>
      </Card>
    </div>
  );
}
