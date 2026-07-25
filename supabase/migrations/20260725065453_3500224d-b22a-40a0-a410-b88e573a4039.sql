-- Create table for AI-generated content
CREATE TABLE public.ai_generated_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('plan', 'course', 'guide', 'roadmap', 'quiz')),
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT false,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_generated_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own content" ON public.ai_generated_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public content" ON public.ai_generated_content FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert their own content" ON public.ai_generated_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own content" ON public.ai_generated_content FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own content" ON public.ai_generated_content FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_ai_generated_content_user_id ON public.ai_generated_content(user_id);
CREATE INDEX idx_ai_generated_content_type ON public.ai_generated_content(content_type);
CREATE INDEX idx_ai_generated_content_public ON public.ai_generated_content(is_public) WHERE is_public = true;
CREATE TRIGGER update_ai_generated_content_updated_at BEFORE UPDATE ON public.ai_generated_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ai_content_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.ai_generated_content(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id)
);
ALTER TABLE public.ai_content_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own likes" ON public.ai_content_likes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can like content" ON public.ai_content_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike content" ON public.ai_content_likes FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.ai_content_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.ai_generated_content(id) ON DELETE CASCADE,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id)
);
ALTER TABLE public.ai_content_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own progress" ON public.ai_content_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own progress" ON public.ai_content_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.ai_content_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own progress" ON public.ai_content_progress FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_ai_content_progress_updated_at BEFORE UPDATE ON public.ai_content_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_content_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ai_generated_content SET likes_count = likes_count + 1 WHERE id = NEW.content_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.ai_generated_content SET likes_count = likes_count - 1 WHERE id = OLD.content_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER update_likes_count_trigger AFTER INSERT OR DELETE ON public.ai_content_likes FOR EACH ROW EXECUTE FUNCTION public.update_content_likes_count();

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "settings admin write" ON public.platform_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.admin_daily_challenge_schedule (
  challenge_date date PRIMARY KEY,
  problem_slug text NOT NULL REFERENCES public.coding_problems(slug) ON DELETE CASCADE,
  set_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_daily_challenge_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dcs public read" ON public.admin_daily_challenge_schedule FOR SELECT USING (true);
CREATE POLICY "dcs admin write" ON public.admin_daily_challenge_schedule FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.user_profiles_extended
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_reason text,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS leaderboard_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS coding_leaderboard_hidden boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_by uuid,
  resolved_at timestamptz
);
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report own insert" ON public.content_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "report admin read" ON public.content_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "report admin update" ON public.content_reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "report admin delete" ON public.content_reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports(status, created_at DESC);

