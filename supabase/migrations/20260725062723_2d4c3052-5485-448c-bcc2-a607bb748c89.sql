-- === profiles ===
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view profiles for leaderboard" ON public.profiles FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, avatar_url)
    VALUES (NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- === user_profiles_extended ===
CREATE TYPE public.user_type AS ENUM ('student', 'professional', 'other');
CREATE TYPE public.study_year AS ENUM ('1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Other');

CREATE TABLE public.user_profiles_extended (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    mobile_number TEXT,
    user_type user_type NOT NULL,
    college_name TEXT,
    course_name TEXT,
    branch TEXT,
    study_year study_year,
    company_name TEXT,
    role TEXT,
    experience TEXT,
    other_description TEXT,
    onboarding_completed BOOLEAN DEFAULT false,
    current_experience text,
    target_goal text,
    referral_source text,
    interested_features text[],
    email_notifications_enabled boolean DEFAULT true,
    marketing_emails_enabled boolean DEFAULT false,
    weekly_digest_enabled boolean DEFAULT true,
    new_feature_alerts_enabled boolean DEFAULT true,
    username TEXT UNIQUE,
    bio TEXT,
    location TEXT,
    occupation TEXT,
    website TEXT,
    skills TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    goals TEXT[] DEFAULT '{}',
    aspirations TEXT[] DEFAULT '{}',
    twitter_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    instagram_url TEXT,
    resume_url TEXT,
    other_links JSONB DEFAULT '[]',
    leetcode_url TEXT,
    hackerrank_url TEXT,
    codeforces_url TEXT,
    codechef_url TEXT,
    geeksforgeeks_url TEXT,
    profile_completion_percentage INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    xp_this_week INTEGER DEFAULT 0,
    last_xp_reset_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    srs_intervals INTEGER[] DEFAULT ARRAY[1,2,4,7,14,30,60],
    srs_mastery_threshold INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles_extended TO authenticated;
GRANT SELECT ON public.user_profiles_extended TO anon;
GRANT ALL ON public.user_profiles_extended TO service_role;
ALTER TABLE public.user_profiles_extended ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own extended profile" ON public.user_profiles_extended FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own extended profile" ON public.user_profiles_extended FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own extended profile" ON public.user_profiles_extended FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view profiles with username set" ON public.user_profiles_extended FOR SELECT USING (username IS NOT NULL AND username != '');
CREATE INDEX idx_user_profiles_extended_username ON public.user_profiles_extended(username);
CREATE TRIGGER update_user_profiles_extended_updated_at BEFORE UPDATE ON public.user_profiles_extended FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.calculate_profile_completion(profile_row public.user_profiles_extended)
RETURNS INTEGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE total_fields INTEGER := 20; filled_fields INTEGER := 0;
BEGIN
    IF profile_row.mobile_number IS NOT NULL AND profile_row.mobile_number != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.bio IS NOT NULL AND profile_row.bio != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.location IS NOT NULL AND profile_row.location != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.occupation IS NOT NULL AND profile_row.occupation != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.website IS NOT NULL AND profile_row.website != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.current_experience IS NOT NULL AND profile_row.current_experience != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.target_goal IS NOT NULL AND profile_row.target_goal != '' THEN filled_fields := filled_fields + 1; END IF;
    IF array_length(profile_row.skills, 1) > 0 THEN filled_fields := filled_fields + 1; END IF;
    IF array_length(profile_row.interests, 1) > 0 THEN filled_fields := filled_fields + 1; END IF;
    IF array_length(profile_row.goals, 1) > 0 THEN filled_fields := filled_fields + 1; END IF;
    IF array_length(profile_row.aspirations, 1) > 0 THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.twitter_url IS NOT NULL AND profile_row.twitter_url != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.linkedin_url IS NOT NULL AND profile_row.linkedin_url != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.github_url IS NOT NULL AND profile_row.github_url != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.instagram_url IS NOT NULL AND profile_row.instagram_url != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.resume_url IS NOT NULL AND profile_row.resume_url != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.leetcode_url IS NOT NULL AND profile_row.leetcode_url != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.hackerrank_url IS NOT NULL AND profile_row.hackerrank_url != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.codeforces_url IS NOT NULL AND profile_row.codeforces_url != '' THEN filled_fields := filled_fields + 1; END IF;
    IF profile_row.codechef_url IS NOT NULL AND profile_row.codechef_url != '' THEN filled_fields := filled_fields + 1; END IF;
    RETURN ROUND((filled_fields::NUMERIC / total_fields::NUMERIC) * 100);
END;
$$;

-- === avatars storage policies (bucket created via storage tool) ===
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Authenticated can view avatars" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars');

-- === conversations, chat_messages ===
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own conversations" ON public.conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own conversations" ON public.conversations FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversations WHERE id = chat_messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert messages in their conversations" ON public.chat_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.conversations WHERE id = chat_messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete messages in their conversations" ON public.chat_messages FOR DELETE USING (EXISTS (SELECT 1 FROM public.conversations WHERE id = chat_messages.conversation_id AND user_id = auth.uid()));
CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- === user_topic_progress ===
CREATE TABLE public.user_topic_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sheet_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  is_revision BOOLEAN NOT NULL DEFAULT false,
  note TEXT DEFAULT '',
  completed_at timestamp with time zone,
  review_count integer NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, sheet_id, topic_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_topic_progress TO authenticated;
GRANT ALL ON public.user_topic_progress TO service_role;
ALTER TABLE public.user_topic_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own progress" ON public.user_topic_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.user_topic_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_topic_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own progress" ON public.user_topic_progress FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_user_topic_progress_lookup ON public.user_topic_progress(user_id, sheet_id);
CREATE TRIGGER update_user_topic_progress_updated_at BEFORE UPDATE ON public.user_topic_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- === user_goals ===
CREATE TABLE public.user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  daily_target INTEGER NOT NULL DEFAULT 5,
  weekly_target INTEGER NOT NULL DEFAULT 25,
  daily_xp_target INTEGER DEFAULT 50,
  weekly_xp_target INTEGER DEFAULT 300,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_goals TO authenticated;
GRANT ALL ON public.user_goals TO service_role;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own goals" ON public.user_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own goals" ON public.user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.user_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON public.user_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- === user_achievements ===
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT SELECT ON public.user_achievements TO anon;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view user achievements for public profiles" ON public.user_achievements FOR SELECT USING (true);
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);

-- === leaderboard_view ===
CREATE VIEW public.leaderboard_view WITH (security_invoker = on) AS
SELECT p.user_id, p.full_name, p.avatar_url,
  COALESCE(progress.completed_count, 0) as completed_count,
  COALESCE(progress.revision_count, 0) as revision_count
FROM public.profiles p
LEFT JOIN (
  SELECT user_id,
    COUNT(*) FILTER (WHERE completed = true) as completed_count,
    COUNT(*) FILTER (WHERE is_revision = true) as revision_count
  FROM public.user_topic_progress GROUP BY user_id
) progress ON p.user_id = progress.user_id
WHERE COALESCE(progress.completed_count, 0) > 0
ORDER BY completed_count DESC LIMIT 50;
GRANT SELECT ON public.leaderboard_view TO authenticated;

-- === user_company_progress ===
CREATE TABLE public.user_company_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id TEXT NOT NULL,
  tab_id TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  solved BOOLEAN NOT NULL DEFAULT false,
  revision BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id, tab_id, item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_company_progress TO authenticated;
GRANT ALL ON public.user_company_progress TO service_role;
ALTER TABLE public.user_company_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own company progress" ON public.user_company_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own company progress" ON public.user_company_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own company progress" ON public.user_company_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own company progress" ON public.user_company_progress FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_user_company_progress_user_company ON public.user_company_progress (user_id, company_id);
CREATE TRIGGER update_user_company_progress_updated_at BEFORE UPDATE ON public.user_company_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_company_progress;

-- === user_folders / user_folder_items / shared_folders ===
CREATE TABLE public.user_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'primary',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_folders TO authenticated;
GRANT ALL ON public.user_folders TO service_role;
ALTER TABLE public.user_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own folders" ON public.user_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own folders" ON public.user_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own folders" ON public.user_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own folders" ON public.user_folders FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_user_folders_updated_at BEFORE UPDATE ON public.user_folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_folder_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID NOT NULL REFERENCES public.user_folders(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  question_source TEXT NOT NULL DEFAULT 'interview',
  sort_order integer NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(folder_id, question_id, question_source)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_folder_items TO authenticated;
GRANT ALL ON public.user_folder_items TO service_role;
ALTER TABLE public.user_folder_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view items in their folders" ON public.user_folder_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_folders WHERE user_folders.id = user_folder_items.folder_id AND user_folders.user_id = auth.uid()));
CREATE POLICY "Users can add items to their folders" ON public.user_folder_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_folders WHERE user_folders.id = user_folder_items.folder_id AND user_folders.user_id = auth.uid()));
CREATE POLICY "Users can remove items from their folders" ON public.user_folder_items FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_folders WHERE user_folders.id = user_folder_items.folder_id AND user_folders.user_id = auth.uid()));
CREATE INDEX idx_user_folder_items_sort_order ON public.user_folder_items(folder_id, sort_order);

