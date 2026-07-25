
-- Storage RLS for discussion-attachments (users manage their own folder)
CREATE POLICY "discussion_attachments_read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'discussion-attachments');

CREATE POLICY "discussion_attachments_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'discussion-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "discussion_attachments_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'discussion-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Reply notifications: fire when someone replies to another user's comment
CREATE OR REPLACE FUNCTION public.notify_discussion_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_user uuid;
  parent_slug text;
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;
  SELECT user_id, problem_slug INTO parent_user, parent_slug
    FROM public.coding_problem_discussions WHERE id = NEW.parent_id;
  IF parent_user IS NULL OR parent_user = NEW.user_id THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, type, title, message, data, read)
  VALUES (
    parent_user,
    'discussion_reply',
    'New reply on your comment',
    left(NEW.content, 140),
    jsonb_build_object(
      'problem_slug', parent_slug,
      'discussion_id', NEW.id,
      'parent_id', NEW.parent_id,
      'from_user_id', NEW.user_id
    ),
    false
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_discussion_reply ON public.coding_problem_discussions;
CREATE TRIGGER trg_notify_discussion_reply
AFTER INSERT ON public.coding_problem_discussions
FOR EACH ROW EXECUTE FUNCTION public.notify_discussion_reply();

-- Like notifications
CREATE OR REPLACE FUNCTION public.notify_discussion_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user uuid;
  target_slug text;
  preview text;
BEGIN
  SELECT user_id, problem_slug, left(content, 140)
    INTO target_user, target_slug, preview
    FROM public.coding_problem_discussions WHERE id = NEW.discussion_id;
  IF target_user IS NULL OR target_user = NEW.user_id THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, type, title, message, data, read)
  VALUES (
    target_user,
    'discussion_like',
    'Someone liked your comment',
    preview,
    jsonb_build_object(
      'problem_slug', target_slug,
      'discussion_id', NEW.discussion_id,
      'from_user_id', NEW.user_id
    ),
    false
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_discussion_like ON public.coding_problem_discussion_likes;
CREATE TRIGGER trg_notify_discussion_like
AFTER INSERT ON public.coding_problem_discussion_likes
FOR EACH ROW EXECUTE FUNCTION public.notify_discussion_like();
