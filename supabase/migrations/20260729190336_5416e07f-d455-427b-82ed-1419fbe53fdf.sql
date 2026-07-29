CREATE OR REPLACE FUNCTION public.mirror_attach_all()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  t record;
  n int := 0;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace ns ON ns.oid = c.relnamespace
    WHERE ns.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname NOT IN ('mirror_outbox', 'mirror_sync_log')
      AND EXISTS (SELECT 1 FROM pg_constraint pc WHERE pc.conrelid = c.oid AND pc.contype = 'p')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS zz_mirror_capture ON public.%I', t.relname);
    EXECUTE format(
      'CREATE TRIGGER zz_mirror_capture AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.mirror_capture()',
      t.relname
    );
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

DROP TRIGGER IF EXISTS zz_mirror_capture ON public.mirror_sync_log;
DELETE FROM public.mirror_outbox WHERE table_name = 'mirror_sync_log' AND synced_at IS NULL;