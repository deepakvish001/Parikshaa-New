
-- User roles infrastructure
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin','owner','moderator','user');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_roles' AND policyname='ur_self_read') THEN
    CREATE POLICY "ur_self_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- ============ ENUMS ============
CREATE TYPE public.blog_post_status AS ENUM ('draft','scheduled','published','archived');
CREATE TYPE public.blog_comment_status AS ENUM ('visible','hidden','reported','deleted');

-- ============ TABLES ============
CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#f59e0b',
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content_md text NOT NULL DEFAULT '',
  cover_image_url text,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.blog_post_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  scheduled_for timestamptz,
  reading_time_min int NOT NULL DEFAULT 1,
  view_count bigint NOT NULL DEFAULT 0,
  like_count bigint NOT NULL DEFAULT 0,
  comment_count bigint NOT NULL DEFAULT 0,
  seo_title text,
  seo_description text,
  og_image_url text,
  canonical_url text,
  is_featured boolean NOT NULL DEFAULT false,
  allow_comments boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blog_posts_status_pub_idx ON public.blog_posts (status, published_at DESC);
CREATE INDEX blog_posts_author_idx ON public.blog_posts (author_id);
CREATE INDEX blog_posts_featured_idx ON public.blog_posts (is_featured) WHERE is_featured = true;
CREATE INDEX blog_posts_scheduled_idx ON public.blog_posts (scheduled_for) WHERE status = 'scheduled';

CREATE TABLE public.blog_post_categories (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);
CREATE INDEX blog_post_categories_cat_idx ON public.blog_post_categories (category_id);

CREATE TABLE public.blog_post_tags (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX blog_post_tags_tag_idx ON public.blog_post_tags (tag_id);

CREATE TABLE public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  status public.blog_comment_status NOT NULL DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blog_comments_post_idx ON public.blog_comments (post_id, created_at DESC);
CREATE INDEX blog_comments_user_idx ON public.blog_comments (user_id);

CREATE TABLE public.blog_likes (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE public.blog_bookmarks (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE public.blog_views (
  id bigserial PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  viewed_on date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  dedup_key text GENERATED ALWAYS AS (COALESCE(user_id::text, session_id, '')) STORED
);
CREATE INDEX blog_views_post_idx ON public.blog_views (post_id, viewed_at DESC);
CREATE UNIQUE INDEX blog_views_dedup_idx ON public.blog_views (post_id, dedup_key, viewed_on);

CREATE TABLE public.blog_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_md text NOT NULL,
  saved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blog_revisions_post_idx ON public.blog_revisions (post_id, created_at DESC);

-- ============ TIMESTAMPS / TRIGGERS ============
CREATE TRIGGER trg_blog_posts_updated BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_blog_categories_updated BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_blog_comments_updated BEFORE UPDATE ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.blog_posts_before_save()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE words int;
BEGIN
  words := array_length(regexp_split_to_array(coalesce(NEW.content_md,''), '\s+'), 1);
  NEW.reading_time_min := GREATEST(1, COALESCE(words,0) / 200);
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_blog_posts_before_save BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.blog_posts_before_save();

CREATE OR REPLACE FUNCTION public.blog_likes_count_fn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_blog_likes_count AFTER INSERT OR DELETE ON public.blog_likes
  FOR EACH ROW EXECUTE FUNCTION public.blog_likes_count_fn();

-- ============ RLS ============
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_revisions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_blog_editor(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role IN ('admin','owner','moderator')
  )
$$;

CREATE POLICY "blog_posts_public_read" ON public.blog_posts
  FOR SELECT USING (status = 'published');
CREATE POLICY "blog_posts_author_read" ON public.blog_posts
  FOR SELECT TO authenticated USING (author_id = auth.uid() OR public.is_blog_editor(auth.uid()));
CREATE POLICY "blog_posts_editor_insert" ON public.blog_posts
  FOR INSERT TO authenticated WITH CHECK (public.is_blog_editor(auth.uid()));
CREATE POLICY "blog_posts_editor_update" ON public.blog_posts
  FOR UPDATE TO authenticated USING (public.is_blog_editor(auth.uid()));
CREATE POLICY "blog_posts_editor_delete" ON public.blog_posts
  FOR DELETE TO authenticated USING (public.is_blog_editor(auth.uid()));

CREATE POLICY "blog_cats_public_read" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "blog_cats_editor_write" ON public.blog_categories
  FOR ALL TO authenticated USING (public.is_blog_editor(auth.uid())) WITH CHECK (public.is_blog_editor(auth.uid()));

CREATE POLICY "blog_tags_public_read" ON public.blog_tags FOR SELECT USING (true);
CREATE POLICY "blog_tags_editor_write" ON public.blog_tags
  FOR ALL TO authenticated USING (public.is_blog_editor(auth.uid())) WITH CHECK (public.is_blog_editor(auth.uid()));

CREATE POLICY "blog_pc_public_read" ON public.blog_post_categories FOR SELECT USING (true);
CREATE POLICY "blog_pc_editor_write" ON public.blog_post_categories
  FOR ALL TO authenticated USING (public.is_blog_editor(auth.uid())) WITH CHECK (public.is_blog_editor(auth.uid()));
CREATE POLICY "blog_pt_public_read" ON public.blog_post_tags FOR SELECT USING (true);
CREATE POLICY "blog_pt_editor_write" ON public.blog_post_tags
  FOR ALL TO authenticated USING (public.is_blog_editor(auth.uid())) WITH CHECK (public.is_blog_editor(auth.uid()));

CREATE POLICY "blog_comments_self_read" ON public.blog_comments
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_blog_editor(auth.uid()));
CREATE POLICY "blog_comments_user_insert" ON public.blog_comments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "blog_comments_user_update" ON public.blog_comments
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_blog_editor(auth.uid()));
CREATE POLICY "blog_comments_user_delete" ON public.blog_comments
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_blog_editor(auth.uid()));

