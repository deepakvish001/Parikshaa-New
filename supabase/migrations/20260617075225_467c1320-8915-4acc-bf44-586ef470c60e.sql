CREATE OR REPLACE FUNCTION public.can_write_org(_org uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = _org
        AND user_id = auth.uid()
        AND role IN ('owner','admin','recruiter')
    );
$function$;