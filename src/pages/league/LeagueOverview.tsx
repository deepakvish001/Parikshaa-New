import { useMemo, useState } from "react";
import { CheckCircle2, Flame, Trophy, Plus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DifficultyBadge, DifficultyRing, MetricCard, StatTile, DailyChallengeCard } from "@/components/league/LeagueBits";
import { useClanStats, useMyClans } from "@/hooks/league/useClans";
import {
  useActivityFeed,
  useAddHandle,
  useContestHistory,
  useDailyActivity,
  useSnapshot,
  useTrackedHandles,
} from "@/hooks/league/useLeague";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 210 90% 60%))",
  "hsl(var(--chart-3, 150 70% 45%))",
  "hsl(var(--chart-4, 280 70% 65%))",
  "hsl(var(--chart-5, 30 90% 60%))",
];

function ConnectHandle() {
  const [value, setValue] = useState("");
  const add = useAddHandle();
  return (
    <Card className="p-8 text-center max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-bold">Connect your LeetCode handle</h2>
      <p className="text-sm text-muted-foreground">
        We sync your solves, streaks, contest rating and topic breakdown so your league stats stay live.
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="your_leetcode_handle"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button
          disabled={add.isPending || !value.trim()}
          onClick={() =>
            add.mutate(
              { handle: value, isSelf: true },
              {
                onSuccess: () => toast.success("Handle connected — syncing"),
                onError: (e: any) => toast.error(e?.message ?? "Could not add handle"),
              },
            )
          }
        >
          <Plus className="h-4 w-4 mr-1" /> Connect
        </Button>
      </div>
    </Card>
  );
}

export default function LeagueOverview() {
  const { data: handles = [], isLoading } = useTrackedHandles();
  const self = handles.find((h) => h.is_self) ?? handles[0];
  const { data: snap } = useSnapshot(self?.handle);
  const { data: activity = [] } = useDailyActivity(self?.handle);
  const { data: history = [] } = useContestHistory(self?.handle);
  const allHandles = useMemo(() => handles.map((h) => h.handle), [handles]);
  const { data: feed = [] } = useActivityFeed(allHandles, 20);
  const { data: myClans = [] } = useMyClans();
  const primaryClan = myClans[0]?.clan;
  const { data: clanStats } = useClanStats(primaryClan?.id);
  const { data: clanMembers = [] } = useClanMembers(primaryClan?.id);

  const solveSeries = useMemo(
    () =>
      activity.slice(-30).map((d) => ({
        day: d.day.slice(5),
        solves: d.submissions,
      })),
    [activity],
  );

  const ratingSeries = useMemo(
    () =>
      history.map((h) => ({
        date: h.start_time.slice(0, 10),
        rating: h.rating ?? 0,
      })),
    [history],
  );

  if (isLoading) return <div className="text-muted-foreground">Loading league…</div>;
  if (!self) return <ConnectHandle />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Total Solved"
          value={snap?.total_solved ?? 0}
          sub={`+${snap?.solved_this_week ?? 0} this week`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="text-emerald-500"
        />
        <MetricCard
          label="Current Streak"
          value={`${snap?.current_streak ?? 0}d`}
          sub={`Best: ${snap?.longest_streak ?? 0}d`}
          icon={<Flame className="h-5 w-5" />}
          accent="text-amber-500"
        />
        <MetricCard
          label="Rating"
          value={snap?.contest_rating ?? "—"}
          sub="LeetCode"
          icon={<Trophy className="h-5 w-5" />}
          accent="text-sky-500"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <DailyChallengeCard />
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold tracking-wide uppercase">Difficulty Breakdown</h3>
            <span className="text-xs text-muted-foreground">{snap?.total_solved ?? 0} Solved</span>
          </div>
          <div className="flex justify-around">
            <DifficultyRing value={snap?.easy_solved ?? 0} total={snap?.total_easy ?? 1} label="EASY" color="hsl(150 70% 45%)" />
            <DifficultyRing value={snap?.medium_solved ?? 0} total={snap?.total_medium ?? 1} label="MEDIUM" color="hsl(38 92% 55%)" />
            <DifficultyRing value={snap?.hard_solved ?? 0} total={snap?.total_hard ?? 1} label="HARD" color="hsl(0 84% 60%)" />
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold tracking-wide uppercase mb-4">Global Standing</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Global Rank" value={snap?.global_ranking ? `#${snap.global_ranking}` : "—"} accent="text-purple-400" />
            <StatTile label="Contest Rating" value={snap?.contest_rating ?? "—"} accent="text-sky-500" />
            <StatTile label="Acceptance" value={`${snap?.acceptance_rate ?? 0}%`} accent="text-emerald-500" />
            <StatTile label="Top Percentage" value={snap?.contest_top_percentage ? `${snap.contest_top_percentage}%` : "—"} accent="text-amber-500" />
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold tracking-wide uppercase mb-4">Solving Pace</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Today" value={snap?.solved_today ?? 0} accent="text-emerald-500" />
            <StatTile label="This Week" value={snap?.solved_this_week ?? 0} />
            <StatTile label="Avg / Active" value={snap?.avg_per_active_day ?? 0} />
            <StatTile label="Peak Day" value={snap?.peak_day ?? "—"} />
          </div>
        </Card>
      </div>

      {primaryClan && (
        <Card className="p-5 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={primaryClan.logo_url ?? undefined} />
                <AvatarFallback>{primaryClan.tag || primaryClan.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  {primaryClan.name}
                  <Badge variant="secondary" className="text-[10px] font-bold">[{primaryClan.tag}]</Badge>
                </h3>
                <p className="text-xs text-muted-foreground">{clanMembers.length} members</p>
              </div>
            </div>
            <Link to={`/league/clans/${primaryClan.id}`}>
              <Button size="sm" variant="ghost">View Clan Detail <ArrowRight className="h-3 w-3 ml-1.5" /></Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile label="Clan Solved" value={clanStats?.total_solved ?? "—"} accent="text-emerald-500" />
            <StatTile label="Avg Rating" value={clanStats?.avg_rating ?? "—"} accent="text-sky-500" />
            <StatTile label="Active Today" value={clanStats?.active_members ?? "—"} />
            <StatTile label="Clan Rank" value="N/A" />
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-sm font-bold mb-4">Daily / Weekly / Monthly Solves</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={solveSeries}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Area type="monotone" dataKey="solves" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

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

        <Card className="p-5">
          <h3 className="text-sm font-bold mb-4">Language Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(snap?.languages ?? []).slice(0, 6)}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={80}
                >
                  {(snap?.languages ?? []).slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold mb-4">Topic Distribution (Top 10)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={(snap?.topics ?? []).slice(0, 10)}>
                <PolarGrid className="stroke-muted/40" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Radar dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.4)" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-bold mb-4">Recent Solved Problems</h3>
        <div className="space-y-2">
          {feed.length === 0 && <p className="text-sm text-muted-foreground">Nothing synced yet.</p>}
          {feed.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-lg border bg-muted/10 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{f.title}</div>
                <div className="text-xs text-muted-foreground">
                  {f.handle} · {f.lang ?? "—"} · {new Date(f.solved_at).toLocaleDateString()}
                </div>
              </div>
              <DifficultyBadge difficulty={f.difficulty} />
              <a
                className="text-xs text-primary hover:underline"
                href={`https://leetcode.com/problems/${f.problem_slug}/`}
                target="_blank"
                rel="noreferrer"
              >
                Solve
              </a>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
