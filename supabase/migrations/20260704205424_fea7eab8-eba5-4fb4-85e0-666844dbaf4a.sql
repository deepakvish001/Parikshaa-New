
GRANT INSERT, UPDATE ON public.problem_companies TO anon;
CREATE POLICY "temp_seed_insert" ON public.problem_companies FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "temp_seed_update" ON public.problem_companies FOR UPDATE TO anon USING (true) WITH CHECK (true);