CREATE TABLE public.shared_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id uuid NOT NULL REFERENCES public.user_folders(id) ON DELETE CASCADE,
  share_code text NOT NULL UNIQUE,
  is_public boolean NOT NULL DEFAULT true,
  allow_copy boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone DEFAULT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_folders TO authenticated;
GRANT SELECT ON public.shared_folders TO anon;
GRANT ALL ON public.shared_folders TO service_role;
CREATE UNIQUE INDEX idx_shared_folders_share_code ON public.shared_folders(share_code);
CREATE INDEX idx_shared_folders_folder_id ON public.shared_folders(folder_id);
ALTER TABLE public.shared_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create shares for their own folders" ON public.shared_folders FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_folders WHERE user_folders.id = shared_folders.folder_id AND user_folders.user_id = auth.uid()));
CREATE POLICY "Users can view shares for their own folders" ON public.shared_folders FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_folders WHERE user_folders.id = shared_folders.folder_id AND user_folders.user_id = auth.uid()));
CREATE POLICY "Users can delete shares for their own folders" ON public.shared_folders FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_folders WHERE user_folders.id = shared_folders.folder_id AND user_folders.user_id = auth.uid()));
CREATE POLICY "Users can update shares for their own folders" ON public.shared_folders FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_folders WHERE user_folders.id = shared_folders.folder_id AND user_folders.user_id = auth.uid()));
CREATE POLICY "Anyone can view public shared folders" ON public.shared_folders FOR SELECT USING (is_public = true);

