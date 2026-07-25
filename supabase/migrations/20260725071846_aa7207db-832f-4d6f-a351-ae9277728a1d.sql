
ALTER TABLE public.user_profiles_extended
  ADD COLUMN IF NOT EXISTS notify_discussion_reply boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_discussion_like boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'landing_footer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ns any ins" ON public.newsletter_subscribers;
CREATE POLICY "ns any ins" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND length(email) <= 255 AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
DROP POLICY IF EXISTS "ns admin read" ON public.newsletter_subscribers;
CREATE POLICY "ns admin read" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.demo_requests
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz;

CREATE TABLE IF NOT EXISTS public.demo_request_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.demo_requests(id) ON DELETE CASCADE,
  from_status text, to_status text NOT NULL, note text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_demo_req_history_request ON public.demo_request_status_history(request_id, created_at DESC);
GRANT SELECT, INSERT ON public.demo_request_status_history TO authenticated;
GRANT ALL ON public.demo_request_status_history TO service_role;
ALTER TABLE public.demo_request_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "drh admin read" ON public.demo_request_status_history;
CREATE POLICY "drh admin read" ON public.demo_request_status_history FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "drh admin ins" ON public.demo_request_status_history;
CREATE POLICY "drh admin ins" ON public.demo_request_status_history FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') AND changed_by=auth.uid());

DO $$ BEGIN CREATE TYPE public.org_type AS ENUM ('college','company'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.org_member_role AS ENUM ('owner','admin','recruiter','viewer'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.ai_insight_rating AS ENUM ('up','down'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, type public.org_type NOT NULL,
  slug TEXT NOT NULL UNIQUE, logo_url TEXT, owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org owner all" ON public.organizations;
CREATE POLICY "org owner all" ON public.organizations FOR ALL TO authenticated USING (auth.uid()=owner_id) WITH CHECK (auth.uid()=owner_id);

CREATE TABLE IF NOT EXISTS public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.org_member_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.org_members TO authenticated;
GRANT ALL ON public.org_members TO service_role;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "om self read" ON public.org_members;
CREATE POLICY "om self read" ON public.org_members FOR SELECT TO authenticated USING (auth.uid()=user_id);

CREATE TABLE IF NOT EXISTS public.ai_insight_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  org_id uuid NOT NULL,
  insight_key text NOT NULL, insight_title text NOT NULL,
  rating public.ai_insight_rating NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, org_id, insight_key)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.ai_insight_feedback TO authenticated;
GRANT ALL ON public.ai_insight_feedback TO service_role;
ALTER TABLE public.ai_insight_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "aif self all" ON public.ai_insight_feedback;
CREATE POLICY "aif self all" ON public.ai_insight_feedback FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE IF NOT EXISTS public.ai_insight_flags (
  insight_key text PRIMARY KEY,
  insight_title text NOT NULL, reason text,
  flagged_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.ai_insight_flags TO authenticated;
GRANT ALL ON public.ai_insight_flags TO service_role;
ALTER TABLE public.ai_insight_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "aiflags admin all" ON public.ai_insight_flags;
CREATE POLICY "aiflags admin all" ON public.ai_insight_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.admin_get_ai_insight_overview(_days integer DEFAULT 90)
RETURNS TABLE (insight_key text, insight_title text, up_count bigint, down_count bigint,
  total_count bigint, net_score bigint, org_count bigint, last_at timestamptz,
  is_flagged boolean, flag_reason text, flagged_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE _w integer := GREATEST(1, LEAST(COALESCE(_days,90), 365));
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
  SELECT f.insight_key, (ARRAY_AGG(f.insight_title ORDER BY f.created_at DESC))[1],
    COUNT(*) FILTER (WHERE f.rating='up')::bigint,
    COUNT(*) FILTER (WHERE f.rating='down')::bigint,
    COUNT(*)::bigint,
    (COUNT(*) FILTER (WHERE f.rating='up') - COUNT(*) FILTER (WHERE f.rating='down'))::bigint,
    COUNT(DISTINCT f.org_id)::bigint, MAX(f.created_at),
    (fl.insight_key IS NOT NULL), fl.reason, fl.created_at
  FROM public.ai_insight_feedback f
  LEFT JOIN public.ai_insight_flags fl ON fl.insight_key=f.insight_key
  WHERE f.created_at >= (now() - make_interval(days => _w))
  GROUP BY f.insight_key, fl.insight_key, fl.reason, fl.created_at
  ORDER BY COUNT(*) DESC, MAX(f.created_at) DESC;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_get_ai_insight_overview(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_ai_insight_feedback(
  _limit integer DEFAULT 50, _offset integer DEFAULT 0,
  _rating public.ai_insight_rating DEFAULT NULL,
  _insight_key text DEFAULT NULL, _org_id uuid DEFAULT NULL)
RETURNS TABLE (id uuid, created_at timestamptz, updated_at timestamptz,
  user_id uuid, user_email text, user_full_name text, user_avatar_url text,
  org_id uuid, org_name text, insight_key text, insight_title text,
  rating public.ai_insight_rating, comment text, total_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE _lim integer := GREATEST(1, LEAST(COALESCE(_limit,50),200));
  _off integer := GREATEST(0, COALESCE(_offset,0)); _total bigint;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT COUNT(*) INTO _total FROM public.ai_insight_feedback f
    WHERE (_rating IS NULL OR f.rating=_rating)
      AND (_insight_key IS NULL OR f.insight_key=_insight_key)
      AND (_org_id IS NULL OR f.org_id=_org_id);
  RETURN QUERY
  SELECT f.id, f.created_at, f.updated_at, f.user_id,
    u.email::text, p.full_name, p.avatar_url,
    f.org_id, o.name, f.insight_key, f.insight_title, f.rating, f.comment, _total
  FROM public.ai_insight_feedback f
  LEFT JOIN public.profiles p ON p.user_id=f.user_id
  LEFT JOIN auth.users u ON u.id=f.user_id
  LEFT JOIN public.organizations o ON o.id=f.org_id
  WHERE (_rating IS NULL OR f.rating=_rating)
    AND (_insight_key IS NULL OR f.insight_key=_insight_key)
    AND (_org_id IS NULL OR f.org_id=_org_id)
  ORDER BY f.created_at DESC LIMIT _lim OFFSET _off;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_list_ai_insight_feedback(integer,integer,public.ai_insight_rating,text,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_insight_flag(
  _insight_key text, _insight_title text, _reason text DEFAULT NULL, _flagged boolean DEFAULT true)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _flagged THEN
    INSERT INTO public.ai_insight_flags (insight_key, insight_title, reason, flagged_by)
    VALUES (_insight_key, COALESCE(_insight_title,_insight_key), NULLIF(trim(_reason),''), auth.uid())
    ON CONFLICT (insight_key) DO UPDATE SET insight_title=EXCLUDED.insight_title,
      reason=EXCLUDED.reason, flagged_by=EXCLUDED.flagged_by, created_at=now();
    RETURN true;
  ELSE
    DELETE FROM public.ai_insight_flags WHERE insight_key=_insight_key;
    RETURN false;
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_set_insight_flag(text,text,text,boolean) TO authenticated;
