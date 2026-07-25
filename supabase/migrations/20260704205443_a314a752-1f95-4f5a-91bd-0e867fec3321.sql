
DROP POLICY IF EXISTS "temp_seed_insert" ON public.problem_companies;
DROP POLICY IF EXISTS "temp_seed_update" ON public.problem_companies;
CREATE POLICY "temp_seed_all" ON public.problem_companies FOR ALL TO public USING (true) WITH CHECK (true);
GRANT INSERT, UPDATE ON public.problem_companies TO public;
