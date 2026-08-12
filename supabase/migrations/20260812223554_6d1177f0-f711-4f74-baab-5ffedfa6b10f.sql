-- M5: Clans - Detailed stats and RPCs
-- This function calculates aggregated stats for a clan based on its members' tracked handles.

CREATE OR REPLACE FUNCTION public.get_clan_stats(_clan_id uuid)
RETURNS TABLE (
    clan_id uuid,
    total_solved bigint,
    avg_rating numeric,
    member_count bigint,
    active_members bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH clan_profiles AS (
        -- Get all profiles belonging to clan members
        SELECT p.id as profile_id
        FROM public.profiles p
        JOIN public.clan_members cm ON cm.user_id = p.id
        WHERE cm.clan_id = _clan_id
    ),
    member_stats AS (
        -- Get the latest snapshot for every tracked handle owned by a clan member
        SELECT DISTINCT ON (th.handle)
            hs.total_solved,
            hs.contest_rating,
            hs.updated_at
        FROM public.tracked_handles th
        JOIN public.handle_snapshots hs ON hs.handle = th.handle AND hs.platform = th.platform
        WHERE th.owner_id IN (SELECT profile_id FROM clan_profiles)
        ORDER BY th.handle, hs.updated_at DESC
    )
    SELECT
        _clan_id as clan_id,
        COALESCE(SUM(ms.total_solved), 0)::bigint as total_solved,
        COALESCE(AVG(ms.contest_rating), 0)::numeric as avg_rating,
        (SELECT COUNT(*) FROM public.clan_members WHERE clan_id = _clan_id)::bigint as member_count,
        (SELECT COUNT(*) FROM public.clan_members WHERE clan_id = _clan_id)::bigint as active_members;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_clan_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_clan_stats(uuid) TO service_role;

-- Update the clan_stats view/table if it exists or create it
-- We'll use a materialized view or just a regular view for "Top Clans" sorting
CREATE OR REPLACE VIEW public.clan_stats_view AS
SELECT
    c.id as clan_id,
    stats.total_solved,
    stats.avg_rating,
    stats.member_count,
    stats.active_members
FROM public.clans c
CROSS JOIN LATERAL public.get_clan_stats(c.id) stats;

GRANT SELECT ON public.clan_stats_view TO authenticated;
GRANT SELECT ON public.clan_stats_view TO service_role;
