
-- Add profile_subjects to extended profile
ALTER TABLE public.user_profiles_extended
  ADD COLUMN IF NOT EXISTS profile_subjects jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Recreate the public_user_profiles view to expose new field
DROP VIEW IF EXISTS public.public_user_profiles;
CREATE VIEW public.public_user_profiles AS
SELECT
  user_id, username, bio, location, occupation, website,
  skills, interests, goals, aspirations,
  twitter_url, linkedin_url, github_url, instagram_url,
  leetcode_url, hackerrank_url, codeforces_url, codechef_url, geeksforgeeks_url,
  college_name, branch, study_year,
  total_xp, xp_this_week, current_level, profile_completion_percentage,
  profile_subjects, resume_url,
  created_at
FROM public.user_profiles_extended;

GRANT SELECT ON public.public_user_profiles TO anon, authenticated;

-- Leetcode cache (24h TTL). Read-only public, service role writes.
CREATE TABLE IF NOT EXISTS public.leetcode_cache (
  username text PRIMARY KEY,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.leetcode_cache TO anon, authenticated;
GRANT ALL ON public.leetcode_cache TO service_role;

ALTER TABLE public.leetcode_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leetcode cache"
  ON public.leetcode_cache FOR SELECT
  USING (true);
