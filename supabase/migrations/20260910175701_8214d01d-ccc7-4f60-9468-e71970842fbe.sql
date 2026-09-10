-- 1. Security definer view -> respect caller permissions
ALTER VIEW public.clan_stats_view SET (security_invoker = on);

-- 2. Trigger-only SECURITY DEFINER functions must not be callable via the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_xp_activity() FROM PUBLIC, anon, authenticated;

-- 3. Privilege escalation: any signed-in user could self-grant admin/owner
DROP FUNCTION IF EXISTS public.grant_admin_to_self();

-- 4. Public mirror of display-safe profile data
CREATE TABLE IF NOT EXISTS public.public_profiles (
  user_id uuid PRIMARY KEY,
  full_name text,
  avatar_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT ALL ON public.public_profiles TO service_role;
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.public_profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.public_profiles FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.public_profiles WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  INSERT INTO public.public_profiles (user_id, full_name, avatar_url, updated_at)
  VALUES (NEW.user_id, NEW.full_name, NEW.avatar_url, now())
  ON CONFLICT (user_id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_public_profile() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_sync_public_profile ON public.profiles;
CREATE TRIGGER trg_sync_public_profile
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_public_profile();

INSERT INTO public.public_profiles (user_id, full_name, avatar_url)
SELECT user_id, full_name, avatar_url FROM public.profiles
ON CONFLICT (user_id) DO UPDATE
  SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url;

-- 5. Public mirror of achievement badges
CREATE TABLE IF NOT EXISTS public.public_user_achievements (
  user_id uuid NOT NULL,
  achievement_id text NOT NULL,
  earned_at timestamptz,
  PRIMARY KEY (user_id, achievement_id)
);
GRANT SELECT ON public.public_user_achievements TO anon, authenticated;
GRANT ALL ON public.public_user_achievements TO service_role;
ALTER TABLE public.public_user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public achievements are viewable by everyone" ON public.public_user_achievements;
CREATE POLICY "Public achievements are viewable by everyone"
  ON public.public_user_achievements FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.sync_public_achievement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.public_user_achievements
      WHERE user_id = OLD.user_id AND achievement_id = OLD.achievement_id;
    RETURN OLD;
  END IF;
  INSERT INTO public.public_user_achievements (user_id, achievement_id, earned_at)
  VALUES (NEW.user_id, NEW.achievement_id, NEW.earned_at)
  ON CONFLICT (user_id, achievement_id) DO UPDATE SET earned_at = EXCLUDED.earned_at;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_public_achievement() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_sync_public_achievement ON public.user_achievements;
CREATE TRIGGER trg_sync_public_achievement
AFTER INSERT OR UPDATE OR DELETE ON public.user_achievements
FOR EACH ROW EXECUTE FUNCTION public.sync_public_achievement();

INSERT INTO public.public_user_achievements (user_id, achievement_id, earned_at)
SELECT user_id, achievement_id, earned_at FROM public.user_achievements
ON CONFLICT (user_id, achievement_id) DO UPDATE SET earned_at = EXCLUDED.earned_at;

-- 6. Lock down the base tables
DROP POLICY IF EXISTS "Anyone can view profiles for leaderboard" ON public.profiles;
CREATE POLICY "Signed-in users can view profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.profiles FROM anon;

DROP POLICY IF EXISTS "Anyone can view user achievements for public profiles" ON public.user_achievements;
CREATE POLICY "Signed-in users can view achievements"
  ON public.user_achievements FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.user_achievements FROM anon;

-- 7. Avatars: direct object reads limited to the owner (bucket is served publicly via CDN)
DROP POLICY IF EXISTS "Authenticated can view avatars" ON storage.objects;
CREATE POLICY "Users can view their own avatar"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);