-- === quiz_results / responses / spaced_repetition ===
CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_type TEXT NOT NULL,
  category TEXT DEFAULT 'all',
  difficulty TEXT DEFAULT 'all',
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL,
  avg_time_seconds INTEGER NOT NULL,
  total_time_seconds INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_results TO authenticated;
GRANT SELECT ON public.quiz_results TO anon;
GRANT ALL ON public.quiz_results TO service_role;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view quiz results for leaderboard" ON public.quiz_results FOR SELECT USING (true);
CREATE POLICY "Users can insert their own quiz results" ON public.quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quiz results" ON public.quiz_results FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_quiz_results_leaderboard ON public.quiz_results (quiz_type, accuracy DESC, avg_time_seconds ASC);
CREATE INDEX idx_quiz_results_user ON public.quiz_results (user_id, completed_at DESC);

CREATE TABLE public.quiz_question_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_result_id UUID NOT NULL REFERENCES public.quiz_results(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  question_category TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  selected_answer_index INTEGER,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  time_taken_seconds INTEGER DEFAULT 0,
  was_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_question_responses TO authenticated;
GRANT ALL ON public.quiz_question_responses TO service_role;
CREATE INDEX idx_quiz_question_responses_result_id ON public.quiz_question_responses(quiz_result_id);
ALTER TABLE public.quiz_question_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own quiz responses" ON public.quiz_question_responses FOR SELECT USING (EXISTS (SELECT 1 FROM public.quiz_results WHERE quiz_results.id = quiz_question_responses.quiz_result_id AND quiz_results.user_id = auth.uid()));
CREATE POLICY "Users can insert their own quiz responses" ON public.quiz_question_responses FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.quiz_results WHERE quiz_results.id = quiz_question_responses.quiz_result_id AND quiz_results.user_id = auth.uid()));
CREATE POLICY "Users can delete their own quiz responses" ON public.quiz_question_responses FOR DELETE USING (EXISTS (SELECT 1 FROM public.quiz_results WHERE quiz_results.id = quiz_question_responses.quiz_result_id AND quiz_results.user_id = auth.uid()));

CREATE TABLE public.quiz_spaced_repetition (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id INTEGER NOT NULL,
  question_category TEXT NOT NULL,
  question_title TEXT NOT NULL,
  last_answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_review_at TIMESTAMP WITH TIME ZONE NOT NULL,
  review_count INTEGER NOT NULL DEFAULT 0,
  correct_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id, question_category)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_spaced_repetition TO authenticated;
