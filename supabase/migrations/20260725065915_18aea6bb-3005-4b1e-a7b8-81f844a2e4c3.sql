-- FILE: supabase/migrations/20260204093126
CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  daily_target INTEGER NOT NULL DEFAULT 5,
  weekly_target INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own goals" ON public.user_goals;
CREATE POLICY "Users can view their own goals" ON public.user_goals FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own goals" ON public.user_goals;
CREATE POLICY "Users can insert their own goals" ON public.user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own goals" ON public.user_goals;
CREATE POLICY "Users can update their own goals" ON public.user_goals FOR UPDATE USING (auth.uid() = user_id);
DROP TRIGGER IF EXISTS update_user_goals_updated_at ON public.user_goals;
CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON public.user_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_goals
  ADD COLUMN IF NOT EXISTS daily_xp_target INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS weekly_xp_target INTEGER DEFAULT 300;

CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON public.user_profiles_extended(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_xp_this_week ON public.user_profiles_extended(xp_this_week DESC);

DROP POLICY IF EXISTS "Anyone can view profiles for leaderboard" ON public.profiles;
CREATE POLICY "Anyone can view profiles for leaderboard" ON public.profiles FOR SELECT USING (true);

-- Views (all security_invoker)
DROP VIEW IF EXISTS public.leaderboard_view CASCADE;
CREATE VIEW public.leaderboard_view WITH (security_invoker = true) AS
SELECT p.user_id, p.full_name, p.avatar_url,
  COALESCE(progress.completed_count, 0::bigint) AS completed_count,
  COALESCE(progress.revision_count, 0::bigint) AS revision_count
FROM public.profiles p
LEFT JOIN (
  SELECT user_id,
    count(*) FILTER (WHERE completed = true) AS completed_count,
    count(*) FILTER (WHERE is_revision = true) AS revision_count
  FROM public.user_topic_progress GROUP BY user_id
) progress ON p.user_id = progress.user_id
WHERE COALESCE(progress.completed_count, 0::bigint) > 0
ORDER BY completed_count DESC LIMIT 50;

DROP VIEW IF EXISTS public.xp_leaderboard_view CASCADE;
CREATE VIEW public.xp_leaderboard_view WITH (security_invoker = true) AS
SELECT upe.user_id, upe.username, upe.total_xp, upe.current_level, upe.xp_this_week,
  p.full_name, p.avatar_url
FROM public.user_profiles_extended upe
LEFT JOIN public.profiles p ON p.user_id = upe.user_id
WHERE upe.total_xp > 0 AND upe.username IS NOT NULL AND upe.username <> ''
ORDER BY upe.total_xp DESC;

DROP VIEW IF EXISTS public.roadmap_leaderboard_view CASCADE;
CREATE VIEW public.roadmap_leaderboard_view WITH (security_invoker = true) AS
SELECT user_id,
  count(DISTINCT topic_id) FILTER (WHERE completed = true AND sheet_id LIKE 'roadmap-tree-%') AS completed_topics,
  count(DISTINCT sheet_id) FILTER (WHERE completed = true AND sheet_id LIKE 'roadmap-tree-%') AS roadmaps_started,
  max(completed_at) FILTER (WHERE completed = true AND sheet_id LIKE 'roadmap-tree-%') AS last_completed_at
FROM public.user_topic_progress
WHERE sheet_id LIKE 'roadmap-tree-%'
GROUP BY user_id
HAVING count(DISTINCT topic_id) FILTER (WHERE completed = true) > 0
ORDER BY completed_topics DESC;

DROP VIEW IF EXISTS public.public_user_profiles CASCADE;
CREATE VIEW public.public_user_profiles WITH (security_invoker = true) AS
SELECT user_id, username, bio, location, occupation, website, skills, interests, goals, aspirations,
  twitter_url, linkedin_url, github_url, instagram_url, leetcode_url, hackerrank_url, codeforces_url, codechef_url,
  total_xp, xp_this_week, current_level, profile_completion_percentage, created_at
FROM public.user_profiles_extended;

GRANT SELECT ON public.leaderboard_view TO anon, authenticated;
GRANT SELECT ON public.xp_leaderboard_view TO anon, authenticated;
GRANT SELECT ON public.roadmap_leaderboard_view TO anon, authenticated;
GRANT SELECT ON public.public_user_profiles TO anon, authenticated;

-- Resume tables
CREATE TABLE IF NOT EXISTS public.resume_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, template_id INTEGER NOT NULL, template_name TEXT NOT NULL,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.resume_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, template_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(user_id, template_id)
);
ALTER TABLE public.resume_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rd_sel" ON public.resume_downloads;
CREATE POLICY "rd_sel" ON public.resume_downloads FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "rd_ins" ON public.resume_downloads;
CREATE POLICY "rd_ins" ON public.resume_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "rd_del" ON public.resume_downloads;
CREATE POLICY "rd_del" ON public.resume_downloads FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "rf_sel" ON public.resume_favorites;
CREATE POLICY "rf_sel" ON public.resume_favorites FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "rf_ins" ON public.resume_favorites;
CREATE POLICY "rf_ins" ON public.resume_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "rf_del" ON public.resume_favorites;
CREATE POLICY "rf_del" ON public.resume_favorites FOR DELETE USING (auth.uid() = user_id);

