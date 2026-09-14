CREATE OR REPLACE FUNCTION public.recompute_contest_leaderboard(_contest_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_starts timestamptz;
  c_penalty integer;
BEGIN
  SELECT starts_at, penalty_minutes
  INTO c_starts, c_penalty
  FROM public.contests
  WHERE id = _contest_id;

  IF c_starts IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.contest_leaderboard_cache
  WHERE contest_id = _contest_id;

  WITH participants AS (
    SELECT cr.user_id
    FROM public.contest_registrations cr
    WHERE cr.contest_id = _contest_id
      AND cr.status = 'registered'
  ),
  solved AS (
    SELECT
      cs.user_id,
      cs.problem_slug,
      MIN(cs.submitted_at) FILTER (WHERE lower(cs.verdict) = 'accepted') AS solved_at,
      COUNT(*) FILTER (
        WHERE lower(cs.verdict) <> 'accepted'
          AND cs.submitted_at < COALESCE(
            (
              SELECT MIN(cs2.submitted_at)
              FROM public.contest_submissions cs2
              WHERE cs2.contest_id = cs.contest_id
                AND cs2.user_id = cs.user_id
                AND cs2.problem_slug = cs.problem_slug
                AND lower(cs2.verdict) = 'accepted'
            ),
            'infinity'::timestamptz
          )
      ) AS wrong_before
    FROM public.contest_submissions cs
    WHERE cs.contest_id = _contest_id
    GROUP BY cs.user_id, cs.problem_slug
  ),
  per_user AS (
    SELECT
      p.user_id,
      COUNT(*) FILTER (WHERE s.solved_at IS NOT NULL)::integer AS problems_solved,
      COALESCE(SUM(cp.points) FILTER (WHERE s.solved_at IS NOT NULL), 0)::integer AS total_points,
      COALESCE(SUM(
        GREATEST(0, EXTRACT(EPOCH FROM (s.solved_at - c_starts))::integer)
        + COALESCE(s.wrong_before, 0)::integer * c_penalty * 60
      ) FILTER (WHERE s.solved_at IS NOT NULL), 0)::integer AS total_penalty_seconds,
      MAX(s.solved_at) AS last_solve_at
    FROM participants p
    LEFT JOIN solved s ON s.user_id = p.user_id
    LEFT JOIN public.contest_problems cp
      ON cp.contest_id = _contest_id
     AND cp.problem_slug = s.problem_slug
    GROUP BY p.user_id
  ),
  ranked AS (
    SELECT
      pu.*,
      RANK() OVER (
        ORDER BY pu.total_points DESC,
                 pu.total_penalty_seconds ASC,
                 pu.last_solve_at ASC NULLS LAST
      )::integer AS rnk
    FROM per_user pu
  )
  INSERT INTO public.contest_leaderboard_cache (
    contest_id, user_id, rank, total_points, total_penalty_seconds,
    problems_solved, last_solve_at, updated_at
  )
  SELECT
    _contest_id, user_id, rnk, total_points, total_penalty_seconds,
    problems_solved, last_solve_at, now()
  FROM ranked;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_contest_leaderboard_after_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_contest_leaderboard(COALESCE(NEW.contest_id, OLD.contest_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_contest_leaderboard_after_submission() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_contest_leaderboard_after_submission() TO service_role;

DROP TRIGGER IF EXISTS trg_refresh_contest_leaderboard ON public.contest_submissions;
CREATE TRIGGER trg_refresh_contest_leaderboard
AFTER INSERT OR UPDATE OF verdict, submitted_at OR DELETE
ON public.contest_submissions
FOR EACH ROW
EXECUTE FUNCTION public.refresh_contest_leaderboard_after_submission();

CREATE OR REPLACE FUNCTION public.finalize_contest_ratings(_contest_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_record record;
  participant_count integer;
  inserted_count integer := 0;
BEGIN
  SELECT id, ends_at, is_weekly_rated
  INTO c_record
  FROM public.contests
  WHERE id = _contest_id;

  IF NOT FOUND OR NOT c_record.is_weekly_rated OR now() < c_record.ends_at THEN
    RETURN 0;
  END IF;

  PERFORM public.recompute_contest_leaderboard(_contest_id);

  SELECT COUNT(*)::integer
  INTO participant_count
  FROM public.contest_leaderboard_cache
  WHERE contest_id = _contest_id;

  IF participant_count = 0 THEN
    RETURN 0;
  END IF;

  WITH current_ratings AS (
    SELECT
      lb.user_id,
      lb.rank,
      lb.total_points,
      COALESCE((
        SELECT crh.new_rating
        FROM public.contest_rating_history crh
        WHERE crh.user_id = lb.user_id
          AND crh.contest_id <> _contest_id
        ORDER BY crh.created_at DESC
        LIMIT 1
      ), 1200) AS old_rating
    FROM public.contest_leaderboard_cache lb
    WHERE lb.contest_id = _contest_id
  ),
  changes AS (
    SELECT
      user_id,
      rank,
      total_points,
      old_rating,
      CASE
        WHEN participant_count = 1 THEN 0
        ELSE ROUND(40 * (((participant_count - rank)::numeric / (participant_count - 1)) - 0.5))::integer
      END AS delta
    FROM current_ratings
  ),
  inserted AS (
    INSERT INTO public.contest_rating_history (
      contest_id, user_id, old_rating, new_rating, delta, rank, participants, created_at
    )
    SELECT
      _contest_id,
      user_id,
      old_rating,
      GREATEST(0, old_rating + delta),
      delta,
      rank,
      participant_count,
      now()
    FROM changes
    ON CONFLICT (contest_id, user_id) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*)::integer INTO inserted_count FROM inserted;

  RETURN inserted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_contest_ratings(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_contest_ratings(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.finalize_due_contest_ratings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contest_row record;
  total_inserted integer := 0;
BEGIN
  FOR contest_row IN
    SELECT c.id
    FROM public.contests c
    WHERE c.is_weekly_rated = true
      AND c.ends_at <= now()
      AND EXISTS (
        SELECT 1
        FROM public.contest_registrations cr
        WHERE cr.contest_id = c.id
          AND cr.status = 'registered'
      )
  LOOP
    total_inserted := total_inserted + public.finalize_contest_ratings(contest_row.id);
  END LOOP;

  RETURN total_inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_due_contest_ratings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_due_contest_ratings() TO anon, authenticated, service_role;