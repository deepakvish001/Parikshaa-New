
-- 1. Contest kind enum
DO $$ BEGIN
  CREATE TYPE public.contest_kind AS ENUM ('monthly_long','weekly_saturday','weekly_sunday','biweekly','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Columns on contests
ALTER TABLE public.contests
  ADD COLUMN IF NOT EXISTS kind public.contest_kind NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS sequence_no integer;

CREATE UNIQUE INDEX IF NOT EXISTS contests_kind_sequence_uidx
  ON public.contests(kind, sequence_no) WHERE sequence_no IS NOT NULL;

-- 3. Daily unlock on contest_problems
ALTER TABLE public.contest_problems
  ADD COLUMN IF NOT EXISTS unlock_at timestamptz;

-- 4. Auto sequence + title/slug trigger
CREATE OR REPLACE FUNCTION public.contests_autonumber()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_seq int;
  seq_txt  text;
  month_txt text;
BEGIN
  IF NEW.kind IS NULL OR NEW.kind = 'other' THEN
    RETURN NEW;
  END IF;

  IF NEW.sequence_no IS NULL THEN
    SELECT COALESCE(MAX(sequence_no), 0) + 1 INTO next_seq
      FROM public.contests WHERE kind = NEW.kind;
    NEW.sequence_no := next_seq;
  END IF;

  seq_txt := lpad(NEW.sequence_no::text, 2, '0');

  IF NEW.title IS NULL OR NEW.title = '' OR TG_OP = 'INSERT' AND NEW.title ILIKE 'auto%' THEN
    IF NEW.kind = 'monthly_long' THEN
      month_txt := to_char(NEW.starts_at AT TIME ZONE 'UTC', 'FMMonth YYYY');
      NEW.title := month_txt || ' Monthly Long Contest - ' || seq_txt;
    ELSIF NEW.kind = 'weekly_saturday' THEN
      NEW.title := 'Saturday Weekly Contest - ' || seq_txt;
    ELSIF NEW.kind = 'weekly_sunday' THEN
      NEW.title := 'Sunday Weekly Contest - ' || seq_txt;
    ELSIF NEW.kind = 'biweekly' THEN
      NEW.title := 'BiWeekly Contest - ' || seq_txt;
    END IF;
  END IF;

  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug := regexp_replace(NEW.slug, '(^-|-$)', '', 'g');
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_contests_autonumber ON public.contests;
CREATE TRIGGER trg_contests_autonumber
  BEFORE INSERT ON public.contests
  FOR EACH ROW EXECUTE FUNCTION public.contests_autonumber();

-- 5. RLS: hide problems until their unlock_at (if set)
DROP POLICY IF EXISTS "contest_problems public read after start" ON public.contest_problems;
CREATE POLICY "contest_problems public read after unlock"
  ON public.contest_problems FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.contests c
      WHERE c.id = contest_problems.contest_id
        AND c.visibility = ANY (ARRAY['public','unlisted'])
        AND c.status = ANY (ARRAY['live','ended'])
        AND c.starts_at <= now()
        AND (contest_problems.unlock_at IS NULL OR contest_problems.unlock_at <= now())
    )
  );
