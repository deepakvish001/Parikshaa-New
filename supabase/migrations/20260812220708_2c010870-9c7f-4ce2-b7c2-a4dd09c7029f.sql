-- ============ tracked handles ============
CREATE TABLE public.tracked_handles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  platform text NOT NULL DEFAULT 'leetcode',
  handle text NOT NULL,
  display_name text,
  avatar_url text,
  is_self boolean NOT NULL DEFAULT false,
  sync_status text NOT NULL DEFAULT 'pending',
  sync_error text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, platform, handle)
);
CREATE INDEX idx_tracked_handles_owner ON public.tracked_handles(owner_id);
CREATE INDEX idx_tracked_handles_handle ON public.tracked_handles(platform, handle);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracked_handles TO authenticated;
GRANT ALL ON public.tracked_handles TO service_role;
ALTER TABLE public.tracked_handles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tracked handles" ON public.tracked_handles FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TRIGGER trg_tracked_handles_updated BEFORE UPDATE ON public.tracked_handles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ shared handle data ============
CREATE TABLE public.handle_snapshots (
  platform text NOT NULL DEFAULT 'leetcode',
  handle text NOT NULL,
  display_name text,
  avatar_url text,
  country text,
  total_solved integer NOT NULL DEFAULT 0,
  easy_solved integer NOT NULL DEFAULT 0,
  medium_solved integer NOT NULL DEFAULT 0,
  hard_solved integer NOT NULL DEFAULT 0,
  total_easy integer NOT NULL DEFAULT 0,
  total_medium integer NOT NULL DEFAULT 0,
  total_hard integer NOT NULL DEFAULT 0,
  acceptance_rate numeric NOT NULL DEFAULT 0,
  global_ranking integer,
  contest_rating numeric,
  contest_global_ranking integer,
  contest_top_percentage numeric,
  attended_contests integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  active_days integer NOT NULL DEFAULT 0,
  solved_today integer NOT NULL DEFAULT 0,
  solved_this_week integer NOT NULL DEFAULT 0,
  solved_this_month integer NOT NULL DEFAULT 0,
  avg_per_active_day numeric NOT NULL DEFAULT 0,
  peak_day text,
  consistency numeric NOT NULL DEFAULT 0,
  languages jsonb NOT NULL DEFAULT '[]'::jsonb,
  topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (platform, handle)
);
GRANT SELECT ON public.handle_snapshots TO authenticated, anon;
GRANT ALL ON public.handle_snapshots TO service_role;
ALTER TABLE public.handle_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "handle snapshots readable" ON public.handle_snapshots FOR SELECT TO authenticated, anon USING (true);

CREATE TABLE public.handle_daily_activity (
  platform text NOT NULL DEFAULT 'leetcode',
  handle text NOT NULL,
  day date NOT NULL,
  submissions integer NOT NULL DEFAULT 0,
  PRIMARY KEY (platform, handle, day)
);
GRANT SELECT ON public.handle_daily_activity TO authenticated, anon;
GRANT ALL ON public.handle_daily_activity TO service_role;
ALTER TABLE public.handle_daily_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "handle activity readable" ON public.handle_daily_activity FOR SELECT TO authenticated, anon USING (true);

CREATE TABLE public.handle_recent_solves (
  id bigserial PRIMARY KEY,
  platform text NOT NULL DEFAULT 'leetcode',
  handle text NOT NULL,
  problem_slug text NOT NULL,
  title text NOT NULL,
  difficulty text,
  lang text,
  solved_at timestamptz NOT NULL,
  UNIQUE (platform, handle, problem_slug, solved_at)
);
CREATE INDEX idx_handle_recent_solves_time ON public.handle_recent_solves(solved_at DESC);
GRANT SELECT ON public.handle_recent_solves TO authenticated, anon;
GRANT ALL ON public.handle_recent_solves TO service_role;
ALTER TABLE public.handle_recent_solves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "handle solves readable" ON public.handle_recent_solves FOR SELECT TO authenticated, anon USING (true);

