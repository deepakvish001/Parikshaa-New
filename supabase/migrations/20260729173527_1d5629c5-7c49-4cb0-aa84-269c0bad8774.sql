CREATE TABLE public.mirror_outbox (
  id bigserial PRIMARY KEY,
  table_name text NOT NULL,
  op text NOT NULL,
  row_pk jsonb,
  row_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  synced_at timestamptz,
  attempts int NOT NULL DEFAULT 0,
  last_error text
);

GRANT SELECT ON public.mirror_outbox TO authenticated;
GRANT ALL ON public.mirror_outbox TO service_role;
ALTER TABLE public.mirror_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read mirror outbox" ON public.mirror_outbox
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE INDEX mirror_outbox_pending_idx ON public.mirror_outbox (id) WHERE synced_at IS NULL;
CREATE INDEX mirror_outbox_table_idx ON public.mirror_outbox (table_name);

CREATE OR REPLACE FUNCTION public.mirror_capture()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pk_cols text[];
  pk jsonb;
  rec jsonb;
BEGIN
  SELECT array_agg(a.attname::text ORDER BY k.ord)
    INTO pk_cols
  FROM pg_constraint c
  CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord)
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
  WHERE c.conrelid = TG_RELID AND c.contype = 'p';

  IF TG_OP = 'DELETE' THEN
    rec := to_jsonb(OLD);
  ELSE
    rec := to_jsonb(NEW);
  END IF;

  IF pk_cols IS NOT NULL THEN
    SELECT jsonb_object_agg(col, rec -> col) INTO pk FROM unnest(pk_cols) AS col;
  END IF;

  INSERT INTO public.mirror_outbox (table_name, op, row_pk, row_data)
  VALUES (
    TG_TABLE_NAME,
    lower(TG_OP),
    pk,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE rec END
  );

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.mirror_attach_all()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      AND c.relname NOT IN ('mirror_outbox')
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

REVOKE ALL ON FUNCTION public.mirror_attach_all() FROM public, anon, authenticated;

SELECT public.mirror_attach_all();