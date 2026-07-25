DO $$ BEGIN CREATE TYPE public.experience_status AS ENUM ('pending','approved','rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.experience_type AS ENUM ('on_campus','off_campus','internship','referral'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.offer_status AS ENUM ('selected','rejected','waitlisted','in_progress'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.experience_report_reason AS ENUM ('spam','misinformation','plagiarism','offensive','personal_info','other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.experience_report_status AS ENUM ('open','resolved','dismissed'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.contest_code_provenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL, contest_id uuid NOT NULL, user_id uuid NOT NULL, problem_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('keystroke','paste','cut','delete_block','ai_suggest','undo','redo','snapshot')),
  char_count integer, paste_size integer, diff_summary jsonb,
  client_ts timestamptz NOT NULL, server_ts timestamptz NOT NULL DEFAULT now(),
  suspicious boolean NOT NULL DEFAULT false, reason text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_code_provenance TO authenticated;
GRANT ALL ON public.contest_code_provenance TO service_role;
ALTER TABLE public.contest_code_provenance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ccp self ins" ON public.contest_code_provenance;
CREATE POLICY "ccp self ins" ON public.contest_code_provenance FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
DROP POLICY IF EXISTS "ccp self read" ON public.contest_code_provenance;
CREATE POLICY "ccp self read" ON public.contest_code_provenance FOR SELECT TO authenticated USING (auth.uid()=user_id);
DROP POLICY IF EXISTS "ccp admin read" ON public.contest_code_provenance;
CREATE POLICY "ccp admin read" ON public.contest_code_provenance FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.contest_problem_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  problem_slug text NOT NULL, variant_key text NOT NULL,
  title text, statement_md text, hidden_test_seed text,
  weight numeric NOT NULL DEFAULT 1.0, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contest_id, problem_slug, variant_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_problem_variants TO authenticated;
GRANT ALL ON public.contest_problem_variants TO service_role;
ALTER TABLE public.contest_problem_variants ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.contest_user_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, problem_slug text NOT NULL,
  variant_id uuid NOT NULL REFERENCES public.contest_problem_variants(id) ON DELETE CASCADE,
  variant_key text NOT NULL, assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contest_id, user_id, problem_slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_user_variants TO authenticated;
GRANT ALL ON public.contest_user_variants TO service_role;
ALTER TABLE public.contest_user_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cpv admin all" ON public.contest_problem_variants;
CREATE POLICY "cpv admin all" ON public.contest_problem_variants FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "cpv assigned read" ON public.contest_problem_variants;
CREATE POLICY "cpv assigned read" ON public.contest_problem_variants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.contest_user_variants uv WHERE uv.variant_id=contest_problem_variants.id AND uv.user_id=auth.uid())
);
DROP POLICY IF EXISTS "cuv admin all" ON public.contest_user_variants;
CREATE POLICY "cuv admin all" ON public.contest_user_variants FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "cuv self read" ON public.contest_user_variants;
CREATE POLICY "cuv self read" ON public.contest_user_variants FOR SELECT USING (auth.uid()=user_id);

CREATE OR REPLACE FUNCTION public.assign_contest_variant(_contest_id uuid, _problem_slug text)
RETURNS public.contest_user_variants LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _u uuid:=auth.uid(); _existing public.contest_user_variants; _chosen public.contest_problem_variants; _count int; _idx int;
BEGIN
  IF _u IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO _existing FROM public.contest_user_variants WHERE contest_id=_contest_id AND user_id=_u AND problem_slug=_problem_slug;
  IF FOUND THEN RETURN _existing; END IF;
  SELECT count(*) INTO _count FROM public.contest_problem_variants WHERE contest_id=_contest_id AND problem_slug=_problem_slug;
  IF _count = 0 THEN RAISE EXCEPTION 'no variants configured'; END IF;
  _idx := abs(('x' || substr(md5(_u::text || ':' || _problem_slug), 1, 8))::bit(32)::int) % _count;
  SELECT * INTO _chosen FROM public.contest_problem_variants WHERE contest_id=_contest_id AND problem_slug=_problem_slug ORDER BY variant_key OFFSET _idx LIMIT 1;
  INSERT INTO public.contest_user_variants (contest_id,user_id,problem_slug,variant_id,variant_key)
    VALUES (_contest_id,_u,_problem_slug,_chosen.id,_chosen.variant_key) RETURNING * INTO _existing;
  RETURN _existing;
