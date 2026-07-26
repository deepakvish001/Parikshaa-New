CREATE TABLE public.builtin_sheet_overrides (
  slug TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  sections JSONB,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.builtin_sheet_overrides TO authenticated;
GRANT ALL ON public.builtin_sheet_overrides TO service_role;

ALTER TABLE public.builtin_sheet_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/owners can read overrides"
  ON public.builtin_sheet_overrides FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins/owners can insert overrides"
  ON public.builtin_sheet_overrides FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins/owners can update overrides"
  ON public.builtin_sheet_overrides FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins/owners can delete overrides"
  ON public.builtin_sheet_overrides FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE TRIGGER trg_builtin_sheet_overrides_updated
  BEFORE UPDATE ON public.builtin_sheet_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();