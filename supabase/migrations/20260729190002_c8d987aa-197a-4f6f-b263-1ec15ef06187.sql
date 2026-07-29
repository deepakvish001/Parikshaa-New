-- Generic activity capture
CREATE OR REPLACE FUNCTION public.log_activity_generic()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _type text := TG_ARGV[0];
  _title text := TG_ARGV[1];
  _usercol text := COALESCE(TG_ARGV[2], 'user_id');
  _desccol text := TG_ARGV[3];
  _row jsonb;
  _uid uuid;
  _desc text;
BEGIN
  _row := to_jsonb(COALESCE(NEW, OLD));
  BEGIN
    _uid := NULLIF(_row ->> _usercol, '')::uuid;
  EXCEPTION WHEN others THEN
    _uid := NULL;
  END;
  IF _uid IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  IF _desccol IS NOT NULL THEN
    _desc := _row ->> _desccol;
  END IF;
  INSERT INTO public.user_activity_log (user_id, activity_type, title, description, metadata)
  VALUES (
    _uid,
    _type,
    _title,
    _desc,
    jsonb_build_object('table', TG_TABLE_NAME, 'op', TG_OP)
      || COALESCE(jsonb_strip_nulls(_row) - 'id', '{}'::jsonb)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Helper to attach a trigger safely
CREATE OR REPLACE FUNCTION public.attach_activity_trigger(
  _table text, _events text, _type text, _title text,
  _usercol text DEFAULT 'user_id', _desccol text DEFAULT NULL, _when text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF to_regclass('public.' || quote_ident(_table)) IS NULL THEN RETURN; END IF;
  EXECUTE format('DROP TRIGGER IF EXISTS zz_activity_log ON public.%I', _table);
  EXECUTE format(
    'CREATE TRIGGER zz_activity_log AFTER %s ON public.%I FOR EACH ROW %s EXECUTE FUNCTION public.log_activity_generic(%L, %L, %L, %L)',
    _events, _table,
    CASE WHEN _when IS NULL THEN '' ELSE 'WHEN (' || _when || ')' END,
    _type, _title, _usercol, _desccol
  );
END;
$$;

-- Blog
SELECT public.attach_activity_trigger('blog_likes','INSERT','blog_like','Liked a blog post','user_id',NULL);
SELECT public.attach_activity_trigger('blog_bookmarks','INSERT','blog_bookmark','Bookmarked a blog post','user_id',NULL);
SELECT public.attach_activity_trigger('blog_comments','INSERT','blog_comment','Commented on a blog post','user_id','body');
SELECT public.attach_activity_trigger('blog_views','INSERT','blog_view','Read a blog post','user_id',NULL);

-- Contests
SELECT public.attach_activity_trigger('contest_registrations','INSERT','contest_register','Registered for a contest','user_id',NULL);
SELECT public.attach_activity_trigger('contest_sessions','INSERT','contest_session','Started a contest session','user_id',NULL);
SELECT public.attach_activity_trigger('contest_submissions','INSERT','contest_submission','Contest submission','user_id','problem_slug');
SELECT public.attach_activity_trigger('contest_violations','INSERT','contest_violation','Contest violation recorded','user_id','kind');

-- Coding
SELECT public.attach_activity_trigger('code_runs','INSERT','code_run','Ran code','user_id','problem_slug');
SELECT public.attach_activity_trigger('coding_problem_discussions','INSERT','discussion_post','Posted in problem discussion','user_id','problem_slug');
SELECT public.attach_activity_trigger('coding_problem_discussion_likes','INSERT','discussion_like','Liked a discussion','user_id',NULL);
SELECT public.attach_activity_trigger('coding_problem_mcq_attempts','INSERT','mcq_attempt','Attempted an MCQ','user_id','problem_slug');
SELECT public.attach_activity_trigger('user_problem_solutions','INSERT OR UPDATE','problem_solution','Saved a problem solution','user_id','problem_slug');
SELECT public.attach_activity_trigger('daily_challenge_completions','INSERT','daily_challenge','Completed the daily challenge','user_id','problem_slug');

-- Learning
SELECT public.attach_activity_trigger('quiz_spaced_repetition','INSERT','srs_review','Reviewed a flashcard','user_id',NULL);
SELECT public.attach_activity_trigger('user_company_progress','INSERT OR UPDATE','company_progress','Updated company prep progress','user_id','company_slug');
SELECT public.attach_activity_trigger('user_sheet_prefs','INSERT OR UPDATE','sheet_pref','Updated sheet preferences','user_id',NULL);
SELECT public.attach_activity_trigger('user_study_focus_sessions','INSERT','focus_session','Completed a focus session','user_id',NULL);
SELECT public.attach_activity_trigger('study_plan_goals','INSERT OR UPDATE','study_goal','Updated a study goal','user_id',NULL);
SELECT public.attach_activity_trigger('user_goals','INSERT OR UPDATE','user_goal','Updated a goal','user_id',NULL);
SELECT public.attach_activity_trigger('user_folders','INSERT','folder_create','Created a folder','user_id','name');

-- Community
SELECT public.attach_activity_trigger('interview_experiences','INSERT','experience_post','Shared an interview experience','user_id','company');
SELECT public.attach_activity_trigger('experience_votes','INSERT','experience_vote','Voted on an experience','user_id',NULL);
SELECT public.attach_activity_trigger('user_follows','INSERT','follow','Followed a user','follower_id',NULL);
SELECT public.attach_activity_trigger('content_reports','INSERT','content_report','Reported content','reporter_id','reason');

-- AI / tools
SELECT public.attach_activity_trigger('ai_generated_content','INSERT','ai_content','Generated AI content','user_id','title');
SELECT public.attach_activity_trigger('ai_content_likes','INSERT','ai_content_like','Liked AI content','user_id',NULL);
SELECT public.attach_activity_trigger('ai_insight_feedback','INSERT','ai_feedback','Gave AI insight feedback','user_id','insight_title');
SELECT public.attach_activity_trigger('resume_analyses','INSERT','resume_analysis','Analyzed a resume','user_id',NULL);
SELECT public.attach_activity_trigger('resume_favorites','INSERT','resume_favorite','Favorited a resume template','user_id',NULL);
SELECT public.attach_activity_trigger('outreach_favorites','INSERT','outreach_favorite','Favorited an outreach template','user_id',NULL);
SELECT public.attach_activity_trigger('user_projects','INSERT OR UPDATE','project','Updated a project','user_id','title');

-- Account / support
SELECT public.attach_activity_trigger('support_messages','INSERT','support_message','Sent a support message','user_id','subject');
SELECT public.attach_activity_trigger('push_subscriptions','INSERT','push_subscribe','Enabled push notifications','user_id',NULL);
SELECT public.attach_activity_trigger('notifications','INSERT','notification','Received a notification','user_id','title');
SELECT public.attach_activity_trigger('user_platform_sync_jobs','INSERT','platform_sync','Synced coding platform stats','user_id',NULL);
SELECT public.attach_activity_trigger('profiles','UPDATE','profile_update','Updated profile','user_id',NULL);
SELECT public.attach_activity_trigger('user_profiles_extended','UPDATE','profile_update','Updated profile details','user_id',NULL);

-- Client-side event logger (login/logout/page/feature events)
CREATE OR REPLACE FUNCTION public.log_client_event(
  _activity_type text, _title text, _description text DEFAULT NULL, _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF _activity_type IS NULL OR length(_activity_type) = 0 OR length(_activity_type) > 64 THEN
    RAISE EXCEPTION 'invalid activity_type';
  END IF;
  INSERT INTO public.user_activity_log (user_id, activity_type, title, description, metadata)
  VALUES (auth.uid(), _activity_type, LEFT(COALESCE(_title, _activity_type), 200),
          LEFT(_description, 500), COALESCE(_metadata, '{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_client_event(text, text, text, jsonb) TO authenticated;

-- Admin/owner can read all activity
DROP POLICY IF EXISTS "Admins can view all activities" ON public.user_activity_log;
CREATE POLICY "Admins can view all activities"
ON public.user_activity_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Ensure new triggers' rows also mirror
SELECT public.mirror_attach_all();