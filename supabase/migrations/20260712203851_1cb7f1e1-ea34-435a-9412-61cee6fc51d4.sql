
CREATE OR REPLACE FUNCTION public.validate_platform_setting()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v jsonb;
  d int;
  h int;
  m int;
  p int;
  dur int;
BEGIN
  IF NEW.key = 'weekly_contest_config' THEN
    v := NEW.value;
    IF v IS NULL OR jsonb_typeof(v) <> 'object' THEN
      RAISE EXCEPTION 'weekly_contest_config must be a JSON object';
    END IF;

    IF NOT (v ? 'day' AND v ? 'hour_utc' AND v ? 'minute_utc' AND v ? 'problem_count' AND v ? 'duration_minutes') THEN
      RAISE EXCEPTION 'weekly_contest_config requires day, hour_utc, minute_utc, problem_count, duration_minutes';
    END IF;

    BEGIN
      d := (v->>'day')::int;
      h := (v->>'hour_utc')::int;
      m := (v->>'minute_utc')::int;
      p := (v->>'problem_count')::int;
      dur := (v->>'duration_minutes')::int;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'weekly_contest_config fields must be integers';
    END;

    IF d < 0 OR d > 6 THEN
      RAISE EXCEPTION 'Day (UTC) must be between 0 (Sun) and 6 (Sat); got %', d;
    END IF;
    IF h < 0 OR h > 23 THEN
      RAISE EXCEPTION 'Hour UTC must be between 0 and 23; got %', h;
    END IF;
    IF m < 0 OR m > 59 THEN
      RAISE EXCEPTION 'Minute UTC must be between 0 and 59; got %', m;
    END IF;
    IF p < 2 OR p > 10 THEN
      RAISE EXCEPTION 'Problem count must be between 2 and 10; got %', p;
    END IF;
    IF dur < 30 OR dur > 480 THEN
      RAISE EXCEPTION 'Duration must be between 30 and 480 minutes; got %', dur;
    END IF;
    IF dur % 15 <> 0 THEN
      RAISE EXCEPTION 'Duration must be a multiple of 15 minutes; got %', dur;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_platform_setting_trg ON public.platform_settings;
CREATE TRIGGER validate_platform_setting_trg
BEFORE INSERT OR UPDATE ON public.platform_settings
FOR EACH ROW EXECUTE FUNCTION public.validate_platform_setting();
