-- =========================================================
-- 1. Roles infrastructure
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage all roles" ON public.user_roles;
CREATE POLICY "Admins manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 2. Coding problems (parent table)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.coding_problems (
  slug text PRIMARY KEY,
  title text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  topics text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  examples jsonb NOT NULL DEFAULT '[]'::jsonb,
  constraints text[] NOT NULL DEFAULT '{}',
  hints text[] NOT NULL DEFAULT '{}',
  cpu_time_limit_sec numeric(5,2) DEFAULT 2.0,
  memory_limit_kb integer DEFAULT 256000,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coding_problems TO authenticated;
GRANT SELECT ON public.coding_problems TO anon;
GRANT ALL ON public.coding_problems TO service_role;

ALTER TABLE public.coding_problems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published problems" ON public.coding_problems;
CREATE POLICY "Public can view published problems"
  ON public.coding_problems FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage problems" ON public.coding_problems;
CREATE POLICY "Admins manage problems"
  ON public.coding_problems FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS coding_problems_set_updated_at ON public.coding_problems;
CREATE TRIGGER coding_problems_set_updated_at
  BEFORE UPDATE ON public.coding_problems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_coding_problems_difficulty ON public.coding_problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_coding_problems_published ON public.coding_problems(is_published);

-- =========================================================
-- 3. Per-language starter code
-- =========================================================
CREATE TABLE IF NOT EXISTS public.coding_problem_starter_code (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_slug text NOT NULL REFERENCES public.coding_problems(slug) ON DELETE CASCADE,
  lang_id text NOT NULL,
  code text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (problem_slug, lang_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coding_problem_starter_code TO authenticated;
GRANT SELECT ON public.coding_problem_starter_code TO anon;
GRANT ALL ON public.coding_problem_starter_code TO service_role;

ALTER TABLE public.coding_problem_starter_code ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read starter code of published problems" ON public.coding_problem_starter_code;
CREATE POLICY "Public can read starter code of published problems"
  ON public.coding_problem_starter_code FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coding_problems p
      WHERE p.slug = problem_slug
        AND (p.is_published = true OR public.has_role(auth.uid(), 'admin'))
    )
  );

DROP POLICY IF EXISTS "Admins manage starter code" ON public.coding_problem_starter_code;
CREATE POLICY "Admins manage starter code"
  ON public.coding_problem_starter_code FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 4. Reference solutions (admin-only)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.coding_problem_reference_solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_slug text NOT NULL REFERENCES public.coding_problems(slug) ON DELETE CASCADE,
  lang_id text NOT NULL,
  code text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (problem_slug, lang_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coding_problem_reference_solutions TO authenticated;
GRANT ALL ON public.coding_problem_reference_solutions TO service_role;

ALTER TABLE public.coding_problem_reference_solutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins fully manage reference solutions" ON public.coding_problem_reference_solutions;
CREATE POLICY "Admins fully manage reference solutions"
  ON public.coding_problem_reference_solutions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 5. Test cases
-- =========================================================
CREATE TABLE IF NOT EXISTS public.coding_problem_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_slug text NOT NULL REFERENCES public.coding_problems(slug) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('sample','hidden')),
  input text NOT NULL DEFAULT '',
  expected text NOT NULL DEFAULT '',
  ord integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coding_problem_tests TO authenticated;
GRANT SELECT ON public.coding_problem_tests TO anon;
GRANT ALL ON public.coding_problem_tests TO service_role;

ALTER TABLE public.coding_problem_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read sample tests of published problems" ON public.coding_problem_tests;
CREATE POLICY "Public can read sample tests of published problems"
  ON public.coding_problem_tests FOR SELECT
  USING (
    (kind = 'sample' AND EXISTS (
      SELECT 1 FROM public.coding_problems p
      WHERE p.slug = problem_slug AND p.is_published = true
    ))
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admins manage tests" ON public.coding_problem_tests;
CREATE POLICY "Admins manage tests"
  ON public.coding_problem_tests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_problem_tests_slug_kind ON public.coding_problem_tests(problem_slug, kind, ord);

-- =========================================================
-- 6. SQL problem specs
-- =========================================================
CREATE TABLE IF NOT EXISTS public.coding_problem_sql_specs (
  problem_slug text PRIMARY KEY REFERENCES public.coding_problems(slug) ON DELETE CASCADE,
  schema_sql text NOT NULL DEFAULT '',
  seed_sql text NOT NULL DEFAULT '',
  reference_query text NOT NULL DEFAULT '',
  order_matters boolean NOT NULL DEFAULT false,
  starter text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coding_problem_sql_specs TO authenticated;
GRANT SELECT ON public.coding_problem_sql_specs TO anon;
GRANT ALL ON public.coding_problem_sql_specs TO service_role;

ALTER TABLE public.coding_problem_sql_specs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read sql specs of published problems" ON public.coding_problem_sql_specs;
CREATE POLICY "Public read sql specs of published problems"
  ON public.coding_problem_sql_specs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coding_problems p
      WHERE p.slug = problem_slug AND p.is_published = true
    )
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admins manage sql specs" ON public.coding_problem_sql_specs;
CREATE POLICY "Admins manage sql specs"
  ON public.coding_problem_sql_specs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 7. Admin audit log
-- =========================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_slug text,
  diff jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins read audit log"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins write audit log" ON public.admin_audit_log;
CREATE POLICY "Admins write audit log"
  ON public.admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND actor_id = auth.uid());

