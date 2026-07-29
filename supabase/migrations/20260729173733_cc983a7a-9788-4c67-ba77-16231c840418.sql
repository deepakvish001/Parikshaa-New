CREATE OR REPLACE FUNCTION public.mirror_mark_failure(_id bigint, _err text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.mirror_outbox
     SET attempts = attempts + 1,
         last_error = _err
   WHERE id = _id;
$$;

REVOKE ALL ON FUNCTION public.mirror_mark_failure(bigint, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mirror_mark_failure(bigint, text) TO service_role;