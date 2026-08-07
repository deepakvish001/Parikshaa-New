DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.prosecdef = true
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM public, anon, authenticated', 
                        func_record.nspname, func_record.proname, func_record.args);
        
        -- Default: Grant to service_role (safe for Edge Functions/Admin tools)
        EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role', 
                        func_record.nspname, func_record.proname, func_record.args);

        -- Specific logic for common user-facing functions
        IF func_record.proname IN ('has_role', 'grant_admin_to_self', 'log_xp_activity', 'handle_new_user') THEN
            EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated', 
                            func_record.nspname, func_record.proname, func_record.args);
        END IF;

        -- If it's a trigger function, usually doesn't need public execute anyway as it runs as owner
    END LOOP;
END $$;

-- Fix "Extension in Public" by moving extensions to a dedicated schema if possible, 
-- or at least documenting it. For now, we'll focus on the high-risk RLS/Function issues.

-- Example: Revoke execute on any function in public that isn't supposed to be there.
-- The linter specifically flags SECURITY DEFINER functions.
