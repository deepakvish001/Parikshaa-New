-- Moving extensions to a dedicated schema is a best practice to avoid polluting 'public'
-- and potentially exposing extension functions to the Data API.
CREATE SCHEMA IF NOT EXISTS extensions;

-- Attempt to move existing extensions from public to the extensions schema
-- Note: Some extensions might not support being moved depending on the Supabase environment,
-- but this is the standard remediation for the linter warning 0014.
DO $$
DECLARE
    ext_record RECORD;
BEGIN
    FOR ext_record IN 
        SELECT extname 
        FROM pg_extension e
        JOIN pg_namespace n ON e.extnamespace = n.oid
        WHERE n.nspname = 'public'
    LOOP
        BEGIN
            EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext_record.extname);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not move extension %: %', ext_record.extname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Update search path for all roles to include the new extensions schema
-- This ensures existing queries using extension functions (like uuid_generate_v4) don't break.
ALTER ROLE authenticated SET search_path TO public, extensions;
ALTER ROLE anon SET search_path TO public, extensions;
ALTER ROLE service_role SET search_path TO public, extensions;
ALTER ROLE postgres SET search_path TO public, extensions;
