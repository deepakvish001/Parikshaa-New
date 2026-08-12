import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const db = supabase as any;

export interface Clan {
  id: string;
  name: string;
  tag: string | null;
  description: string | null;
  banner_url: string | null;
  logo_url: string | null;
  is_public: boolean;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

export function useMyClans() {
  const { user } = useAuth() as any;
  return useQuery({
    queryKey: ["league", "my-clans", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await db
        .from("clan_members")
        .select("role, clan_id, clans:clan_id (*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({ role: r.role as string, clan: r.clans as Clan }));
    },
  });
}

export function useBrowseClans(search: string) {
  return useQuery({
    queryKey: ["league", "browse-clans", search],
    queryFn: async () => {
      let q = db.from("clans").select("*").eq("is_public", true).limit(30);
      if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Clan[];
    },
  });
}

export function useClanMembers(clanId?: string) {
  return useQuery({
    queryKey: ["league", "clan-members", clanId],
    enabled: !!clanId,
    queryFn: async () => {
      const { data, error } = await db
        .from("clan_members")
        .select("user_id, role, joined_at")
        .eq("clan_id", clanId);
      if (error) throw error;
      return (data ?? []) as { user_id: string; role: string; joined_at: string }[];
    },
  });
}

export function useCreateClan() {
  const qc = useQueryClient();
  const { user } = useAuth() as any;
  return useMutation({
    mutationFn: async (input: { name: string; tag?: string; description?: string; is_public: boolean }) => {
      const { data, error } = await db
        .from("clans")
        .insert({ ...input, owner_id: user.id })
        .select()
        .single();
      if (error) throw error;
      const { error: mErr } = await db
        .from("clan_members")
        .insert({ clan_id: data.id, user_id: user.id, role: "owner" });
      if (mErr) throw mErr;
      return data as Clan;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["league"] }),
  });
}

export function useJoinClan() {
  const qc = useQueryClient();
  const { user } = useAuth() as any;
  return useMutation({
    mutationFn: async ({ clanId, inviteCode }: { clanId?: string; inviteCode?: string }) => {
      let id = clanId;
      if (!id && inviteCode) {
        const { data, error } = await db
          .from("clans")
          .select("id")
          .eq("invite_code", inviteCode.trim().toUpperCase())
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Invalid invite code");
        id = data.id;
      }
      if (!id) throw new Error("No clan specified");
      const { error } = await db
        .from("clan_members")
        .insert({ clan_id: id, user_id: user.id, role: "member" });
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["league"] }),
  });
}

export function useLeaveClan() {
  const qc = useQueryClient();
  const { user } = useAuth() as any;
  return useMutation({
    mutationFn: async (clanId: string) => {
      const { error } = await db
        .from("clan_members")
        .delete()
        .eq("clan_id", clanId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["league"] }),
  });
}
