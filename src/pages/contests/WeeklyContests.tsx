import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy, Calendar, Clock, Users, TrendingUp, Swords, Sparkles,
  ChevronRight, Flame, Timer, Radio, Loader2, X,
} from "lucide-react";
import { toast } from "sonner";

interface Contest {
  id: string; slug: string; title: string; description: string | null;
  starts_at: string; ends_at: string; status: string;
}
interface RatingRow {
  contest_id: string; new_rating: number; delta: number; rank: number;
  participants: number; created_at: string;
}

const TIERS = [
  { min: 0,    label: "Newbie",           color: "text-muted-foreground", ring: "ring-muted" },
  { min: 1200, label: "Pupil",            color: "text-emerald-400",       ring: "ring-emerald-500/40" },
  { min: 1400, label: "Specialist",       color: "text-cyan-400",          ring: "ring-cyan-500/40" },
  { min: 1600, label: "Expert",           color: "text-sky-400",           ring: "ring-sky-500/40" },
  { min: 1900, label: "Candidate Master", color: "text-fuchsia-400",       ring: "ring-fuchsia-500/40" },
  { min: 2100, label: "Master",           color: "text-orange-400",        ring: "ring-orange-500/40" },
  { min: 2400, label: "Grandmaster",      color: "text-rose-400",          ring: "ring-rose-500/40" },
];
function tierOf(r: number) {
  let cur = TIERS[0];
  for (const t of TIERS) if (r >= t.min) cur = t;
  const idx = TIERS.indexOf(cur);
  const next = TIERS[idx + 1];
  return { ...cur, next };
}

