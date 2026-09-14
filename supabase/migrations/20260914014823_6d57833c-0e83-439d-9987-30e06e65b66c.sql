CREATE OR REPLACE FUNCTION public.process_due_contests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed_count integer := 0;
  finalized_count integer := 0;
BEGIN
  UPDATE public.contests
  SET status = 'live', updated_at = now()
  WHERE status = 'published'
    AND starts_at <= now()
    AND ends_at > now();
  GET DIAGNOSTICS changed_count = ROW_COUNT;

  UPDATE public.contests
  SET status = 'ended', updated_at = now()
  WHERE status IN ('published', 'live')
    AND ends_at <= now();
  GET DIAGNOSTICS finalized_count = ROW_COUNT;

  finalized_count := finalized_count + public.finalize_due_contest_ratings();
  RETURN changed_count + finalized_count;
END;
$$;

REVOKE ALL ON FUNCTION public.process_due_contests() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_due_contests() TO service_role;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'process-due-contests';

SELECT cron.schedule(
  'process-due-contests',
  '0 * * * *',
  'SELECT public.process_due_contests();'
);