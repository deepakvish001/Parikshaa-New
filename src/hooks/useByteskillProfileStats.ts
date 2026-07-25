import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ByteskillStats {
  difficulty: { easy: { solved: number; total: number }; medium: { solved: number; total: number }; hard: { solved: number; total: number } };
  submissionsByDay: Record<string, number>; // YYYY-MM-DD -> count
  totalSubmissions: number;
  activeDays: number;
  maxStreak: number;
  loading: boolean;
}

const EMPTY: ByteskillStats = {
  difficulty: { easy: { solved: 0, total: 0 }, medium: { solved: 0, total: 0 }, hard: { solved: 0, total: 0 } },
  submissionsByDay: {},
  totalSubmissions: 0,
  activeDays: 0,
  maxStreak: 0,
  loading: true,
};

function computeMaxStreak(byDay: Record<string, number>): number {
  const days = Object.keys(byDay).filter((d) => byDay[d] > 0).sort();
  if (!days.length) return 0;
  let max = 1, cur = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const today = new Date(days[i]);
    const diff = Math.round((today.getTime() - prev.getTime()) / 86400000);
    cur = diff === 1 ? cur + 1 : 1;
    if (cur > max) max = cur;
  }
  return max;
}

/** Aggregates the user's code_submissions into the shape the profile cards need. */
export const useByteskillProfileStats = (userId?: string | null): ByteskillStats => {
  const [stats, setStats] = useState<ByteskillStats>(EMPTY);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStats((s) => ({ ...s, loading: true }));




      // Pull all accepted submissions for difficulty counts; pull all for heatmap (last 12 months).
      const since = new Date();
      since.setMonth(since.getMonth() - 12);
      const sinceIso = since.toISOString();

      const [allSubsRes, problemsRes] = await Promise.all([
        userId
          ? supabase
              .from("code_submissions")
              .select("problem_slug, verdict, created_at")
              .eq("user_id", userId)
              .gte("created_at", sinceIso)
              .limit(5000)
          : Promise.resolve({ data: [] as any[] }),
        supabase
          .from("coding_problems")
          .select("slug, difficulty")
          .limit(2000),
      ]);


      const subs = allSubsRes.data ?? [];
      const probs = problemsRes.data ?? [];
      const diffBySlug = new Map<string, string>();
      const totals = { Easy: 0, Medium: 0, Hard: 0 } as Record<string, number>;
      const normDiff = (d: string) => {
        const s = (d || "").toLowerCase();
        if (s === "easy") return "Easy";
        if (s === "medium") return "Medium";
        if (s === "hard") return "Hard";
        return d;
      };
      for (const p of probs) {
        if (p.slug && p.difficulty) {
          const d = normDiff(p.difficulty);
          diffBySlug.set(p.slug, d);
          totals[d] = (totals[d] ?? 0) + 1;
        }
      }


      const solvedEasy = new Set<string>();
      const solvedMed = new Set<string>();
      const solvedHard = new Set<string>();
      const byDay: Record<string, number> = {};

      for (const s of subs) {
        const day = (s.created_at as string).slice(0, 10);
        byDay[day] = (byDay[day] ?? 0) + 1;
        if (s.verdict === "Accepted") {
          const d = diffBySlug.get(s.problem_slug);
          if (d === "Easy") solvedEasy.add(s.problem_slug);
          else if (d === "Medium") solvedMed.add(s.problem_slug);
          else if (d === "Hard") solvedHard.add(s.problem_slug);
        }
      }

      const activeDays = Object.keys(byDay).length;
      const maxStreak = computeMaxStreak(byDay);

      if (cancelled) return;
      setStats({
        difficulty: {
          easy: { solved: solvedEasy.size, total: totals.Easy ?? 0 },
          medium: { solved: solvedMed.size, total: totals.Medium ?? 0 },
          hard: { solved: solvedHard.size, total: totals.Hard ?? 0 },
        },
        submissionsByDay: byDay,
        totalSubmissions: subs.length,
        activeDays,
        maxStreak,
        loading: false,
      });
    })();
    return () => { cancelled = true; };
  }, [userId, tick]);

  // Realtime: refetch on new submissions for this user + any coding_problems change (totals).
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`byteskill-stats:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "code_submissions", filter: `user_id=eq.${userId}` },
        () => setTick((t) => t + 1),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coding_problems" },
        () => setTick((t) => t + 1),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);



  return stats;
};
