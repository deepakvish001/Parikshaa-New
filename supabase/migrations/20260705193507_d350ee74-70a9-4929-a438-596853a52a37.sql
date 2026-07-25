
UPDATE public.job_openings SET source_id = id::text WHERE source_id IS NULL;
ALTER TABLE public.job_openings ALTER COLUMN source_id SET DEFAULT '';
ALTER TABLE public.job_openings ALTER COLUMN source_id SET NOT NULL;

DROP INDEX IF EXISTS public.uq_job_openings_source;
CREATE UNIQUE INDEX uq_job_openings_source
  ON public.job_openings (source, source_id);
