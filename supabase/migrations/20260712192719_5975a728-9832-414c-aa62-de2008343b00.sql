-- study_plans
CREATE TABLE public.study_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  goal TEXT,
  target_date DATE,
  focus_topics TEXT[] NOT NULL DEFAULT '{}',
  weekday_minutes INTEGER NOT NULL DEFAULT 60,
  weekend_minutes INTEGER NOT NULL DEFAULT 120,
  readiness_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  plan_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_study_plans_user_active ON public.study_plans(user_id, is_active, week_start DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_plans TO authenticated;
GRANT ALL ON public.study_plans TO service_role;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own plans select" ON public.study_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own plans insert" ON public.study_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own plans update" ON public.study_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own plans delete" ON public.study_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- study_plan_tasks
CREATE TABLE public.study_plan_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  day_date DATE NOT NULL,
  day_index INTEGER NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL, -- 'dsa' | 'sql' | 'quiz' | 'srs' | 'interview' | 'reading' | 'mock'
  topic TEXT,
  title TEXT NOT NULL,
  description TEXT,
  estimated_minutes INTEGER NOT NULL DEFAULT 20,
  resource_url TEXT,
  resource_ref JSONB,
  difficulty TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'done' | 'skipped'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_study_plan_tasks_plan_day ON public.study_plan_tasks(plan_id, day_date, order_index);
CREATE INDEX idx_study_plan_tasks_user_day ON public.study_plan_tasks(user_id, day_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_plan_tasks TO authenticated;
GRANT ALL ON public.study_plan_tasks TO service_role;
ALTER TABLE public.study_plan_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own tasks select" ON public.study_plan_tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own tasks insert" ON public.study_plan_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own tasks update" ON public.study_plan_tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own tasks delete" ON public.study_plan_tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_study_plans_touch BEFORE UPDATE ON public.study_plans
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER trg_study_plan_tasks_touch BEFORE UPDATE ON public.study_plan_tasks
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();