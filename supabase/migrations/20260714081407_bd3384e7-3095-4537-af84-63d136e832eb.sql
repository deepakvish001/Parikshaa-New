
-- Coding problem versioning table for admin rollback
CREATE TABLE public.coding_problem_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  tests_snapshot JSONB,
  starter_snapshot JSONB,
  note TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (slug, version_number)
);

CREATE INDEX coding_problem_versions_slug_idx
  ON public.coding_problem_versions (slug, version_number DESC);

GRANT SELECT, INSERT ON public.coding_problem_versions TO authenticated;
GRANT ALL ON public.coding_problem_versions TO service_role;

ALTER TABLE public.coding_problem_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view coding problem versions"
  ON public.coding_problem_versions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can insert coding problem versions"
  ON public.coding_problem_versions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
