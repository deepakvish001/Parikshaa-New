
-- 1. Create app_role enum if it doesn't exist (it should already be there from previous instructions)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'owner');
    END IF;
END $$;

-- 2. User Onboarding & Goals
CREATE TABLE IF NOT EXISTS public.user_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    target_company TEXT,
    target_role TEXT,
    target_timeline TEXT,
    skills TEXT[],
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_onboarding TO authenticated;
GRANT ALL ON public.user_onboarding TO service_role;
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own onboarding"
ON public.user_onboarding
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- 3. Personalized Roadmaps
CREATE TABLE IF NOT EXISTS public.user_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    weekly_sprints JSONB NOT NULL, -- Structure: [{sprint: 1, title: '...', tasks: [{day: 1, task: '...', status: 'pending'}]}]
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roadmaps TO authenticated;
GRANT ALL ON public.user_roadmaps TO service_role;
ALTER TABLE public.user_roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own roadmaps"
ON public.user_roadmaps
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- 4. Revision Notes & Sprint Quizzes
CREATE TABLE IF NOT EXISTS public.sprint_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    roadmap_id UUID REFERENCES public.user_roadmaps(id) ON DELETE CASCADE NOT NULL,
    sprint_number INT NOT NULL,
    revision_notes TEXT, -- AI generated Markdown
    quiz_data JSONB, -- AI generated questions
    quiz_score INT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sprint_artifacts TO authenticated;
GRANT ALL ON public.sprint_artifacts TO service_role;
ALTER TABLE public.sprint_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sprint artifacts"
ON public.sprint_artifacts
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- 5. Aptitude Problems
CREATE TABLE IF NOT EXISTS public.aptitude_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    sub_topic TEXT,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option TEXT NOT NULL,
    explanation TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT ON public.aptitude_questions TO authenticated;
GRANT ALL ON public.aptitude_questions TO service_role;
ALTER TABLE public.aptitude_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read aptitude questions"
ON public.aptitude_questions
FOR SELECT
TO authenticated
USING (true);

-- 6. Interview Experiences
CREATE TABLE IF NOT EXISTS public.interview_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    role TEXT,
    experience_text TEXT NOT NULL,
    tags TEXT[],
    status TEXT DEFAULT 'pending', -- approved, pending, rejected
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.interview_experiences TO authenticated;
GRANT ALL ON public.interview_experiences TO service_role;
ALTER TABLE public.interview_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public experiences can be read by all authenticated"
ON public.interview_experiences
FOR SELECT
TO authenticated
USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Users can submit their own experience"
ON public.interview_experiences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 7. Code Reviews & AI Feedback
CREATE TABLE IF NOT EXISTS public.problem_ai_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL, -- Reference to your code submission table if it exists
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    review_markdown TEXT NOT NULL,
    suggested_improvements TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT ON public.problem_ai_reviews TO authenticated;
GRANT ALL ON public.problem_ai_reviews TO service_role;
ALTER TABLE public.problem_ai_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own reviews"
ON public.problem_ai_reviews
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 8. Streaks & Daily Habits
CREATE TABLE IF NOT EXISTS public.user_streaks (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INT DEFAULT 0,
    max_streak INT DEFAULT 0,
    last_activity_date DATE,
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_streaks TO authenticated;
GRANT ALL ON public.user_streaks TO service_role;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own streaks"
ON public.user_streaks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
