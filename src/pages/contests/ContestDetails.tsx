import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy, Calendar, Clock, Users, Sparkles, ArrowLeft, CheckCircle2,
  ExternalLink, RefreshCw, Medal,
} from "lucide-react";
import { toast } from "sonner";
import { useContestLeaderboard, useMyContestLeaderboardRow } from "@/hooks/useContestLeaderboard";
import { useContestClock } from "@/hooks/useContestClock";
import { Lock, Unlock, Loader2, X } from "lucide-react";


interface Contest {
  id: string; slug: string; title: string; description: string | null;
  starts_at: string; ends_at: string; status: string; penalty_minutes: number;
  is_weekly_rated: boolean;
}
interface ProblemRow {
  problem_slug: string; order_index: number; points: number;
  title?: string; difficulty?: string;
}

function fmtCountdown(ms: number) {
  if (ms <= 0) return "0m";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600),
    m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (d) return `${d}d ${h}h ${m}m`;
  if (h) return `${h}h ${m}m`;
  return `${m}m ${sec}s`;
}

export default function ContestDetails() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [contest, setContest] = useState<Contest | null>(null);
  const [problems, setProblems] = useState<ProblemRow[]>([]);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: c } = await (supabase as any)
        .from("contests")
        .select("id,slug,title,description,starts_at,ends_at,status,penalty_minutes,is_weekly_rated")
        .eq("slug", slug).maybeSingle();
      if (!c) { setLoading(false); return; }
      setContest(c as Contest);

      const { data: probs } = await (supabase as any)
        .from("contest_problems")
        .select("problem_slug,order_index,points")
        .eq("contest_id", (c as any).id)
        .order("order_index", { ascending: true });
      const rows = (probs as ProblemRow[]) ?? [];
      if (rows.length) {
        const { data: meta } = await (supabase as any)
          .from("coding_problems")
          .select("slug,title,difficulty")
          .in("slug", rows.map((r) => r.problem_slug));
        const map = new Map((meta ?? []).map((m: any) => [m.slug, m]));
        setProblems(rows.map((r) => ({ ...r, ...((map.get(r.problem_slug) as any) ?? {}) })));
      } else setProblems([]);

      if (user) {
        const { data: reg } = await supabase
          .from("contest_registrations")
          .select("id,status")
          .eq("contest_id", (c as any).id)
          .eq("user_id", user.id).maybeSingle();
        setRegistered(!!reg && (reg as any).status === "registered");
      }
      setLoading(false);
    })();
  }, [slug, user?.id]);

  const contestId = contest?.id;
  const clock = useContestClock(contest?.starts_at, contest?.ends_at);

  const { data: lbPage, isLoading: lbLoading, refetch, isFetching, dataUpdatedAt } =
    useContestLeaderboard(contestId, page, pageSize);
  const { data: myRow } = useMyContestLeaderboardRow(contestId, user?.id);

  const now = Date.now();
  const kind = useMemo<"upcoming" | "live" | "past" | null>(() => {
    if (!contest) return null;
    const s = new Date(contest.starts_at).getTime();
    const e = new Date(contest.ends_at).getTime();
    if (now < s) return "upcoming";
    if (now < e) return "live";
    return "past";
  }, [contest, tick]);

  const [pending, setPending] = useState(false);

  const register = async () => {
    if (!user) return toast.error("Sign in to register");
    if (!contest) return;
    setPending(true);
    const { error } = await supabase.from("contest_registrations").upsert(
      {
        contest_id: contest.id,
        user_id: user.id,
        status: "registered",
        honor_code_accepted_at: new Date().toISOString(),
      },
      { onConflict: "contest_id,user_id" },
    );
    setPending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRegistered(true);
    toast.success("Registered!");
  };

  const unregister = async () => {
    if (!user || !contest) return;
    setPending(true);
    const { error } = await supabase
      .from("contest_registrations")
      .update({ status: "withdrawn" })
      .eq("contest_id", contest.id)
      .eq("user_id", user.id);
    setPending(false);
    if (error) return toast.error(error.message);
    setRegistered(false);
    toast.success("Registration cancelled");
  };


  if (loading) {
    return <div className="mx-auto max-w-7xl p-6 space-y-3">
      <Skeleton className="h-8 w-64" /><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" />
    </div>;
  }
  if (!contest) {
    return <div className="mx-auto max-w-7xl p-6 text-center">
      <p className="text-muted-foreground">Contest not found.</p>
      <Link to="/contests"><Button variant="outline" className="mt-4"><ArrowLeft className="mr-1 h-4 w-4" />Back to Weekly</Button></Link>
    </div>;
  }

  const starts = new Date(contest.starts_at);
  const ends = new Date(contest.ends_at);
  const cdMs = kind === "upcoming" ? starts.getTime() - now : ends.getTime() - now;
  const rows = lbPage?.rows ?? [];
  const totalPages = Math.max(1, Math.ceil((lbPage?.total ?? 0) / pageSize));



  const totalMs = new Date(contest.ends_at).getTime() - new Date(contest.starts_at).getTime();
  const elapsed = Math.max(0, Math.min(totalMs, now - new Date(contest.starts_at).getTime()));
  const progressPct = kind === "live" ? Math.round((elapsed / totalMs) * 100) : kind === "past" ? 100 : 0;
  const cdSec = Math.max(0, Math.floor(cdMs / 1000));
  const cdDays = Math.floor(cdSec / 86400);
  const cdHours = Math.floor((cdSec % 86400) / 3600);
  const cdMins = Math.floor((cdSec % 3600) / 60);
  const cdSecs = cdSec % 60;
  const heroAccent = kind === "live" ? "emerald" : kind === "past" ? "muted" : "amber";

  return (
    <div className="min-h-screen bg-transparent">
      <Helmet>
        <title>{contest.title} · Parikshaa Contests</title>
        <meta name="description" content={contest.description ?? "Weekly rated contest."} />
      </Helmet>

      {/* HERO BAND */}
      <section className="relative overflow-hidden border-b border-amber-400/15">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className={`absolute -top-24 -left-20 h-80 w-80 rounded-full blur-3xl ${heroAccent === "emerald" ? "bg-emerald-500/20" : heroAccent === "muted" ? "bg-muted/20" : "bg-amber-500/20"}`} />
          <div className={`absolute -top-10 right-0 h-80 w-80 rounded-full blur-3xl ${heroAccent === "emerald" ? "bg-emerald-500/10" : "bg-orange-500/15"}`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,transparent_45%,hsl(var(--background))_88%)]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pt-6 pb-8 md:px-6 md:pt-8 md:pb-10">
          <Link to="/contests" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-amber-300">
            <ArrowLeft className="h-3.5 w-3.5" /> All weekly contests
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                {contest.is_weekly_rated && (
                  <Badge variant="outline" className="border-amber-400/40 bg-amber-500/10 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                    Rated · Weekly
                  </Badge>
                )}
                {kind === "live" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
                    Live now
                  </span>
                )}
                {kind === "past" && <Badge variant="outline" className="text-[10px] uppercase tracking-wider">Finished</Badge>}
                {kind === "upcoming" && <Badge variant="outline" className="border-amber-400/40 text-[10px] uppercase tracking-wider text-amber-200">Upcoming</Badge>}
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                <span className="bg-gradient-to-br from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                  {contest.title}
                </span>
              </h1>
              {contest.description && (
                <p className="mt-2 text-sm text-muted-foreground md:text-base">{contest.description}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-amber-400" />{starts.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-amber-400" />{Math.round((ends.getTime() - starts.getTime()) / 60000)}m</span>
                <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-amber-400" />{lbPage?.total ?? 0} participants</span>
              </div>
            </div>

            {/* Countdown block */}
            <div className="min-w-[260px]">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {kind === "live" ? "Ends in" : kind === "upcoming" ? "Starts in" : "Contest ended"}
              </div>
              {kind !== "past" ? (
                <div className="mt-1 flex items-baseline gap-1 tabular-nums">
                  {cdDays > 0 && (
                    <>
                      <CountBox n={cdDays} label="d" accent={heroAccent} />
                      <span className="text-2xl text-amber-400/50">:</span>
                    </>
                  )}
                  <CountBox n={cdHours} label="h" accent={heroAccent} />
                  <span className="text-2xl text-amber-400/50">:</span>
                  <CountBox n={cdMins} label="m" accent={heroAccent} />
                  <span className="text-2xl text-amber-400/50">:</span>
                  <CountBox n={cdSecs} label="s" accent={heroAccent} />
                </div>
              ) : (
                <div className="mt-1 text-xl font-semibold text-muted-foreground">
                  {ends.toLocaleDateString(undefined, { dateStyle: "medium" })}
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                {kind === "upcoming" && (registered
                  ? <Badge className="bg-emerald-500/15 text-emerald-300" data-testid="registered-badge"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Registered</Badge>
                  : <Button size="sm" disabled={pending} onClick={register} className="bg-amber-500 text-black hover:bg-amber-400">{pending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />}Register</Button>)}
                {kind === "live" && !registered && <Button size="sm" disabled={pending} onClick={register} className="bg-emerald-500 text-black hover:bg-emerald-400">{pending && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}Join now</Button>}
                {kind === "live" && registered && <Badge className="bg-emerald-500/15 text-emerald-300"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />You're in</Badge>}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {kind !== "upcoming" && (
            <div className="mt-6">
              <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Contest progress</span>
                <span className="tabular-nums">{progressPct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted/40">
                <div
                  className={`h-full rounded-full transition-all ${kind === "live" ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-amber-500 to-orange-500"}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">


        {/* Live countdown banner */}
        <Card className="mb-6 border-amber-400/20 bg-card/60 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Starts</div>
              <div className="text-sm font-medium">{starts.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</div>
              {clock.phase === "upcoming" && (
                <div className="mt-0.5 text-xs text-amber-300 tabular-nums">in {clock.label.replace(/^Starts in /, "")}</div>
              )}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Ends</div>
              <div className="text-sm font-medium">{ends.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</div>
              {clock.phase === "live" && (
                <div className="mt-0.5 text-xs text-emerald-300 tabular-nums">in {clock.label.replace(/^Ends in /, "")}</div>
              )}
              {clock.phase === "ended" && <div className="mt-0.5 text-xs text-muted-foreground">Finished</div>}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Problem lock</div>
              {clock.phase === "upcoming" ? (
                <div className="mt-0.5 inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-300">
                  <Lock className="h-3.5 w-3.5" /> Locked · unlocks in {clock.label.replace(/^Starts in /, "")}
                </div>
              ) : (
                <div className="mt-0.5 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-300">
                  <Unlock className="h-3.5 w-3.5" /> Unlocked
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* My registration status */}
        <Card className="mb-6 border-amber-400/20 bg-card/60 p-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4 text-amber-400" /> Your registration
          </h2>
          {!user ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">Sign in to register and submit solutions.</p>
              <Link to="/login"><Button size="sm" variant="outline">Sign in</Button></Link>
            </div>
          ) : registered ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/15 text-emerald-300">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Registered
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {kind === "upcoming" && "Submissions unlock when the contest starts."}
                  {kind === "live" && "Submissions are open — go solve!"}
                  {kind === "past" && "Contest ended. Submissions closed."}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={
                  kind === "live" ? "border-emerald-400/40 text-emerald-300"
                    : kind === "past" ? "text-muted-foreground"
                    : "border-amber-400/40 text-amber-300"
                }>
                  {kind === "live" ? "Submissions open" : kind === "past" ? "Submissions closed" : "Submissions locked"}
                </Badge>
                {kind === "upcoming" && (
                  <Button size="sm" variant="outline" disabled={pending} onClick={unregister} className="border-rose-400/40 text-rose-300 hover:bg-rose-500/10">
                    {pending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <X className="mr-1 h-3.5 w-3.5" />}
                    Unregister
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {kind === "past"
                  ? "You didn't register for this contest."
                  : "You are not registered yet. Register to unlock submissions when the contest starts."}
              </p>
              {kind !== "past" && (
                <Button size="sm" disabled={pending} onClick={register} className="bg-amber-500 text-black hover:bg-amber-400">
                  {pending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />} Register
                </Button>
              )}
            </div>
          )}
        </Card>
        <GlobalRatingsPreview />


        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          {/* Problems */}
          <Card className="border-amber-400/20 bg-card/60 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Medal className="h-4 w-4 text-amber-400" /> Problems{(kind === "past" || (kind === "live" && registered)) && ` (${problems.length})`}</h2>
            {kind === "upcoming" ? (
              <p className="text-sm text-muted-foreground">Problems unlock when the contest starts.</p>
            ) : kind === "live" && !registered ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Register for this contest to view and solve the problems.</p>
                {user && (
                  <Button size="sm" disabled={pending} onClick={register} className="bg-amber-500 text-black hover:bg-amber-400">
                    {pending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />} Register
                  </Button>
                )}
              </div>
            ) : problems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No problems yet.</p>
            ) : (
              <ol className="space-y-2">
                {problems.map((p, i) => {
                  const label = String.fromCharCode(65 + i);
                  const inner = (
                    <div className="flex items-center justify-between gap-3 rounded-md border border-border/40 p-3 hover:border-amber-400/40">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/15 text-xs font-bold text-amber-300">{label}</span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{p.title ?? p.problem_slug}</div>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                            {p.difficulty && <Badge variant="outline" className="text-[9px]">{p.difficulty}</Badge>}
                            <span>{p.points} pts</span>
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  );
                  return (
                    <li key={p.problem_slug}>
                      <Link to={`/library/problems/${p.problem_slug}`}>{inner}</Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          {/* Leaderboard */}
          <Card className="border-amber-400/20 bg-card/60 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold"><Trophy className="h-4 w-4 text-amber-400" /> Live standings</h2>
              <div className="flex items-center gap-2">
                {dataUpdatedAt > 0 && (
                  <span className="text-[10px] text-muted-foreground tabular-nums" title={new Date(dataUpdatedAt).toLocaleString()}>
                    Updated {new Date(dataUpdatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                )}
                <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching} className="h-7 gap-1 text-xs">
                  <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                  Refresh standings
                </Button>
              </div>
            </div>

            {myRow && (
              <div className="mb-3 rounded-md border border-amber-400/40 bg-amber-500/10 p-2.5 text-xs">
                <span className="font-semibold text-amber-200">Your rank: #{myRow.rank}</span>
                <span className="ml-2 text-muted-foreground">
                  {myRow.problems_solved} solved · {myRow.total_points} pts · penalty {Math.round(myRow.total_penalty_seconds / 60)}m
                </span>
              </div>
            )}
            {lbLoading ? (
              <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
            ) : rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No submissions yet.</p>
            ) : (
              <>
                <div className="overflow-hidden rounded-md border border-border/40">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/30 text-muted-foreground">
                      <tr>
                        <th className="px-2 py-1.5 text-left">#</th>
                        <th className="px-2 py-1.5 text-left">User</th>
                        <th className="px-2 py-1.5 text-right">Solved</th>
                        <th className="px-2 py-1.5 text-right">Points</th>
                        <th className="px-2 py-1.5 text-right">Penalty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const mine = r.user_id === user?.id;
                        return (
                          <tr key={r.user_id} className={`border-t border-border/30 ${mine ? "bg-amber-500/10" : ""}`}>
                            <td className="px-2 py-1.5 font-semibold tabular-nums">
                              {r.rank <= 3 ? <span className={r.rank === 1 ? "text-amber-300" : r.rank === 2 ? "text-slate-300" : "text-orange-400"}>#{r.rank}</span> : `#${r.rank}`}
                            </td>
                            <td className="px-2 py-1.5">
                              <Link to={`/u/${r.user_id}`} className="hover:text-amber-300">{r.display_name ?? "Anonymous"}</Link>
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{r.problems_solved}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{r.total_points}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{Math.round(r.total_penalty_seconds / 60)}m</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                    <span className="text-muted-foreground">Page {page} / {totalPages}</span>
                    <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                )}
                <p className="mt-2 text-[10px] text-muted-foreground">Standings refresh live via realtime as submissions finalize.</p>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function CountBox({ n, label, accent }: { n: number; label: string; accent: "emerald" | "amber" | "muted" }) {
  const color =
    accent === "emerald" ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
    : accent === "muted" ? "text-muted-foreground border-border/40 bg-card/60"
    : "text-amber-200 border-amber-400/30 bg-amber-500/10";
  return (
    <div className="flex flex-col items-center">
      <div className={`min-w-[44px] rounded-md border px-2 py-1 text-center text-2xl font-bold tabular-nums md:text-3xl ${color}`}>
        {String(n).padStart(2, "0")}
      </div>
      <span className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

const TIERS_MINI = [
  { min: 0,    label: "Newbie",           color: "text-muted-foreground" },
  { min: 1200, label: "Pupil",            color: "text-emerald-400" },
  { min: 1400, label: "Specialist",       color: "text-cyan-400" },
  { min: 1600, label: "Expert",           color: "text-sky-400" },
  { min: 1900, label: "Candidate Master", color: "text-fuchsia-400" },
  { min: 2100, label: "Master",           color: "text-orange-400" },
  { min: 2400, label: "Grandmaster",      color: "text-rose-400" },
];
function tierMini(r: number) {
  let cur = TIERS_MINI[0];
  for (const t of TIERS_MINI) if (r >= t.min) cur = t;
  return cur;
}

function GlobalRatingsPreview() {
  const [rows, setRows] = useState<Array<{ user_id: string; rating: number; name: string | null; username: string | null; avatar: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: hist } = await supabase
        .from("contest_rating_history" as any)
        .select("user_id,new_rating,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      const seen = new Map<string, number>();
      for (const h of ((hist as any) ?? []) as Array<{ user_id: string; new_rating: number }>) {
        if (!seen.has(h.user_id)) seen.set(h.user_id, h.new_rating);
      }
      const top = Array.from(seen.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const ids = top.map(([id]) => id);
      let profs: any[] = [];
      if (ids.length) {
        const { data } = await supabase
          .from("user_profiles_extended" as any)
          .select("user_id,username,full_name,avatar_url")
          .in("user_id", ids);
        profs = (data as any) ?? [];
      }
      const pmap = new Map(profs.map((p) => [p.user_id, p]));
      setRows(top.map(([user_id, rating]) => {
        const p = pmap.get(user_id) as any;
        return { user_id, rating, name: p?.full_name ?? null, username: p?.username ?? null, avatar: p?.avatar_url ?? null };
      }));
      setLoading(false);
    })();
  }, []);

  return (
    <Card className="mb-6 border-amber-400/20 bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Trophy className="h-4 w-4 text-amber-400" /> Global rating leaders
        </h2>
        <Link to="/contests/ratings">
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs border-amber-400/40 text-amber-200 hover:bg-amber-500/10">
            View all <ArrowLeft className="h-3 w-3 rotate-180" />
          </Button>
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">No rating data yet.</p>
      ) : (
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {rows.map((r, i) => {
            const t = tierMini(r.rating);
            return (
              <li key={r.user_id}>
                <Link
                  to={r.username ? `/u/${r.username}` : `/u/${r.user_id}`}
                  className="flex items-center gap-2 rounded-md border border-border/40 bg-background/40 p-2 transition-colors hover:border-amber-400/40 hover:bg-amber-500/[0.04]"
                >
                  <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${i === 0 ? "bg-amber-500/20 text-amber-300" : i === 1 ? "bg-slate-400/20 text-slate-200" : i === 2 ? "bg-orange-500/20 text-orange-300" : "bg-muted/40 text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium">{r.name ?? r.username ?? "Anonymous"}</div>
                    <div className={`text-[10px] font-semibold tabular-nums ${t.color}`}>{r.rating}</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}


