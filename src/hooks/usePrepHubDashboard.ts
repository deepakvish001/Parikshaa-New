import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const SHEET_TOTALS: Record<string, { title: string; total: number }> = {
  "strivers-sde-sheet": { title: "Striver SDE Sheet", total: 199 },
  "strivers-a2z-dsa": { title: "Striver A2Z DSA", total: 445 },
  "neetcode-150": { title: "NeetCode 150", total: 150 },
  "neetcode-250": { title: "NeetCode 250", total: 250 },
  "blind-75": { title: "Blind 75", total: 75 },
  "cses-sheet": { title: "CSES Problem Set", total: 400 },
  "cp-interview-sheet": { title: "CP Interview Sheet", total: 50 },
  "acm-icpc-training": { title: "ACM-ICPC Training", total: 1153 },
  "parikshaa-cp-sheet": { title: "CP Ladder", total: 535 },
};

export function usePrepHubDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`prep-hub-live-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_topic_progress", filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["prep-hub-dashboard", userId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_sheet_progress_summary", filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["prep-hub-dashboard", userId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "contest_submissions", filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["prep-hub-dashboard", userId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "contest_rating_history", filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["prep-hub-dashboard", userId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "contest_leaderboard_cache", filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["prep-hub-dashboard", userId] });
        queryClient.invalidateQueries({ queryKey: ["my-weekly-contest-results"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return useQuery({
    queryKey: ["prep-hub-dashboard", user?.id],
    enabled: Boolean(user?.id),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",

    queryFn: async () => {
      if (!user?.id) throw new Error("Sign in required");
      const now = new Date().toISOString();
      const [onboarding, roadmap, streak, progress, sheetSummaries, contests, contestSubs] = await Promise.all([
        supabase.from("user_onboarding").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roadmaps").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_streaks").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_topic_progress").select("sheet_id,topic_id,completed,is_revision,note,updated_at,time_spent_seconds").eq("user_id", user.id),
        supabase.from("user_sheet_progress_summary").select("sheet_id,total_count,solved_count,pending_count,time_spent_seconds,updated_at").eq("user_id", user.id),
        supabase.from("contests").select("id,slug,title,starts_at,ends_at").gte("ends_at", now).order("starts_at").limit(3),
        supabase.from("contest_submissions").select("contest_id,problem_slug,verdict").eq("user_id", user.id),
      ]);
      const error = onboarding.error || roadmap.error || streak.error || progress.error || sheetSummaries.error || contests.error || contestSubs.error;
      if (error) throw error;

      const { data: ratingRows } = await supabase
        .from("contest_rating_history")
        .select("new_rating,delta,rank,participants,created_at,contest_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      const ratingList = ratingRows ?? [];
      const latestRating = ratingList[0] ?? null;
      const peakRating = ratingList.length
        ? Math.max(...ratingList.map((r) => Number(r.new_rating ?? 0)))
        : null;

      const contestAttempted = new Set<string>();
      const contestAccepted = new Set<string>();
      for (const row of contestSubs.data ?? []) {
        const key = `${row.contest_id}:${row.problem_slug}`;
        contestAttempted.add(key);
        if ((row.verdict ?? "").toLowerCase() === "accepted") contestAccepted.add(key);
      }
      const contestSolved = contestAccepted.size;
      const contestPending = Math.max(0, contestAttempted.size - contestAccepted.size);

      const sheetRows = (sheetSummaries.data ?? [])
        .map((item) => {
          const meta = SHEET_TOTALS[item.sheet_id] ?? { title: item.sheet_id.replace(/-/g, " "), total: item.total_count };
          const total = Math.max(item.total_count, meta.total);
          const solved = item.solved_count;
          return {
            sheetId: item.sheet_id,
            title: meta.title,
            total,
            solved,
            pending: Math.max(0, total - solved),
            time: Number(item.time_spent_seconds ?? 0),
            percent: total > 0 ? Math.round((solved / total) * 100) : 0,
          };
        })
        .sort((a, b) => b.solved - a.solved);
      const solved = sheetRows.reduce((sum, item) => sum + item.solved, 0);
      const total = sheetRows.reduce((sum, item) => sum + item.total, 0);
      const timeSeconds = sheetRows.reduce((sum, item) => sum + item.time, 0);
      const revisions = (progress.data ?? [])
        .filter((row) => row.is_revision && row.topic_id !== "__sheet_session__")
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 4);
      const nowMs = Date.now();
      const contestRows = (contests.data ?? []).map((c) => ({
        ...c,
        isLive: new Date(c.starts_at).getTime() <= nowMs && new Date(c.ends_at).getTime() >= nowMs,
      }));

      return {
        onboarding: onboarding.data,
        roadmap: roadmap.data,
        streak: streak.data,
        sheets: sheetRows,
        revisions,
        contests: contestRows,
        solved,
        total,
        pending: Math.max(0, total - solved),
        timeSeconds,
        progressPercent: total > 0 ? Math.round((solved / total) * 100) : 0,
        contestSolved,
        contestPending,
        rating: latestRating ? Number(latestRating.new_rating) : null,
        ratingDelta: latestRating ? Number(latestRating.delta ?? 0) : null,
        ratingRank: latestRating?.rank ?? null,
        ratingParticipants: latestRating?.participants ?? null,
        ratedContests: ratingList.length,
        peakRating,
      };
    },
  });
}