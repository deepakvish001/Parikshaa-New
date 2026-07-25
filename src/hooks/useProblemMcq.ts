import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface McqOption {
  label: string;
  correct?: boolean;
}

export interface McqData {
  question?: string;
  options: McqOption[];
}

export interface McqAttempt {
  selected_index: number;
  is_correct: boolean;
}

/** Reads the user's MCQ attempt for a problem (if any) and exposes a save fn. */
export const useProblemMcqAttempt = (problemSlug?: string) => {
  const { user } = useAuth();
  const [attempt, setAttempt] = useState<McqAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user || !problemSlug) {
      setAttempt(null);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("coding_problem_mcq_attempts")
        .select("selected_index, is_correct")
        .eq("user_id", user.id)
        .eq("problem_slug", problemSlug)
        .maybeSingle();
      if (cancelled) return;
      setAttempt(data ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, problemSlug]);

  const submit = useCallback(
    async (selectedIndex: number, isCorrect: boolean) => {
      if (!user || !problemSlug) return;
      const next = { selected_index: selectedIndex, is_correct: isCorrect };
      setAttempt(next);
      await supabase
        .from("coding_problem_mcq_attempts")
        .upsert(
          { user_id: user.id, problem_slug: problemSlug, ...next },
          { onConflict: "user_id,problem_slug" },
        );
    },
    [user, problemSlug],
  );

  return { attempt, submit, loading };
};
