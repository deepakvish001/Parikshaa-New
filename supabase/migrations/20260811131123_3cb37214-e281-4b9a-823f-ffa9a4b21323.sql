
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;

CREATE TABLE IF NOT EXISTS public.contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'finished', 'cancelled')),
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'hidden')),
  scoring_mode text NOT NULL DEFAULT 'icpc' CHECK (scoring_mode IN ('icpc', 'points', 'io')),
  penalty_minutes integer DEFAULT 0,
  is_weekly_rated boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.contests TO authenticated, anon;
GRANT ALL ON public.contests TO service_role;

ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published contests" ON public.contests
  FOR SELECT USING (status = 'published' OR status = 'finished' OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_contests_weekly_starts ON public.contests(is_weekly_rated, starts_at DESC);

ALTER TABLE public.coding_problems 
  ADD COLUMN IF NOT EXISTS is_contest_pool boolean NOT NULL DEFAULT false;

GRANT SELECT ON public.coding_problems TO authenticated, anon;
GRANT ALL ON public.coding_problems TO service_role;
