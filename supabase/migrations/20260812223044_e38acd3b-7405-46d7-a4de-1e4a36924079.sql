-- M4: Ranks & Leaderboard Functions
-- Drop the function first to avoid the "cannot remove parameter defaults" error
DROP FUNCTION IF EXISTS public.league_leaderboard(text[], text);

CREATE OR REPLACE FUNCTION public.league_leaderboard(_handles text[], _metric text)
RETURNS TABLE (
    rank bigint,
    handle text,
    display_name text,
    avatar_url text,
    value numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH latest_snapshots AS (
        -- Get the most recent snapshot for each handle
        SELECT DISTINCT ON (s.handle)
            s.handle,
            s.display_name,
            s.avatar_url,
            s.total_solved,
            s.solved_today,
            s.solved_this_week,
            s.solved_this_month,
            s.contest_rating,
            s.current_streak,
            s.longest_streak,
            s.hard_solved,
            s.consistency
        FROM handle_snapshots s
        WHERE s.handle = ANY(_handles)
        AND s.platform = 'leetcode'
        ORDER BY s.handle, s.updated_at DESC
    ),
    ranked_data AS (
        SELECT
            ls.handle,
            ls.display_name,
            ls.avatar_url,
            CASE
                WHEN _metric = 'today' THEN ls.solved_today::numeric
                WHEN _metric = 'week' THEN ls.solved_this_week::numeric
                WHEN _metric = 'month' THEN ls.solved_this_month::numeric
                WHEN _metric = 'total' THEN ls.total_solved::numeric
                WHEN _metric = 'rating' THEN COALESCE(ls.contest_rating, 0)::numeric
                WHEN _metric = 'current_streak' THEN ls.current_streak::numeric
                WHEN _metric = 'longest_streak' THEN ls.longest_streak::numeric
                WHEN _metric = 'hard' THEN ls.hard_solved::numeric
                WHEN _metric = 'consistency' THEN ls.consistency::numeric
                ELSE 0
            END as metric_value
        FROM latest_snapshots ls
    )
    SELECT
        DENSE_RANK() OVER (ORDER BY rd.metric_value DESC, rd.handle ASC) as rank,
        rd.handle,
        rd.display_name,
        rd.avatar_url,
        rd.metric_value as value
    FROM ranked_data rd
    ORDER BY rank ASC;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.league_leaderboard(text[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.league_leaderboard(text[], text) TO service_role;
