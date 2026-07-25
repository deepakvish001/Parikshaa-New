
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, endpoint)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ps self all" ON public.push_subscriptions;
CREATE POLICY "ps self all" ON public.push_subscriptions FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE IF NOT EXISTS public.user_platform_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  rating INTEGER,
  solved_easy INTEGER NOT NULL DEFAULT 0,
  solved_medium INTEGER NOT NULL DEFAULT 0,
  solved_hard INTEGER NOT NULL DEFAULT 0,
  solved_total INTEGER NOT NULL DEFAULT 0,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  sync_status TEXT NOT NULL DEFAULT 'ok',
  sync_error TEXT,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.user_platform_stats TO authenticated;
GRANT ALL ON public.user_platform_stats TO service_role;
ALTER TABLE public.user_platform_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ups self all" ON public.user_platform_stats;
CREATE POLICY "ups self all" ON public.user_platform_stats FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
DROP TRIGGER IF EXISTS trg_ups_updated ON public.user_platform_stats;
CREATE TRIGGER trg_ups_updated BEFORE UPDATE ON public.user_platform_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.user_platform_sync_jobs (
  user_id uuid NOT NULL,
  platform text NOT NULL,
  handle text NOT NULL,
  interval_hours integer NOT NULL DEFAULT 24,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  last_run_at timestamptz,
  last_status text,
  last_error text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, platform)
);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_next_run ON public.user_platform_sync_jobs(next_run_at) WHERE enabled=true;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.user_platform_sync_jobs TO authenticated;
GRANT ALL ON public.user_platform_sync_jobs TO service_role;
ALTER TABLE public.user_platform_sync_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "upsj self all" ON public.user_platform_sync_jobs;
CREATE POLICY "upsj self all" ON public.user_platform_sync_jobs FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
DROP TRIGGER IF EXISTS trg_upsj_updated ON public.user_platform_sync_jobs;
CREATE TRIGGER trg_upsj_updated BEFORE UPDATE ON public.user_platform_sync_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.coding_problems ADD COLUMN IF NOT EXISTS mcq jsonb;

CREATE TABLE IF NOT EXISTS public.coding_problem_mcq_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  problem_slug text NOT NULL,
  selected_index int NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, problem_slug)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.coding_problem_mcq_attempts TO authenticated;
GRANT ALL ON public.coding_problem_mcq_attempts TO service_role;
ALTER TABLE public.coding_problem_mcq_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mcq self all" ON public.coding_problem_mcq_attempts;
CREATE POLICY "mcq self all" ON public.coding_problem_mcq_attempts FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE IF NOT EXISTS public.problem_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_slug TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_domain TEXT NOT NULL,
  frequency NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (problem_slug, company_name)
);
CREATE INDEX IF NOT EXISTS idx_problem_companies_slug ON public.problem_companies (problem_slug);
GRANT SELECT ON public.problem_companies TO anon, authenticated;
GRANT ALL ON public.problem_companies TO service_role;
ALTER TABLE public.problem_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pc read all" ON public.problem_companies;
CREATE POLICY "pc read all" ON public.problem_companies FOR SELECT USING (true);
