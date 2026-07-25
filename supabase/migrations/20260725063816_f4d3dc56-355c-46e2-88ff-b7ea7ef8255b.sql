-- Create user_activity_log table for centralized activity tracking
CREATE TABLE public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT ON public.user_activity_log TO authenticated;
GRANT ALL ON public.user_activity_log TO service_role;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities"
ON public.user_activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activities"
ON public.user_activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System can insert activities"
ON public.user_activity_log FOR INSERT WITH CHECK (true);

CREATE INDEX idx_activity_log_user_created ON public.user_activity_log(user_id, created_at DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity_log;

CREATE OR REPLACE FUNCTION public.log_quiz_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_activity_log (user_id, activity_type, title, description, metadata)
  VALUES (NEW.user_id, 'quiz_complete',
    'Completed ' || UPPER(NEW.quiz_type) || ' Quiz',
    'Scored ' || NEW.score || '/' || NEW.total_questions || ' (' || ROUND(NEW.accuracy::numeric, 1) || '%)',
    jsonb_build_object('quiz_type', NEW.quiz_type, 'category', NEW.category, 'difficulty', NEW.difficulty,
      'score', NEW.score, 'total_questions', NEW.total_questions, 'accuracy', NEW.accuracy, 'quiz_result_id', NEW.id));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_quiz_complete AFTER INSERT ON public.quiz_results
FOR EACH ROW EXECUTE FUNCTION public.log_quiz_activity();

CREATE OR REPLACE FUNCTION public.log_achievement_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_activity_log (user_id, activity_type, title, description, metadata)
  VALUES (NEW.user_id, 'achievement', 'Unlocked Achievement', NEW.achievement_id,
    jsonb_build_object('achievement_id', NEW.achievement_id, 'earned_at', NEW.earned_at));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_achievement_unlock AFTER INSERT ON public.user_achievements
FOR EACH ROW EXECUTE FUNCTION public.log_achievement_activity();

CREATE OR REPLACE FUNCTION public.log_xp_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_activity_log (user_id, activity_type, title, description, metadata)
  VALUES (NEW.user_id, 'xp_earned', 'Earned ' || NEW.amount || ' XP',
    COALESCE(NEW.description, 'From ' || NEW.source),
    jsonb_build_object('amount', NEW.amount, 'source', NEW.source, 'description', NEW.description));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_xp_earned AFTER INSERT ON public.xp_transactions
FOR EACH ROW EXECUTE FUNCTION public.log_xp_activity();

CREATE OR REPLACE FUNCTION public.log_topic_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
    INSERT INTO public.user_activity_log (user_id, activity_type, title, description, metadata)
    VALUES (NEW.user_id, 'topic_complete', 'Completed Topic', NEW.topic_id,
      jsonb_build_object('topic_id', NEW.topic_id, 'sheet_id', NEW.sheet_id, 'completed_at', NEW.completed_at));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_topic_complete AFTER UPDATE ON public.user_topic_progress
FOR EACH ROW EXECUTE FUNCTION public.log_topic_activity();

-- Coding Problems Hub schema
CREATE TABLE IF NOT EXISTS public.code_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  problem_slug TEXT NOT NULL,
  language TEXT NOT NULL,
  language_id INTEGER NOT NULL,
  source_code TEXT NOT NULL,
  verdict TEXT NOT NULL,
  runtime_ms INTEGER,
  memory_kb INTEGER,
  passed_tests INTEGER NOT NULL DEFAULT 0,
  total_tests INTEGER NOT NULL DEFAULT 0,
  failing_case JSONB,
  stderr TEXT,
  is_submission BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.code_submissions TO authenticated;
GRANT ALL ON public.code_submissions TO service_role;
CREATE INDEX IF NOT EXISTS idx_code_submissions_user ON public.code_submissions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_code_submissions_problem ON public.code_submissions(problem_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_code_submissions_user_problem ON public.code_submissions(user_id, problem_slug, created_at DESC);
ALTER TABLE public.code_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their own submissions" ON public.code_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert their own submissions" ON public.code_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.code_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  problem_slug TEXT NOT NULL,
  language TEXT NOT NULL,
  source_code TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, problem_slug, language)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.code_drafts TO authenticated;
GRANT ALL ON public.code_drafts TO service_role;
CREATE INDEX IF NOT EXISTS idx_code_drafts_user_problem ON public.code_drafts(user_id, problem_slug);
ALTER TABLE public.code_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their own drafts" ON public.code_drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert their own drafts" ON public.code_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own drafts" ON public.code_drafts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete their own drafts" ON public.code_drafts FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_code_drafts_updated_at BEFORE UPDATE ON public.code_drafts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.coding_problems_meta (
  problem_slug TEXT PRIMARY KEY,
  total_submissions INTEGER NOT NULL DEFAULT 0,
  total_accepted INTEGER NOT NULL DEFAULT 0,
  acceptance_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coding_problems_meta TO anon, authenticated;
GRANT ALL ON public.coding_problems_meta TO service_role;
ALTER TABLE public.coding_problems_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view coding problem stats" ON public.coding_problems_meta FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.handle_code_submission_aftermath()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_submission = false THEN RETURN NEW; END IF;
  INSERT INTO public.coding_problems_meta (problem_slug, total_submissions, total_accepted, acceptance_rate)
  VALUES (NEW.problem_slug, 1, CASE WHEN NEW.verdict = 'Accepted' THEN 1 ELSE 0 END,
          CASE WHEN NEW.verdict = 'Accepted' THEN 100 ELSE 0 END)
  ON CONFLICT (problem_slug) DO UPDATE
  SET total_submissions = public.coding_problems_meta.total_submissions + 1,
      total_accepted = public.coding_problems_meta.total_accepted + CASE WHEN NEW.verdict = 'Accepted' THEN 1 ELSE 0 END,
      updated_at = now();
  UPDATE public.coding_problems_meta
  SET acceptance_rate = ROUND((total_accepted::numeric / NULLIF(total_submissions, 0)) * 100, 2)
  WHERE problem_slug = NEW.problem_slug;
  IF NEW.verdict = 'Accepted' THEN
    INSERT INTO public.user_activity_log (user_id, activity_type, title, description, metadata)
    VALUES (NEW.user_id, 'code_submission', 'Solved Coding Problem', NEW.problem_slug,
      jsonb_build_object('problem_slug', NEW.problem_slug, 'language', NEW.language,
        'runtime_ms', NEW.runtime_ms, 'memory_kb', NEW.memory_kb));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_handle_code_submission_aftermath AFTER INSERT ON public.code_submissions
FOR EACH ROW EXECUTE FUNCTION public.handle_code_submission_aftermath();

CREATE TABLE public.user_sheet_prefs (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sheet_id text NOT NULL,
  prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, sheet_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sheet_prefs TO authenticated;
GRANT ALL ON public.user_sheet_prefs TO service_role;
ALTER TABLE public.user_sheet_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sheet prefs read"   ON public.user_sheet_prefs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own sheet prefs insert" ON public.user_sheet_prefs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sheet prefs update" ON public.user_sheet_prefs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sheet prefs delete" ON public.user_sheet_prefs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.tg_user_sheet_prefs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER user_sheet_prefs_set_updated_at BEFORE UPDATE ON public.user_sheet_prefs
FOR EACH ROW EXECUTE FUNCTION public.tg_user_sheet_prefs_updated_at();

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
GRANT SELECT ON public.coding_problem_discussions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coding_problem_discussions TO authenticated;
GRANT ALL ON public.coding_problem_discussions TO service_role;
CREATE INDEX idx_cpd_slug_created ON public.coding_problem_discussions(problem_slug, created_at DESC);
CREATE INDEX idx_cpd_parent ON public.coding_problem_discussions(parent_id);
ALTER TABLE public.coding_problem_discussions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "discussions readable by all" ON public.coding_problem_discussions FOR SELECT
  USING (deleted_at IS NULL OR auth.uid() = user_id);
CREATE POLICY "users insert own discussions" ON public.coding_problem_discussions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own discussions" ON public.coding_problem_discussions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own discussions" ON public.coding_problem_discussions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE TRIGGER update_cpd_updated_at BEFORE UPDATE ON public.coding_problem_discussions
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

-- Tighten quiz_results reads, expose leaderboards via RPCs
DROP POLICY IF EXISTS "Authenticated users can view quiz results for leaderboard" ON public.quiz_results;
CREATE POLICY "Users can view their own quiz results" ON public.quiz_results
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_quiz_leaderboard(
  p_quiz_type text, p_difficulty text DEFAULT NULL, p_since timestamptz DEFAULT NULL,
  p_order_by_total boolean DEFAULT false, p_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid, user_id uuid, quiz_type text, score integer, total_questions integer,
  accuracy numeric, avg_time_seconds integer, total_time_seconds integer,
  completed_at timestamptz, full_name text, avatar_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT qr.id, qr.user_id, qr.quiz_type, qr.score, qr.total_questions, qr.accuracy,
    qr.avg_time_seconds, qr.total_time_seconds, qr.completed_at, p.full_name, p.avatar_url
  FROM public.quiz_results qr
  LEFT JOIN public.profiles p ON p.user_id = qr.user_id
  WHERE qr.quiz_type = p_quiz_type
    AND (p_difficulty IS NULL OR qr.difficulty = p_difficulty)
    AND (p_since IS NULL OR qr.completed_at >= p_since)
  ORDER BY qr.accuracy DESC,
    CASE WHEN p_order_by_total THEN qr.total_time_seconds ELSE qr.avg_time_seconds END ASC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

CREATE OR REPLACE FUNCTION public.get_fundamentals_leaderboard(
  p_type text DEFAULT 'all', p_since timestamptz DEFAULT NULL, p_limit integer DEFAULT 20
)
RETURNS TABLE (
  user_id uuid, full_name text, avatar_url text,
  total_quizzes bigint, total_score bigint, total_questions bigint,
  avg_accuracy integer, best_accuracy integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH filtered AS (
    SELECT qr.* FROM public.quiz_results qr
    WHERE (p_since IS NULL OR qr.completed_at >= p_since)
      AND (
        p_type = 'all'
        OR (p_type = 'languages' AND qr.quiz_type IN ('c','cpp','java','python','javascript','typescript','go','rust','csharp'))
        OR (p_type = 'oops' AND qr.quiz_type = 'oops')
      )
  )
  SELECT f.user_id, p.full_name, p.avatar_url,
    COUNT(*)::bigint AS total_quizzes,
    SUM(f.score)::bigint AS total_score,
    SUM(f.total_questions)::bigint AS total_questions,
    ROUND(AVG(f.accuracy))::integer AS avg_accuracy,
    MAX(f.accuracy)::integer AS best_accuracy
  FROM filtered f
  LEFT JOIN public.profiles p ON p.user_id = f.user_id
  GROUP BY f.user_id, p.full_name, p.avatar_url
  ORDER BY avg_accuracy DESC, total_quizzes DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

GRANT EXECUTE ON FUNCTION public.get_quiz_leaderboard(text,text,timestamptz,boolean,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fundamentals_leaderboard(text,timestamptz,integer) TO authenticated;