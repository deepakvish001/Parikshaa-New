ALTER TABLE public.user_topic_progress
  ADD COLUMN IF NOT EXISTS revision_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revision_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_revised_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS user_topic_progress_user_sheet_last_revised_idx
  ON public.user_topic_progress (user_id, sheet_id, last_revised_at DESC);