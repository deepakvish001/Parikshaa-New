import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Rocket,
  Target,
  Calendar,
  Clock,
  BookOpen,
  History,
  TrendingUp,
  BrainCircuit,
  Code2,
  Trophy,
  Star,
  Zap,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import TufyChat from '@/components/prephub/TufyChat';
import { SheetProgressViz } from '@/components/prephub/SheetProgressViz';
import { usePrepHubDashboard } from '@/hooks/usePrepHubDashboard';

const cardCx =
  "relative overflow-hidden rounded-2xl bg-[hsl(var(--card))]/50 border border-white/[0.05]";

const PrepHubDashboard = () => {
  const { user } = useAuth();
  const { data, isLoading: loading, refetch } = usePrepHubDashboard();
  const onboarding = data?.onboarding;
  const roadmap = data?.roadmap;
  const streak = data?.streak;

  const generateInitialRoadmap = async () => {
    if (!user || !onboarding) return;
    try {
      const { data, error } = await supabase.functions.invoke('generate-roadmap', {
        body: { user_id: user.id, onboarding_data: onboarding }
      });
      if (error) throw error;

      const { error: dbError } = await supabase
        .from('user_roadmaps')
        .insert({
          user_id: user.id,
          title: `Roadmap for ${onboarding.target_company}`,
          weekly_sprints: data.roadmap.weeks,
          status: 'active'
        })
        .select()
        .single();

      if (dbError) throw dbError;
    } catch (error) {
      console.error("Error generating roadmap:", error);
    } finally {
      await refetch();
    }
  };

  return (
    <div className="relative min-h-svh bg-background text-foreground antialiased subpixel-antialiased [text-rendering:optimizeLegibility]">
      <Helmet>
        <title>Prep Hub — Parikshaa</title>
        <meta name="description" content="Your personalised interview prep dashboard — roadmap, streaks, aptitude and AI mentor." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <div className="mx-auto max-w-[1500px] px-3 md:px-4 py-3">
        <div className="learn-frame relative rounded-2xl border">
          {/* Sticky hero header — same language as Learn Hub */}
          <div className="sticky top-0 z-40 px-4 md:px-6 pt-5 pb-4 bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-xl border-b border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-primary/40 blur-xl rounded-2xl" />
                  <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" strokeWidth={2} />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1
                      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", textRendering: "optimizeLegibility" }}
                      className="text-2xl md:text-[28px] font-bold tracking-[-0.02em] text-foreground leading-none"
                    >
                      Prep{" "}
                      <span className="relative inline-block px-2 py-0.5">
                        <span aria-hidden className="absolute inset-0 -z-10 rounded-md bg-primary/15 ring-1 ring-inset ring-primary/25" />
                        <span
                          className="bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent"
                          style={{ backgroundSize: "200% auto", animation: "apex-shimmer 6s linear infinite" }}
                        >
                          Hub
                        </span>
                      </span>
                    </h1>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          aria-label="About Prep Hub"
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                        >
                          <Info className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="bottom" align="start" className="max-w-xs text-[12px] leading-relaxed p-3">
                        <p>Your personalised prep overview — roadmap, daily tasks, aptitude and interview experiences.</p>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="mt-1.5 text-[13px] text-muted-foreground truncate">
                    Welcome back, {user?.user_metadata?.full_name || 'Scholar'}!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary fill-primary" />
                  <span className="text-[13px] font-semibold">{streak?.current_streak || 0} Day Streak</span>
                </div>
                {!roadmap ? (
                  <Button
                    onClick={() => generateInitialRoadmap()}
                    className="h-10 px-5 rounded-lg text-[12px] font-bold uppercase tracking-[0.1em] bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] shadow-[0_0_24px_-6px_hsl(var(--primary)/0.45)] transition-all"
                  >
                    <Rocket className="mr-2 h-4 w-4" /> Generate Roadmap
                  </Button>
                ) : (
                  <Button className="h-10 px-5 rounded-lg text-[12px] font-bold uppercase tracking-[0.1em] bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] shadow-[0_0_24px_-6px_hsl(var(--primary)/0.45)] transition-all">
                    <Rocket className="mr-2 h-4 w-4" /> Start Today's Task
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 md:px-6 py-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {[
                { icon: Target, label: "Target Company", value: onboarding?.target_company || 'Not Set' },
                { icon: Trophy, label: "Solved Problems", value: loading ? "…" : `${data?.solved ?? 0}` },
                { icon: Target, label: "Pending Problems", value: loading ? "…" : `${data?.pending ?? 0}` },
                { icon: Clock, label: "Time Tracked", value: loading ? "…" : `${Math.floor((data?.timeSeconds ?? 0) / 3600)}h ${Math.floor(((data?.timeSeconds ?? 0) % 3600) / 60)}m` },
                { icon: Trophy, label: "Contest Solved", value: loading ? "…" : `${data?.contestSolved ?? 0}${(data?.contestPending ?? 0) > 0 ? ` / ${(data?.contestSolved ?? 0) + (data?.contestPending ?? 0)}` : ''}` },
                {
                  icon: Trophy,
                  label: "Contest Rating",
                  value: loading
                    ? "…"
                    : data?.rating != null
                      ? `${data.rating}${data.ratingDelta != null ? ` (${data.ratingDelta >= 0 ? "+" : ""}${data.ratingDelta})` : ""}`
                      : "Unrated",
                },
              ].map((s) => (
                <div key={s.label} className={`${cardCx} p-5 flex items-center gap-4`}>
                  <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{s.label}</p>
                    <p className="text-[15px] font-bold truncate">{s.value}</p>
                  </div>
                </div>
              ))}
              <div className={`${cardCx} p-5 flex items-center gap-4`}>
                <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Overall Progress</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={data?.progressPercent ?? 0} className="h-1.5 w-24" />
                    <span className="text-xs font-bold">{data?.progressPercent ?? 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main column */}
              <div className="lg:col-span-2 space-y-6">
                <Card className={`${cardCx} p-0`}>
                  <CardHeader className="border-b border-white/[0.05]">
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2 text-[15px]">
                        <Calendar className="h-4 w-4 text-primary" />
                        Weekly Sprint Plan
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" asChild>
                        <Link to="/roadmap">Full Roadmap <ChevronRight className="ml-1 h-4 w-4" /></Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-white/[0.05]">
                      {roadmap ? (
                        (roadmap.weekly_sprints?.[0]?.tasks || []).slice(0, 5).map((task: any, idx: number) => (
                          <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${idx === 0 ? 'border-primary/50 bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground'}`}>
                                <span className="text-xs font-bold">{idx === 0 ? '✓' : idx + 1}</span>
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${idx === 0 ? 'line-through text-muted-foreground' : ''}`}>
                                  Day {task.day || idx + 1}: {task.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground">{task.type} • {task.estimated_minutes} mins</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="h-8 rounded-lg border-white/10">
                              {idx === 0 ? 'Review' : 'Start'}
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center text-[13px] text-muted-foreground">
                          Generate your roadmap to see your daily plan.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className={`${cardCx} p-0`}>
                  <CardHeader className="border-b border-white/[0.05]">
                    <CardTitle className="flex items-center gap-2 text-[15px]">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Sheet-wise Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <SheetProgressViz sheets={data?.sheets ?? []} loading={loading} />
                  </CardContent>
                </Card>

                {/* Quick Modules */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { to: "/prephub/aptitude", icon: TrendingUp, tag: "2000+ Topics", title: "Aptitude Module", desc: "Master logical and quantitative reasoning with step-by-step solutions." },
                    { to: "/prephub/interview-experiences", icon: History, tag: "Daily Updates", title: "Interview Experiences", desc: "Real world insights from recent candidates at top tech firms." },
                  ].map((m) => (
                    <Link key={m.to} to={m.to} className="h-full">
                      <div className={`${cardCx} p-5 h-full transition-colors hover:border-primary/30 group`}>
                        <div className="flex items-start justify-between">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <m.icon className="h-5 w-5 text-primary" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground rounded-full border border-white/10 bg-white/[0.03] px-2 py-1">{m.tag}</span>
                        </div>
                        <h3 className="mt-4 font-bold text-[15px] tracking-[-0.01em]">{m.title}</h3>
                        <p className="text-[13px] leading-relaxed text-muted-foreground mt-1">{m.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className={`${cardCx} p-5 border-l-2 border-l-primary`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Code2 className="h-4 w-4 text-primary" />
                    <span className="text-[11px] font-bold tracking-[0.1em] text-primary uppercase">Live & Upcoming Rounds</span>
                  </div>
                  {(data?.contests ?? []).length === 0 ? (
                    <p className="text-[13px] text-muted-foreground mb-5">No scheduled rounds right now. New rounds will appear here.</p>
                  ) : (
                    <div className="space-y-3 mb-5">
                      {data?.contests.map((c) => (
                        <Link key={c.id} to={`/contests/${c.slug}`} className="block rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:border-primary/30 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[13px] font-semibold leading-snug">{c.title}</span>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${c.isLive ? "bg-primary/15 text-primary border border-primary/30" : "bg-white/[0.04] text-muted-foreground border border-white/10"}`}>
                              {c.isLive ? "Live" : "Upcoming"}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {new Date(c.starts_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                  <Button asChild className="w-full h-10 rounded-lg text-[12px] font-bold uppercase tracking-[0.1em] bg-primary text-primary-foreground hover:bg-primary/90"><Link to="/contests">View All Contests</Link></Button>
                </div>

                <div className={`${cardCx} p-5 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[15px]">Ask Tufy AI</h3>
                      <p className="text-[11px] text-muted-foreground italic">"I'll guide, you'll solve."</p>
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed text-muted-foreground mb-4">Stuck on a pattern? Get a hint without spoiling the solution.</p>
                  <div className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1 flex items-center gap-2 focus-within:border-primary/40 transition-colors">
                    <input
                      type="text"
                      placeholder="Ask a hint…"
                      className="flex-1 bg-transparent h-8 text-[13px] placeholder:text-muted-foreground/60 focus:outline-none"
                    />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <Card className={`${cardCx}`}>
                  <CardHeader>
                    <CardTitle className="text-[15px] flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Revision Snippets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(data?.revisions ?? []).length === 0 ? <p className="text-[13px] text-muted-foreground">Mark sheet topics for revision to see them here.</p> : data?.revisions.map((note) => (
                      <Link to={`/learn/sheets/${note.sheet_id}`} key={`${note.sheet_id}-${note.topic_id}`} className="flex items-center justify-between group">
                        <span className="text-[13px] text-muted-foreground group-hover:text-foreground transition-colors">{note.note || note.topic_id}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TufyChat />
    </div>
  );
};

export default PrepHubDashboard;
