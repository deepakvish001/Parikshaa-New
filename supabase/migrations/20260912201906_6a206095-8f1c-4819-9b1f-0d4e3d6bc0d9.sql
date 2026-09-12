ALTER TABLE public.contests ADD COLUMN IF NOT EXISTS kind public.contest_kind NOT NULL DEFAULT 'other';
CREATE INDEX IF NOT EXISTS contests_kind_idx ON public.contests (kind);