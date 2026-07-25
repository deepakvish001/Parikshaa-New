CREATE TABLE public.visualize_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  algo_id TEXT NOT NULL,
  step INTEGER NOT NULL DEFAULT 0,
  speed INTEGER NOT NULL DEFAULT 900,
  reduced_motion BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, algo_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.visualize_progress TO authenticated;
GRANT ALL ON public.visualize_progress TO service_role;

ALTER TABLE public.visualize_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own visualize progress"
  ON public.visualize_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_visualize_progress_updated_at
  BEFORE UPDATE ON public.visualize_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_visualize_progress_user ON public.visualize_progress(user_id);
