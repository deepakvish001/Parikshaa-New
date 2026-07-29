CREATE TABLE IF NOT EXISTS public.mirror_sync_log (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL,
  ok BOOLEAN NOT NULL DEFAULT true,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mirror_sync_log TO authenticated;
GRANT ALL ON public.mirror_sync_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.mirror_sync_log_id_seq TO service_role;

ALTER TABLE public.mirror_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view mirror sync log"
  ON public.mirror_sync_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE INDEX IF NOT EXISTS mirror_sync_log_created_idx ON public.mirror_sync_log (created_at DESC);

CREATE OR REPLACE FUNCTION public.mirror_auth_export(_after TIMESTAMPTZ DEFAULT '1970-01-01'::timestamptz, _limit INT DEFAULT 500)
RETURNS TABLE (
  id UUID,
  email TEXT,
  phone TEXT,
  encrypted_password TEXT,
  email_confirmed_at TIMESTAMPTZ,
  phone_confirmed_at TIMESTAMPTZ,
  raw_user_meta_data JSONB,
  raw_app_meta_data JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT u.id, u.email::text, u.phone::text, u.encrypted_password::text,
         u.email_confirmed_at, u.phone_confirmed_at,
         u.raw_user_meta_data, u.raw_app_meta_data, u.created_at, u.updated_at
  FROM auth.users u
  WHERE u.updated_at > _after
  ORDER BY u.updated_at ASC
  LIMIT _limit;
$$;

REVOKE ALL ON FUNCTION public.mirror_auth_export(TIMESTAMPTZ, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mirror_auth_export(TIMESTAMPTZ, INT) TO service_role;