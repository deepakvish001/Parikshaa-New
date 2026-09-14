import { useQuery } from "@tanstack/react-query";

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
  return useQuery({
    queryKey: ["prep-hub-dashboard", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) throw new Error("Sign in required");
      const now = new Date().toISOString();
      const [onboarding, roadmap, streak, progress, contests] = await Promise.all([
        supabase.from("user_onboarding").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roadmaps").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_streaks").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_topic_progress").select("sheet_id,topic_id,completed,is_revision,note,updated_at,time_spent_seconds").eq("user_id", user.id),
        supabase.from("contests").select("id,slug,title,starts_at,ends_at").gte("ends_at", now).order("starts_at").limit(3),
      ]);
      const error = onboarding.error || roadmap.error || streak.error || progress.error || contests.error;
      if (error) throw error;

      const sheets = new Map<string, { sheetId: string; title: string; total: number; solved: number; time: number }>();
      for (const row of progress.data ?? []) {
        const meta = SHEET_TOTALS[row.sheet_id] ?? { title: row.sheet_id.replace(/-/g, " "), total: 0 };
        const current = sheets.get(row.sheet_id) ?? { sheetId: row.sheet_id, title: meta.title, total: meta.total, solved: 0, time: 0 };
        if (row.completed && row.topic_id !== "__sheet_session__") current.solved += 1;
        current.time += Number(row.time_spent_seconds ?? 0);
        sheets.set(row.sheet_id, current);
      }
      const sheetRows = Array.from(sheets.values())
        .map((item) => ({
          ...item,
          pending: Math.max(0, item.total - item.solved),
          percent: item.total > 0 ? Math.round((item.solved / item.total) * 100) : 0,
        }))
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
        contests: contests.data ?? [],
        solved,
        total,
        pending: Math.max(0, total - solved),
        timeSeconds,
        progressPercent: total > 0 ? Math.round((solved / total) * 100) : 0,
      };
    },
  });
}