ALTER TABLE public.user_topic_progress REPLICA IDENTITY FULL;
ALTER TABLE public.contest_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.contest_leaderboard_cache REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='user_topic_progress') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_topic_progress;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='contest_submissions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_submissions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='contest_leaderboard_cache') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_leaderboard_cache;
  END IF;
END $$;