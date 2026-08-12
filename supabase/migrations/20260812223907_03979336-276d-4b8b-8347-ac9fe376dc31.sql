-- M7: External Contests Table
CREATE TABLE IF NOT EXISTS public.external_contests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    platform text NOT NULL,
    title text NOT NULL,
    url text,
    start_time timestamptz NOT NULL,
    duration_seconds integer NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(platform, title, start_time)
);

-- Grant permissions
GRANT SELECT ON public.external_contests TO authenticated;
GRANT ALL ON public.external_contests TO service_role;

-- Enable RLS
ALTER TABLE public.external_contests ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read contests
CREATE POLICY "Public contests are readable by all"
ON public.external_contests FOR SELECT
TO authenticated
USING (true);