CREATE TABLE public.handle_contest_history (
  platform text NOT NULL DEFAULT 'leetcode',
  handle text NOT NULL,
  contest_title text NOT NULL,
  start_time timestamptz NOT NULL,
  attended boolean NOT NULL DEFAULT false,
  rating numeric,
  ranking integer,
  PRIMARY KEY (platform, handle, contest_title)
);
GRANT SELECT ON public.handle_contest_history TO authenticated, anon;
GRANT ALL ON public.handle_contest_history TO service_role;
ALTER TABLE public.handle_contest_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "handle contest history readable" ON public.handle_contest_history FOR SELECT TO authenticated, anon USING (true);

CREATE TABLE public.lc_problem_meta (
  slug text PRIMARY KEY,
  title text,
  difficulty text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lc_problem_meta TO authenticated, anon;
GRANT ALL ON public.lc_problem_meta TO service_role;
ALTER TABLE public.lc_problem_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "problem meta readable" ON public.lc_problem_meta FOR SELECT TO authenticated, anon USING (true);

-- ============ clans ============
CREATE TABLE public.clans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tag text,
  description text,
  banner_url text,
  logo_url text,
  is_public boolean NOT NULL DEFAULT true,
  invite_code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clans TO authenticated;
GRANT SELECT ON public.clans TO anon;
GRANT ALL ON public.clans TO service_role;
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.clan_members (
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (clan_id, user_id)
);
CREATE INDEX idx_clan_members_user ON public.clan_members(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clan_members TO authenticated;
GRANT ALL ON public.clan_members TO service_role;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_clan_member(_clan uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.clan_members WHERE clan_id = _clan AND user_id = _user)
$$;

CREATE OR REPLACE FUNCTION public.is_clan_manager(_clan uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clan_members
    WHERE clan_id = _clan AND user_id = _user AND role IN ('owner','admin')
  )
$$;

CREATE POLICY "public clans visible" ON public.clans FOR SELECT TO authenticated, anon
  USING (is_public = true);
CREATE POLICY "members see own clan" ON public.clans FOR SELECT TO authenticated
  USING (public.is_clan_member(id, auth.uid()));
CREATE POLICY "create clan" ON public.clans FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "managers update clan" ON public.clans FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_clan_manager(id, auth.uid()))
  WITH CHECK (owner_id = auth.uid() OR public.is_clan_manager(id, auth.uid()));
CREATE POLICY "owner deletes clan" ON public.clans FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "members visible to co-members" ON public.clan_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_clan_member(clan_id, auth.uid()));
CREATE POLICY "join clan" ON public.clan_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_clan_manager(clan_id, auth.uid()));
CREATE POLICY "leave or manage members" ON public.clan_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_clan_manager(clan_id, auth.uid()));
CREATE POLICY "managers update members" ON public.clan_members FOR UPDATE TO authenticated
  USING (public.is_clan_manager(clan_id, auth.uid()))
  WITH CHECK (public.is_clan_manager(clan_id, auth.uid()));

CREATE TRIGGER trg_clans_updated BEFORE UPDATE ON public.clans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ external contests ============
CREATE TABLE public.external_contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  external_id text NOT NULL,
  title text NOT NULL,
  url text,
  start_time timestamptz NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 0,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, external_id)
);
CREATE INDEX idx_external_contests_start ON public.external_contests(start_time);
GRANT SELECT ON public.external_contests TO authenticated, anon;
GRANT ALL ON public.external_contests TO service_role;
ALTER TABLE public.external_contests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "external contests readable" ON public.external_contests FOR SELECT TO authenticated, anon USING (true);

-- ============ saved problems ============
CREATE TABLE public.saved_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL DEFAULT 'leetcode',
  problem_slug text NOT NULL,
  title text,
  difficulty text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, problem_slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_problems TO authenticated;
GRANT ALL ON public.saved_problems TO service_role;
ALTER TABLE public.saved_problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saved problems" ON public.saved_problems FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());