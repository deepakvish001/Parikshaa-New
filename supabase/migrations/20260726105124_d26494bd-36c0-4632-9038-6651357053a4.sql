
-- Extend self-grant to also assign the 'owner' role (idempotent).
CREATE OR REPLACE FUNCTION public.grant_admin_to_self()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.user_roles(user_id, role)
  VALUES (auth.uid(), 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Try to also assign owner if that enum value exists; ignore if not.
  BEGIN
    INSERT INTO public.user_roles(user_id, role)
    VALUES (auth.uid(), 'owner'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN invalid_text_representation THEN
    NULL;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_admin_to_self() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_admin_to_self() TO authenticated;
