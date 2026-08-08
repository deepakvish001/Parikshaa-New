import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useContestLocks = (contestId: string | undefined) => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!contestId) return;

    const channel = supabase
      .channel(`contest-locks-${contestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contest_tab_locks",
          filter: `contest_id=eq.${contestId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["contest-locks", contestId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contestId, qc]);

  return useQuery({
    queryKey: ["contest-locks", contestId],
    enabled: !!contestId,
    queryFn: async () => {
      // First check if contest has ended
      const { data: contest, error: contestError } = await supabase
        .from("contests" as any)
        .select("ends_at")
        .eq("id", contestId!)
        .maybeSingle();

      if (contestError) throw contestError;
      
      const hasEnded = contest?.ends_at && new Date(contest.ends_at) < new Date();
      if (hasEnded) return [];

      const { data, error } = await supabase
        .from("contest_tab_locks" as any)
        .select("*")
        .eq("contest_id", contestId!)
        .gt("expires_at", new Date().toISOString());

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refresh every 30s as fallback
  });
};
