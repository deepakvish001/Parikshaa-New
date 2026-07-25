import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, TrendingUp, TrendingDown, Search, ArrowLeft, Crown, Medal, Award, Swords } from "lucide-react";

const TIERS = [
  { min: 0,    label: "Newbie",           color: "text-muted-foreground", ring: "ring-muted/40",       chip: "bg-muted/40 text-muted-foreground" },
  { min: 1200, label: "Pupil",            color: "text-emerald-400",       ring: "ring-emerald-500/40", chip: "bg-emerald-500/15 text-emerald-300" },
  { min: 1400, label: "Specialist",       color: "text-cyan-400",          ring: "ring-cyan-500/40",    chip: "bg-cyan-500/15 text-cyan-300" },
  { min: 1600, label: "Expert",           color: "text-sky-400",           ring: "ring-sky-500/40",     chip: "bg-sky-500/15 text-sky-300" },
  { min: 1900, label: "Candidate Master", color: "text-fuchsia-400",       ring: "ring-fuchsia-500/40", chip: "bg-fuchsia-500/15 text-fuchsia-300" },
  { min: 2100, label: "Master",           color: "text-orange-400",        ring: "ring-orange-500/40",  chip: "bg-orange-500/15 text-orange-300" },
  { min: 2400, label: "Grandmaster",      color: "text-rose-400",          ring: "ring-rose-500/40",    chip: "bg-rose-500/15 text-rose-300" },
];
function tierOf(r: number) {
  let cur = TIERS[0];
  for (const t of TIERS) if (r >= t.min) cur = t;
  return cur;
}

