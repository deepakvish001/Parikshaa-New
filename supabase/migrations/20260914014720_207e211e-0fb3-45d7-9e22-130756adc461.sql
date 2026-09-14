REVOKE ALL ON FUNCTION public.finalize_contest_ratings(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_contest_ratings(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.finalize_due_contest_ratings() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_due_contest_ratings() TO service_role;