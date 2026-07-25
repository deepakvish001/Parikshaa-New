
CREATE TABLE IF NOT EXISTS public.resume_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  overall_score INTEGER,
  ats_score INTEGER,
  keyword_score INTEGER,
  format_score INTEGER,
  content_score INTEGER,
  suggestions JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  keywords_found JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.resume_analyses TO authenticated;
GRANT ALL ON public.resume_analyses TO service_role;
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ra self all" ON public.resume_analyses;
CREATE POLICY "ra self all" ON public.resume_analyses FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

ALTER TABLE public.contest_sessions
  ADD COLUMN IF NOT EXISTS terminated_at timestamptz,
  ADD COLUMN IF NOT EXISTS terminated_reason text,
  ADD COLUMN IF NOT EXISTS risk_score numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS side_camera_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS side_camera_status text NOT NULL DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS public.contest_side_camera_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.contest_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.contest_side_camera_audit_logs TO authenticated;
GRANT ALL ON public.contest_side_camera_audit_logs TO service_role;
ALTER TABLE public.contest_side_camera_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sca owner read" ON public.contest_side_camera_audit_logs;
CREATE POLICY "sca owner read" ON public.contest_side_camera_audit_logs FOR SELECT TO authenticated USING (auth.uid()=user_id);
DROP POLICY IF EXISTS "sca owner ins" ON public.contest_side_camera_audit_logs;
CREATE POLICY "sca owner ins" ON public.contest_side_camera_audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
DROP POLICY IF EXISTS "sca admin read" ON public.contest_side_camera_audit_logs;
CREATE POLICY "sca admin read" ON public.contest_side_camera_audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  repo_url TEXT,
  live_url TEXT,
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  cover_image_url TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual',
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON public.user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_sort ON public.user_projects(user_id, pinned DESC, sort_order ASC, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_projects_external ON public.user_projects(user_id, source, external_id) WHERE external_id IS NOT NULL;
GRANT SELECT ON public.user_projects TO anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.user_projects TO authenticated;
GRANT ALL ON public.user_projects TO service_role;
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "up read all" ON public.user_projects;
CREATE POLICY "up read all" ON public.user_projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "up self ins" ON public.user_projects;
CREATE POLICY "up self ins" ON public.user_projects FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
DROP POLICY IF EXISTS "up self upd" ON public.user_projects;
CREATE POLICY "up self upd" ON public.user_projects FOR UPDATE TO authenticated USING (auth.uid()=user_id);
DROP POLICY IF EXISTS "up self del" ON public.user_projects;
CREATE POLICY "up self del" ON public.user_projects FOR DELETE TO authenticated USING (auth.uid()=user_id);
DROP TRIGGER IF EXISTS trg_user_projects_updated ON public.user_projects;
CREATE TRIGGER trg_user_projects_updated BEFORE UPDATE ON public.user_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.user_study_profile (
  user_id UUID PRIMARY KEY,
  goal TEXT NOT NULL,
  target_date DATE,
  weekday_minutes INTEGER NOT NULL DEFAULT 60,
  weekend_minutes INTEGER NOT NULL DEFAULT 120,
  level TEXT NOT NULL DEFAULT 'beginner',
  topics_known TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.user_study_profile TO authenticated;
GRANT ALL ON public.user_study_profile TO service_role;
ALTER TABLE public.user_study_profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usp self all" ON public.user_study_profile;
CREATE POLICY "usp self all" ON public.user_study_profile FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
DROP TRIGGER IF EXISTS trg_usp_updated ON public.user_study_profile;
CREATE TRIGGER trg_usp_updated BEFORE UPDATE ON public.user_study_profile FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.award_earned_achievements()
RETURNS text[] LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN RETURN ARRAY[]::text[]; END $$;
REVOKE ALL ON FUNCTION public.award_earned_achievements() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_earned_achievements() TO authenticated;
