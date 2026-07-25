
ALTER TABLE public.demo_requests
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz;

CREATE TABLE IF NOT EXISTS public.demo_request_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.demo_requests(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  note text,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.demo_request_status_history TO authenticated;
GRANT ALL ON public.demo_request_status_history TO service_role;

ALTER TABLE public.demo_request_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view status history"
  ON public.demo_request_status_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert status history"
  ON public.demo_request_status_history FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND changed_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_demo_req_history_request ON public.demo_request_status_history(request_id, created_at DESC);
