CREATE OR REPLACE FUNCTION public.league_leaderboard(_handles text[], _metric text DEFAULT 'total')
RETURNS TABLE (
  rank bigint,
  handle text,
  display_name text,
  avatar_url text,
  value numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY v DESC NULLS LAST, s_handle ASC) AS rank,
    s_handle AS handle,
    s_name AS display_name,
    s_avatar AS avatar_url,
    v AS value
  FROM (
    SELECT
      s.handle AS s_handle,
      s.display_name AS s_name,
      s.avatar_url AS s_avatar,
      COALESCE(
        CASE _metric
          WHEN 'today' THEN s.solved_today::numeric
          WHEN 'week' THEN s.solved_this_week::numeric
          WHEN 'month' THEN s.solved_this_month::numeric
          WHEN 'total' THEN s.total_solved::numeric
          WHEN 'rating' THEN s.contest_rating
          WHEN 'current_streak' THEN s.current_streak::numeric
          WHEN 'longest_streak' THEN s.longest_streak::numeric
          WHEN 'hard' THEN s.hard_solved::numeric
          WHEN 'consistency' THEN s.consistency
          ELSE s.total_solved::numeric
        END, 0) AS v
    FROM public.handle_snapshots s
    WHERE s.platform = 'leetcode'
      AND (_handles IS NULL OR s.handle = ANY(_handles))
  ) t
$$;

REVOKE ALL ON FUNCTION public.league_leaderboard(text[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.league_leaderboard(text[], text) TO authenticated, anon;