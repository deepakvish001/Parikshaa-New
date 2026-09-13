ALTER TABLE public.user_topic_progress
  ADD COLUMN IF NOT EXISTS time_spent_seconds integer NOT NULL DEFAULT 0;

ALTER TABLE public.user_topic_progress
  DROP CONSTRAINT IF EXISTS user_topic_progress_time_spent_seconds_nonnegative;
ALTER TABLE public.user_topic_progress
  ADD CONSTRAINT user_topic_progress_time_spent_seconds_nonnegative
  CHECK (time_spent_seconds >= 0);

CREATE OR REPLACE FUNCTION public.add_topic_study_time(
  _sheet_id text,
  _topic_id text,
  _seconds integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _new_total integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _seconds < 1 OR _seconds > 300 THEN
    RAISE EXCEPTION 'Study time increment must be between 1 and 300 seconds';
  END IF;

  INSERT INTO public.user_topic_progress (
    user_id, sheet_id, topic_id, time_spent_seconds
  ) VALUES (
    auth.uid(), _sheet_id, _topic_id, _seconds
  )
  ON CONFLICT (user_id, sheet_id, topic_id)
  DO UPDATE SET
    time_spent_seconds = public.user_topic_progress.time_spent_seconds + EXCLUDED.time_spent_seconds,
    updated_at = now()
  RETURNING time_spent_seconds INTO _new_total;

  RETURN _new_total;
END;
$$;

REVOKE ALL ON FUNCTION public.add_topic_study_time(text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_topic_study_time(text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_topic_study_time(text, text, integer) TO service_role;

DROP POLICY IF EXISTS "leaderboard public read" ON public.contest_leaderboard_cache;
CREATE POLICY "leaderboard public read"
ON public.contest_leaderboard_cache
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.contests c
    WHERE c.id = contest_leaderboard_cache.contest_id
      AND c.status IN ('published', 'live', 'ended', 'finished')
  )
);

CREATE OR REPLACE FUNCTION public.refresh_contest_leaderboard_after_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_contest_leaderboard(NEW.contest_id);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_contest_leaderboard_after_submission() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_contest_leaderboard_after_submission() TO service_role;

DROP TRIGGER IF EXISTS trg_refresh_contest_leaderboard ON public.contest_submissions;
CREATE TRIGGER trg_refresh_contest_leaderboard
AFTER INSERT OR UPDATE OF verdict, submitted_at OR DELETE
ON public.contest_submissions
FOR EACH ROW
EXECUTE FUNCTION public.refresh_contest_leaderboard_after_submission();