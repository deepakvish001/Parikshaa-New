-- === 20260428073613: code_runs ===
CREATE TABLE public.code_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  problem_slug text NOT NULL,
  language text NOT NULL,
  language_id integer NOT NULL,
  source_code text NOT NULL DEFAULT '',
  stdin text NOT NULL DEFAULT '',
  stdout text,
  stderr text,
  compile_output text,
  status text,
  status_id integer,
  time_ms integer,
  memory_kb integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.code_runs TO authenticated;
GRANT ALL ON public.code_runs TO service_role;
ALTER TABLE public.code_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their own runs" ON public.code_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert their own runs" ON public.code_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own runs" ON public.code_runs FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_code_runs_user_problem ON public.code_runs (user_id, problem_slug, created_at DESC);
CREATE INDEX idx_code_runs_user_created ON public.code_runs (user_id, created_at DESC);

-- === 20260428121640: user_problem_solutions ===
CREATE TABLE public.user_problem_solutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  problem_slug TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  code JSONB NOT NULL DEFAULT '{}'::jsonb,
  code_updated_at JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, problem_slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_problem_solutions TO authenticated;
GRANT ALL ON public.user_problem_solutions TO service_role;
ALTER TABLE public.user_problem_solutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their own solutions" ON public.user_problem_solutions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert their own solutions" ON public.user_problem_solutions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own solutions" ON public.user_problem_solutions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete their own solutions" ON public.user_problem_solutions FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_user_problem_solutions_user ON public.user_problem_solutions(user_id);
CREATE INDEX idx_user_problem_solutions_slug ON public.user_problem_solutions(user_id, problem_slug);
CREATE TRIGGER update_user_problem_solutions_updated_at BEFORE UPDATE ON public.user_problem_solutions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- === 20260428124636: daily_challenge_completions + optin ===
CREATE TABLE public.daily_challenge_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_date DATE NOT NULL,
  problem_slug TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_challenge_completions TO authenticated;
GRANT ALL ON public.daily_challenge_completions TO service_role;
CREATE INDEX idx_dcc_user_date ON public.daily_challenge_completions (user_id, challenge_date DESC);
ALTER TABLE public.daily_challenge_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own completions" ON public.daily_challenge_completions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own completions" ON public.daily_challenge_completions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own completions" ON public.daily_challenge_completions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.daily_challenge_leaderboard_optin (
  user_id UUID NOT NULL PRIMARY KEY,
  opted_in BOOLEAN NOT NULL DEFAULT false,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_challenge_leaderboard_optin TO authenticated;
GRANT ALL ON public.daily_challenge_leaderboard_optin TO service_role;
ALTER TABLE public.daily_challenge_leaderboard_optin ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own optin" ON public.daily_challenge_leaderboard_optin FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated view opted-in users" ON public.daily_challenge_leaderboard_optin FOR SELECT TO authenticated USING (opted_in = true);
CREATE POLICY "Users insert own optin" ON public.daily_challenge_leaderboard_optin FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own optin" ON public.daily_challenge_leaderboard_optin FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_dclo_updated_at BEFORE UPDATE ON public.daily_challenge_leaderboard_optin FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- === get_daily_challenge_leaderboard RPC (final version) ===
CREATE OR REPLACE FUNCTION public.get_daily_challenge_leaderboard(_limit integer DEFAULT 50)
 RETURNS TABLE(user_id uuid, display_name text, username text, avatar_url text, current_streak integer, weekly_completions integer, total_completions integer, last_completed_at timestamp with time zone)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  RETURN QUERY
  WITH opted AS (SELECT o.user_id, o.display_name FROM public.daily_challenge_leaderboard_optin o WHERE o.opted_in = true),
  agg AS (
    SELECT c.user_id, COUNT(*)::INTEGER AS total_completions,
           COUNT(*) FILTER (WHERE c.challenge_date >= (CURRENT_DATE - INTERVAL '6 days'))::INTEGER AS weekly_completions,
           MAX(c.completed_at) AS last_completed_at
    FROM public.daily_challenge_completions c WHERE c.user_id IN (SELECT user_id FROM opted) GROUP BY c.user_id
  ),
  streaks AS (
    SELECT sub.user_id, COUNT(*)::INTEGER AS current_streak FROM (
      SELECT c.user_id, c.challenge_date, (CURRENT_DATE - c.challenge_date) AS days_ago,
             ROW_NUMBER() OVER (PARTITION BY c.user_id ORDER BY c.challenge_date DESC) - 1 AS rn
      FROM public.daily_challenge_completions c
      WHERE c.user_id IN (SELECT user_id FROM opted) AND c.challenge_date >= (CURRENT_DATE - INTERVAL '365 days')
    ) sub
    WHERE sub.days_ago = sub.rn
       OR (sub.rn = 0 AND sub.days_ago = 1)
       OR (sub.rn > 0 AND sub.days_ago = sub.rn + (CASE WHEN EXISTS (SELECT 1 FROM public.daily_challenge_completions c2 WHERE c2.user_id = sub.user_id AND c2.challenge_date = CURRENT_DATE) THEN 0 ELSE 1 END))
    GROUP BY sub.user_id
  )
  SELECT o.user_id, COALESCE(o.display_name, p.full_name, 'Anonymous') AS display_name,
    upe.username, p.avatar_url,
    COALESCE(s.current_streak, 0), COALESCE(a.weekly_completions, 0), COALESCE(a.total_completions, 0), a.last_completed_at
  FROM opted o
  LEFT JOIN agg a ON a.user_id = o.user_id
  LEFT JOIN streaks s ON s.user_id = o.user_id
  LEFT JOIN public.profiles p ON p.user_id = o.user_id
  LEFT JOIN public.user_profiles_extended upe ON upe.user_id = o.user_id
  ORDER BY current_streak DESC NULLS LAST, weekly_completions DESC, total_completions DESC, last_completed_at DESC NULLS LAST
  LIMIT _limit;
