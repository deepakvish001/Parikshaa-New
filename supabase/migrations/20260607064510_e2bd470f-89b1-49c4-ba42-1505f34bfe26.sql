CREATE TABLE public.user_sheet_prefs (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sheet_id text NOT NULL,
  prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, sheet_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sheet_prefs TO authenticated;
GRANT ALL ON public.user_sheet_prefs TO service_role;
ALTER TABLE public.user_sheet_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sheet prefs read"   ON public.user_sheet_prefs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own sheet prefs insert" ON public.user_sheet_prefs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sheet prefs update" ON public.user_sheet_prefs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sheet prefs delete" ON public.user_sheet_prefs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.tg_user_sheet_prefs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER user_sheet_prefs_set_updated_at
BEFORE UPDATE ON public.user_sheet_prefs
FOR EACH ROW EXECUTE FUNCTION public.tg_user_sheet_prefs_updated_at();