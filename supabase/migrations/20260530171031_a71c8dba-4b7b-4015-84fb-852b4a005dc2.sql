-- Add optional MCQ to coding problems
ALTER TABLE public.coding_problems ADD COLUMN IF NOT EXISTS mcq jsonb;

-- Per-user MCQ attempts
CREATE TABLE IF NOT EXISTS public.coding_problem_mcq_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  problem_slug text NOT NULL,
  selected_index int NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, problem_slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coding_problem_mcq_attempts TO authenticated;
GRANT ALL ON public.coding_problem_mcq_attempts TO service_role;

ALTER TABLE public.coding_problem_mcq_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own MCQ attempts"
  ON public.coding_problem_mcq_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own MCQ attempts"
  ON public.coding_problem_mcq_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own MCQ attempts"
  ON public.coding_problem_mcq_attempts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete their own MCQ attempts"
  ON public.coding_problem_mcq_attempts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);