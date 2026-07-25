CREATE OR REPLACE FUNCTION public.admin_save_problem(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _slug text := payload->>'slug';
  _uid uuid := auth.uid();
  _lang text;
  _code text;
  _test jsonb;
  _co jsonb;
  _i int := 0;
BEGIN
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;
  IF _slug IS NULL OR length(_slug) = 0 THEN
    RAISE EXCEPTION 'slug is required';
  END IF;

  INSERT INTO public.coding_problems (
    slug, title, difficulty, topics, description, examples,
    constraints, hints, cpu_time_limit_sec, memory_limit_kb,
    is_published, created_by
  ) VALUES (
    _slug,
    payload->>'title',
    COALESCE(payload->>'difficulty', 'medium'),
    COALESCE((SELECT array_agg(value::text) FROM jsonb_array_elements_text(payload->'topics')), '{}'),
    COALESCE(payload->>'description', ''),
    COALESCE(payload->'examples', '[]'::jsonb),
    COALESCE((SELECT array_agg(value::text) FROM jsonb_array_elements_text(payload->'constraints')), '{}'),
    COALESCE((SELECT array_agg(value::text) FROM jsonb_array_elements_text(payload->'hints')), '{}'),
    COALESCE((payload->>'cpu_time_limit_sec')::numeric, 2.0),
    COALESCE((payload->>'memory_limit_kb')::int, 256000),
    COALESCE((payload->>'is_published')::boolean, false),
    _uid
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    difficulty = EXCLUDED.difficulty,
    topics = EXCLUDED.topics,
    description = EXCLUDED.description,
    examples = EXCLUDED.examples,
    constraints = EXCLUDED.constraints,
    hints = EXCLUDED.hints,
    cpu_time_limit_sec = EXCLUDED.cpu_time_limit_sec,
    memory_limit_kb = EXCLUDED.memory_limit_kb,
    is_published = EXCLUDED.is_published,
    updated_at = now();

  IF payload ? 'starter_code' THEN
    DELETE FROM public.coding_problem_starter_code WHERE problem_slug = _slug;
    FOR _lang, _code IN SELECT key, value FROM jsonb_each_text(payload->'starter_code') LOOP
      INSERT INTO public.coding_problem_starter_code (problem_slug, lang_id, code)
      VALUES (_slug, _lang, _code);
    END LOOP;
  END IF;

  IF payload ? 'reference_solution' THEN
    DELETE FROM public.coding_problem_reference_solutions WHERE problem_slug = _slug;
    FOR _lang, _code IN SELECT key, value FROM jsonb_each_text(payload->'reference_solution') LOOP
      INSERT INTO public.coding_problem_reference_solutions (problem_slug, lang_id, code)
      VALUES (_slug, _lang, _code);
    END LOOP;
  END IF;

  IF payload ? 'sample_tests' THEN
    DELETE FROM public.coding_problem_tests WHERE problem_slug = _slug AND kind = 'sample';
    _i := 0;
    FOR _test IN SELECT value FROM jsonb_array_elements(payload->'sample_tests') LOOP
      INSERT INTO public.coding_problem_tests (problem_slug, kind, input, expected, ord)
      VALUES (_slug, 'sample', COALESCE(_test->>'input',''), COALESCE(_test->>'expected',''), _i);
      _i := _i + 1;
    END LOOP;
  END IF;

  IF payload ? 'hidden_tests' THEN
    DELETE FROM public.coding_problem_tests WHERE problem_slug = _slug AND kind = 'hidden';
    _i := 0;
    FOR _test IN SELECT value FROM jsonb_array_elements(payload->'hidden_tests') LOOP
      INSERT INTO public.coding_problem_tests (problem_slug, kind, input, expected, ord)
      VALUES (_slug, 'hidden', COALESCE(_test->>'input',''), COALESCE(_test->>'expected',''), _i);
      _i := _i + 1;
    END LOOP;
  END IF;

  IF payload ? 'sql_spec' AND jsonb_typeof(payload->'sql_spec') = 'object' THEN
    INSERT INTO public.coding_problem_sql_specs (problem_slug, schema_sql, seed_sql, reference_query, order_matters, starter)
    VALUES (
      _slug,
      COALESCE(payload->'sql_spec'->>'schema_sql', ''),
      COALESCE(payload->'sql_spec'->>'seed_sql', ''),
      COALESCE(payload->'sql_spec'->>'reference_query', ''),
      COALESCE((payload->'sql_spec'->>'order_matters')::boolean, false),
      COALESCE(payload->'sql_spec'->>'starter', '')
    )
    ON CONFLICT (problem_slug) DO UPDATE SET
      schema_sql = EXCLUDED.schema_sql,
      seed_sql = EXCLUDED.seed_sql,
      reference_query = EXCLUDED.reference_query,
      order_matters = EXCLUDED.order_matters,
      starter = EXCLUDED.starter,
      updated_at = now();
  END IF;

  IF payload ? 'companies' AND jsonb_typeof(payload->'companies') = 'array' THEN
    DELETE FROM public.problem_companies WHERE problem_slug = _slug;
    FOR _co IN SELECT value FROM jsonb_array_elements(payload->'companies') LOOP
      IF COALESCE(_co->>'name','') <> '' AND COALESCE(_co->>'domain','') <> '' THEN
        INSERT INTO public.problem_companies (problem_slug, company_name, company_domain, frequency)
        VALUES (
          _slug,
          _co->>'name',
          _co->>'domain',
          COALESCE((_co->>'frequency')::numeric, 0)
        )
        ON CONFLICT (problem_slug, company_name) DO UPDATE SET
          company_domain = EXCLUDED.company_domain,
          frequency = EXCLUDED.frequency;
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_slug, diff)
  VALUES (_uid, 'save_problem', 'coding_problem', _slug, payload);

  RETURN jsonb_build_object('ok', true, 'slug', _slug);
END;
$$;