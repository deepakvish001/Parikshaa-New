CREATE TABLE IF NOT EXISTS public.blog_media_upload_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'articles',
  content_type TEXT NOT NULL DEFAULT 'image/png',
  base64_data TEXT NOT NULL,
  target_post_slug TEXT,
  target_field TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','succeeded','failed','dead')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 8,
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_path TEXT,
  resolved_signed_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_media_upload_queue TO authenticated;
GRANT ALL ON public.blog_media_upload_queue TO service_role;

ALTER TABLE public.blog_media_upload_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "queue admin owner all"
  ON public.blog_media_upload_queue
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE INDEX IF NOT EXISTS blog_media_upload_queue_pending_idx
  ON public.blog_media_upload_queue (status, next_attempt_at)
  WHERE status = 'pending';

CREATE TRIGGER blog_media_upload_queue_touch
  BEFORE UPDATE ON public.blog_media_upload_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();