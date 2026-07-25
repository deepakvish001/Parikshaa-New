import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserProject {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  repo_url: string | null;
  live_url: string | null;
  tech_stack: string[];
  cover_image_url: string | null;
  pinned: boolean;
  sort_order: number;
  source: "manual" | "github";
  external_id: string | null;
  created_at: string;
  updated_at: string;
}

export type UserProjectInput = Omit<
  UserProject,
  "id" | "user_id" | "created_at" | "updated_at"
>;

const ORDER = "pinned.desc,sort_order.asc,created_at.desc" as const;

export const useUserProjects = (userId?: string | null) => {
  return useQuery({
    queryKey: ["user-projects", userId],
    enabled: !!userId,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<UserProject[]> => {
      const { data, error } = await supabase
        .from("user_projects")
        .select("*")
        .eq("user_id", userId!)
        .order("pinned", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as UserProject[];
    },
  });
};

export const useUserProjectMutations = (userId: string) => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["user-projects", userId] });

  const create = useMutation({
    mutationFn: async (input: Partial<UserProjectInput> & { title: string }) => {
      const { error } = await supabase.from("user_projects").insert({
        user_id: userId,
        title: input.title,
        description: input.description ?? null,
        repo_url: input.repo_url ?? null,
        live_url: input.live_url ?? null,
        tech_stack: input.tech_stack ?? [],
        cover_image_url: input.cover_image_url ?? null,
        pinned: input.pinned ?? false,
        sort_order: input.sort_order ?? 0,
        source: input.source ?? "manual",
        external_id: input.external_id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<UserProjectInput>) => {
      const { error } = await supabase.from("user_projects").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
};