type Row = {
  user_id: string;
  rating: number;
  delta: number;
  contests: number;
  best_rank: number;
  updated_at: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export default function ContestRatings() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Pull recent rating events; group latest per user in JS.
      const { data: hist } = await supabase
        .from("contest_rating_history" as any)
        .select("user_id,new_rating,delta,rank,created_at")
        .order("created_at", { ascending: false })
        .limit(2000);

      const byUser = new Map<string, Row>();
      for (const h of ((hist as any) ?? []) as Array<{
        user_id: string; new_rating: number; delta: number; rank: number; created_at: string;
      }>) {
        const cur = byUser.get(h.user_id);
        if (!cur) {
          byUser.set(h.user_id, {
            user_id: h.user_id,
            rating: h.new_rating,
            delta: h.delta,
            contests: 1,
            best_rank: h.rank,
            updated_at: h.created_at,
            username: null, full_name: null, avatar_url: null,
          });
        } else {
          cur.contests += 1;
          cur.best_rank = Math.min(cur.best_rank, h.rank);
        }
      }

      const ids = Array.from(byUser.keys());
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from("user_profiles_extended" as any)
          .select("user_id,username,full_name,avatar_url")
          .in("user_id", ids);
        for (const p of ((profs as any) ?? []) as any[]) {
          const r = byUser.get(p.user_id);
          if (r) { r.username = p.username; r.full_name = p.full_name; r.avatar_url = p.avatar_url; }
        }
      }

      const list = Array.from(byUser.values()).sort((a, b) => b.rating - a.rating);
      setRows(list);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      (r.username ?? "").toLowerCase().includes(term) ||
      (r.full_name ?? "").toLowerCase().includes(term),
    );
  }, [rows, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const podium = filtered.slice(0, 3);
  const myRow = user ? filtered.find((r) => r.user_id === user.id) : null;
  const myRank = myRow ? filtered.indexOf(myRow) + 1 : null;

  return (
    <div className="min-h-svh">
      <Helmet>
        <title>Global Ratings · Contests · Parikshaa</title>
        <meta name="description" content="Global contest ratings leaderboard on Parikshaa — see top-rated coders across all weekly rated contests." />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-amber-400/15 bg-gradient-to-b from-amber-500/[0.06] via-transparent to-transparent">
        <div className="absolute -top-24 left-1/2 h-64 w-[70%] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <Link to="/contests" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-amber-300">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to contests
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge variant="outline" className="mb-3 border-amber-400/40 text-[10px] uppercase tracking-widest text-amber-300">
                <Swords className="mr-1 h-3 w-3" /> Global Ratings
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">Leaderboard</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Ranked by latest weekly-contest rating. Climb the ladder — Newbie to Grandmaster.
              </p>
            </div>
            {myRow && myRank && (
              <Card className="border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs">
                <div className="text-[10px] uppercase tracking-wide text-amber-200/80">Your rank</div>
                <div className="mt-0.5 flex items-center gap-3">
                  <span className="text-2xl font-bold tabular-nums text-amber-200">#{myRank}</span>
                  <div>
                    <div className="text-sm font-semibold">{myRow.rating}</div>
                    <div className={`text-[10px] ${tierOf(myRow.rating).color}`}>{tierOf(myRow.rating).label}</div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {/* Podium */}
        {!loading && podium.length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {[podium[1], podium[0], podium[2]].filter(Boolean).map((r, i) => {
              const rank = r === podium[0] ? 1 : r === podium[1] ? 2 : 3;
              const tier = tierOf(r.rating);
              const Icon = rank === 1 ? Crown : rank === 2 ? Medal : Award;
              const accent =
                rank === 1 ? "border-amber-400/60 bg-gradient-to-b from-amber-500/15 to-transparent"
                : rank === 2 ? "border-slate-300/40 bg-gradient-to-b from-slate-400/10 to-transparent"
                : "border-orange-400/40 bg-gradient-to-b from-orange-500/10 to-transparent";
              return (
                <Card key={r.user_id} className={`relative overflow-hidden p-5 text-center ${accent} ${rank === 1 ? "sm:-translate-y-2" : ""}`}>
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/60">
                    <Icon className={`h-4 w-4 ${rank === 1 ? "text-amber-300" : rank === 2 ? "text-slate-300" : "text-orange-400"}`} />
                  </div>
                  <Avatar className={`mx-auto h-16 w-16 ring-2 ${tier.ring}`}>
                    <AvatarImage src={r.avatar_url ?? undefined} />
                    <AvatarFallback>{(r.full_name ?? r.username ?? "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="mt-3 truncate text-sm font-semibold">{r.full_name ?? r.username ?? "Anonymous"}</div>
                  {r.username && <div className="truncate text-[11px] text-muted-foreground">@{r.username}</div>}
                  <div className={`mt-2 text-2xl font-bold tabular-nums ${tier.color}`}>{r.rating}</div>
                  <Badge className={`mt-1 border-transparent text-[10px] ${tier.chip}`}>{tier.label}</Badge>
                  <div className="mt-2 text-[10px] text-muted-foreground">{r.contests} contests</div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search by name or username…"
              className="pl-9"
            />
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {loading ? "…" : `${filtered.length.toLocaleString()} coders`}
          </div>
        </div>

        {/* Table */}
        <Card className="overflow-hidden border-amber-400/20 bg-card/60">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : paged.length === 0 ? (
            <div className="p-10 text-center">
              <Trophy className="mx-auto mb-2 h-6 w-6 text-amber-400/60" />
              <p className="text-sm text-muted-foreground">No coders match your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">Coder</th>
                    <th className="px-4 py-3 text-left">Tier</th>
                    <th className="px-4 py-3 text-right">Rating</th>
                    <th className="px-4 py-3 text-right">Δ Last</th>
                    <th className="px-4 py-3 text-right">Contests</th>
                    <th className="px-4 py-3 text-right">Best</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r, i) => {
                    const rank = (page - 1) * pageSize + i + 1;
                    const tier = tierOf(r.rating);
                    const mine = user && r.user_id === user.id;
                    const profileHref = r.username ? `/u/${r.username}` : `/u/${r.user_id}`;
                    return (
                      <tr key={r.user_id} className={`border-t border-border/30 transition-colors hover:bg-amber-500/[0.04] ${mine ? "bg-amber-500/10" : ""}`}>
                        <td className="px-4 py-3 font-semibold tabular-nums">
                          {rank <= 3 ? (
                            <span className={rank === 1 ? "text-amber-300" : rank === 2 ? "text-slate-300" : "text-orange-400"}>#{rank}</span>
                          ) : `#${rank}`}
                        </td>
                        <td className="px-4 py-3">
                          <Link to={profileHref} className="flex items-center gap-3 hover:text-amber-300">
                            <Avatar className={`h-8 w-8 ring-1 ${tier.ring}`}>
                              <AvatarImage src={r.avatar_url ?? undefined} />
                              <AvatarFallback className="text-[10px]">{(r.full_name ?? r.username ?? "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">{r.full_name ?? r.username ?? "Anonymous"}</div>
                              {r.username && <div className="truncate text-[11px] text-muted-foreground">@{r.username}</div>}
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`border-transparent text-[10px] ${tier.chip}`}>{tier.label}</Badge>
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold tabular-nums ${tier.color}`}>{r.rating}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className={`inline-flex items-center gap-0.5 ${r.delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {r.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {r.delta >= 0 ? "+" : ""}{r.delta}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{r.contests}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">#{r.best_rank}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-xs">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <span className="text-muted-foreground">Page {page} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}
