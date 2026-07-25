ALTER TABLE public.user_profiles_extended
  ADD COLUMN IF NOT EXISTS notify_discussion_reply BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_discussion_like  BOOLEAN NOT NULL DEFAULT true;