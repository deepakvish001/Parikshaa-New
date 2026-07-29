CREATE OR REPLACE FUNCTION public.mirror_local_q(q TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  IF lower(btrim(q)) NOT LIKE 'select%' THEN
    RAISE EXCEPTION 'only select allowed';
  END IF;
  EXECUTE 'select coalesce(jsonb_agg(t), ''[]''::jsonb) from (' || q || ') t' INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.mirror_local_q(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mirror_local_q(TEXT) TO service_role;