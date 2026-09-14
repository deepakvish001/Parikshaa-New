GRANT INSERT, UPDATE ON public.user_sheet_progress_summary TO authenticated;

CREATE POLICY "Users can create own sheet progress summaries"
ON public.user_sheet_progress_summary
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sheet progress summaries"
ON public.user_sheet_progress_summary
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

ALTER FUNCTION public.refresh_user_sheet_progress_summary(text, integer, uuid) SECURITY INVOKER;