import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns the set of problem slugs the user has Accepted submissions for.
 * Used by the curriculum sidebar to show check icons + folder progress.
 */
export const useSolvedSlugs = () => {
  const { user } = useAuth();
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setSolved(new Set());
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("code_submissions")
        .select("problem_slug")
        .eq("user_id", user.id)
        .eq("verdict", "Accepted")
        .limit(5000);
      if (cancelled) return;
      setSolved(new Set((data ?? []).map((r) => r.problem_slug as string)));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { solved, loading };
};

export const computeFolderProgress = (slugs: string[], solved: Set<string>) => {
  const total = slugs.length;
  const done = slugs.filter((s) => solved.has(s)).length;
  return { done, total };
};