CREATE POLICY "blog_likes_public_read" ON public.blog_likes FOR SELECT USING (true);
CREATE POLICY "blog_likes_self_write" ON public.blog_likes
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "blog_bookmarks_self" ON public.blog_bookmarks
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "blog_views_anyone_insert" ON public.blog_views
  FOR INSERT WITH CHECK (true);
CREATE POLICY "blog_views_editor_read" ON public.blog_views
  FOR SELECT TO authenticated USING (public.is_blog_editor(auth.uid()));

CREATE POLICY "blog_revisions_editor_all" ON public.blog_revisions
  FOR ALL TO authenticated USING (public.is_blog_editor(auth.uid())) WITH CHECK (public.is_blog_editor(auth.uid()));

-- ============ FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.blog_increment_view(_post_id uuid, _session_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  BEGIN
    INSERT INTO public.blog_views (post_id, user_id, session_id)
      VALUES (_post_id, auth.uid(), _session_id);
    UPDATE public.blog_posts SET view_count = view_count + 1 WHERE id = _post_id;
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END $$;

CREATE OR REPLACE FUNCTION public.blog_publish_scheduled()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  UPDATE public.blog_posts
    SET status = 'published', published_at = now()
    WHERE status = 'scheduled' AND scheduled_for <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname='blog-publish-scheduled';
    PERFORM cron.schedule('blog-publish-scheduled', '*/5 * * * *', 'SELECT public.blog_publish_scheduled();');
  END IF;
END $$;

INSERT INTO public.blog_categories (slug,name,color,icon,sort_order) VALUES
  ('career','Career','#f59e0b','briefcase',1),
  ('dsa','DSA & Coding','#10b981','code',2),
  ('interview','Interview Prep','#8b5cf6','message-circle',3),
  ('placement','Placement Stories','#ef4444','award',4),
  ('tutorials','Tutorials','#3b82f6','book-open',5),
  ('announcements','Announcements','#ec4899','megaphone',6)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE public.blog_comment_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  post_id uuid,
  actor_id uuid,
  action text NOT NULL,
  old_status text,
  new_status text,
  comment_snapshot text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_blog_comment_audit_created_at ON public.blog_comment_audit(created_at DESC);
CREATE INDEX idx_blog_comment_audit_comment_id ON public.blog_comment_audit(comment_id);
ALTER TABLE public.blog_comment_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_comment_audit_admin_read" ON public.blog_comment_audit
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.blog_comment_audit_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.blog_comment_audit
        (comment_id, post_id, actor_id, action, old_status, new_status, comment_snapshot)
      VALUES
        (NEW.id, NEW.post_id, auth.uid(),
         CASE NEW.status WHEN 'visible' THEN 'make_visible' WHEN 'hidden' THEN 'hide' WHEN 'reported' THEN 'report' ELSE 'status_change' END,
         OLD.status, NEW.status, LEFT(COALESCE(NEW.body, ''), 500));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.blog_comment_audit
      (comment_id, post_id, actor_id, action, old_status, new_status, comment_snapshot)
    VALUES (OLD.id, OLD.post_id, auth.uid(), 'delete', OLD.status, NULL, LEFT(COALESCE(OLD.body, ''), 500));
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_blog_comment_audit AFTER UPDATE OR DELETE ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.blog_comment_audit_fn();

-- Revision audit + comment approval
CREATE TABLE public.blog_revision_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  revision_id uuid REFERENCES public.blog_revisions(id) ON DELETE SET NULL,
  compare_revision_id uuid REFERENCES public.blog_revisions(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('viewed','compared','restored','created','edited')),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blog_revision_audit_post_idx ON public.blog_revision_audit(post_id, created_at DESC);
CREATE INDEX blog_revision_audit_actor_idx ON public.blog_revision_audit(actor_id, created_at DESC);
ALTER TABLE public.blog_revision_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_revision_audit_editor_read" ON public.blog_revision_audit FOR SELECT TO authenticated USING (public.is_blog_editor(auth.uid()));
CREATE POLICY "blog_revision_audit_editor_insert" ON public.blog_revision_audit FOR INSERT TO authenticated WITH CHECK (public.is_blog_editor(auth.uid()) AND actor_id = auth.uid());

ALTER TABLE public.blog_comments
  ADD COLUMN approved_at timestamptz,
  ADD COLUMN approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX blog_comments_pending_idx ON public.blog_comments(post_id, created_at DESC) WHERE approved_at IS NULL;
CREATE INDEX blog_comments_public_idx ON public.blog_comments(post_id, created_at DESC) WHERE approved_at IS NOT NULL AND status = 'visible';

ALTER TABLE public.blog_posts ADD COLUMN auto_approve_comments boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.blog_comment_autoapprove_fn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_auto boolean;
BEGIN
  IF NEW.approved_at IS NULL THEN
    IF public.is_blog_editor(NEW.user_id) THEN
      NEW.approved_at := now();
      NEW.approved_by := NEW.user_id;
    ELSE
      SELECT auto_approve_comments INTO v_auto FROM public.blog_posts WHERE id = NEW.post_id;
      IF coalesce(v_auto, false) THEN NEW.approved_at := now(); END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_blog_comment_autoapprove BEFORE INSERT ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.blog_comment_autoapprove_fn();

CREATE POLICY "blog_comments_public_read" ON public.blog_comments
  FOR SELECT USING (status = 'visible' AND approved_at IS NOT NULL);

CREATE OR REPLACE FUNCTION public.blog_comments_count_fn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE was_pub boolean; now_pub boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'visible' AND NEW.approved_at IS NOT NULL THEN
      UPDATE public.blog_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'visible' AND OLD.approved_at IS NOT NULL THEN
      UPDATE public.blog_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    was_pub := (OLD.status = 'visible' AND OLD.approved_at IS NOT NULL);
    now_pub := (NEW.status = 'visible' AND NEW.approved_at IS NOT NULL);
    IF was_pub AND NOT now_pub THEN
      UPDATE public.blog_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = NEW.post_id;
    ELSIF NOT was_pub AND now_pub THEN
      UPDATE public.blog_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER trg_blog_comments_count AFTER INSERT OR UPDATE OR DELETE ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.blog_comments_count_fn();

-- GRANTS
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
GRANT SELECT ON public.blog_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_categories TO authenticated;
GRANT ALL ON public.blog_categories TO service_role;
GRANT SELECT ON public.blog_tags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_tags TO authenticated;
GRANT ALL ON public.blog_tags TO service_role;
GRANT SELECT ON public.blog_post_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_post_categories TO authenticated;
GRANT ALL ON public.blog_post_categories TO service_role;
GRANT SELECT ON public.blog_post_tags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_post_tags TO authenticated;
GRANT ALL ON public.blog_post_tags TO service_role;
GRANT SELECT ON public.blog_comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_comments TO authenticated;
GRANT ALL ON public.blog_comments TO service_role;
GRANT SELECT ON public.blog_likes TO anon, authenticated;
GRANT INSERT, DELETE ON public.blog_likes TO authenticated;
GRANT ALL ON public.blog_likes TO service_role;
GRANT SELECT, INSERT, DELETE ON public.blog_bookmarks TO authenticated;
GRANT ALL ON public.blog_bookmarks TO service_role;
GRANT INSERT ON public.blog_views TO anon, authenticated;
GRANT SELECT ON public.blog_views TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE blog_views_id_seq TO anon, authenticated;
GRANT ALL ON public.blog_views TO service_role;
GRANT ALL ON SEQUENCE blog_views_id_seq TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_revisions TO authenticated;
GRANT ALL ON public.blog_revisions TO service_role;
GRANT SELECT ON public.blog_comment_audit TO authenticated;
GRANT ALL ON public.blog_comment_audit TO service_role;
GRANT SELECT, INSERT ON public.blog_revision_audit TO authenticated;
GRANT ALL ON public.blog_revision_audit TO service_role;