CREATE OR REPLACE FUNCTION public.admin_list_users(_search text DEFAULT NULL, _limit int DEFAULT 50, _offset int DEFAULT 0)
RETURNS TABLE (user_id uuid, email text, full_name text, username text, avatar_url text, joined_at timestamptz, last_active_at timestamptz, total_xp integer, current_level integer, is_suspended boolean, roles text[])
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY
  SELECT u.id, u.email::text, p.full_name, upe.username, p.avatar_url, u.created_at,
    (SELECT MAX(a.created_at) FROM public.user_activity_log a WHERE a.user_id = u.id),
    upe.total_xp, upe.current_level, COALESCE(upe.is_suspended,false),
    ARRAY(SELECT r.role::text FROM public.user_roles r WHERE r.user_id = u.id)
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN public.user_profiles_extended upe ON upe.user_id = u.id
  WHERE _search IS NULL OR u.email::text ILIKE '%'||_search||'%' OR p.full_name ILIKE '%'||_search||'%' OR upe.username ILIKE '%'||_search||'%'
  ORDER BY u.created_at DESC
  LIMIT GREATEST(_limit,1) OFFSET GREATEST(_offset,0);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_grant_role(_user_id uuid, _role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, _role) ON CONFLICT DO NOTHING;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'grant_role','user', _user_id::text, jsonb_build_object('role',_role));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_revoke_role(_user_id uuid, _role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  DELETE FROM public.user_roles WHERE user_id=_user_id AND role=_role;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'revoke_role','user', _user_id::text, jsonb_build_object('role',_role));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_suspend_user(_user_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.user_profiles_extended
    SET is_suspended=true, suspended_reason=_reason, suspended_at=now()
    WHERE user_id=_user_id;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'suspend_user','user', _user_id::text, jsonb_build_object('reason',_reason));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_unsuspend_user(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.user_profiles_extended SET is_suspended=false, suspended_reason=NULL, suspended_at=NULL WHERE user_id=_user_id;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'unsuspend_user','user', _user_id::text, '{}'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_setting(_key text, _value jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  INSERT INTO public.platform_settings(key, value, updated_by, updated_at) VALUES (_key, _value, auth.uid(), now())
  ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_by=auth.uid(), updated_at=now();
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'set_setting','platform_setting', _key, _value);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_broadcast_notification(_audience jsonb, _title text, _message text, _data jsonb DEFAULT '{}'::jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inserted_count int := 0;
  audience_kind text := COALESCE(_audience->>'kind','all');
  min_level int := COALESCE((_audience->>'min_level')::int, 0);
  target_role text := _audience->>'role';
  target_user uuid := NULLIF(_audience->>'user_id','')::uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  WITH targets AS (
    SELECT u.id AS uid
    FROM auth.users u
    LEFT JOIN public.user_profiles_extended upe ON upe.user_id = u.id
    WHERE CASE audience_kind
      WHEN 'all' THEN true
      WHEN 'level' THEN COALESCE(upe.current_level,1) >= min_level
      WHEN 'role' THEN EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=u.id AND r.role::text=target_role)
      WHEN 'user' THEN u.id = target_user
      ELSE false END
      AND COALESCE(upe.is_suspended, false) = false
    LIMIT 50000
  ),
  ins AS (INSERT INTO public.notifications(user_id, type, title, message, data) SELECT uid, 'broadcast', _title, _message, _data FROM targets RETURNING 1)
  SELECT COUNT(*) INTO inserted_count FROM ins;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'broadcast','notification', NULL, jsonb_build_object('audience',_audience,'title',_title,'count',inserted_count));
  RETURN inserted_count;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_schedule_daily_challenge(_date date, _slug text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  INSERT INTO public.admin_daily_challenge_schedule(challenge_date, problem_slug, set_by) VALUES (_date, _slug, auth.uid())
  ON CONFLICT (challenge_date) DO UPDATE SET problem_slug=EXCLUDED.problem_slug, set_by=auth.uid(), created_at=now();
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'schedule_daily','coding_problem', _slug, jsonb_build_object('date',_date));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_dashboard_kpis()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'dau', (SELECT COUNT(DISTINCT user_id) FROM public.user_activity_log WHERE created_at >= now() - interval '24 hours'),
    'wau', (SELECT COUNT(DISTINCT user_id) FROM public.user_activity_log WHERE created_at >= now() - interval '7 days'),
    'submissions_total', (SELECT COUNT(*) FROM public.code_submissions WHERE is_submission=true),
    'accepted_today', (SELECT COUNT(*) FROM public.code_submissions WHERE verdict='Accepted' AND created_at >= date_trunc('day', now())),
    'ai_content_total', (SELECT COUNT(*) FROM public.ai_generated_content),
    'open_reports', (SELECT COUNT(*) FROM public.content_reports WHERE status='open'),
    'published_problems', (SELECT COUNT(*) FROM public.coding_problems WHERE is_published=true),
    'draft_problems', (SELECT COUNT(*) FROM public.coding_problems WHERE is_published=false),
    'signups_7d', (SELECT COUNT(*) FROM auth.users WHERE created_at >= now() - interval '7 days')
  ) INTO result;
  RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_trend_submissions(_days int DEFAULT 30)
