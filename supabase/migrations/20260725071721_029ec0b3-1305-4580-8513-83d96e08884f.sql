
CREATE TABLE IF NOT EXISTS public.lead_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  page text, referrer text,
  utm_source text, utm_medium text, utm_campaign text, utm_term text, utm_content text,
  user_agent text, session_id text, user_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON public.lead_events(created_at DESC);
GRANT INSERT ON public.lead_events TO anon, authenticated;
GRANT SELECT ON public.lead_events TO authenticated;
GRANT ALL ON public.lead_events TO service_role;
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "le any ins" ON public.lead_events;
CREATE POLICY "le any ins" ON public.lead_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "le admin read" ON public.lead_events;
CREATE POLICY "le admin read" ON public.lead_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.demo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, email text NOT NULL, org text NOT NULL,
  use_case text NOT NULL, candidates text NOT NULL,
  proctoring text[] NOT NULL DEFAULT '{}', reporting text[] NOT NULL DEFAULT '{}',
  notes text, utm_source text, utm_medium text, utm_campaign text,
  utm_term text, utm_content text, referrer text, landing_page text, user_agent text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.demo_requests TO anon, authenticated;
GRANT SELECT ON public.demo_requests TO authenticated;
GRANT ALL ON public.demo_requests TO service_role;
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dr any ins" ON public.demo_requests;
CREATE POLICY "dr any ins" ON public.demo_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "dr admin read" ON public.demo_requests;
CREATE POLICY "dr admin read" ON public.demo_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.job_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL, title TEXT NOT NULL,
  role_type TEXT NOT NULL DEFAULT 'Fresher',
  location TEXT, is_remote BOOLEAN NOT NULL DEFAULT false,
  apply_url TEXT NOT NULL, description TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'manual', source_id TEXT,
  company_logo_url TEXT, salary TEXT,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_job_openings_active_posted ON public.job_openings (is_active, posted_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_job_openings_source ON public.job_openings (source, source_id) WHERE source_id IS NOT NULL;
GRANT SELECT ON public.job_openings TO anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.job_openings TO authenticated;
GRANT ALL ON public.job_openings TO service_role;
ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "jo view active" ON public.job_openings;
CREATE POLICY "jo view active" ON public.job_openings FOR SELECT USING (is_active=true OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "jo admin ins" ON public.job_openings;
CREATE POLICY "jo admin ins" ON public.job_openings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "jo admin upd" ON public.job_openings;
CREATE POLICY "jo admin upd" ON public.job_openings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "jo admin del" ON public.job_openings;
CREATE POLICY "jo admin del" ON public.job_openings FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_job_openings_updated_at ON public.job_openings;
CREATE TRIGGER trg_job_openings_updated_at BEFORE UPDATE ON public.job_openings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_profiles_extended
  ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS weekly_digest_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS new_feature_alerts_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS marketing_emails_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_velocity_reminder boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_achievement_unlock boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_new_follower boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_goal_milestone boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_streak_reminder boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_rare_achievement boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_emails text[] DEFAULT '{}'::text[];

ALTER TABLE public.user_topic_progress
  ADD COLUMN IF NOT EXISTS revision_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revision_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_revised_at timestamptz NULL;

CREATE OR REPLACE FUNCTION public.award_xp(_user_id uuid, _amount integer, _source text, _description text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE max_per_event integer := 100; new_total integer; new_level integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != _user_id THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF _amount <= 0 OR _amount > max_per_event THEN RAISE EXCEPTION 'Invalid XP amount'; END IF;
  IF _source NOT IN ('quiz','srs_review','srs_mastered','streak','achievement','topic_complete') THEN RAISE EXCEPTION 'Invalid XP source'; END IF;
  INSERT INTO public.xp_transactions (user_id, amount, source, description) VALUES (_user_id,_amount,_source,_description);
  SELECT COALESCE(SUM(amount),0) INTO new_total FROM public.xp_transactions WHERE user_id=_user_id;
  new_level := CASE
    WHEN new_total>=23350 THEN 20 WHEN new_total>=20800 THEN 19 WHEN new_total>=18400 THEN 18
    WHEN new_total>=16150 THEN 17 WHEN new_total>=14050 THEN 16 WHEN new_total>=12100 THEN 15
    WHEN new_total>=10300 THEN 14 WHEN new_total>=8650 THEN 13 WHEN new_total>=7150 THEN 12
    WHEN new_total>=5800 THEN 11 WHEN new_total>=4600 THEN 10 WHEN new_total>=3550 THEN 9
    WHEN new_total>=2650 THEN 8 WHEN new_total>=1900 THEN 7 WHEN new_total>=1300 THEN 6
    WHEN new_total>=850 THEN 5 WHEN new_total>=500 THEN 4 WHEN new_total>=250 THEN 3
    WHEN new_total>=100 THEN 2 ELSE 1 END;
  UPDATE public.user_profiles_extended SET total_xp=new_total, current_level=new_level,
    xp_this_week=COALESCE(xp_this_week,0)+_amount WHERE user_id=_user_id;
  RETURN jsonb_build_object('total_xp',new_total,'current_level',new_level,'amount',_amount);
END $$;
REVOKE ALL ON FUNCTION public.award_xp(uuid,integer,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_xp(uuid,integer,text,text) TO authenticated;
