-- Projects Hub: user-owned portfolio projects, publicly readable
CREATE TABLE public.user_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  repo_url TEXT,
  live_url TEXT,
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  cover_image_url TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'github'
  external_id TEXT, -- e.g. github repo id, for dedupe on re-import
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_projects_user_id ON public.user_projects(user_id);
CREATE INDEX idx_user_projects_sort ON public.user_projects(user_id, pinned DESC, sort_order ASC, created_at DESC);
CREATE UNIQUE INDEX idx_user_projects_external ON public.user_projects(user_id, source, external_id) WHERE external_id IS NOT NULL;

-- Grants: publicly readable, owner CRUD
GRANT SELECT ON public.user_projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_projects TO authenticated;
GRANT ALL ON public.user_projects TO service_role;

ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view projects"
  ON public.user_projects FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own projects"
  ON public.user_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.user_projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.user_projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- updated_at trigger (reuse existing function if available, else inline)
CREATE OR REPLACE FUNCTION public.tg_user_projects_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_projects_touch_updated_at
  BEFORE UPDATE ON public.user_projects
  FOR EACH ROW EXECUTE FUNCTION public.tg_user_projects_touch_updated_at();