RETURNS TABLE (day date, total int, accepted int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY
  SELECT d::date, COALESCE(COUNT(s.id) FILTER (WHERE s.is_submission=true),0)::int,
    COALESCE(COUNT(s.id) FILTER (WHERE s.is_submission=true AND s.verdict='Accepted'),0)::int
  FROM generate_series(now()::date - (_days-1), now()::date, interval '1 day') d
  LEFT JOIN public.code_submissions s ON s.created_at::date = d::date
  GROUP BY d ORDER BY d;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_trend_signups(_days int DEFAULT 30)
RETURNS TABLE (day date, signups int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY
  SELECT d::date, COALESCE(COUNT(u.id),0)::int
  FROM generate_series(now()::date - (_days-1), now()::date, interval '1 day') d
  LEFT JOIN auth.users u ON u.created_at::date = d::date
  GROUP BY d ORDER BY d;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_resolve_report(_id uuid, _new_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _new_status NOT IN ('resolved','dismissed','open') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE public.content_reports SET status=_new_status, resolved_by=auth.uid(), resolved_at=now() WHERE id=_id;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'resolve_report','content_report', _id::text, jsonb_build_object('status',_new_status));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_ai_content_visibility(_id uuid, _is_public boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.ai_generated_content SET is_public = _is_public WHERE id = _id;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'mod_ai_visibility','ai_content', _id::text, jsonb_build_object('is_public',_is_public));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_ai_content(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  DELETE FROM public.ai_generated_content WHERE id = _id;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'mod_ai_delete','ai_content', _id::text, '{}'::jsonb);
END; $$;

-- Featured / Library / Roadmap / Support
CREATE TABLE IF NOT EXISTS public.featured_content (
  slot text PRIMARY KEY, target_type text NOT NULL, target_id text NOT NULL,
  weight int NOT NULL DEFAULT 0, starts_at timestamptz, ends_at timestamptz,
  updated_by uuid REFERENCES auth.users(id), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.featured_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "featured public read" ON public.featured_content FOR SELECT USING (true);
CREATE POLICY "featured admin write" ON public.featured_content FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.library_hidden_items (
  category text NOT NULL, item_id text NOT NULL,
  hidden_by uuid REFERENCES auth.users(id), hidden_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (category, item_id)
);
ALTER TABLE public.library_hidden_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lhi public read" ON public.library_hidden_items FOR SELECT USING (true);
CREATE POLICY "lhi admin write" ON public.library_hidden_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.roadmap_overrides (
  roadmap_id text PRIMARY KEY, is_published boolean NOT NULL DEFAULT true, is_featured boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0, updated_by uuid REFERENCES auth.users(id), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.roadmap_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ro public read" ON public.roadmap_overrides FOR SELECT USING (true);
CREATE POLICY "ro admin write" ON public.roadmap_overrides FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL, subject text NOT NULL, body text NOT NULL, status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(), replied_at timestamptz, replied_by uuid REFERENCES auth.users(id), reply_body text
);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sm public submit" ON public.support_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "sm admin read" ON public.support_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "sm admin update" ON public.support_messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "sm admin delete" ON public.support_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_support_messages_status_created ON public.support_messages (status, created_at DESC);

-- Achievement / user detail / XP admin RPCs
CREATE OR REPLACE FUNCTION public.admin_grant_achievement(_user_id uuid, _achievement_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (_user_id, _achievement_id) ON CONFLICT DO NOTHING;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'grant_achievement','user', _user_id::text, jsonb_build_object('achievement_id',_achievement_id));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_recompute_achievements(_user_id uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cnt int;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT COUNT(*) INTO cnt FROM public.user_achievements WHERE user_id = _user_id;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'recompute_achievements','user', _user_id::text, jsonb_build_object('current_count',cnt));
  RETURN cnt;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_recent_auth_events(_limit int DEFAULT 50)
RETURNS TABLE (id uuid, created_at timestamptz, action text, ip_address text, payload jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY
  SELECT e.id, e.created_at, e.payload->>'action', e.ip_address::text, e.payload
  FROM auth.audit_log_entries e ORDER BY e.created_at DESC LIMIT GREATEST(1, LEAST(_limit,500));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_user_detail(_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT jsonb_build_object(
    'profile', (SELECT to_jsonb(p) FROM (
      SELECT pr.user_id, pr.full_name, pr.avatar_url, pe.username, pe.bio, pe.location,
             pe.total_xp, pe.current_level, pe.xp_this_week, pe.is_suspended,
             pe.suspended_reason, pe.suspended_at, pe.leaderboard_hidden, pe.coding_leaderboard_hidden,
             pe.created_at, pe.updated_at
      FROM public.profiles pr LEFT JOIN public.user_profiles_extended pe ON pe.user_id = pr.user_id
      WHERE pr.user_id = _user_id LIMIT 1
    ) p),
    'roles', COALESCE((SELECT jsonb_agg(role::text) FROM public.user_roles WHERE user_id = _user_id), '[]'::jsonb),
    'achievements', COALESCE((SELECT jsonb_agg(jsonb_build_object('achievement_id',achievement_id,'earned_at',earned_at) ORDER BY earned_at DESC)
                              FROM public.user_achievements WHERE user_id = _user_id), '[]'::jsonb),
    'xp_recent', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM
      (SELECT id, amount, source, description, created_at FROM public.xp_transactions WHERE user_id = _user_id ORDER BY created_at DESC LIMIT 50) x), '[]'::jsonb),
    'recent_submissions', COALESCE((SELECT jsonb_agg(to_jsonb(s)) FROM
      (SELECT id, problem_slug, verdict, language, created_at FROM public.code_submissions WHERE user_id = _user_id ORDER BY created_at DESC LIMIT 25) s), '[]'::jsonb),
    'audit_actions', COALESCE((SELECT jsonb_agg(to_jsonb(a)) FROM
      (SELECT id, action, entity_type, entity_slug, created_at FROM public.admin_audit_log WHERE actor_id = _user_id ORDER BY created_at DESC LIMIT 25) a), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_revoke_achievement(_user_id uuid, _achievement_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  DELETE FROM public.user_achievements WHERE user_id = _user_id AND achievement_id = _achievement_id;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'achievement.revoke','user', _user_id::text, jsonb_build_object('achievement_id',_achievement_id));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_adjust_xp(_user_id uuid, _amount int, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  INSERT INTO public.xp_transactions(user_id, amount, source, description) VALUES (_user_id, _amount, 'admin_adjustment', COALESCE(_reason,'Admin adjustment'));
  UPDATE public.user_profiles_extended SET total_xp = GREATEST(0, COALESCE(total_xp,0) + _amount), updated_at = now() WHERE user_id = _user_id;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'xp.adjust','user', _user_id::text, jsonb_build_object('amount',_amount,'reason',_reason));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_leaderboard_top(_window text DEFAULT 'all', _limit int DEFAULT 100)
RETURNS TABLE(user_id uuid, full_name text, username text, avatar_url text, total_xp int, xp_this_week int, current_level int, leaderboard_hidden boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY
  SELECT pe.user_id, pr.full_name, pe.username, pr.avatar_url, pe.total_xp, pe.xp_this_week, pe.current_level, pe.leaderboard_hidden
  FROM public.user_profiles_extended pe LEFT JOIN public.profiles pr ON pr.user_id = pe.user_id
  ORDER BY CASE WHEN _window='week' THEN pe.xp_this_week ELSE pe.total_xp END DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(_limit,500));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_leaderboard_hidden(_user_id uuid, _hidden boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.user_profiles_extended SET leaderboard_hidden=_hidden, updated_at=now() WHERE user_id=_user_id;
  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_slug, diff)
  VALUES (auth.uid(),'leaderboard.hide','user', _user_id::text, jsonb_build_object('hidden',_hidden));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_achievement_stats()
RETURNS TABLE(achievement_id text, earned_count bigint, last_earned timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY SELECT ua.achievement_id, COUNT(*)::bigint, MAX(ua.earned_at)
  FROM public.user_achievements ua GROUP BY ua.achievement_id ORDER BY COUNT(*) DESC;
END; $$;

-- Gamification rule history
CREATE TABLE IF NOT EXISTS public.gamification_rule_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL, old_value jsonb, new_value jsonb NOT NULL, note text,
  changed_by uuid, changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grh_key_time ON public.gamification_rule_history (rule_key, changed_at DESC);
ALTER TABLE public.gamification_rule_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read rule history" ON public.gamification_rule_history FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert rule history" ON public.gamification_rule_history FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.admin_get_gamification_rules()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN COALESCE((SELECT jsonb_object_agg(key, value) FROM public.platform_settings WHERE key LIKE 'gamification.%'), '{}'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_gamification_rule(_key text, _value jsonb, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _full_key text; _old jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  _full_key := CASE WHEN _key LIKE 'gamification.%' THEN _key ELSE 'gamification.'||_key END;
  SELECT value INTO _old FROM public.platform_settings WHERE key = _full_key;
  INSERT INTO public.platform_settings(key,value,updated_by,updated_at) VALUES (_full_key,_value,auth.uid(),now())
  ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_by=auth.uid(), updated_at=now();
  INSERT INTO public.gamification_rule_history(rule_key,old_value,new_value,note,changed_by) VALUES (_full_key,_old,_value,_note,auth.uid());
  INSERT INTO public.admin_audit_log(actor_id,action,entity_type,entity_slug,diff)
  VALUES (auth.uid(),'gamification.rule_set','platform_setting',_full_key, jsonb_build_object('old',_old,'new',_value,'note',_note));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_gamification_history(_key text DEFAULT NULL, _limit int DEFAULT 50)
RETURNS TABLE(id uuid, rule_key text, old_value jsonb, new_value jsonb, note text, changed_by uuid, changed_at timestamptz, actor_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY
  SELECT h.id, h.rule_key, h.old_value, h.new_value, h.note, h.changed_by, h.changed_at, COALESCE(p.full_name,'')::text
  FROM public.gamification_rule_history h LEFT JOIN public.profiles p ON p.user_id = h.changed_by
  WHERE _key IS NULL OR h.rule_key = _key OR h.rule_key = 'gamification.'||_key
  ORDER BY h.changed_at DESC LIMIT GREATEST(_limit,1);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_search_users(_q text, _limit int DEFAULT 20)
RETURNS TABLE(user_id uuid, full_name text, username text, avatar_url text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY
  SELECT pe.user_id, p.full_name, pe.username, p.avatar_url
  FROM public.user_profiles_extended pe LEFT JOIN public.profiles p ON p.user_id = pe.user_id
  WHERE _q IS NULL OR _q = '' OR pe.username ILIKE '%'||_q||'%' OR p.full_name ILIKE '%'||_q||'%' OR pe.user_id::text = _q
  ORDER BY p.full_name NULLS LAST LIMIT GREATEST(_limit,1);
END; $$;

-- Contest kind + sequence_no
DO $$ BEGIN
  CREATE TYPE public.contest_kind AS ENUM ('monthly_long','weekly_saturday','weekly_sunday','biweekly','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.contests
  ADD COLUMN IF NOT EXISTS kind public.contest_kind NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS sequence_no integer;
CREATE UNIQUE INDEX IF NOT EXISTS contests_kind_sequence_uidx ON public.contests(kind, sequence_no) WHERE sequence_no IS NOT NULL;

ALTER TABLE public.contest_problems ADD COLUMN IF NOT EXISTS unlock_at timestamptz;

CREATE OR REPLACE FUNCTION public.contests_autonumber()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE next_seq int; seq_txt text; month_txt text;
BEGIN
  IF NEW.kind IS NULL OR NEW.kind = 'other' THEN RETURN NEW; END IF;
  IF NEW.sequence_no IS NULL THEN
    SELECT COALESCE(MAX(sequence_no),0)+1 INTO next_seq FROM public.contests WHERE kind = NEW.kind;
    NEW.sequence_no := next_seq;
  END IF;
  seq_txt := lpad(NEW.sequence_no::text,2,'0');
  IF NEW.title IS NULL OR NEW.title = '' THEN
    IF NEW.kind = 'monthly_long' THEN
      month_txt := to_char(NEW.starts_at AT TIME ZONE 'UTC','FMMonth YYYY');
      NEW.title := month_txt || ' Monthly Long Contest - '||seq_txt;
    ELSIF NEW.kind = 'weekly_saturday' THEN NEW.title := 'Saturday Weekly Contest - '||seq_txt;
    ELSIF NEW.kind = 'weekly_sunday' THEN NEW.title := 'Sunday Weekly Contest - '||seq_txt;
    ELSIF NEW.kind = 'biweekly' THEN NEW.title := 'BiWeekly Contest - '||seq_txt;
    END IF;
  END IF;
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.title,'[^a-zA-Z0-9]+','-','g'));
    NEW.slug := regexp_replace(NEW.slug,'(^-|-$)','','g');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_contests_autonumber ON public.contests;
CREATE TRIGGER trg_contests_autonumber BEFORE INSERT ON public.contests FOR EACH ROW EXECUTE FUNCTION public.contests_autonumber();

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_generated_content TO authenticated;
GRANT ALL ON public.ai_generated_content TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_content_likes TO authenticated;
GRANT ALL ON public.ai_content_likes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_content_progress TO authenticated;
GRANT ALL ON public.ai_content_progress TO service_role;
GRANT SELECT ON public.platform_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;
GRANT SELECT ON public.admin_daily_challenge_schedule TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_daily_challenge_schedule TO authenticated;
GRANT ALL ON public.admin_daily_challenge_schedule TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;
GRANT SELECT ON public.featured_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.featured_content TO authenticated;
GRANT ALL ON public.featured_content TO service_role;
GRANT SELECT ON public.library_hidden_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_hidden_items TO authenticated;
GRANT ALL ON public.library_hidden_items TO service_role;
GRANT SELECT ON public.roadmap_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_overrides TO authenticated;
GRANT ALL ON public.roadmap_overrides TO service_role;
GRANT INSERT ON public.support_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gamification_rule_history TO authenticated;
GRANT ALL ON public.gamification_rule_history TO service_role;

GRANT EXECUTE ON FUNCTION public.admin_list_users(text,int,int),
  public.admin_grant_role(uuid,app_role), public.admin_revoke_role(uuid,app_role),
  public.admin_suspend_user(uuid,text), public.admin_unsuspend_user(uuid),
  public.admin_set_setting(text,jsonb), public.admin_broadcast_notification(jsonb,text,text,jsonb),
  public.admin_schedule_daily_challenge(date,text), public.admin_dashboard_kpis(),
  public.admin_trend_submissions(int), public.admin_trend_signups(int),
  public.admin_resolve_report(uuid,text), public.admin_set_ai_content_visibility(uuid,boolean),
  public.admin_delete_ai_content(uuid), public.admin_grant_achievement(uuid,text),
  public.admin_recompute_achievements(uuid), public.admin_recent_auth_events(int),
  public.admin_user_detail(uuid), public.admin_revoke_achievement(uuid,text),
  public.admin_adjust_xp(uuid,int,text), public.admin_leaderboard_top(text,int),
  public.admin_set_leaderboard_hidden(uuid,boolean), public.admin_achievement_stats(),
  public.admin_get_gamification_rules(), public.admin_set_gamification_rule(text,jsonb,text),
  public.admin_gamification_history(text,int), public.admin_search_users(text,int)
TO authenticated;