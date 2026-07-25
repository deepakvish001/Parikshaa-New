CREATE OR REPLACE FUNCTION public.admin_role_audit(_user_id uuid DEFAULT NULL, _action text DEFAULT NULL, _limit int DEFAULT 200)
RETURNS TABLE(id uuid, created_at timestamptz, action text, actor_id uuid, actor_name text, actor_email text, target_user_id uuid, target_name text, target_email text, role text, diff jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY SELECT l.id, l.created_at, l.action, l.actor_id, pa.full_name, ua.email::text, NULLIF(l.entity_slug,'')::uuid, pt.full_name, ut.email::text, (l.diff->>'role')::text, l.diff
  FROM public.admin_audit_log l
  LEFT JOIN auth.users ua ON ua.id=l.actor_id
  LEFT JOIN public.profiles pa ON pa.user_id=l.actor_id
  LEFT JOIN auth.users ut ON ut.id::text=l.entity_slug
  LEFT JOIN public.profiles pt ON pt.user_id=ut.id
  WHERE l.action IN ('grant_role','revoke_role')
    AND (_user_id IS NULL OR l.entity_slug=_user_id::text)
    AND (_action IS NULL OR l.action=_action)
  ORDER BY l.created_at DESC LIMIT GREATEST(_limit,1);
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_role_audit(uuid,text,int) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_table_policies(_table text)
RETURNS TABLE(policy_name text, command text, roles text[], using_expr text, check_expr text, permissive text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_catalog' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY SELECT p.policyname::text, p.cmd::text, p.roles::text[], p.qual::text, p.with_check::text, p.permissive::text
  FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=_table ORDER BY p.policyname;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_list_table_policies(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_public_tables()
RETURNS TABLE(table_name text, rls_enabled boolean, policy_count int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','pg_catalog' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY SELECT c.relname::text, c.relrowsecurity, (SELECT COUNT(*)::int FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=c.relname)
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' ORDER BY c.relname;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_list_public_tables() TO authenticated;

ALTER TABLE public.contest_registrations
  ADD COLUMN IF NOT EXISTS honor_code_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS disqualified_at timestamptz,
  ADD COLUMN IF NOT EXISTS disqualified_reason text,
  ADD COLUMN IF NOT EXISTS violation_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flagged boolean NOT NULL DEFAULT false;

ALTER TABLE public.contests
  ADD COLUMN IF NOT EXISTS min_trust_score integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS require_screen_share boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.contest_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  session_token uuid NOT NULL DEFAULT gen_random_uuid(),
  user_agent text,
  ip_hash text,
  is_active boolean NOT NULL DEFAULT true,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  invalidated_at timestamptz,
  device_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_fingerprint jsonb,
  ip_address inet,
  last_heartbeat_at timestamptz,
  stream_grace_until timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_sessions TO authenticated;
GRANT ALL ON public.contest_sessions TO service_role;
ALTER TABLE public.contest_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cs self read" ON public.contest_sessions;
CREATE POLICY "cs self read" ON public.contest_sessions FOR SELECT USING (auth.uid()=user_id);
DROP POLICY IF EXISTS "cs admin all" ON public.contest_sessions;
CREATE POLICY "cs admin all" ON public.contest_sessions FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.contest_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  session_id uuid REFERENCES public.contest_sessions(id) ON DELETE SET NULL,
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'warn',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_violations TO authenticated;
GRANT ALL ON public.contest_violations TO service_role;
ALTER TABLE public.contest_violations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cv self read" ON public.contest_violations;
CREATE POLICY "cv self read" ON public.contest_violations FOR SELECT USING (auth.uid()=user_id);
DROP POLICY IF EXISTS "cv admin all" ON public.contest_violations;
CREATE POLICY "cv admin all" ON public.contest_violations FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.contest_proctor_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  session_id uuid REFERENCES public.contest_sessions(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_proctor_snapshots TO authenticated;
GRANT ALL ON public.contest_proctor_snapshots TO service_role;
ALTER TABLE public.contest_proctor_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cps self ins" ON public.contest_proctor_snapshots;
CREATE POLICY "cps self ins" ON public.contest_proctor_snapshots FOR INSERT WITH CHECK (auth.uid()=user_id);
DROP POLICY IF EXISTS "cps self read" ON public.contest_proctor_snapshots;
CREATE POLICY "cps self read" ON public.contest_proctor_snapshots FOR SELECT USING (auth.uid()=user_id);
DROP POLICY IF EXISTS "cps admin all" ON public.contest_proctor_snapshots;
CREATE POLICY "cps admin all" ON public.contest_proctor_snapshots FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.contest_screen_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  session_id uuid REFERENCES public.contest_sessions(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  duration_sec integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_screen_recordings TO authenticated;
GRANT ALL ON public.contest_screen_recordings TO service_role;
ALTER TABLE public.contest_screen_recordings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "csr self ins" ON public.contest_screen_recordings;
CREATE POLICY "csr self ins" ON public.contest_screen_recordings FOR INSERT WITH CHECK (auth.uid()=user_id);
DROP POLICY IF EXISTS "csr self read" ON public.contest_screen_recordings;
CREATE POLICY "csr self read" ON public.contest_screen_recordings FOR SELECT USING (auth.uid()=user_id);
DROP POLICY IF EXISTS "csr admin all" ON public.contest_screen_recordings;
CREATE POLICY "csr admin all" ON public.contest_screen_recordings FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.contest_trust_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  session_id uuid REFERENCES public.contest_sessions(id) ON DELETE SET NULL,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  risk text NOT NULL CHECK (risk IN ('low','medium','high')),
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_trust_scores TO authenticated;
GRANT ALL ON public.contest_trust_scores TO service_role;
ALTER TABLE public.contest_trust_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cts self read" ON public.contest_trust_scores;
CREATE POLICY "cts self read" ON public.contest_trust_scores FOR SELECT USING (auth.uid()=user_id);
DROP POLICY IF EXISTS "cts admin all" ON public.contest_trust_scores;
CREATE POLICY "cts admin all" ON public.contest_trust_scores FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.contest_typing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  session_id uuid REFERENCES public.contest_sessions(id) ON DELETE SET NULL,
  problem_slug text NOT NULL,
  char_count integer NOT NULL,
  dt_ms integer NOT NULL,
  is_burst boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_typing_events TO authenticated;
GRANT ALL ON public.contest_typing_events TO service_role;
ALTER TABLE public.contest_typing_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cte self ins" ON public.contest_typing_events;
CREATE POLICY "cte self ins" ON public.contest_typing_events FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
DROP POLICY IF EXISTS "cte self read" ON public.contest_typing_events;
CREATE POLICY "cte self read" ON public.contest_typing_events FOR SELECT TO authenticated USING (auth.uid()=user_id);
DROP POLICY IF EXISTS "cte admin all" ON public.contest_typing_events;
CREATE POLICY "cte admin all" ON public.contest_typing_events FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.contest_stream_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  session_id uuid REFERENCES public.contest_sessions(id) ON DELETE SET NULL,
  stream_kind text NOT NULL CHECK (stream_kind IN ('webcam','screen')),
  healthy boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_stream_health TO authenticated;
GRANT ALL ON public.contest_stream_health TO service_role;
ALTER TABLE public.contest_stream_health ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "csh self ins" ON public.contest_stream_health;
CREATE POLICY "csh self ins" ON public.contest_stream_health FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
DROP POLICY IF EXISTS "csh self read" ON public.contest_stream_health;
CREATE POLICY "csh self read" ON public.contest_stream_health FOR SELECT TO authenticated USING (auth.uid()=user_id);
DROP POLICY IF EXISTS "csh admin all" ON public.contest_stream_health;
CREATE POLICY "csh admin all" ON public.contest_stream_health FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.contest_tab_locks (
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tab_id text NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contest_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_tab_locks TO authenticated;
GRANT ALL ON public.contest_tab_locks TO service_role;
ALTER TABLE public.contest_tab_locks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ctl self read" ON public.contest_tab_locks;
CREATE POLICY "ctl self read" ON public.contest_tab_locks FOR SELECT TO authenticated USING (auth.uid()=user_id);
DROP POLICY IF EXISTS "ctl admin all" ON public.contest_tab_locks;
CREATE POLICY "ctl admin all" ON public.contest_tab_locks FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "cp self upload" ON storage.objects;
CREATE POLICY "cp self upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id='contest-proctor' AND auth.uid()::text=(storage.foldername(name))[1]);
DROP POLICY IF EXISTS "cp self read" ON storage.objects;
CREATE POLICY "cp self read" ON storage.objects FOR SELECT USING (bucket_id='contest-proctor' AND auth.uid()::text=(storage.foldername(name))[1]);
DROP POLICY IF EXISTS "cp admin read" ON storage.objects;
CREATE POLICY "cp admin read" ON storage.objects FOR SELECT USING (bucket_id='contest-proctor' AND public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "csrec self upload" ON storage.objects;
CREATE POLICY "csrec self upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id='contest-screen-recordings' AND auth.uid()::text=(storage.foldername(name))[1]);
DROP POLICY IF EXISTS "csrec self read" ON storage.objects;
CREATE POLICY "csrec self read" ON storage.objects FOR SELECT USING (bucket_id='contest-screen-recordings' AND auth.uid()::text=(storage.foldername(name))[1]);
DROP POLICY IF EXISTS "csrec admin read" ON storage.objects;
CREATE POLICY "csrec admin read" ON storage.objects FOR SELECT USING (bucket_id='contest-screen-recordings' AND public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.contest_accept_honor_code(_contest_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  UPDATE public.contest_registrations SET honor_code_accepted_at=now()
   WHERE contest_id=_contest_id AND user_id=auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'not registered'; END IF;
END; $$;
GRANT EXECUTE ON FUNCTION public.contest_accept_honor_code(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.contest_start_secure_session(_contest_id uuid, _user_agent text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _new uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  UPDATE public.contest_sessions SET is_active=false, invalidated_at=now()
   WHERE contest_id=_contest_id AND user_id=auth.uid() AND is_active=true;
  INSERT INTO public.contest_sessions (contest_id,user_id,user_agent)
    VALUES (_contest_id, auth.uid(), _user_agent) RETURNING id INTO _new;
  RETURN _new;
END; $$;
GRANT EXECUTE ON FUNCTION public.contest_start_secure_session(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.contest_log_violation(_contest_id uuid, _session_id uuid, _type text, _severity text DEFAULT 'warn', _meta jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _count int; _flagged boolean; _dq boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  INSERT INTO public.contest_violations (contest_id,user_id,session_id,type,severity,meta)
    VALUES (_contest_id,auth.uid(),_session_id,_type,COALESCE(_severity,'warn'),COALESCE(_meta,'{}'::jsonb));
  UPDATE public.contest_registrations
    SET violation_count=violation_count+1,
        flagged=(violation_count+1)>=3,
        disqualified_at=CASE WHEN (violation_count+1)>=5 AND disqualified_at IS NULL THEN now() ELSE disqualified_at END
    WHERE contest_id=_contest_id AND user_id=auth.uid()
    RETURNING violation_count, flagged, (disqualified_at IS NOT NULL) INTO _count,_flagged,_dq;
  RETURN jsonb_build_object('violation_count',COALESCE(_count,0),'flagged',COALESCE(_flagged,false),'disqualified',COALESCE(_dq,false));
END; $$;
GRANT EXECUTE ON FUNCTION public.contest_log_violation(uuid,uuid,text,text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.contest_session_heartbeat(_session_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.contest_sessions%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT * INTO s FROM public.contest_sessions WHERE id=_session_id;
  IF NOT FOUND OR s.user_id<>auth.uid() THEN RETURN jsonb_build_object('ok',false,'code','not_found'); END IF;
  IF NOT s.is_active THEN RETURN jsonb_build_object('ok',false,'code','invalidated'); END IF;
  UPDATE public.contest_sessions SET last_seen_at=now(), last_heartbeat_at=now() WHERE id=_session_id;
  RETURN jsonb_build_object('ok',true,'last_seen_at',now());
END; $$;
GRANT EXECUTE ON FUNCTION public.contest_session_heartbeat(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.contest_session_heartbeat(_session_id uuid, _fingerprint jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  RETURN public.contest_session_heartbeat(_session_id);
END; $$;
GRANT EXECUTE ON FUNCTION public.contest_session_heartbeat(uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.contest_claim_tab_lock(_contest_id uuid, _tab_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE prev text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT tab_id INTO prev FROM public.contest_tab_locks WHERE contest_id=_contest_id AND user_id=auth.uid();
  INSERT INTO public.contest_tab_locks (contest_id,user_id,tab_id,claimed_at) VALUES (_contest_id,auth.uid(),_tab_id,now())
    ON CONFLICT (contest_id,user_id) DO UPDATE SET tab_id=EXCLUDED.tab_id, claimed_at=now();
  RETURN jsonb_build_object('ok',true,'displaced_tab_id', CASE WHEN prev IS NOT NULL AND prev<>_tab_id THEN prev END);
END; $$;
GRANT EXECUTE ON FUNCTION public.contest_claim_tab_lock(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.contest_report_stream_health(_session_id uuid, _kind text, _healthy boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.contest_sessions%ROWTYPE; dq boolean:=false;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT * INTO s FROM public.contest_sessions WHERE id=_session_id;
  IF NOT FOUND OR s.user_id<>auth.uid() THEN RETURN jsonb_build_object('ok',false,'code','not_found'); END IF;
  INSERT INTO public.contest_stream_health (contest_id,user_id,session_id,stream_kind,healthy)
    VALUES (s.contest_id,auth.uid(),_session_id,_kind,_healthy);
  IF _healthy THEN
    UPDATE public.contest_sessions SET stream_grace_until=NULL WHERE id=_session_id;
    RETURN jsonb_build_object('ok',true,'healthy',true);
  END IF;
  IF s.stream_grace_until IS NULL THEN
    UPDATE public.contest_sessions SET stream_grace_until=now()+interval '30 seconds' WHERE id=_session_id;
    RETURN jsonb_build_object('ok',true,'healthy',false,'grace_until',now()+interval '30 seconds');
  END IF;
  IF now() > s.stream_grace_until THEN
    UPDATE public.contest_sessions SET is_active=false, invalidated_at=now() WHERE id=_session_id;
    UPDATE public.contest_registrations SET disqualified_at=COALESCE(disqualified_at,now()) WHERE contest_id=s.contest_id AND user_id=auth.uid();
    dq:=true;
  END IF;
  RETURN jsonb_build_object('ok',true,'healthy',false,'grace_until',s.stream_grace_until,'disqualified',dq);
END; $$;
GRANT EXECUTE ON FUNCTION public.contest_report_stream_health(uuid,text,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.contest_aux_unlocked(_contest_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.contests%ROWTYPE; reg_status text;
BEGIN
  SELECT * INTO c FROM public.contests WHERE id=_contest_id;
  IF NOT FOUND THEN RETURN true; END IF;
  IF now() >= c.ends_at THEN RETURN true; END IF;
  SELECT status INTO reg_status FROM public.contest_registrations WHERE contest_id=_contest_id AND user_id=auth.uid();
  RETURN reg_status IS DISTINCT FROM 'registered';
END; $$;
GRANT EXECUTE ON FUNCTION public.contest_aux_unlocked(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_contest_submission(_contest_id uuid, _problem_slug text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.contests%ROWTYPE; reg_status text; has_session boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'code','unauth','message','Sign in required'); END IF;
  SELECT * INTO c FROM public.contests WHERE id=_contest_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'code','no_contest'); END IF;
  IF now() < c.starts_at THEN RETURN jsonb_build_object('ok',false,'code','not_started'); END IF;
  IF now() >= c.ends_at THEN RETURN jsonb_build_object('ok',false,'code','ended'); END IF;
  SELECT status INTO reg_status FROM public.contest_registrations WHERE contest_id=_contest_id AND user_id=auth.uid();
  IF reg_status IS NULL OR reg_status<>'registered' THEN RETURN jsonb_build_object('ok',false,'code','not_registered'); END IF;
  SELECT EXISTS (SELECT 1 FROM public.contest_sessions WHERE contest_id=_contest_id AND user_id=auth.uid() AND is_active=true) INTO has_session;
  IF NOT has_session THEN RETURN jsonb_build_object('ok',false,'code','no_session'); END IF;
  RETURN jsonb_build_object('ok',true);
END; $$;
GRANT EXECUTE ON FUNCTION public.validate_contest_submission(uuid,text) TO authenticated;