END;
$function$;
REVOKE ALL ON FUNCTION public.get_daily_challenge_leaderboard(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_daily_challenge_leaderboard(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_daily_challenge_leaderboard(integer) TO authenticated;

-- === audit_daily_completions functions ===
CREATE OR REPLACE FUNCTION public.audit_daily_completions()
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); removed integer := 0; gaps text[] := ARRAY[]::text[]; cur_date date;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, challenge_date ORDER BY completed_at ASC, (CASE WHEN COALESCE(problem_slug, '') = '' THEN 1 ELSE 0 END) ASC, created_at ASC) AS rn
    FROM public.daily_challenge_completions WHERE user_id = uid
  ), deleted AS (
    DELETE FROM public.daily_challenge_completions c USING ranked r WHERE c.id = r.id AND r.rn > 1 RETURNING c.id
  )
  SELECT COUNT(*) INTO removed FROM deleted;
  FOR cur_date IN SELECT d::date FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, INTERVAL '1 day') d LOOP
    IF NOT EXISTS (SELECT 1 FROM public.daily_challenge_completions WHERE user_id = uid AND challenge_date = cur_date) THEN
      gaps := array_append(gaps, to_char(cur_date, 'YYYY-MM-DD'));
    END IF;
  END LOOP;
  RETURN jsonb_build_object('duplicates_removed', removed, 'gaps_last_30d', gaps, 'audited_at', now());
END;
$function$;
REVOKE ALL ON FUNCTION public.audit_daily_completions() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_daily_completions() FROM anon;
GRANT EXECUTE ON FUNCTION public.audit_daily_completions() TO authenticated;

CREATE OR REPLACE FUNCTION public.audit_daily_completions_all()
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE removed integer := 0;
BEGIN
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, challenge_date ORDER BY completed_at ASC, (CASE WHEN COALESCE(problem_slug, '') = '' THEN 1 ELSE 0 END) ASC, created_at ASC) AS rn
    FROM public.daily_challenge_completions
  ), deleted AS (
    DELETE FROM public.daily_challenge_completions c USING ranked r WHERE c.id = r.id AND r.rn > 1 RETURNING c.id
  )
  SELECT COUNT(*) INTO removed FROM deleted;
  RETURN jsonb_build_object('duplicates_removed', removed, 'audited_at', now());
END;
$function$;
REVOKE ALL ON FUNCTION public.audit_daily_completions_all() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_daily_completions_all() FROM anon;
REVOKE ALL ON FUNCTION public.audit_daily_completions_all() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.audit_daily_completions_all() TO service_role;

-- === get_submission_percentiles RPC ===
CREATE OR REPLACE FUNCTION public.get_submission_percentiles(_submission_id uuid)
RETURNS TABLE (total_users integer, runtime_beats numeric, memory_beats numeric, runtime_ms integer, memory_kb integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE _sub RECORD; _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL THEN RETURN; END IF;
  SELECT s.user_id, s.problem_slug, s.language, s.verdict, s.runtime_ms, s.memory_kb INTO _sub
  FROM public.code_submissions s WHERE s.id = _submission_id AND s.user_id = _caller;
  IF NOT FOUND OR _sub.verdict <> 'Accepted' THEN RETURN; END IF;
  RETURN QUERY
  WITH best_per_user AS (
    SELECT s.user_id, MIN(NULLIF(s.runtime_ms, 0)) AS best_runtime, MIN(NULLIF(s.memory_kb, 0)) AS best_memory
    FROM public.code_submissions s
    WHERE s.problem_slug = _sub.problem_slug AND s.language = _sub.language AND s.verdict = 'Accepted' AND s.user_id <> _sub.user_id
    GROUP BY s.user_id
  ), agg AS (
    SELECT COUNT(*)::int AS n,
      COUNT(*) FILTER (WHERE best_runtime IS NOT NULL AND _sub.runtime_ms IS NOT NULL AND _sub.runtime_ms <= best_runtime)::numeric AS rt_wins,
      COUNT(*) FILTER (WHERE best_runtime IS NOT NULL AND _sub.runtime_ms IS NOT NULL)::numeric AS rt_total,
      COUNT(*) FILTER (WHERE best_memory IS NOT NULL AND _sub.memory_kb IS NOT NULL AND _sub.memory_kb <= best_memory)::numeric AS mem_wins,
      COUNT(*) FILTER (WHERE best_memory IS NOT NULL AND _sub.memory_kb IS NOT NULL)::numeric AS mem_total
    FROM best_per_user
  )
  SELECT agg.n,
    CASE WHEN agg.rt_total > 0 THEN ROUND((agg.rt_wins / agg.rt_total) * 100, 1) ELSE NULL END,
    CASE WHEN agg.mem_total > 0 THEN ROUND((agg.mem_wins / agg.mem_total) * 100, 1) ELSE NULL END,
    _sub.runtime_ms, _sub.memory_kb
  FROM agg;
END;
$$;
REVOKE ALL ON FUNCTION public.get_submission_percentiles(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_submission_percentiles(uuid) TO authenticated;