function fmtCountdown(ms: number) {
  if (ms <= 0) return "Live";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function WeeklyContests() {
  const { user } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState<number>(1200);
  const [myHistory, setMyHistory] = useState<RatingRow[]>([]);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: cs } = await (supabase as any)
        .from("contests")
        .select("id,slug,title,description,starts_at,ends_at,status")
        .or("is_weekly_rated.eq.true,kind.in.(monthly_long,weekly_saturday,weekly_sunday,biweekly)")
        .order("starts_at", { ascending: false })
        .limit(30);
      setContests((cs as any) ?? []);
      if (user) {
        const { data: h } = await supabase
          .from("contest_rating_history" as any)
          .select("contest_id,new_rating,delta,rank,participants,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        const rows = ((h as any) ?? []) as RatingRow[];
        setMyHistory(rows);
        setMyRating(rows[0]?.new_rating ?? 1200);

        const { data: regs } = await supabase
          .from("contest_registrations")
          .select("contest_id,status")
          .eq("user_id", user.id)
          .eq("status", "registered");
        setRegisteredIds(new Set(((regs as any) ?? []).map((r: any) => r.contest_id)));
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const now = Date.now();
  const upcoming = useMemo(() => contests.filter((c) => new Date(c.starts_at).getTime() > now), [contests, tick]);
  const live = useMemo(() => contests.filter((c) => new Date(c.starts_at).getTime() <= now && new Date(c.ends_at).getTime() > now), [contests, tick]);
  const past = useMemo(() => contests.filter((c) => new Date(c.ends_at).getTime() <= now), [contests, tick]);

  const [pendingId, setPendingId] = useState<string | null>(null);

  const register = async (contestId: string) => {
    if (!user) return toast.error("Sign in to register");
    setPendingId(contestId);
    const { error } = await supabase.from("contest_registrations").upsert(
      {
        contest_id: contestId, user_id: user.id, status: "registered",
        honor_code_accepted_at: new Date().toISOString(),
      },
      { onConflict: "contest_id,user_id" },
    );
    setPendingId(null);
    if (error) return toast.error(error.message);
    setRegisteredIds((prev) => new Set(prev).add(contestId));
    toast.success("Registered! See you on contest day.");
  };

  const unregister = async (contestId: string) => {
    if (!user) return;
    setPendingId(contestId);
    const { error } = await supabase
      .from("contest_registrations")
      .update({ status: "withdrawn" })
      .eq("contest_id", contestId)
      .eq("user_id", user.id);
    setPendingId(null);
    if (error) return toast.error(error.message);
    setRegisteredIds((prev) => {
      const next = new Set(prev);
      next.delete(contestId);
      return next;
    });
    toast.success("Registration cancelled");
  };

  const tier = tierOf(myRating);
  const nextDelta = tier.next ? tier.next.min - myRating : 0;
  const progress = tier.next
    ? Math.max(0, Math.min(100, ((myRating - tier.min) / (tier.next.min - tier.min)) * 100))
    : 100;
  const chronological = [...myHistory].reverse();
  const maxR = Math.max(1200, ...chronological.map((r) => r.new_rating));
  const minR = Math.min(1200, ...chronological.map((r) => r.new_rating));

  return (
    <div className="min-h-screen bg-transparent">
      <Helmet>
        <title>Weekly Rated Contests · Codeforces-style Rankings | Parikshaa</title>
        <meta name="description" content="Compete every week in rated coding contests. Earn a global rating with Codeforces-style Elo, climb tiers from Newbie to Grandmaster." />
      </Helmet>

      {/* HERO BAND */}
      <section className="relative overflow-hidden border-b border-amber-400/15">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute -top-10 right-0 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,transparent_45%,hsl(var(--background))_85%)]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-8 md:px-6 md:pt-14 md:pb-12">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                <Radio className="h-3 w-3" /> Weekly · Rated
              </div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight md:text-5xl">
                <Swords className="h-8 w-8 text-amber-400 md:h-10 md:w-10" />
                <span className="bg-gradient-to-br from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                  Weekly Rated Contests
                </span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Every Sunday · 2 hours · 4 problems · Elo-style global rating.
                Climb from Newbie to Grandmaster, one round at a time.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-amber-400/25 bg-card/60 px-3 py-2 backdrop-blur">
                <Flame className="h-4 w-4 text-amber-400" />
                <div className="text-xs">
                  <div className="font-semibold">{contests.length} total rounds</div>
                  <div className="text-muted-foreground">{live.length} live · {upcoming.length} upcoming</div>
                </div>
              </div>
            </div>
          </div>

          {/* Rating hero */}
          {user && (
            <Card className="mt-8 border-amber-400/30 bg-gradient-to-br from-amber-500/[0.10] via-card/70 to-orange-500/[0.05] p-5 backdrop-blur">
              <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Your rating</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className={`text-5xl font-bold tabular-nums ${tier.color}`}>{myRating}</span>
                    <span className={`text-sm font-semibold ${tier.color}`}>{tier.label}</span>
                  </div>
                  {tier.next ? (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                        <span>Progress → {tier.next.label}</span>
                        <span className="tabular-nums">+{nextDelta}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted/40">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-amber-300">Top tier reached. Keep defending!</div>
                  )}
                  {myHistory[0] && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      Last change:{" "}
                      <span className={myHistory[0].delta >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                        {myHistory[0].delta >= 0 ? "+" : ""}{myHistory[0].delta}
                      </span>{" "}
                      · rank {myHistory[0].rank}/{myHistory[0].participants}
                    </div>
                  )}
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Rating trend</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{chronological.length} rounds</span>
                  </div>
                  {chronological.length ? (
                    <svg viewBox="0 0 400 96" className="h-24 w-full">
                      <defs>
                        <linearGradient id="g" x1="0" x2="1">
                          <stop offset="0" stopColor="#f59e0b" /><stop offset="1" stopColor="#f97316" />
                        </linearGradient>
                        <linearGradient id="gf" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.35" />
                          <stop offset="1" stopColor="#f97316" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {(() => {
                        const pts = chronological.map((r, i) => {
                          const x = (i / Math.max(1, chronological.length - 1)) * 400;
                          const y = 90 - ((r.new_rating - minR) / Math.max(1, maxR - minR)) * 82;
                          return [x, y] as const;
                        });
                        const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
                        const area = `0,96 ${line} 400,96`;
                        return (
                          <>
                            <polyline fill="url(#gf)" stroke="none" points={area} />
                            <polyline fill="none" stroke="url(#g)" strokeWidth="2.5" points={line} strokeLinecap="round" strokeLinejoin="round" />
                            {pts.map(([x, y], i) => (
                              <circle key={i} cx={x} cy={y} r={2} fill="#f59e0b" />
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  ) : (
                    <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border/40 text-xs text-muted-foreground">
                      Compete in your first weekly contest to see your rating graph.
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* CONTEST LISTS */}
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        {loading ? (
          <div className="space-y-3"><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div>
        ) : (
          <div className="space-y-10">
            {live.length > 0 && (
              <Section
                title="Live now"
                accent="emerald"
                icon={<span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>}
              >
                <div className="grid gap-3">
                  {live.map((c) => <ContestRow key={c.id} c={c} kind="live" tick={tick} onRegister={register} onUnregister={unregister} registered={registeredIds.has(c.id)} pending={pendingId === c.id} />)}
                </div>
              </Section>
            )}
            {upcoming.length > 0 && (
              <Section title="Upcoming" accent="amber" icon={<Calendar className="h-4 w-4" />}>
                <div className="grid gap-3">
                  {upcoming.slice().reverse().map((c) => <ContestRow key={c.id} c={c} kind="upcoming" tick={tick} onRegister={register} onUnregister={unregister} registered={registeredIds.has(c.id)} pending={pendingId === c.id} />)}
                </div>
              </Section>
            )}
            <Section title="Past contests" accent="muted" icon={<Trophy className="h-4 w-4" />}>
              {past.length === 0 ? (
                <Card className="border-dashed border-amber-400/20 bg-card/30 p-10 text-center">
                  <Trophy className="mx-auto mb-2 h-6 w-6 text-amber-400/60" />
                  <p className="text-sm text-muted-foreground">No past contests yet. The first one starts this Sunday!</p>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {past.map((c) => <ContestRow key={c.id} c={c} kind="past" tick={tick} onRegister={register} onUnregister={unregister} registered={registeredIds.has(c.id)} pending={pendingId === c.id} />)}
                </div>
              )}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, accent, icon, children }: { title: string; accent: "emerald" | "amber" | "muted"; icon: React.ReactNode; children: React.ReactNode }) {
  const color = accent === "emerald" ? "text-emerald-300" : accent === "amber" ? "text-amber-300" : "text-muted-foreground";
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] ${color}`}>
          {icon} {title}
        </h2>
        <div className={`h-px flex-1 bg-gradient-to-r ${accent === "emerald" ? "from-emerald-500/40" : accent === "amber" ? "from-amber-500/40" : "from-border"} to-transparent`} />
      </div>
      {children}
    </section>
  );
}

function ContestRow({ c, kind, tick, onRegister, onUnregister, registered, pending }: { c: Contest; kind: "live" | "upcoming" | "past"; tick: number; onRegister: (id: string) => void; onUnregister?: (id: string) => void; registered?: boolean; pending?: boolean }) {
  const starts = new Date(c.starts_at);
  const ends = new Date(c.ends_at);
  const now = Date.now();
  const ms = kind === "upcoming" ? starts.getTime() - now : ends.getTime() - now;
  const duration = Math.round((ends.getTime() - starts.getTime()) / 60000);
  const stripe = kind === "live" ? "bg-emerald-500" : kind === "upcoming" ? "bg-amber-500" : "bg-muted";

  return (
    <Card className="group relative overflow-hidden border-amber-400/20 bg-card/60 p-0 transition-all hover:-translate-y-0.5 hover:border-amber-400/50 hover:shadow-[0_10px_30px_-15px_rgba(245,158,11,0.35)]">
      <div className={`absolute inset-y-0 left-0 w-1 ${stripe}`} />
      <Link to={`/contests/${c.slug}`} className="block p-4 pl-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold group-hover:text-amber-200">{c.title}</h3>
              <Badge variant="outline" className="border-amber-400/40 text-[10px] text-amber-200">Rated</Badge>
              {kind === "live" && (
                <Badge className="border-transparent bg-emerald-500/20 text-[10px] text-emerald-300">
                  <Radio className="mr-1 h-3 w-3" /> Live
                </Badge>
              )}
              {kind === "past" && <Badge variant="outline" className="text-[10px]">Finished</Badge>}
            </div>
            {c.description && (
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{c.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{starts.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{duration}m</span>
              {kind !== "past" && (
                <span key={tick} className="inline-flex items-center gap-1 font-semibold text-amber-300">
                  <Timer className="h-3 w-3" />
                  {kind === "live" ? `Ends in ${fmtCountdown(ms)}` : `Starts in ${fmtCountdown(ms)}`}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
            {kind === "upcoming" && (
              registered ? (
                <div className="flex items-center gap-1.5">
                  <Badge className="border-transparent bg-emerald-500/20 text-emerald-300" data-testid="registered-badge">
                    <Sparkles className="mr-1 h-3.5 w-3.5" /> Registered
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => onUnregister?.(c.id)}
                    className="border-rose-400/40 text-rose-300 hover:bg-rose-500/10"
                  >
                    {pending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <X className="mr-1 h-3.5 w-3.5" />}
                    Unregister
                  </Button>
                </div>
              ) : (
                <Button size="sm" disabled={pending} onClick={() => onRegister(c.id)} className="bg-amber-500 text-black hover:bg-amber-400">
                  {pending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />}
                  Register
                </Button>
              )
            )}
            {kind === "live" && (
              <Link to={`/contests/${c.slug}`}>
                <Button size="sm" className="bg-emerald-500 text-black hover:bg-emerald-400">Enter</Button>
              </Link>
            )}
            {kind === "past" && (
              <Link to={`/contests/${c.slug}`}>
                <Button size="sm" variant="outline" className="border-amber-400/30">
                  <Users className="mr-1 h-3.5 w-3.5" /> Standings
                </Button>
              </Link>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-amber-300" />
          </div>
        </div>
      </Link>
    </Card>
  );
}