-- Outreach
CREATE TABLE IF NOT EXISTS public.outreach_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, template_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(user_id, template_id)
);
CREATE TABLE IF NOT EXISTS public.outreach_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, template_id TEXT NOT NULL, copied_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.outreach_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "of_sel" ON public.outreach_favorites;
CREATE POLICY "of_sel" ON public.outreach_favorites FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "of_ins" ON public.outreach_favorites;
CREATE POLICY "of_ins" ON public.outreach_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "of_del" ON public.outreach_favorites;
CREATE POLICY "of_del" ON public.outreach_favorites FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "ou_sel" ON public.outreach_usage;
CREATE POLICY "ou_sel" ON public.outreach_usage FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "ou_ins" ON public.outreach_usage;
CREATE POLICY "ou_ins" ON public.outreach_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activity log (table already exists — ensure)
DROP POLICY IF EXISTS "System can insert activities" ON public.user_activity_log;
CREATE POLICY "System can insert activities" ON public.user_activity_log FOR INSERT WITH CHECK (true);

-- Trigger functions for activity log
CREATE OR REPLACE FUNCTION public.log_resume_download_activity() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN INSERT INTO public.user_activity_log (user_id, activity_type, title, description, metadata)
VALUES (NEW.user_id, 'resume_download', 'Downloaded Resume Template', NEW.template_name,
  jsonb_build_object('template_id', NEW.template_id, 'template_name', NEW.template_name));
RETURN NEW; END $$;
DROP TRIGGER IF EXISTS on_resume_download ON public.resume_downloads;
CREATE TRIGGER on_resume_download AFTER INSERT ON public.resume_downloads FOR EACH ROW EXECUTE FUNCTION public.log_resume_download_activity();

CREATE OR REPLACE FUNCTION public.log_outreach_activity() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN INSERT INTO public.user_activity_log (user_id, activity_type, title, description, metadata)
VALUES (NEW.user_id, 'outreach_copy', 'Copied Outreach Template', NEW.template_id, jsonb_build_object('template_id', NEW.template_id));
RETURN NEW; END $$;
DROP TRIGGER IF EXISTS on_outreach_copy ON public.outreach_usage;
CREATE TRIGGER on_outreach_copy AFTER INSERT ON public.outreach_usage FOR EACH ROW EXECUTE FUNCTION public.log_outreach_activity();

-- Coding leaderboard difficulty + hidden flag
ALTER TABLE public.coding_problems_meta
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'medium'
    CHECK (difficulty IN ('easy','medium','hard'));
ALTER TABLE public.user_profiles_extended
  ADD COLUMN IF NOT EXISTS coding_leaderboard_hidden boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_code_submissions_accepted
  ON public.code_submissions (user_id, problem_slug)
  WHERE verdict = 'Accepted' AND is_submission = true;
CREATE INDEX IF NOT EXISTS idx_code_submissions_created_at
  ON public.code_submissions (created_at DESC);

