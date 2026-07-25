
-- Drop contests.institution_id column
ALTER TABLE public.contests DROP COLUMN IF EXISTS institution_id CASCADE;

-- Drop all overloads of the listed functions dynamically
DO $$
DECLARE
  fn record;
  target_names text[] := ARRAY[
    'accept_b2b_org_invite','assessment_attempts_set_slug','assessment_org',
    'assessments_set_slug','attempt_assessment_org','attempt_owner',
    'b2b_my_role','b2b_user_owns_org','backfill_assessment_invite_sources',
    'can_write_org','claim_assessment_invite','claim_open_org_assessment',
    'create_b2b_org_invite','drive_org','get_assessment_answer_key',
    'get_attempt_paper','get_attempt_results','get_b2b_dashboard_stats',
    'is_institution_member','is_org_admin','is_org_billing_admin',
    'is_org_member','is_org_student','link_assessment_invite_to_student',
    'link_org_student_on_signup','log_org_audit','mark_recruiter_repeat',
    'placement_overview','placement_rankings','placement_rankings_count',
    'placement_rankings_filter_values','placement_recompute_scores',
    'preview_assessment_invite','question_org','section_org',
    'start_preview_attempt','submit_attempt','transfer_org_ownership',
    'validate_assessment_invite_source'
  ];
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema_name, p.proname AS fn_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY(target_names)
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
                   fn.schema_name, fn.fn_name, fn.args);
  END LOOP;
END $$;

-- Drop tables (CASCADE to remove dependent FKs, policies, triggers, views)
DROP TABLE IF EXISTS public.assessment_answer_uploads CASCADE;
DROP TABLE IF EXISTS public.assessment_chat_messages CASCADE;
DROP TABLE IF EXISTS public.assessment_feedback CASCADE;
DROP TABLE IF EXISTS public.assessment_proctor_findings CASCADE;
DROP TABLE IF EXISTS public.assessment_proctor_recordings CASCADE;
DROP TABLE IF EXISTS public.assessment_proctor_session_chunks CASCADE;
DROP TABLE IF EXISTS public.assessment_proctor_snapshots CASCADE;
DROP TABLE IF EXISTS public.assessment_side_camera_frames CASCADE;
DROP TABLE IF EXISTS public.assessment_side_camera_pairings CASCADE;
DROP TABLE IF EXISTS public.assessment_sos_events CASCADE;
DROP TABLE IF EXISTS public.attempt_answers CASCADE;
DROP TABLE IF EXISTS public.attempt_event_notes CASCADE;
DROP TABLE IF EXISTS public.attempt_event_pins CASCADE;
DROP TABLE IF EXISTS public.attempt_events CASCADE;
DROP TABLE IF EXISTS public.assessment_attempts CASCADE;
DROP TABLE IF EXISTS public.assessment_invites CASCADE;
DROP TABLE IF EXISTS public.section_questions CASCADE;
DROP TABLE IF EXISTS public.assessment_sections CASCADE;
DROP TABLE IF EXISTS public.mcq_options CASCADE;
DROP TABLE IF EXISTS public.question_test_cases CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.assessments CASCADE;

DROP TABLE IF EXISTS public.b2b_leads CASCADE;
DROP TABLE IF EXISTS public.b2b_onboarding_events CASCADE;
DROP TABLE IF EXISTS public.b2b_onboarding_funnel CASCADE;
DROP TABLE IF EXISTS public.b2b_org_audit CASCADE;
DROP TABLE IF EXISTS public.b2b_org_invites CASCADE;

DROP TABLE IF EXISTS public.org_member_capabilities CASCADE;
DROP TABLE IF EXISTS public.org_members CASCADE;
DROP TABLE IF EXISTS public.org_student_invite_audit CASCADE;
DROP TABLE IF EXISTS public.org_student_invites CASCADE;
DROP TABLE IF EXISTS public.org_students CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

DROP TABLE IF EXISTS public.institution_members CASCADE;
DROP TABLE IF EXISTS public.institutions CASCADE;

DROP TABLE IF EXISTS public.placement_offers CASCADE;
DROP TABLE IF EXISTS public.placement_snapshots CASCADE;
DROP TABLE IF EXISTS public.placement_student_scores CASCADE;
DROP TABLE IF EXISTS public.placement_views CASCADE;
DROP TABLE IF EXISTS public.drive_applications CASCADE;
DROP TABLE IF EXISTS public.placement_drives CASCADE;

DROP TABLE IF EXISTS public.recruiters CASCADE;
DROP TABLE IF EXISTS public.target_companies CASCADE;
DROP TABLE IF EXISTS public.student_share_views CASCADE;
DROP TABLE IF EXISTS public.student_share_links CASCADE;
DROP TABLE IF EXISTS public.student_profile_preferences CASCADE;
