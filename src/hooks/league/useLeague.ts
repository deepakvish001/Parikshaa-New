import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// The league tables are new; generated types lag behind, so we use a loose client.
const db = supabase as any;

export interface TrackedHandle {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  is_self: boolean;
  sync_status: string;
  sync_error: string | null;
  last_synced_at: string | null;
}

export interface HandleSnapshot {
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  country: string | null;
  total_solved: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  total_easy: number;
  total_medium: number;
  total_hard: number;
  acceptance_rate: number;
  global_ranking: number | null;
  contest_rating: number | null;
  contest_global_ranking: number | null;
  contest_top_percentage: number | null;
  attended_contests: number;
  current_streak: number;
  longest_streak: number;
  active_days: number;
  solved_today: number;
  solved_this_week: number;
  solved_this_month: number;
  avg_per_active_day: number;
  peak_day: string | null;
  consistency: number;
  languages: { name: string; count: number }[];
  topics: { name: string; count: number }[];
  updated_at: string;
}

export function useTrackedHandles() {
  const { user } = useAuth() as any;
  return useQuery({
    queryKey: ["league", "handles", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<TrackedHandle[]> => {
      const { data, error } = await db
        .from("tracked_handles")
        .select("id, handle, display_name, avatar_url, is_self, sync_status, sync_error, last_synced_at")
        .order("is_self", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSnapshots(handles: string[]) {
  return useQuery({
    queryKey: ["league", "snapshots", [...handles].sort().join(",")],
    enabled: handles.length > 0,
    queryFn: async (): Promise<HandleSnapshot[]> => {
      const { data, error } = await db
        .from("handle_snapshots")
        .select("*")
        .eq("platform", "leetcode")
        .in("handle", handles);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSnapshot(handle?: string | null) {
  return useQuery({
    queryKey: ["league", "snapshot", handle],
    enabled: !!handle,
    queryFn: async (): Promise<HandleSnapshot | null> => {
      const { data, error } = await db
        .from("handle_snapshots")
        .select("*")
        .eq("platform", "leetcode")
        .eq("handle", handle)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function useDailyActivity(handle?: string | null, days = 365) {
  return useQuery({
    queryKey: ["league", "activity", handle, days],
    enabled: !!handle,
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
      const { data, error } = await db
        .from("handle_daily_activity")
        .select("day, submissions")
        .eq("platform", "leetcode")
        .eq("handle", handle)
        .gte("day", since)
        .order("day", { ascending: true });
      if (error) throw error;
      return (data ?? []) as { day: string; submissions: number }[];
    },
  });
}

export function useContestHistory(handle?: string | null) {
  return useQuery({
    queryKey: ["league", "contest-history", handle],
    enabled: !!handle,
    queryFn: async () => {
      const { data, error } = await db
        .from("handle_contest_history")
        .select("contest_title, start_time, rating, ranking")
        .eq("platform", "leetcode")
        .eq("handle", handle)
        .order("start_time", { ascending: true });
      if (error) throw error;
      return (data ?? []) as { contest_title: string; start_time: string; rating: number | null; ranking: number | null }[];
    },
  });
}

export interface FeedItem {
  id: number;
  handle: string;
  problem_slug: string;
  title: string;
  difficulty: string | null;
  lang: string | null;
  solved_at: string;
}

export function useActivityFeed(handles: string[], limit = 60) {
  return useQuery({
    queryKey: ["league", "feed", [...handles].sort().join(","), limit],
    enabled: handles.length > 0,
    queryFn: async (): Promise<FeedItem[]> => {
      const { data, error } = await db
        .from("handle_recent_solves")
        .select("id, handle, problem_slug, title, difficulty, lang, solved_at")
        .eq("platform", "leetcode")
        .in("handle", handles)
        .order("solved_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type LeagueMetric =
  | "today"
  | "week"
  | "month"
  | "total"
  | "rating"
  | "current_streak"
  | "longest_streak"
  | "hard"
  | "consistency"
  | "points";

export function useLeaderboard(handles: string[], metric: LeagueMetric) {
  return useQuery({
    queryKey: ["league", "leaderboard", metric, [...handles].sort().join(",")],
    enabled: handles.length > 0,
    queryFn: async () => {
      const { data, error } = await db.rpc("league_leaderboard", {
        _handles: handles,
        _metric: metric,
      });
      if (error) throw error;
      return (data ?? []) as {
        rank: number;
        handle: string;
        display_name: string | null;
        avatar_url: string | null;
        value: number;
      }[];
    },
  });
}

export function useAddHandle() {
  const qc = useQueryClient();
  const { user } = useAuth() as any;
  return useMutation({
    mutationFn: async ({ handle, isSelf }: { handle: string; isSelf?: boolean }) => {
      const clean = handle.trim().replace(/^@/, "");
      if (!clean) throw new Error("Handle required");
      const { error } = await db.from("tracked_handles").insert({
        owner_id: user.id,
        platform: "leetcode",
        handle: clean,
        is_self: !!isSelf,
      });
      if (error) throw error;
      await supabase.functions.invoke("handles-sync", { body: { handle: clean } });
      return clean;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["league"] });
    },
  });
}

export function useRemoveHandle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("tracked_handles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["league"] }),
  });
}

export function useSyncAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (handle?: string) => {
      const { data, error } = await supabase.functions.invoke("handles-sync", {
        body: handle ? { handle } : {},
      });
      if (error) throw error;
      return data as { synced: number; results: { handle: string; ok: boolean; error?: string }[] };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["league"] }),
  });
}

export function useSavedProblems() {
  const { user } = useAuth() as any;
  return useQuery({
    queryKey: ["league", "saved", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await db
        .from("saved_problems")
        .select("id, problem_slug, title, difficulty, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        problem_slug: string;
        title: string | null;
        difficulty: string | null;
        created_at: string;
      }[];
    },
  });
}

export function useToggleSaved() {
  const qc = useQueryClient();
  const { user } = useAuth() as any;
  return useMutation({
    mutationFn: async (p: { slug: string; title?: string | null; difficulty?: string | null }) => {
      const { data: existing } = await db
        .from("saved_problems")
        .select("id")
        .eq("user_id", user.id)
        .eq("problem_slug", p.slug)
        .maybeSingle();
      if (existing) {
        const { error } = await db.from("saved_problems").delete().eq("id", existing.id);
        if (error) throw error;
        return "removed" as const;
      }
      const { error } = await db.from("saved_problems").insert({
        user_id: user.id,
        platform: "leetcode",
        problem_slug: p.slug,
        title: p.title ?? null,
        difficulty: p.difficulty ?? null,
      });
      if (error) throw error;
      return "saved" as const;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["league", "saved"] }),
  });
}

export function useExternalContests() {
  return useQuery({
    queryKey: ["league", "external-contests"],
    queryFn: async () => {
      const { data, error } = await db
        .from("external_contests")
        .select("id, platform, title, url, start_time, duration_seconds")
        .gte("start_time", new Date(Date.now() - 3600000).toISOString())
        .order("start_time", { ascending: true })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        platform: string;
        title: string;
        url: string | null;
        start_time: string;
        duration_seconds: number;
      }[];
    },
  });
}