END $$;
GRANT EXECUTE ON FUNCTION public.assign_contest_variant(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_contest_registered_count(_contest_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COUNT(*)::int FROM public.contest_registrations cr
  JOIN public.contests c ON c.id = cr.contest_id
  WHERE cr.contest_id=_contest_id AND cr.status='registered'
    AND c.visibility='public' AND c.status IN ('published','live','ended');
$$;
GRANT EXECUTE ON FUNCTION public.get_contest_registered_count(uuid) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.user_study_focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, task_id uuid,
  started_at timestamptz NOT NULL DEFAULT now(), ended_at timestamptz,
  actual_minutes integer, completed_cycles integer NOT NULL DEFAULT 0,
  notes text, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_study_focus_sessions TO authenticated;
GRANT ALL ON public.user_study_focus_sessions TO service_role;
ALTER TABLE public.user_study_focus_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ufs self all" ON public.user_study_focus_sessions;
CREATE POLICY "ufs self all" ON public.user_study_focus_sessions FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE IF NOT EXISTS public.interview_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_name text NOT NULL, role text NOT NULL, year int NOT NULL,
  experience_type public.experience_type NOT NULL DEFAULT 'on_campus',
  difficulty text NOT NULL DEFAULT 'medium',
  offer_status public.offer_status NOT NULL DEFAULT 'in_progress',
  ctc_lpa numeric, location text,
  rounds jsonb NOT NULL DEFAULT '[]'::jsonb,
  tips text, overall_text text NOT NULL,
  status public.experience_status NOT NULL DEFAULT 'pending',
  moderation_notes text, moderated_by uuid, moderated_at timestamptz,
  upvotes int NOT NULL DEFAULT 0, views int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_experiences TO authenticated;
GRANT SELECT ON public.interview_experiences TO anon;
GRANT ALL ON public.interview_experiences TO service_role;
ALTER TABLE public.interview_experiences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ie read approved" ON public.interview_experiences;
CREATE POLICY "ie read approved" ON public.interview_experiences FOR SELECT USING (status='approved' OR auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "ie self ins" ON public.interview_experiences;
CREATE POLICY "ie self ins" ON public.interview_experiences FOR INSERT WITH CHECK (auth.uid()=user_id AND status='pending');
DROP POLICY IF EXISTS "ie self upd" ON public.interview_experiences;
CREATE POLICY "ie self upd" ON public.interview_experiences FOR UPDATE USING (auth.uid()=user_id AND status='pending');
DROP POLICY IF EXISTS "ie admin upd" ON public.interview_experiences;
CREATE POLICY "ie admin upd" ON public.interview_experiences FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "ie self del" ON public.interview_experiences;
CREATE POLICY "ie self del" ON public.interview_experiences FOR DELETE USING (auth.uid()=user_id AND status='pending');
DROP POLICY IF EXISTS "ie admin del" ON public.interview_experiences;
CREATE POLICY "ie admin del" ON public.interview_experiences FOR DELETE USING (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_ie_updated_at ON public.interview_experiences;
CREATE TRIGGER trg_ie_updated_at BEFORE UPDATE ON public.interview_experiences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.experience_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.interview_experiences(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (experience_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experience_votes TO authenticated;
GRANT SELECT ON public.experience_votes TO anon;
GRANT ALL ON public.experience_votes TO service_role;
ALTER TABLE public.experience_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ev pub read" ON public.experience_votes;
CREATE POLICY "ev pub read" ON public.experience_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "ev self ins" ON public.experience_votes;
CREATE POLICY "ev self ins" ON public.experience_votes FOR INSERT WITH CHECK (auth.uid()=user_id);
DROP POLICY IF EXISTS "ev self del" ON public.experience_votes;
CREATE POLICY "ev self del" ON public.experience_votes FOR DELETE USING (auth.uid()=user_id);

CREATE TABLE IF NOT EXISTS public.experience_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.interview_experiences(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason public.experience_report_reason NOT NULL, details text,
  status public.experience_report_status NOT NULL DEFAULT 'open',
  resolution_notes text, resolved_by uuid, resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (experience_id, reporter_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experience_reports TO authenticated;
GRANT ALL ON public.experience_reports TO service_role;
ALTER TABLE public.experience_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "er self read" ON public.experience_reports;
CREATE POLICY "er self read" ON public.experience_reports FOR SELECT USING (auth.uid()=reporter_id OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "er self ins" ON public.experience_reports;
CREATE POLICY "er self ins" ON public.experience_reports FOR INSERT WITH CHECK (auth.uid()=reporter_id AND status='open');
DROP POLICY IF EXISTS "er admin upd" ON public.experience_reports;
CREATE POLICY "er admin upd" ON public.experience_reports FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "er admin del" ON public.experience_reports;
CREATE POLICY "er admin del" ON public.experience_reports FOR DELETE USING (public.has_role(auth.uid(),'admin'));