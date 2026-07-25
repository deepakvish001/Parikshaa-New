
CREATE TABLE public.problem_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_slug TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_domain TEXT NOT NULL,
  frequency NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (problem_slug, company_name)
);

CREATE INDEX idx_problem_companies_slug ON public.problem_companies (problem_slug);

GRANT SELECT ON public.problem_companies TO anon, authenticated;
GRANT ALL ON public.problem_companies TO service_role;

ALTER TABLE public.problem_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Problem companies are readable by everyone"
  ON public.problem_companies FOR SELECT
  USING (true);