-- =========================================================
-- 8. Admin RPCs
-- =========================================================
CREATE OR REPLACE FUNCTION public.admin_save_problem(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _slug text := payload->>'slug';
  _uid uuid := auth.uid();
  _lang text;
  _code text;
  _test jsonb;
  _i int := 0;
BEGIN
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;
  IF _slug IS NULL OR length(_slug) = 0 THEN
    RAISE EXCEPTION 'slug is required';
  END IF;

  INSERT INTO public.coding_problems (
    slug, title, difficulty, topics, description, examples,
    constraints, hints, cpu_time_limit_sec, memory_limit_kb,
    is_published, created_by
  ) VALUES (
    _slug,
    payload->>'title',
    COALESCE(payload->>'difficulty', 'medium'),
    COALESCE((SELECT array_agg(value::text) FROM jsonb_array_elements_text(payload->'topics')), '{}'),
    COALESCE(payload->>'description', ''),
    COALESCE(payload->'examples', '[]'::jsonb),
    COALESCE((SELECT array_agg(value::text) FROM jsonb_array_elements_text(payload->'constraints')), '{}'),
    COALESCE((SELECT array_agg(value::text) FROM jsonb_array_elements_text(payload->'hints')), '{}'),
    COALESCE((payload->>'cpu_time_limit_sec')::numeric, 2.0),
    COALESCE((payload->>'memory_limit_kb')::int, 256000),
    COALESCE((payload->>'is_published')::boolean, false),
    _uid
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    difficulty = EXCLUDED.difficulty,
    topics = EXCLUDED.topics,
    description = EXCLUDED.description,
    examples = EXCLUDED.examples,
    constraints = EXCLUDED.constraints,
    hints = EXCLUDED.hints,
    cpu_time_limit_sec = EXCLUDED.cpu_time_limit_sec,
    memory_limit_kb = EXCLUDED.memory_limit_kb,
    is_published = EXCLUDED.is_published,
    updated_at = now();

  IF payload ? 'starter_code' THEN
    DELETE FROM public.coding_problem_starter_code WHERE problem_slug = _slug;
    FOR _lang, _code IN SELECT key, value FROM jsonb_each_text(payload->'starter_code') LOOP
      INSERT INTO public.coding_problem_starter_code (problem_slug, lang_id, code)
      VALUES (_slug, _lang, _code);
    END LOOP;
  END IF;

  IF payload ? 'reference_solution' THEN
    DELETE FROM public.coding_problem_reference_solutions WHERE problem_slug = _slug;
    FOR _lang, _code IN SELECT key, value FROM jsonb_each_text(payload->'reference_solution') LOOP
      INSERT INTO public.coding_problem_reference_solutions (problem_slug, lang_id, code)
      VALUES (_slug, _lang, _code);
    END LOOP;
  END IF;

  IF payload ? 'sample_tests' THEN
    DELETE FROM public.coding_problem_tests WHERE problem_slug = _slug AND kind = 'sample';
    _i := 0;
    FOR _test IN SELECT value FROM jsonb_array_elements(payload->'sample_tests') LOOP
      INSERT INTO public.coding_problem_tests (problem_slug, kind, input, expected, ord)
      VALUES (_slug, 'sample', COALESCE(_test->>'input',''), COALESCE(_test->>'expected',''), _i);
      _i := _i + 1;
    END LOOP;
  END IF;

  IF payload ? 'hidden_tests' THEN
    DELETE FROM public.coding_problem_tests WHERE problem_slug = _slug AND kind = 'hidden';
    _i := 0;
    FOR _test IN SELECT value FROM jsonb_array_elements(payload->'hidden_tests') LOOP
      INSERT INTO public.coding_problem_tests (problem_slug, kind, input, expected, ord)
      VALUES (_slug, 'hidden', COALESCE(_test->>'input',''), COALESCE(_test->>'expected',''), _i);
      _i := _i + 1;
    END LOOP;
  END IF;

  IF payload ? 'sql_spec' AND jsonb_typeof(payload->'sql_spec') = 'object' THEN
    INSERT INTO public.coding_problem_sql_specs (problem_slug, schema_sql, seed_sql, reference_query, order_matters, starter)
    VALUES (
      _slug,
      COALESCE(payload->'sql_spec'->>'schema_sql', ''),
      COALESCE(payload->'sql_spec'->>'seed_sql', ''),
      COALESCE(payload->'sql_spec'->>'reference_query', ''),
      COALESCE((payload->'sql_spec'->>'order_matters')::boolean, false),
      COALESCE(payload->'sql_spec'->>'starter', '')
    )
    ON CONFLICT (problem_slug) DO UPDATE SET
      schema_sql = EXCLUDED.schema_sql,
      seed_sql = EXCLUDED.seed_sql,
      reference_query = EXCLUDED.reference_query,
      order_matters = EXCLUDED.order_matters,
      starter = EXCLUDED.starter,
      updated_at = now();
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_slug, diff)
  VALUES (_uid, 'save_problem', 'coding_problem', _slug, payload);

  RETURN jsonb_build_object('ok', true, 'slug', _slug);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_full_problem(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    'problem', to_jsonb(p.*),
    'starter_code', COALESCE((SELECT jsonb_object_agg(lang_id, code) FROM public.coding_problem_starter_code WHERE problem_slug = _slug), '{}'::jsonb),
    'reference_solution', COALESCE((SELECT jsonb_object_agg(lang_id, code) FROM public.coding_problem_reference_solutions WHERE problem_slug = _slug), '{}'::jsonb),
    'sample_tests', COALESCE((SELECT jsonb_agg(jsonb_build_object('input', input, 'expected', expected) ORDER BY ord) FROM public.coding_problem_tests WHERE problem_slug = _slug AND kind = 'sample'), '[]'::jsonb),
    'hidden_tests', COALESCE((SELECT jsonb_agg(jsonb_build_object('input', input, 'expected', expected) ORDER BY ord) FROM public.coding_problem_tests WHERE problem_slug = _slug AND kind = 'hidden'), '[]'::jsonb),
    'sql_spec', (SELECT to_jsonb(s.*) FROM public.coding_problem_sql_specs s WHERE problem_slug = _slug)
  ) INTO result
  FROM public.coding_problems p
  WHERE p.slug = _slug;

  RETURN result;
END;
$$;

-- =========================================================
-- CONTESTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  rules_md text DEFAULT '',
  banner_url text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','live','ended','archived')),
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','unlisted','private')),
  invite_code text,
  max_participants integer,
  scoring_mode text NOT NULL DEFAULT 'icpc' CHECK (scoring_mode IN ('icpc','ioi','points')),
  penalty_minutes integer NOT NULL DEFAULT 10,
  kind text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contests TO authenticated;
GRANT SELECT ON public.contests TO anon;
GRANT ALL ON public.contests TO service_role;

CREATE INDEX IF NOT EXISTS idx_contests_status ON public.contests(status);
CREATE INDEX IF NOT EXISTS idx_contests_starts_at ON public.contests(starts_at);

ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contests public read"
ON public.contests FOR SELECT
USING (
  (visibility IN ('public','unlisted') AND status IN ('published','live','ended'))
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "contests admin all"
ON public.contests FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.contest_problems (
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  problem_slug text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 100,
  unlock_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contest_id, problem_slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_problems TO authenticated;
GRANT SELECT ON public.contest_problems TO anon;
GRANT ALL ON public.contest_problems TO service_role;

CREATE INDEX IF NOT EXISTS idx_contest_problems_contest ON public.contest_problems(contest_id);

ALTER TABLE public.contest_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contest_problems public read after start"
ON public.contest_problems FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contests c
    WHERE c.id = contest_problems.contest_id
      AND (
        (c.visibility IN ('public','unlisted') AND c.status IN ('live','ended') AND c.starts_at <= now())
        OR has_role(auth.uid(), 'admin'::app_role)
      )
  )
);

CREATE POLICY "contest_problems admin all"
ON public.contest_problems FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.contest_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','disqualified','withdrawn')),
  display_name text,
  team_name text,
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contest_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_registrations TO authenticated;
GRANT ALL ON public.contest_registrations TO service_role;

CREATE INDEX IF NOT EXISTS idx_contest_registrations_contest ON public.contest_registrations(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_registrations_user ON public.contest_registrations(user_id);

ALTER TABLE public.contest_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registrations self read"
ON public.contest_registrations FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "registrations public read for visible contests"
ON public.contest_registrations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contests c
    WHERE c.id = contest_registrations.contest_id
      AND c.visibility = 'public'
      AND c.status IN ('published','live','ended')
  )
);