GRANT ALL ON public.quiz_spaced_repetition TO service_role;
ALTER TABLE public.quiz_spaced_repetition ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own quiz reviews" ON public.quiz_spaced_repetition FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quiz reviews" ON public.quiz_spaced_repetition FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quiz reviews" ON public.quiz_spaced_repetition FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quiz reviews" ON public.quiz_spaced_repetition FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_quiz_spaced_repetition_user_next_review ON public.quiz_spaced_repetition(user_id, next_review_at);
CREATE TRIGGER update_quiz_spaced_repetition_updated_at BEFORE UPDATE ON public.quiz_spaced_repetition FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- === user_follows / notifications / xp_transactions ===
CREATE TABLE public.user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_follows TO authenticated;
GRANT ALL ON public.user_follows TO service_role;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own follows" ON public.user_follows FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);
CREATE POLICY "Users can follow others" ON public.user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.user_follows FOR DELETE USING (auth.uid() = follower_id);
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;

CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE follower_name TEXT;
BEGIN
    SELECT full_name INTO follower_name FROM public.profiles WHERE user_id = NEW.follower_id;
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (NEW.following_id, 'new_follower', 'New Follower',
        COALESCE(follower_name, 'Someone') || ' started following you',
        jsonb_build_object('follower_id', NEW.follower_id, 'follower_name', follower_name));
    RETURN NEW;
END;
$$;
CREATE TRIGGER on_new_follow AFTER INSERT ON public.user_follows FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

CREATE OR REPLACE FUNCTION public.notify_on_rare_achievement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    earner_name TEXT; earner_id UUID; follower_record RECORD;
    total_users INTEGER; earned_count INTEGER; percentage NUMERIC;
BEGIN
    earner_id := NEW.user_id;
    SELECT full_name INTO earner_name FROM public.profiles WHERE user_id = earner_id;
    SELECT COUNT(DISTINCT user_id) INTO total_users FROM public.user_achievements;
    SELECT COUNT(*) INTO earned_count FROM public.user_achievements WHERE achievement_id = NEW.achievement_id;
    IF total_users > 0 THEN percentage := (earned_count::NUMERIC / total_users::NUMERIC) * 100;
    ELSE percentage := 100; END IF;
    IF percentage < 10 THEN
        FOR follower_record IN SELECT follower_id FROM public.user_follows WHERE following_id = earner_id
        LOOP
            INSERT INTO public.notifications (user_id, type, title, message, data)
            VALUES (follower_record.follower_id, 'rare_achievement', 'Rare Achievement Unlocked!',
                COALESCE(earner_name, 'Someone you follow') || ' earned a rare badge: ' || NEW.achievement_id,
                jsonb_build_object('earner_id', earner_id, 'earner_name', earner_name, 'achievement_id', NEW.achievement_id, 'rarity_percentage', percentage));
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER on_rare_achievement AFTER INSERT ON public.user_achievements FOR EACH ROW EXECUTE FUNCTION public.notify_on_rare_achievement();

CREATE TABLE public.xp_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.xp_transactions TO authenticated;
GRANT ALL ON public.xp_transactions TO service_role;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own XP transactions" ON public.xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own XP transactions" ON public.xp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_xp_transactions_user_id ON public.xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_created_at ON public.xp_transactions(created_at DESC);
CREATE INDEX idx_profiles_total_xp ON public.user_profiles_extended(total_xp DESC);
CREATE INDEX idx_profiles_xp_this_week ON public.user_profiles_extended(xp_this_week DESC);

CREATE VIEW public.xp_leaderboard_view WITH (security_invoker = on) AS
SELECT upe.user_id, upe.username, upe.total_xp, upe.current_level, upe.xp_this_week,
  p.full_name, p.avatar_url
FROM public.user_profiles_extended upe
LEFT JOIN public.profiles p ON p.user_id = upe.user_id
WHERE upe.total_xp > 0 AND upe.username IS NOT NULL AND upe.username != ''
ORDER BY upe.total_xp DESC;
GRANT SELECT ON public.xp_leaderboard_view TO authenticated, anon;

-- === study_plan_goals ===
CREATE TABLE public.study_plan_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  target_questions INTEGER NOT NULL DEFAULT 10,
  questions_practiced INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_plan_goals TO authenticated;
GRANT ALL ON public.study_plan_goals TO service_role;
ALTER TABLE public.study_plan_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own study plan goals" ON public.study_plan_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own study plan goals" ON public.study_plan_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own study plan goals" ON public.study_plan_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own study plan goals" ON public.study_plan_goals FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_study_plan_goals_user_id ON public.study_plan_goals(user_id);
CREATE TRIGGER update_study_plan_goals_updated_at BEFORE UPDATE ON public.study_plan_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;