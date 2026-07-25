
CREATE TABLE public.coding_problem_discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_slug TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.coding_problem_discussions(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_cpd_slug_created ON public.coding_problem_discussions(problem_slug, created_at DESC);
CREATE INDEX idx_cpd_parent ON public.coding_problem_discussions(parent_id);

GRANT SELECT ON public.coding_problem_discussions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coding_problem_discussions TO authenticated;
GRANT ALL ON public.coding_problem_discussions TO service_role;

ALTER TABLE public.coding_problem_discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discussions readable by all"
  ON public.coding_problem_discussions FOR SELECT
  USING (deleted_at IS NULL OR auth.uid() = user_id);

CREATE POLICY "users insert own discussions"
  ON public.coding_problem_discussions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own discussions"
  ON public.coding_problem_discussions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own discussions"
  ON public.coding_problem_discussions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_cpd_updated_at
  BEFORE UPDATE ON public.coding_problem_discussions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.coding_problem_discussion_likes (
  discussion_id UUID NOT NULL REFERENCES public.coding_problem_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (discussion_id, user_id)
);
GRANT SELECT ON public.coding_problem_discussion_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.coding_problem_discussion_likes TO authenticated;
GRANT ALL ON public.coding_problem_discussion_likes TO service_role;

ALTER TABLE public.coding_problem_discussion_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes readable by all" ON public.coding_problem_discussion_likes FOR SELECT USING (true);
CREATE POLICY "users like as self" ON public.coding_problem_discussion_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users unlike own" ON public.coding_problem_discussion_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.coding_problem_discussions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coding_problem_discussion_likes;
