DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coding_problems;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;