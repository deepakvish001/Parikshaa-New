CREATE TABLE IF NOT EXISTS public.builtin_sheet_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  include_articles BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.builtin_sheet_share_links TO authenticated;
GRANT SELECT ON public.builtin_sheet_share_links TO anon;
GRANT ALL ON public.builtin_sheet_share_links TO service_role;

ALTER TABLE public.builtin_sheet_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can lookup active share link by token"
  ON public.builtin_sheet_share_links FOR SELECT
  USING (revoked = false AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins/owners manage share links"
  ON public.builtin_sheet_share_links FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE INDEX IF NOT EXISTS idx_builtin_sheet_share_links_slug ON public.builtin_sheet_share_links(slug);
CREATE INDEX IF NOT EXISTS idx_builtin_sheet_share_links_token ON public.builtin_sheet_share_links(token);

CREATE TRIGGER trg_builtin_sheet_share_links_updated
  BEFORE UPDATE ON public.builtin_sheet_share_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();