CREATE OR REPLACE FUNCTION public.get_coding_leaderboard(
  _window text DEFAULT 'all', _limit int DEFAULT 50, _offset int DEFAULT 0, _search text DEFAULT NULL
) RETURNS TABLE (
  rank bigint, user_id uuid, username text, display_name text, avatar_url text,
  problems_solved int, total_accepted int, acceptance_rate numeric,
  fastest_avg_runtime int, weighted_score numeric, last_accepted_at timestamptz
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE _since timestamptz;
BEGIN
  _since := CASE WHEN _window='today' THEN date_trunc('day', now())
                 WHEN _window='week' THEN now() - interval '7 days' ELSE NULL END;
  RETURN QUERY
  WITH visible_users AS (
    SELECT upe.user_id, upe.username FROM public.user_profiles_extended upe
    WHERE COALESCE(upe.coding_leaderboard_hidden,false)=false
  ),
  acc AS (
    SELECT s.user_id, s.problem_slug,
      MIN(NULLIF(s.runtime_ms,0)) AS best_runtime,
      COUNT(*)::int AS accepted_count,
      MAX(s.created_at) AS last_accepted_at
    FROM public.code_submissions s
    WHERE s.verdict='Accepted' AND s.is_submission=true
      AND (_since IS NULL OR s.created_at >= _since)
    GROUP BY s.user_id, s.problem_slug
  ),
  totals AS (
    SELECT s.user_id, COUNT(*)::int AS total_subs,
      COUNT(*) FILTER (WHERE s.verdict='Accepted')::int AS total_acc
    FROM public.code_submissions s
    WHERE s.is_submission=true AND (_since IS NULL OR s.created_at >= _since)
    GROUP BY s.user_id
  ),
  per_user AS (
    SELECT a.user_id,
      COUNT(DISTINCT a.problem_slug)::int AS problems_solved,
      AVG(a.best_runtime)::int AS fastest_avg_runtime,
      MAX(a.last_accepted_at) AS last_accepted_at,
      SUM(
        CASE COALESCE(m.difficulty,'medium') WHEN 'easy' THEN 1 WHEN 'medium' THEN 3 WHEN 'hard' THEN 5 ELSE 3 END
        + COALESCE(LEAST(
            0.2 * CASE COALESCE(m.difficulty,'medium') WHEN 'easy' THEN 1 WHEN 'medium' THEN 3 WHEN 'hard' THEN 5 ELSE 3 END,
            GREATEST(0, (2000.0 - LEAST(a.best_runtime, 2000)) / 9000.0)
          ), 0)
      )::numeric AS weighted_score
    FROM acc a
    LEFT JOIN public.coding_problems_meta m ON m.problem_slug = a.problem_slug
    GROUP BY a.user_id
  ),
  joined AS (
    SELECT pu.user_id, vu.username,
      COALESCE(p.full_name, vu.username, 'Anonymous') AS display_name, p.avatar_url,
      pu.problems_solved, COALESCE(t.total_acc,0) AS total_accepted,
      CASE WHEN COALESCE(t.total_subs,0)>0
        THEN ROUND((t.total_acc::numeric / t.total_subs) * 100, 1) ELSE 0 END AS acceptance_rate,
      pu.fastest_avg_runtime, pu.weighted_score, pu.last_accepted_at
    FROM per_user pu
    JOIN visible_users vu ON vu.user_id = pu.user_id
    LEFT JOIN public.profiles p ON p.user_id = pu.user_id
    LEFT JOIN totals t ON t.user_id = pu.user_id
    WHERE _search IS NULL OR vu.username ILIKE '%'||_search||'%' OR p.full_name ILIKE '%'||_search||'%'
  )
  SELECT ROW_NUMBER() OVER (ORDER BY j.weighted_score DESC NULLS LAST, j.problems_solved DESC,
    j.fastest_avg_runtime ASC NULLS LAST, j.last_accepted_at DESC NULLS LAST) AS rank,
    j.user_id, j.username, j.display_name, j.avatar_url, j.problems_solved,
    j.total_accepted, j.acceptance_rate, j.fastest_avg_runtime, j.weighted_score, j.last_accepted_at
  FROM joined j ORDER BY rank
  LIMIT GREATEST(_limit,1) OFFSET GREATEST(_offset,0);
END $$;

CREATE OR REPLACE FUNCTION public.get_coding_leaderboard_stats()
RETURNS TABLE (total_participants int, total_accepted_today int, total_accepted_week int, total_problems_solved int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN RETURN QUERY
  WITH visible_users AS (SELECT user_id FROM public.user_profiles_extended WHERE COALESCE(coding_leaderboard_hidden,false)=false)
  SELECT
    (SELECT COUNT(DISTINCT s.user_id)::int FROM public.code_submissions s JOIN visible_users v ON v.user_id=s.user_id WHERE s.verdict='Accepted' AND s.is_submission=true),
    (SELECT COUNT(*)::int FROM public.code_submissions s JOIN visible_users v ON v.user_id=s.user_id WHERE s.verdict='Accepted' AND s.is_submission=true AND s.created_at>=date_trunc('day',now())),
    (SELECT COUNT(*)::int FROM public.code_submissions s JOIN visible_users v ON v.user_id=s.user_id WHERE s.verdict='Accepted' AND s.is_submission=true AND s.created_at>=now()-interval '7 days'),
    (SELECT COUNT(DISTINCT s.problem_slug)::int FROM public.code_submissions s JOIN visible_users v ON v.user_id=s.user_id WHERE s.verdict='Accepted' AND s.is_submission=true);
END $$;

GRANT EXECUTE ON FUNCTION public.get_coding_leaderboard(text,int,int,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_coding_leaderboard_stats() TO anon, authenticated;

-- Grants for new tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_goals TO authenticated;
GRANT ALL ON public.user_goals TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_downloads TO authenticated;
GRANT ALL ON public.resume_downloads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_favorites TO authenticated;
GRANT ALL ON public.resume_favorites TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_favorites TO authenticated;
GRANT ALL ON public.outreach_favorites TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_usage TO authenticated;
GRANT ALL ON public.outreach_usage TO service_role;
