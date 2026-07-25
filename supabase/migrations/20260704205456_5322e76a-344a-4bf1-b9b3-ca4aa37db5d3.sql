
DROP POLICY IF EXISTS "temp_seed_all" ON public.problem_companies;
REVOKE INSERT, UPDATE ON public.problem_companies FROM public;
