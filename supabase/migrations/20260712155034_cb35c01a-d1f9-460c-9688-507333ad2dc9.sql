
DROP POLICY IF EXISTS "Authenticated users can view battle achievements" ON public.battle_achievements;
CREATE POLICY "Users view own battle achievements"
  ON public.battle_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Portfolio settings publicly readable" ON public.portfolio_settings;
CREATE POLICY "Public portfolios or owner readable"
  ON public.portfolio_settings FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can view profiles for leaderboard" ON public.profiles;

CREATE OR REPLACE VIEW public.profiles_public AS
SELECT user_id, full_name, avatar_url
FROM public.profiles
WHERE suspended_at IS NULL;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view projects" ON public.user_projects;
CREATE POLICY "Users view own projects"
  ON public.user_projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
