CREATE OR REPLACE FUNCTION public.admin_system_health()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'users_total', (SELECT count(*) FROM auth.users),
    'users_24h', (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '24 hours'),
    'problems_total', (SELECT count(*) FROM public.coding_problems),
    'submissions_total', (SELECT count(*) FROM public.code_submissions),
    'submissions_24h', (SELECT count(*) FROM public.code_submissions WHERE created_at > now() - interval '24 hours'),
    'ai_content_total', (SELECT count(*) FROM public.ai_generated_content),
    'audit_24h', (SELECT count(*) FROM public.admin_audit_log WHERE created_at > now() - interval '24 hours'),
    'reports_open', (SELECT count(*) FROM public.content_reports WHERE status = 'open'),
    'now', now()
  )
  INTO result;

  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_system_health() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_system_health() TO authenticated;