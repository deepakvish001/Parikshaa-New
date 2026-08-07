-- 1. Flags
ALTER TABLE public.contests
  ADD COLUMN IF NOT EXISTS is_weekly_rated boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_contests_weekly_starts ON public.contests(is_weekly_rated, starts_at DESC);

ALTER TABLE public.coding_problems
  ADD COLUMN IF NOT EXISTS is_contest_pool boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_coding_problems_contest_pool ON public.coding_problems(is_contest_pool) WHERE is_contest_pool = true;

-- 2. Rating history
CREATE TABLE IF NOT EXISTS public.contest_rating_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  old_rating integer NOT NULL DEFAULT 1200,
  new_rating integer NOT NULL,
  delta integer NOT NULL,
  rank integer NOT NULL,
  participants integer NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, contest_id)
);
CREATE INDEX IF NOT EXISTS idx_crh_user_created ON public.contest_rating_history(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_crh_contest ON public.contest_rating_history(contest_id);

GRANT SELECT ON public.contest_rating_history TO anon, authenticated;
GRANT ALL ON public.contest_rating_history TO service_role;

ALTER TABLE public.contest_rating_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crh public read" ON public.contest_rating_history
  FOR SELECT TO anon, authenticated USING (true);