CREATE POLICY "registrations self insert"
ON public.contest_registrations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "registrations self delete"
ON public.contest_registrations FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "registrations admin all"
ON public.contest_registrations FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.contest_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  problem_slug text NOT NULL,
  submission_id uuid,
  verdict text NOT NULL,
  points_awarded integer NOT NULL DEFAULT 0,
  penalty_seconds integer NOT NULL DEFAULT 0,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_submissions TO authenticated;
GRANT ALL ON public.contest_submissions TO service_role;

CREATE INDEX IF NOT EXISTS idx_contest_submissions_contest_user ON public.contest_submissions(contest_id, user_id);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_problem ON public.contest_submissions(contest_id, problem_slug);

ALTER TABLE public.contest_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contest_submissions self read"
ON public.contest_submissions FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "contest_submissions public read after end"
ON public.contest_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contests c
    WHERE c.id = contest_submissions.contest_id
      AND c.status = 'ended'
      AND c.visibility IN ('public','unlisted')
  )
);

CREATE POLICY "contest_submissions admin all"
ON public.contest_submissions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.contest_leaderboard_cache (
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rank integer NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 0,
  total_penalty_seconds integer NOT NULL DEFAULT 0,
  problems_solved integer NOT NULL DEFAULT 0,
  last_solve_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contest_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_leaderboard_cache TO authenticated;
GRANT SELECT ON public.contest_leaderboard_cache TO anon;
GRANT ALL ON public.contest_leaderboard_cache TO service_role;

CREATE INDEX IF NOT EXISTS idx_contest_lb_contest ON public.contest_leaderboard_cache(contest_id, rank);

ALTER TABLE public.contest_leaderboard_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaderboard public read"
ON public.contest_leaderboard_cache FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contests c
    WHERE c.id = contest_leaderboard_cache.contest_id
      AND c.visibility IN ('public','unlisted')
      AND c.status IN ('published','live','ended')
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "leaderboard admin all"
ON public.contest_leaderboard_cache FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_contests_updated_at ON public.contests;
CREATE TRIGGER trg_contests_updated_at
BEFORE UPDATE ON public.contests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.recompute_contest_leaderboard(_contest_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_starts timestamptz;
  c_penalty integer;
BEGIN
  SELECT starts_at, penalty_minutes INTO c_starts, c_penalty
  FROM public.contests WHERE id = _contest_id;
  IF c_starts IS NULL THEN RETURN; END IF;

  DELETE FROM public.contest_leaderboard_cache WHERE contest_id = _contest_id;

  WITH solved AS (
    SELECT
      cs.user_id,
      cs.problem_slug,
      MIN(cs.submitted_at) FILTER (WHERE cs.verdict = 'accepted') AS solved_at,
      COUNT(*) FILTER (WHERE cs.verdict <> 'accepted'
                       AND cs.submitted_at < (
                         SELECT MIN(cs2.submitted_at)
                         FROM public.contest_submissions cs2
                         WHERE cs2.contest_id = cs.contest_id
                           AND cs2.user_id = cs.user_id
                           AND cs2.problem_slug = cs.problem_slug
                           AND cs2.verdict = 'accepted'
                       )) AS wrong_before
    FROM public.contest_submissions cs
    WHERE cs.contest_id = _contest_id
    GROUP BY cs.user_id, cs.problem_slug
  ),
  per_user AS (
    SELECT
      s.user_id,
      COUNT(*) FILTER (WHERE s.solved_at IS NOT NULL) AS problems_solved,
      COALESCE(SUM(cp.points) FILTER (WHERE s.solved_at IS NOT NULL), 0) AS total_points,
      COALESCE(SUM(
        EXTRACT(EPOCH FROM (s.solved_at - c_starts))::int
        + COALESCE(s.wrong_before, 0) * c_penalty * 60
      ) FILTER (WHERE s.solved_at IS NOT NULL), 0)::int AS total_penalty_seconds,
      MAX(s.solved_at) AS last_solve_at
    FROM solved s
    LEFT JOIN public.contest_problems cp
      ON cp.contest_id = _contest_id AND cp.problem_slug = s.problem_slug
    GROUP BY s.user_id
  ),
  ranked AS (
    SELECT pu.*, RANK() OVER (ORDER BY pu.total_points DESC, pu.total_penalty_seconds ASC, pu.last_solve_at ASC NULLS LAST) AS rnk
    FROM per_user pu
  )
  INSERT INTO public.contest_leaderboard_cache
    (contest_id, user_id, rank, total_points, total_penalty_seconds, problems_solved, last_solve_at, updated_at)
  SELECT _contest_id, user_id, rnk, total_points, total_penalty_seconds, problems_solved, last_solve_at, now()
  FROM ranked;
END;
$$;

CREATE OR REPLACE FUNCTION public.mirror_code_submission_to_contests()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.id AS contest_id
    FROM public.contests c
    JOIN public.contest_problems cp ON cp.contest_id = c.id AND cp.problem_slug = NEW.problem_slug
    JOIN public.contest_registrations cr ON cr.contest_id = c.id AND cr.user_id = NEW.user_id AND cr.status = 'registered'
    WHERE NEW.created_at >= c.starts_at AND NEW.created_at <= c.ends_at
  LOOP
    INSERT INTO public.contest_submissions
      (contest_id, user_id, problem_slug, submission_id, verdict, points_awarded, penalty_seconds, submitted_at)
    VALUES (r.contest_id, NEW.user_id, NEW.problem_slug, NEW.id,
      CASE WHEN NEW.verdict = 'accepted' THEN 'accepted' ELSE NEW.verdict END, 0, 0, NEW.created_at);
    PERFORM public.recompute_contest_leaderboard(r.contest_id);
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mirror_code_submission_to_contests ON public.code_submissions;
CREATE TRIGGER trg_mirror_code_submission_to_contests
AFTER INSERT ON public.code_submissions
FOR EACH ROW EXECUTE FUNCTION public.mirror_code_submission_to_contests();

CREATE OR REPLACE FUNCTION public.register_for_contest(_contest_id uuid, _invite_code text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.contests%ROWTYPE;
  uid uuid := auth.uid();
  cur_count integer;
  reg_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
  SELECT * INTO c FROM public.contests WHERE id = _contest_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contest not found'; END IF;
  IF c.status NOT IN ('published','live') THEN RAISE EXCEPTION 'Registration not open'; END IF;
  IF c.registration_opens_at IS NOT NULL AND now() < c.registration_opens_at THEN RAISE EXCEPTION 'Registration not open yet'; END IF;
  IF c.registration_closes_at IS NOT NULL AND now() > c.registration_closes_at THEN RAISE EXCEPTION 'Registration closed'; END IF;
  IF c.ends_at < now() THEN RAISE EXCEPTION 'Contest already ended'; END IF;
  IF c.visibility = 'private' AND (_invite_code IS NULL OR _invite_code <> c.invite_code) THEN RAISE EXCEPTION 'Invalid invite code'; END IF;
  IF c.max_participants IS NOT NULL THEN
    SELECT COUNT(*) INTO cur_count FROM public.contest_registrations WHERE contest_id = _contest_id AND status = 'registered';
    IF cur_count >= c.max_participants THEN RAISE EXCEPTION 'Contest is full'; END IF;
  END IF;
  INSERT INTO public.contest_registrations (contest_id, user_id, status)
  VALUES (_contest_id, uid, 'registered')
  ON CONFLICT (contest_id, user_id) DO UPDATE SET status = 'registered'
  RETURNING id INTO reg_id;
  RETURN reg_id;
END;
$$;

-- =========================================================
-- Blog: bookmark_count
-- =========================================================
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS bookmark_count bigint NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.blog_bookmarks_count_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_posts SET bookmark_count = bookmark_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_posts SET bookmark_count = GREATEST(0, bookmark_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_blog_bookmarks_count ON public.blog_bookmarks;
CREATE TRIGGER trg_blog_bookmarks_count AFTER INSERT OR DELETE ON public.blog_bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.blog_bookmarks_count_fn();

UPDATE public.blog_posts p
SET bookmark_count = COALESCE(c.cnt, 0)
FROM (SELECT post_id, COUNT(*) AS cnt FROM public.blog_bookmarks GROUP BY post_id) c
WHERE c.post_id = p.id;
