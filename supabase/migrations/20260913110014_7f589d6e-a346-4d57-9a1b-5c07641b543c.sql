ALTER TABLE public.contests
  ADD COLUMN IF NOT EXISTS sequence_no integer,
  ADD COLUMN IF NOT EXISTS invite_code text,
  ADD COLUMN IF NOT EXISTS rules_md text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS max_participants integer,
  ADD COLUMN IF NOT EXISTS created_by uuid;

CREATE TABLE IF NOT EXISTS public.contest_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  problem_slug text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 100,
  unlock_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contest_id, problem_slug)
);
GRANT SELECT ON public.contest_problems TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_problems TO authenticated;
GRANT ALL ON public.contest_problems TO service_role;
ALTER TABLE public.contest_problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contest problems are viewable by everyone" ON public.contest_problems FOR SELECT USING (true);
CREATE POLICY "Admins manage contest problems" ON public.contest_problems FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));
CREATE INDEX IF NOT EXISTS contest_problems_contest_idx ON public.contest_problems(contest_id, order_index);
CREATE TRIGGER update_contest_problems_updated_at BEFORE UPDATE ON public.contest_problems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.contest_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  problem_slug text NOT NULL,
  verdict text NOT NULL DEFAULT 'pending',
  language text,
  code text,
  runtime_ms integer,
  memory_kb integer,
  passed_tests integer,
  total_tests integer,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.contest_submissions TO authenticated;
GRANT ALL ON public.contest_submissions TO service_role;
ALTER TABLE public.contest_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own contest submissions" ON public.contest_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "Users create own contest submissions" ON public.contest_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS contest_submissions_contest_user_idx ON public.contest_submissions(contest_id, user_id, problem_slug);
CREATE TRIGGER update_contest_submissions_updated_at BEFORE UPDATE ON public.contest_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.contest_rating_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  old_rating integer NOT NULL DEFAULT 1200,
  new_rating integer NOT NULL DEFAULT 1200,
  delta integer NOT NULL DEFAULT 0,
  rank integer,
  participants integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contest_id, user_id)
);
GRANT SELECT ON public.contest_rating_history TO anon;
GRANT SELECT ON public.contest_rating_history TO authenticated;
GRANT ALL ON public.contest_rating_history TO service_role;
ALTER TABLE public.contest_rating_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contest rating history is viewable by everyone" ON public.contest_rating_history FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS contest_rating_history_user_idx ON public.contest_rating_history(user_id, created_at DESC);