-- Allow admin/owner MCP and app users to manage blog-media objects while keeping other buckets unchanged.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'admins can upload blog media'
  ) THEN
    CREATE POLICY "admins can upload blog media"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'blog-media'
      AND EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'owner')
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'admins can update blog media'
  ) THEN
    CREATE POLICY "admins can update blog media"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'blog-media'
      AND EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'owner')
      )
    )
    WITH CHECK (
      bucket_id = 'blog-media'
      AND EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'owner')
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'admins can delete blog media'
  ) THEN
    CREATE POLICY "admins can delete blog media"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'blog-media'
      AND EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'owner')
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'public can read blog media objects'
  ) THEN
    CREATE POLICY "public can read blog media objects"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'blog-media');
  END IF;
END $$;

-- Security scanner fix: stop exposing identifiable quiz_results rows publicly.
DROP POLICY IF EXISTS "Anyone can view quiz results for leaderboard" ON public.quiz_results;

CREATE OR REPLACE VIEW public.quiz_leaderboard_public
WITH (security_invoker = on) AS
SELECT
  quiz_type,
  category,
  difficulty,
  score,
  total_questions,
  accuracy,
  avg_time_seconds,
  total_time_seconds,
  completed_at
FROM public.quiz_results;

GRANT SELECT ON public.quiz_leaderboard_public TO anon, authenticated, service_role;