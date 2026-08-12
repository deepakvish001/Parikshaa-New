import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

const db = supabase as any;

export interface ClanStats {
  clan_id: string;
  total_solved: number;
  avg_rating: number;
  member_count: number;
  active_members: number;
}

export function useClanStats(clanId?: string) {
  return useQuery({
    queryKey: ["league", "clan-stats", clanId],
    enabled: !!clanId,
    queryFn: async () => {
      const { data, error } = await db.rpc("get_clan_stats", { _clan_id: clanId });
      if (error) throw error;
      return data as ClanStats;
    },
  });
}

export function useTopClans(limit = 10) {
  return useQuery({
    queryKey: ["league", "top-clans", limit],
    queryFn: async () => {
      const { data, error } = await db
        .from("clans")
        .select("*, stats:clan_stats(*)")
        .eq("is_public", true)
        .order("stats(total_solved)", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useClanInvites(clanId?: string) {
  return useQuery({
    queryKey: ["league", "clan-invites", clanId],
    enabled: !!clanId,
    queryFn: async () => {
      const { data, error } = await db
        .from("clan_invites")
        .select("*")
        .eq("clan_id", clanId)
        .eq("status", "pending");
      if (error) throw error;
      return data as any[];
    },
  });
}
