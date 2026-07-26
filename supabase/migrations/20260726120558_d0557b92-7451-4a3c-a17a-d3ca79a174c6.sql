
ALTER TABLE public.user_folder_items
  ADD COLUMN IF NOT EXISTS question_slug text;

ALTER TABLE public.user_folder_items
  ALTER COLUMN question_id DROP NOT NULL;

ALTER TABLE public.user_folder_items
  DROP CONSTRAINT IF EXISTS user_folder_items_identifier_chk;
ALTER TABLE public.user_folder_items
  ADD CONSTRAINT user_folder_items_identifier_chk
  CHECK (question_id IS NOT NULL OR question_slug IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS user_folder_items_folder_slug_uniq
  ON public.user_folder_items (folder_id, question_slug)
  WHERE question_slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_folder_items_folder_qid_uniq
  ON public.user_folder_items (folder_id, question_source, question_id)
  WHERE question_id IS NOT NULL;
