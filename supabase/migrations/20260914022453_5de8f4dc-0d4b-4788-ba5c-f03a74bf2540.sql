CREATE TABLE public.user_sheet_progress_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sheet_id text NOT NULL,
  total_count integer NOT NULL DEFAULT 0 CHECK (total_count >= 0),
  solved_count integer NOT NULL DEFAULT 0 CHECK (solved_count >= 0),
  pending_count integer NOT NULL DEFAULT 0 CHECK (pending_count >= 0),
  time_spent_seconds integer NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, sheet_id)
);

GRANT SELECT ON public.user_sheet_progress_summary TO authenticated;
GRANT ALL ON public.user_sheet_progress_summary TO service_role;

ALTER TABLE public.user_sheet_progress_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sheet progress summaries"
ON public.user_sheet_progress_summary
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.refresh_user_sheet_progress_summary(
  _sheet_id text,
  _total_count integer DEFAULT NULL,
  _user_id uuid DEFAULT auth.uid()
)
RETURNS public.user_sheet_progress_summary
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_id uuid := auth.uid();
  _resolved_user_id uuid;
  _existing_total integer;
  _tracked_count integer;
  _solved_count integer;
  _time_spent integer;
  _result public.user_sheet_progress_summary;
BEGIN
  IF _sheet_id IS NULL OR btrim(_sheet_id) = '' THEN
    RAISE EXCEPTION 'sheet_id is required';
  END IF;

  IF _caller_id IS NULL THEN
    _resolved_user_id := _user_id;
  ELSE
    _resolved_user_id := _caller_id;
  END IF;

  IF _resolved_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF _total_count IS NOT NULL AND (_total_count < 0 OR _total_count > 10000) THEN
    RAISE EXCEPTION 'invalid sheet total';
  END IF;

  SELECT total_count
  INTO _existing_total
  FROM public.user_sheet_progress_summary
  WHERE user_id = _resolved_user_id AND sheet_id = _sheet_id;

  SELECT
    count(*) FILTER (WHERE topic_id <> '__sheet_session__'),
    count(*) FILTER (WHERE topic_id <> '__sheet_session__' AND completed),
    coalesce(sum(time_spent_seconds), 0)
  INTO _tracked_count, _solved_count, _time_spent
  FROM public.user_topic_progress
  WHERE user_id = _resolved_user_id AND sheet_id = _sheet_id;

  _existing_total := greatest(
    coalesce(_total_count, _existing_total, 0),
    coalesce(_tracked_count, 0),
    coalesce(_solved_count, 0)
  );

  INSERT INTO public.user_sheet_progress_summary (
    user_id,
    sheet_id,
    total_count,
    solved_count,
    pending_count,
    time_spent_seconds,
    updated_at
  ) VALUES (
    _resolved_user_id,
    _sheet_id,
    _existing_total,
    coalesce(_solved_count, 0),
    greatest(0, _existing_total - coalesce(_solved_count, 0)),
    coalesce(_time_spent, 0),
    now()
  )
  ON CONFLICT (user_id, sheet_id) DO UPDATE SET
    total_count = EXCLUDED.total_count,
    solved_count = EXCLUDED.solved_count,
    pending_count = EXCLUDED.pending_count,
    time_spent_seconds = EXCLUDED.time_spent_seconds,
    updated_at = now()
  RETURNING * INTO _result;

  RETURN _result;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_user_sheet_progress_summary(text, integer, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_user_sheet_progress_summary(text, integer, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.refresh_sheet_progress_summary_after_topic_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.user_topic_progress;
BEGIN
  _row := coalesce(NEW, OLD);
  PERFORM public.refresh_user_sheet_progress_summary(_row.sheet_id, NULL, _row.user_id);
  RETURN coalesce(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_sheet_progress_summary_after_topic_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_sheet_progress_summary_after_topic_change() TO service_role;

CREATE TRIGGER refresh_sheet_progress_summary_after_topic_change
AFTER INSERT OR UPDATE OR DELETE ON public.user_topic_progress
FOR EACH ROW
EXECUTE FUNCTION public.refresh_sheet_progress_summary_after_topic_change();

INSERT INTO public.user_sheet_progress_summary (
  user_id,
  sheet_id,
  total_count,
  solved_count,
  pending_count,
  time_spent_seconds,
  updated_at
)
SELECT
  p.user_id,
  p.sheet_id,
  greatest(
    CASE p.sheet_id
      WHEN 'strivers-sde-sheet' THEN 199
      WHEN 'strivers-a2z-dsa' THEN 445
      WHEN 'neetcode-150' THEN 150
      WHEN 'neetcode-250' THEN 250
      WHEN 'blind-75' THEN 75
      WHEN 'cses-sheet' THEN 400
      WHEN 'cp-interview-sheet' THEN 50
      WHEN 'acm-icpc-training' THEN 1153
      WHEN 'parikshaa-cp-sheet' THEN 535
      ELSE count(*) FILTER (WHERE p.topic_id <> '__sheet_session__')
    END,
    count(*) FILTER (WHERE p.topic_id <> '__sheet_session__')
  )::integer,
  count(*) FILTER (WHERE p.topic_id <> '__sheet_session__' AND p.completed)::integer,
  greatest(
    0,
    greatest(
      CASE p.sheet_id
        WHEN 'strivers-sde-sheet' THEN 199
        WHEN 'strivers-a2z-dsa' THEN 445
        WHEN 'neetcode-150' THEN 150
        WHEN 'neetcode-250' THEN 250
        WHEN 'blind-75' THEN 75
        WHEN 'cses-sheet' THEN 400
        WHEN 'cp-interview-sheet' THEN 50
        WHEN 'acm-icpc-training' THEN 1153
        WHEN 'parikshaa-cp-sheet' THEN 535
        ELSE count(*) FILTER (WHERE p.topic_id <> '__sheet_session__')
      END,
      count(*) FILTER (WHERE p.topic_id <> '__sheet_session__')
    ) - count(*) FILTER (WHERE p.topic_id <> '__sheet_session__' AND p.completed)
  )::integer,
  coalesce(sum(p.time_spent_seconds), 0)::integer,
  now()
FROM public.user_topic_progress p
GROUP BY p.user_id, p.sheet_id
ON CONFLICT (user_id, sheet_id) DO UPDATE SET
  total_count = EXCLUDED.total_count,
  solved_count = EXCLUDED.solved_count,
  pending_count = EXCLUDED.pending_count,
  time_spent_seconds = EXCLUDED.time_spent_seconds,
  updated_at = now();

ALTER TABLE public.user_sheet_progress_summary REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_sheet_progress_summary'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sheet_progress_summary;
  END IF;
END
$$;