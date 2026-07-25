
-- 1. Fix SECURITY DEFINER view: make public_user_profiles use invoker rights so
--    caller's RLS applies.
ALTER VIEW public.public_user_profiles SET (security_invoker = true);

-- 2. admin_feature_flag_registry: remove world-readable policy, admin-only.
DROP POLICY IF EXISTS "affr public read" ON public.admin_feature_flag_registry;

-- 3. admin_outreach_hidden: remove world-readable policy, admin-only.
DROP POLICY IF EXISTS "aoh public read" ON public.admin_outreach_hidden;

-- 4. admin_daily_challenge_schedule: only expose today's row (and admins can
--    see the full future schedule via the existing admin ALL policy).
DROP POLICY IF EXISTS "dcs public read" ON public.admin_daily_challenge_schedule;
CREATE POLICY "dcs today only public read"
ON public.admin_daily_challenge_schedule
FOR SELECT
USING (challenge_date = (now() AT TIME ZONE 'UTC')::date);

-- 5. profiles: keep authenticated leaderboard reads, but restrict which
--    columns non-owners can read via column-level GRANTs. suspended_at is
--    admin-only metadata and should not be broadly visible.
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, user_id, full_name, avatar_url, is_premium, created_at, updated_at)
  ON public.profiles TO authenticated;
-- service_role and admin RLS policies retain full-column access via GRANT ALL.
GRANT ALL ON public.profiles TO service_role;
