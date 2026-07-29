export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          diff: Json | null
          entity_slug: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          diff?: Json | null
          entity_slug?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          diff?: Json | null
          entity_slug?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      admin_daily_challenge_schedule: {
        Row: {
          challenge_date: string
          created_at: string
          problem_slug: string
          set_by: string | null
        }
        Insert: {
          challenge_date: string
          created_at?: string
          problem_slug: string
          set_by?: string | null
        }
        Update: {
          challenge_date?: string
          created_at?: string
          problem_slug?: string
          set_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_daily_challenge_schedule_problem_slug_fkey"
            columns: ["problem_slug"]
            isOneToOne: false
            referencedRelation: "coding_problems"
            referencedColumns: ["slug"]
          },
        ]
      }
      ai_content_likes: {
        Row: {
          content_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_likes_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "ai_generated_content"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_content_progress: {
        Row: {
          completed_at: string | null
          content_id: string
          created_at: string
          id: string
          last_accessed_at: string
          progress: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content_id: string
          created_at?: string
          id?: string
          last_accessed_at?: string
          progress?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content_id?: string
          created_at?: string
          id?: string
          last_accessed_at?: string
          progress?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "ai_generated_content"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generated_content: {
        Row: {
          content: Json
          content_type: string
          created_at: string
          id: string
          is_public: boolean
          likes_count: number
          title: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          content_type: string
          created_at?: string
          id?: string
          is_public?: boolean
          likes_count?: number
          title: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          content_type?: string
          created_at?: string
          id?: string
          is_public?: boolean
          likes_count?: number
          title?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_insight_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          insight_key: string
          insight_title: string
          org_id: string
          rating: Database["public"]["Enums"]["ai_insight_rating"]
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          insight_key: string
          insight_title: string
          org_id: string
          rating: Database["public"]["Enums"]["ai_insight_rating"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          insight_key?: string
          insight_title?: string
          org_id?: string
          rating?: Database["public"]["Enums"]["ai_insight_rating"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_insight_flags: {
        Row: {
          created_at: string
          flagged_by: string
          insight_key: string
          insight_title: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          flagged_by?: string
          insight_key: string
          insight_title: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          flagged_by?: string
          insight_key?: string
          insight_title?: string
          reason?: string | null
        }
        Relationships: []
      }
      blog_bookmarks: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_comment_audit: {
        Row: {
          action: string
          actor_id: string | null
          comment_id: string
          comment_snapshot: string | null
          created_at: string
          id: string
          new_status: string | null
          old_status: string | null
          post_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          comment_id: string
          comment_snapshot?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          post_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          comment_id?: string
          comment_snapshot?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          post_id?: string | null
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          body: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          status: Database["public"]["Enums"]["blog_comment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          body: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          status?: Database["public"]["Enums"]["blog_comment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          body?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          status?: Database["public"]["Enums"]["blog_comment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_media_upload_queue: {
        Row: {
          attempts: number
          base64_data: string
          content_type: string
          created_at: string
          file_name: string
          folder: string
          id: string
          last_error: string | null
          max_attempts: number
          next_attempt_at: string
          requested_by: string | null
          resolved_path: string | null
          resolved_signed_url: string | null
          status: string
          target_field: string | null
          target_post_slug: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          base64_data: string
          content_type?: string
          created_at?: string
          file_name: string
          folder?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          next_attempt_at?: string
          requested_by?: string | null
          resolved_path?: string | null
          resolved_signed_url?: string | null
          status?: string
          target_field?: string | null
          target_post_slug?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          base64_data?: string
          content_type?: string
          created_at?: string
          file_name?: string
          folder?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          next_attempt_at?: string
          requested_by?: string | null
          resolved_path?: string | null
          resolved_signed_url?: string | null
          status?: string
          target_field?: string | null
          target_post_slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_categories: {
        Row: {
          category_id: string
          post_id: string
        }
        Insert: {
          category_id: string
          post_id: string
        }
        Update: {
          category_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          allow_comments: boolean
          author_id: string | null
          auto_approve_comments: boolean
          bookmark_count: number
          canonical_url: string | null
          comment_count: number
          content_md: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_featured: boolean
          like_count: number
          og_image_url: string | null
          published_at: string | null
          reading_time_min: number
          scheduled_for: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["blog_post_status"]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          allow_comments?: boolean
          author_id?: string | null
          auto_approve_comments?: boolean
          bookmark_count?: number
          canonical_url?: string | null
          comment_count?: number
          content_md?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          like_count?: number
          og_image_url?: string | null
          published_at?: string | null
          reading_time_min?: number
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          allow_comments?: boolean
          author_id?: string | null
          auto_approve_comments?: boolean
          bookmark_count?: number
          canonical_url?: string | null
          comment_count?: number
          content_md?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          like_count?: number
          og_image_url?: string | null
          published_at?: string | null
          reading_time_min?: number
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      blog_revision_audit: {
        Row: {
          action: string
          actor_id: string | null
          compare_revision_id: string | null
          created_at: string
          id: string
          meta: Json
          post_id: string
          revision_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          compare_revision_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          post_id: string
          revision_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          compare_revision_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          post_id?: string
          revision_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_revision_audit_compare_revision_id_fkey"
            columns: ["compare_revision_id"]
            isOneToOne: false
            referencedRelation: "blog_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_revision_audit_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_revision_audit_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "blog_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_revisions: {
        Row: {
          content_md: string
          created_at: string
          id: string
          post_id: string
          saved_by: string | null
          title: string
        }
        Insert: {
          content_md: string
          created_at?: string
          id?: string
          post_id: string
          saved_by?: string | null
          title: string
        }
        Update: {
          content_md?: string
          created_at?: string
          id?: string
          post_id?: string
          saved_by?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_revisions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_views: {
        Row: {
          dedup_key: string | null
          id: number
          post_id: string
          session_id: string | null
          user_id: string | null
          viewed_at: string
          viewed_on: string
        }
        Insert: {
          dedup_key?: string | null
          id?: number
          post_id: string
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string
          viewed_on?: string
        }
        Update: {
          dedup_key?: string | null
          id?: number
          post_id?: string
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string
          viewed_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      builtin_sheet_overrides: {
        Row: {
          created_at: string
          description: string | null
          sections: Json | null
          slug: string
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          sections?: Json | null
          slug: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          sections?: Json | null
          slug?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      builtin_sheet_share_links: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          include_articles: boolean
          label: string | null
          last_viewed_at: string | null
          revoked: boolean
          slug: string
          token: string
          updated_at: string
          view_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          include_articles?: boolean
          label?: string | null
          last_viewed_at?: string | null
          revoked?: boolean
          slug: string
          token: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          include_articles?: boolean
          label?: string | null
          last_viewed_at?: string | null
          revoked?: boolean
          slug?: string
          token?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      code_drafts: {
        Row: {
          id: string
          language: string
          problem_slug: string
          source_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          language: string
          problem_slug: string
          source_code?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          language?: string
          problem_slug?: string
          source_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      code_runs: {
        Row: {
          compile_output: string | null
          created_at: string
          id: string
          language: string
          language_id: number
          memory_kb: number | null
          problem_slug: string
          source_code: string
          status: string | null
          status_id: number | null
          stderr: string | null
          stdin: string
          stdout: string | null
          time_ms: number | null
          user_id: string
        }
        Insert: {
          compile_output?: string | null
          created_at?: string
          id?: string
          language: string
          language_id: number
          memory_kb?: number | null
          problem_slug: string
          source_code?: string
          status?: string | null
          status_id?: number | null
          stderr?: string | null
          stdin?: string
          stdout?: string | null
          time_ms?: number | null
          user_id: string
        }
        Update: {
          compile_output?: string | null
          created_at?: string
          id?: string
          language?: string
          language_id?: number
          memory_kb?: number | null
          problem_slug?: string
          source_code?: string
          status?: string | null
          status_id?: number | null
          stderr?: string | null
          stdin?: string
          stdout?: string | null
          time_ms?: number | null
          user_id?: string
        }
        Relationships: []
      }
      code_submissions: {
        Row: {
          created_at: string
          failing_case: Json | null
          id: string
          is_submission: boolean
          language: string
          language_id: number
          memory_kb: number | null
          passed_tests: number
          problem_slug: string
          runtime_ms: number | null
          source_code: string
          stderr: string | null
          total_tests: number
          user_id: string
          verdict: string
        }
        Insert: {
          created_at?: string
          failing_case?: Json | null
          id?: string
          is_submission?: boolean
          language: string
          language_id: number
          memory_kb?: number | null
          passed_tests?: number
          problem_slug: string
          runtime_ms?: number | null
          source_code: string
          stderr?: string | null
          total_tests?: number
          user_id: string
          verdict: string
        }
        Update: {
          created_at?: string
          failing_case?: Json | null
          id?: string
          is_submission?: boolean
          language?: string
          language_id?: number
          memory_kb?: number | null
          passed_tests?: number
          problem_slug?: string
          runtime_ms?: number | null
          source_code?: string
          stderr?: string | null
          total_tests?: number
          user_id?: string
          verdict?: string
        }
        Relationships: []
      }
      coding_problem_discussion_likes: {
        Row: {
          created_at: string
          discussion_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discussion_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          discussion_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_problem_discussion_likes_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "coding_problem_discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      coding_problem_discussions: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          parent_id: string | null
          problem_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          parent_id?: string | null
          problem_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          parent_id?: string | null
          problem_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_problem_discussions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "coding_problem_discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      coding_problem_mcq_attempts: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          problem_slug: string
          selected_index: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          problem_slug: string
          selected_index: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          problem_slug?: string
          selected_index?: number
          user_id?: string
        }
        Relationships: []
      }
      coding_problem_reference_solutions: {
        Row: {
          code: string
          id: string
          lang_id: string
          problem_slug: string
          updated_at: string
        }
        Insert: {
          code?: string
          id?: string
          lang_id: string
          problem_slug: string
          updated_at?: string
        }
        Update: {
          code?: string
          id?: string
          lang_id?: string
          problem_slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_problem_reference_solutions_problem_slug_fkey"
            columns: ["problem_slug"]
            isOneToOne: false
            referencedRelation: "coding_problems"
            referencedColumns: ["slug"]
          },
        ]
      }
      coding_problem_sql_specs: {
        Row: {
          order_matters: boolean
          problem_slug: string
          reference_query: string
          schema_sql: string
          seed_sql: string
          starter: string
          updated_at: string
        }
        Insert: {
          order_matters?: boolean
          problem_slug: string
          reference_query?: string
          schema_sql?: string
          seed_sql?: string
          starter?: string
          updated_at?: string
        }
        Update: {
          order_matters?: boolean
          problem_slug?: string
          reference_query?: string
          schema_sql?: string
          seed_sql?: string
          starter?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_problem_sql_specs_problem_slug_fkey"
            columns: ["problem_slug"]
            isOneToOne: true
            referencedRelation: "coding_problems"
            referencedColumns: ["slug"]
          },
        ]
      }
      coding_problem_starter_code: {
        Row: {
          code: string
          id: string
          lang_id: string
          problem_slug: string
          updated_at: string
        }
        Insert: {
          code?: string
          id?: string
          lang_id: string
          problem_slug: string
          updated_at?: string
        }
        Update: {
          code?: string
          id?: string
          lang_id?: string
          problem_slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_problem_starter_code_problem_slug_fkey"
            columns: ["problem_slug"]
            isOneToOne: false
            referencedRelation: "coding_problems"
            referencedColumns: ["slug"]
          },
        ]
      }
      coding_problem_tests: {
        Row: {
          created_at: string
          expected: string
          id: string
          input: string
          kind: string
          ord: number
          problem_slug: string
        }
        Insert: {
          created_at?: string
          expected?: string
          id?: string
          input?: string
          kind: string
          ord?: number
          problem_slug: string
        }
        Update: {
          created_at?: string
          expected?: string
          id?: string
          input?: string
          kind?: string
          ord?: number
          problem_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_problem_tests_problem_slug_fkey"
            columns: ["problem_slug"]
            isOneToOne: false
            referencedRelation: "coding_problems"
            referencedColumns: ["slug"]
          },
        ]
      }
      coding_problems: {
        Row: {
          constraints: string[]
          cpu_time_limit_sec: number | null
          created_at: string
          created_by: string | null
          description: string
          difficulty: string
          examples: Json
          hints: string[]
          is_published: boolean
          mcq: Json | null
          memory_limit_kb: number | null
          slug: string
          title: string
          topics: string[]
          updated_at: string
        }
        Insert: {
          constraints?: string[]
          cpu_time_limit_sec?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string
          examples?: Json
          hints?: string[]
          is_published?: boolean
          mcq?: Json | null
          memory_limit_kb?: number | null
          slug: string
          title: string
          topics?: string[]
          updated_at?: string
        }
        Update: {
          constraints?: string[]
          cpu_time_limit_sec?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string
          examples?: Json
          hints?: string[]
          is_published?: boolean
          mcq?: Json | null
          memory_limit_kb?: number | null
          slug?: string
          title?: string
          topics?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      coding_problems_meta: {
        Row: {
          acceptance_rate: number
          difficulty: string
          problem_slug: string
          total_accepted: number
          total_submissions: number
          updated_at: string
        }
        Insert: {
          acceptance_rate?: number
          difficulty?: string
          problem_slug: string
          total_accepted?: number
          total_submissions?: number
          updated_at?: string
        }
        Update: {
          acceptance_rate?: number
          difficulty?: string
          problem_slug?: string
          total_accepted?: number
          total_submissions?: number
          updated_at?: string
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      contest_code_provenance: {
        Row: {
          char_count: number | null
          client_ts: string
          contest_id: string
          diff_summary: Json | null
          event_type: string
          id: string
          paste_size: number | null
          problem_id: string
          reason: string | null
          server_ts: string
          session_id: string
          suspicious: boolean
          user_id: string
        }
        Insert: {
          char_count?: number | null
          client_ts: string
          contest_id: string
          diff_summary?: Json | null
          event_type: string
          id?: string
          paste_size?: number | null
          problem_id: string
          reason?: string | null
          server_ts?: string
          session_id: string
          suspicious?: boolean
          user_id: string
        }
        Update: {
          char_count?: number | null
          client_ts?: string
          contest_id?: string
          diff_summary?: Json | null
          event_type?: string
          id?: string
          paste_size?: number | null
          problem_id?: string
          reason?: string | null
          server_ts?: string
          session_id?: string
          suspicious?: boolean
          user_id?: string
        }
        Relationships: []
      }
      contest_leaderboard_cache: {
        Row: {
          contest_id: string
          last_solve_at: string | null
          problems_solved: number
          rank: number
          total_penalty_seconds: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          contest_id: string
          last_solve_at?: string | null
          problems_solved?: number
          rank?: number
          total_penalty_seconds?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          contest_id?: string
          last_solve_at?: string | null
          problems_solved?: number
          rank?: number
          total_penalty_seconds?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_leaderboard_cache_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_problem_variants: {
        Row: {
          contest_id: string
          created_at: string
          hidden_test_seed: string | null
          id: string
          problem_slug: string
          statement_md: string | null
          title: string | null
          variant_key: string
          weight: number
        }
        Insert: {
          contest_id: string
          created_at?: string
          hidden_test_seed?: string | null
          id?: string
          problem_slug: string
          statement_md?: string | null
          title?: string | null
          variant_key: string
          weight?: number
        }
        Update: {
          contest_id?: string
          created_at?: string
          hidden_test_seed?: string | null
          id?: string
          problem_slug?: string
          statement_md?: string | null
          title?: string | null
          variant_key?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "contest_problem_variants_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_problems: {
        Row: {
          contest_id: string
          created_at: string
          order_index: number
          points: number
          problem_slug: string
          unlock_at: string | null
        }
        Insert: {
          contest_id: string
          created_at?: string
          order_index?: number
          points?: number
          problem_slug: string
          unlock_at?: string | null
        }
        Update: {
          contest_id?: string
          created_at?: string
          order_index?: number
          points?: number
          problem_slug?: string
          unlock_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contest_problems_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_proctor_snapshots: {
        Row: {
          captured_at: string
          contest_id: string
          id: string
          session_id: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          captured_at?: string
          contest_id: string
          id?: string
          session_id?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          captured_at?: string
          contest_id?: string
          id?: string
          session_id?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_proctor_snapshots_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_proctor_snapshots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_registrations: {
        Row: {
          contest_id: string
          display_name: string | null
          disqualified_at: string | null
          disqualified_reason: string | null
          flagged: boolean
          honor_code_accepted_at: string | null
          id: string
          registered_at: string
          status: string
          team_name: string | null
          user_id: string
          violation_count: number
        }
        Insert: {
          contest_id: string
          display_name?: string | null
          disqualified_at?: string | null
          disqualified_reason?: string | null
          flagged?: boolean
          honor_code_accepted_at?: string | null
          id?: string
          registered_at?: string
          status?: string
          team_name?: string | null
          user_id: string
          violation_count?: number
        }
        Update: {
          contest_id?: string
          display_name?: string | null
          disqualified_at?: string | null
          disqualified_reason?: string | null
          flagged?: boolean
          honor_code_accepted_at?: string | null
          id?: string
          registered_at?: string
          status?: string
          team_name?: string | null
          user_id?: string
          violation_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "contest_registrations_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_screen_recordings: {
        Row: {
          contest_id: string
          created_at: string
          duration_sec: number
          id: string
          session_id: string | null
          started_at: string
          storage_path: string
          user_id: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          duration_sec?: number
          id?: string
          session_id?: string | null
          started_at?: string
          storage_path: string
          user_id: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          duration_sec?: number
          id?: string
          session_id?: string | null
          started_at?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_screen_recordings_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_screen_recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_sessions: {
        Row: {
          client_fingerprint: Json | null
          contest_id: string
          device_meta: Json
          id: string
          invalidated_at: string | null
          ip_address: unknown
          ip_hash: string | null
          is_active: boolean
          last_heartbeat_at: string | null
          last_seen_at: string
          risk_score: number
          session_token: string
          side_camera_required: boolean
          side_camera_status: string
          started_at: string
          stream_grace_until: string | null
          terminated_at: string | null
          terminated_reason: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          client_fingerprint?: Json | null
          contest_id: string
          device_meta?: Json
          id?: string
          invalidated_at?: string | null
          ip_address?: unknown
          ip_hash?: string | null
          is_active?: boolean
          last_heartbeat_at?: string | null
          last_seen_at?: string
          risk_score?: number
          session_token?: string
          side_camera_required?: boolean
          side_camera_status?: string
          started_at?: string
          stream_grace_until?: string | null
          terminated_at?: string | null
          terminated_reason?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          client_fingerprint?: Json | null
          contest_id?: string
          device_meta?: Json
          id?: string
          invalidated_at?: string | null
          ip_address?: unknown
          ip_hash?: string | null
          is_active?: boolean
          last_heartbeat_at?: string | null
          last_seen_at?: string
          risk_score?: number
          session_token?: string
          side_camera_required?: boolean
          side_camera_status?: string
          started_at?: string
          stream_grace_until?: string | null
          terminated_at?: string | null
          terminated_reason?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_sessions_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_side_camera_audit_logs: {
        Row: {
          created_at: string
          detail: Json
          event_type: string
          id: string
          session_id: string
          severity: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: Json
          event_type: string
          id?: string
          session_id: string
          severity?: string
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: Json
          event_type?: string
          id?: string
          session_id?: string
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_side_camera_audit_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_stream_health: {
        Row: {
          contest_id: string
          created_at: string
          healthy: boolean
          id: string
          session_id: string | null
          stream_kind: string
          user_id: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          healthy: boolean
          id?: string
          session_id?: string | null
          stream_kind: string
          user_id: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          healthy?: boolean
          id?: string
          session_id?: string | null
          stream_kind?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_stream_health_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_stream_health_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_submissions: {
        Row: {
          contest_id: string
          id: string
          penalty_seconds: number
          points_awarded: number
          problem_slug: string
          submission_id: string | null
          submitted_at: string
          user_id: string
          verdict: string
        }
        Insert: {
          contest_id: string
          id?: string
          penalty_seconds?: number
          points_awarded?: number
          problem_slug: string
          submission_id?: string | null
          submitted_at?: string
          user_id: string
          verdict: string
        }
        Update: {
          contest_id?: string
          id?: string
          penalty_seconds?: number
          points_awarded?: number
          problem_slug?: string
          submission_id?: string | null
          submitted_at?: string
          user_id?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_submissions_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_tab_locks: {
        Row: {
          claimed_at: string
          contest_id: string
          tab_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          contest_id: string
          tab_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          contest_id?: string
          tab_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_tab_locks_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_trust_scores: {
        Row: {
          computed_at: string
          contest_id: string
          id: string
          reasons: Json
          risk: string
          score: number
          session_id: string | null
          user_id: string
        }
        Insert: {
          computed_at?: string
          contest_id: string
          id?: string
          reasons?: Json
          risk: string
          score: number
          session_id?: string | null
          user_id: string
        }
        Update: {
          computed_at?: string
          contest_id?: string
          id?: string
          reasons?: Json
          risk?: string
          score?: number
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_trust_scores_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_trust_scores_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_typing_events: {
        Row: {
          char_count: number
          contest_id: string
          created_at: string
          dt_ms: number
          id: string
          is_burst: boolean
          problem_slug: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          char_count: number
          contest_id: string
          created_at?: string
          dt_ms: number
          id?: string
          is_burst?: boolean
          problem_slug: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          char_count?: number
          contest_id?: string
          created_at?: string
          dt_ms?: number
          id?: string
          is_burst?: boolean
          problem_slug?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_typing_events_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_typing_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_user_variants: {
        Row: {
          assigned_at: string
          contest_id: string
          id: string
          problem_slug: string
          user_id: string
          variant_id: string
          variant_key: string
        }
        Insert: {
          assigned_at?: string
          contest_id: string
          id?: string
          problem_slug: string
          user_id: string
          variant_id: string
          variant_key: string
        }
        Update: {
          assigned_at?: string
          contest_id?: string
          id?: string
          problem_slug?: string
          user_id?: string
          variant_id?: string
          variant_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_user_variants_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_user_variants_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "contest_problem_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_violations: {
        Row: {
          contest_id: string
          created_at: string
          id: string
          meta: Json
          session_id: string | null
          severity: string
          type: string
          user_id: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          id?: string
          meta?: Json
          session_id?: string | null
          severity?: string
          type: string
          user_id: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          id?: string
          meta?: Json
          session_id?: string | null
          severity?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_violations_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_violations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contests: {
        Row: {
          banner_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          id: string
          invite_code: string | null
          kind: string | null
          max_participants: number | null
          min_trust_score: number
          penalty_minutes: number
          registration_closes_at: string | null
          registration_opens_at: string | null
          require_screen_share: boolean
          rules_md: string | null
          scoring_mode: string
          sequence_no: number | null
          slug: string
          starts_at: string
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          id?: string
          invite_code?: string | null
          kind?: string | null
          max_participants?: number | null
          min_trust_score?: number
          penalty_minutes?: number
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          require_screen_share?: boolean
          rules_md?: string | null
          scoring_mode?: string
          sequence_no?: number | null
          slug: string
          starts_at: string
          status?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          invite_code?: string | null
          kind?: string | null
          max_participants?: number | null
          min_trust_score?: number
          penalty_minutes?: number
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          require_screen_share?: boolean
          rules_md?: string | null
          scoring_mode?: string
          sequence_no?: number | null
          slug?: string
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_challenge_completions: {
        Row: {
          challenge_date: string
          completed_at: string
          created_at: string
          id: string
          problem_slug: string
          user_id: string
        }
        Insert: {
          challenge_date: string
          completed_at?: string
          created_at?: string
          id?: string
          problem_slug: string
          user_id: string
        }
        Update: {
          challenge_date?: string
          completed_at?: string
          created_at?: string
          id?: string
          problem_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_challenge_leaderboard_optin: {
        Row: {
          created_at: string
          display_name: string | null
          opted_in: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          opted_in?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          opted_in?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      demo_request_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          request_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          request_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          request_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_request_status_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "demo_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          admin_notes: string | null
          candidates: string
          created_at: string
          email: string
          id: string
          landing_page: string | null
          name: string
          notes: string | null
          org: string
          proctoring: string[]
          referrer: string | null
          reporting: string[]
          status: string
          status_updated_at: string | null
          use_case: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          admin_notes?: string | null
          candidates: string
          created_at?: string
          email: string
          id?: string
          landing_page?: string | null
          name: string
          notes?: string | null
          org: string
          proctoring?: string[]
          referrer?: string | null
          reporting?: string[]
          status?: string
          status_updated_at?: string | null
          use_case: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          admin_notes?: string | null
          candidates?: string
          created_at?: string
          email?: string
          id?: string
          landing_page?: string | null
          name?: string
          notes?: string | null
          org?: string
          proctoring?: string[]
          referrer?: string | null
          reporting?: string[]
          status?: string
          status_updated_at?: string | null
          use_case?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      experience_reports: {
        Row: {
          created_at: string
          details: string | null
          experience_id: string
          id: string
          reason: Database["public"]["Enums"]["experience_report_reason"]
          reporter_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["experience_report_status"]
        }
        Insert: {
          created_at?: string
          details?: string | null
          experience_id: string
          id?: string
          reason: Database["public"]["Enums"]["experience_report_reason"]
          reporter_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["experience_report_status"]
        }
        Update: {
          created_at?: string
          details?: string | null
          experience_id?: string
          id?: string
          reason?: Database["public"]["Enums"]["experience_report_reason"]
          reporter_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["experience_report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "experience_reports_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "interview_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_votes: {
        Row: {
          created_at: string
          experience_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          experience_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          experience_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_votes_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "interview_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_content: {
        Row: {
          ends_at: string | null
          slot: string
          starts_at: string | null
          target_id: string
          target_type: string
          updated_at: string
          updated_by: string | null
          weight: number
        }
        Insert: {
          ends_at?: string | null
          slot: string
          starts_at?: string | null
          target_id: string
          target_type: string
          updated_at?: string
          updated_by?: string | null
          weight?: number
        }
        Update: {
          ends_at?: string | null
          slot?: string
          starts_at?: string | null
          target_id?: string
          target_type?: string
          updated_at?: string
          updated_by?: string | null
          weight?: number
        }
        Relationships: []
      }
      gamification_rule_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_value: Json
          note: string | null
          old_value: Json | null
          rule_key: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_value: Json
          note?: string | null
          old_value?: Json | null
          rule_key: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_value?: Json
          note?: string | null
          old_value?: Json | null
          rule_key?: string
        }
        Relationships: []
      }
      interview_experiences: {
        Row: {
          company_name: string
          created_at: string
          ctc_lpa: number | null
          difficulty: string
          experience_type: Database["public"]["Enums"]["experience_type"]
          id: string
          location: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          offer_status: Database["public"]["Enums"]["offer_status"]
          overall_text: string
          role: string
          rounds: Json
          status: Database["public"]["Enums"]["experience_status"]
          tips: string | null
          updated_at: string
          upvotes: number
          user_id: string
          views: number
          year: number
        }
        Insert: {
          company_name: string
          created_at?: string
          ctc_lpa?: number | null
          difficulty?: string
          experience_type?: Database["public"]["Enums"]["experience_type"]
          id?: string
          location?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          offer_status?: Database["public"]["Enums"]["offer_status"]
          overall_text: string
          role: string
          rounds?: Json
          status?: Database["public"]["Enums"]["experience_status"]
          tips?: string | null
          updated_at?: string
          upvotes?: number
          user_id: string
          views?: number
          year: number
        }
        Update: {
          company_name?: string
          created_at?: string
          ctc_lpa?: number | null
          difficulty?: string
          experience_type?: Database["public"]["Enums"]["experience_type"]
          id?: string
          location?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          offer_status?: Database["public"]["Enums"]["offer_status"]
          overall_text?: string
          role?: string
          rounds?: Json
          status?: Database["public"]["Enums"]["experience_status"]
          tips?: string | null
          updated_at?: string
          upvotes?: number
          user_id?: string
          views?: number
          year?: number
        }
        Relationships: []
      }
      job_openings: {
        Row: {
          apply_url: string
          company: string
          company_logo_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          is_remote: boolean
          location: string | null
          posted_at: string
          role_type: string
          salary: string | null
          source: string
          source_id: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          apply_url: string
          company: string
          company_logo_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_remote?: boolean
          location?: string | null
          posted_at?: string
          role_type?: string
          salary?: string | null
          source?: string
          source_id?: string | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          apply_url?: string
          company?: string
          company_logo_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_remote?: boolean
          location?: string | null
          posted_at?: string
          role_type?: string
          salary?: string | null
          source?: string
          source_id?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          page: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          page?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          page?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      library_hidden_items: {
        Row: {
          category: string
          hidden_at: string
          hidden_by: string | null
          item_id: string
        }
        Insert: {
          category: string
          hidden_at?: string
          hidden_by?: string | null
          item_id: string
        }
        Update: {
          category?: string
          hidden_at?: string
          hidden_by?: string | null
          item_id?: string
        }
        Relationships: []
      }
      mirror_outbox: {
        Row: {
          attempts: number
          created_at: string
          id: number
          last_error: string | null
          op: string
          row_data: Json | null
          row_pk: Json | null
          synced_at: string | null
          table_name: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: number
          last_error?: string | null
          op: string
          row_data?: Json | null
          row_pk?: Json | null
          synced_at?: string | null
          table_name: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: number
          last_error?: string | null
          op?: string
          row_data?: Json | null
          row_pk?: Json | null
          synced_at?: string | null
          table_name?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      org_members: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          slug: string
          type: Database["public"]["Enums"]["org_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          slug: string
          type: Database["public"]["Enums"]["org_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          slug?: string
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
        }
        Relationships: []
      }
      outreach_favorites: {
        Row: {
          created_at: string | null
          id: string
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          template_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          template_id?: string
          user_id?: string
        }
        Relationships: []
      }
      outreach_usage: {
        Row: {
          copied_at: string | null
          id: string
          template_id: string
          user_id: string
        }
        Insert: {
          copied_at?: string | null
          id?: string
          template_id: string
          user_id: string
        }
        Update: {
          copied_at?: string | null
          id?: string
          template_id?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      problem_companies: {
        Row: {
          company_domain: string
          company_name: string
          created_at: string
          frequency: number
          id: string
          problem_slug: string
        }
        Insert: {
          company_domain: string
          company_name: string
          created_at?: string
          frequency?: number
          id?: string
          problem_slug: string
        }
        Update: {
          company_domain?: string
          company_name?: string
          created_at?: string
          frequency?: number
          id?: string
          problem_slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          is_active: boolean
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_question_responses: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          question_category: string
          question_id: number
          question_index: number
          quiz_result_id: string
          selected_answer_index: number | null
          time_taken_seconds: number | null
          was_flagged: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_category: string
          question_id: number
          question_index: number
          quiz_result_id: string
          selected_answer_index?: number | null
          time_taken_seconds?: number | null
          was_flagged?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_category?: string
          question_id?: number
          question_index?: number
          quiz_result_id?: string
          selected_answer_index?: number | null
          time_taken_seconds?: number | null
          was_flagged?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "quiz_question_responses_quiz_result_id_fkey"
            columns: ["quiz_result_id"]
            isOneToOne: false
            referencedRelation: "quiz_results"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          accuracy: number
          avg_time_seconds: number
          category: string | null
          completed_at: string
          created_at: string
          difficulty: string | null
          id: string
          quiz_type: string
          score: number
          total_questions: number
          total_time_seconds: number
          user_id: string
        }
        Insert: {
          accuracy: number
          avg_time_seconds: number
          category?: string | null
          completed_at?: string
          created_at?: string
          difficulty?: string | null
          id?: string
          quiz_type: string
          score: number
          total_questions: number
          total_time_seconds: number
          user_id: string
        }
        Update: {
          accuracy?: number
          avg_time_seconds?: number
          category?: string | null
          completed_at?: string
          created_at?: string
          difficulty?: string | null
          id?: string
          quiz_type?: string
          score?: number
          total_questions?: number
          total_time_seconds?: number
          user_id?: string
        }
        Relationships: []
      }
      quiz_spaced_repetition: {
        Row: {
          correct_streak: number
          created_at: string
          id: string
          last_answered_at: string
          next_review_at: string
          question_category: string
          question_id: number
          question_title: string
          review_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_streak?: number
          created_at?: string
          id?: string
          last_answered_at?: string
          next_review_at: string
          question_category: string
          question_id: number
          question_title: string
          review_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_streak?: number
          created_at?: string
          id?: string
          last_answered_at?: string
          next_review_at?: string
          question_category?: string
          question_id?: number
          question_title?: string
          review_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resume_analyses: {
        Row: {
          ats_score: number | null
          content_score: number | null
          created_at: string | null
          file_name: string
          file_url: string
          format_score: number | null
          id: string
          keyword_score: number | null
          keywords_found: Json | null
          overall_score: number | null
          strengths: Json | null
          suggestions: Json | null
          summary: string | null
          user_id: string
        }
        Insert: {
          ats_score?: number | null
          content_score?: number | null
          created_at?: string | null
          file_name: string
          file_url: string
          format_score?: number | null
          id?: string
          keyword_score?: number | null
          keywords_found?: Json | null
          overall_score?: number | null
          strengths?: Json | null
          suggestions?: Json | null
          summary?: string | null
          user_id: string
        }
        Update: {
          ats_score?: number | null
          content_score?: number | null
          created_at?: string | null
          file_name?: string
          file_url?: string
          format_score?: number | null
          id?: string
          keyword_score?: number | null
          keywords_found?: Json | null
          overall_score?: number | null
          strengths?: Json | null
          suggestions?: Json | null
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resume_downloads: {
        Row: {
          created_at: string
          downloaded_at: string
          id: string
          template_id: number
          template_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          downloaded_at?: string
          id?: string
          template_id: number
          template_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          downloaded_at?: string
          id?: string
          template_id?: number
          template_name?: string
          user_id?: string
        }
        Relationships: []
      }
      resume_favorites: {
        Row: {
          created_at: string
          id: string
          template_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          template_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          template_id?: number
          user_id?: string
        }
        Relationships: []
      }
      roadmap_overrides: {
        Row: {
          is_featured: boolean
          is_published: boolean
          roadmap_id: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          is_featured?: boolean
          is_published?: boolean
          roadmap_id: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          is_featured?: boolean
          is_published?: boolean
          roadmap_id?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      shared_folders: {
        Row: {
          allow_copy: boolean
          created_at: string
          expires_at: string | null
          folder_id: string
          id: string
          is_public: boolean
          share_code: string
        }
        Insert: {
          allow_copy?: boolean
          created_at?: string
          expires_at?: string | null
          folder_id: string
          id?: string
          is_public?: boolean
          share_code: string
        }
        Update: {
          allow_copy?: boolean
          created_at?: string
          expires_at?: string | null
          folder_id?: string
          id?: string
          is_public?: boolean
          share_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_folders_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "user_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plan_goals: {
        Row: {
          category: string
          completed_at: string | null
          id: string
          is_completed: boolean
          questions_practiced: number
          started_at: string
          target_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          completed_at?: string | null
          id?: string
          is_completed?: boolean
          questions_practiced?: number
          started_at?: string
          target_questions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          id?: string
          is_completed?: boolean
          questions_practiced?: number
          started_at?: string
          target_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          email: string
          id: string
          replied_at: string | null
          replied_by: string | null
          reply_body: string | null
          status: string
          subject: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          email: string
          id?: string
          replied_at?: string | null
          replied_by?: string | null
          reply_body?: string | null
          status?: string
          subject: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          email?: string
          id?: string
          replied_at?: string | null
          replied_by?: string | null
          reply_body?: string | null
          status?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_company_progress: {
        Row: {
          company_id: string
          created_at: string
          id: string
          item_id: number
          revision: boolean
          solved: boolean
          tab_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          item_id: number
          revision?: boolean
          solved?: boolean
          tab_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          item_id?: number
          revision?: boolean
          solved?: boolean
          tab_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_folder_items: {
        Row: {
          created_at: string
          folder_id: string
          id: string
          question_id: number | null
          question_slug: string | null
          question_source: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          folder_id: string
          id?: string
          question_id?: number | null
          question_slug?: string | null
          question_source?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          folder_id?: string
          id?: string
          question_id?: number | null
          question_slug?: string | null
          question_source?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_folder_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "user_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_folders: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          created_at: string
          daily_target: number
          daily_xp_target: number | null
          id: string
          updated_at: string
          user_id: string
          weekly_target: number
          weekly_xp_target: number | null
        }
        Insert: {
          created_at?: string
          daily_target?: number
          daily_xp_target?: number | null
          id?: string
          updated_at?: string
          user_id: string
          weekly_target?: number
          weekly_xp_target?: number | null
        }
        Update: {
          created_at?: string
          daily_target?: number
          daily_xp_target?: number | null
          id?: string
          updated_at?: string
          user_id?: string
          weekly_target?: number
          weekly_xp_target?: number | null
        }
        Relationships: []
      }
      user_platform_stats: {
        Row: {
          created_at: string
          handle: string
          id: string
          last_synced_at: string
          platform: string
          rating: number | null
          raw: Json
          solved_easy: number
          solved_hard: number
          solved_medium: number
          solved_total: number
          sync_error: string | null
          sync_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          handle: string
          id?: string
          last_synced_at?: string
          platform: string
          rating?: number | null
          raw?: Json
          solved_easy?: number
          solved_hard?: number
          solved_medium?: number
          solved_total?: number
          sync_error?: string | null
          sync_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          handle?: string
          id?: string
          last_synced_at?: string
          platform?: string
          rating?: number | null
          raw?: Json
          solved_easy?: number
          solved_hard?: number
          solved_medium?: number
          solved_total?: number
          sync_error?: string | null
          sync_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_platform_sync_jobs: {
        Row: {
          created_at: string
          enabled: boolean
          handle: string
          interval_hours: number
          last_error: string | null
          last_run_at: string | null
          last_status: string | null
          next_run_at: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          handle: string
          interval_hours?: number
          last_error?: string | null
          last_run_at?: string | null
          last_status?: string | null
          next_run_at?: string
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          handle?: string
          interval_hours?: number
          last_error?: string | null
          last_run_at?: string | null
          last_status?: string | null
          next_run_at?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_problem_solutions: {
        Row: {
          code: Json
          code_updated_at: Json
          created_at: string
          id: string
          notes: string
          notes_updated_at: string | null
          problem_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          code?: Json
          code_updated_at?: Json
          created_at?: string
          id?: string
          notes?: string
          notes_updated_at?: string | null
          problem_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: Json
          code_updated_at?: Json
          created_at?: string
          id?: string
          notes?: string
          notes_updated_at?: string | null
          problem_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles_extended: {
        Row: {
          aspirations: string[] | null
          bio: string | null
          branch: string | null
          codechef_url: string | null
          codeforces_url: string | null
          coding_leaderboard_hidden: boolean
          college_name: string | null
          company_name: string | null
          course_name: string | null
          created_at: string
          current_experience: string | null
          current_level: number | null
          email_notifications_enabled: boolean | null
          experience: string | null
          geeksforgeeks_url: string | null
          github_url: string | null
          goals: string[] | null
          hackerrank_url: string | null
          id: string
          instagram_url: string | null
          interested_features: string[] | null
          interests: string[] | null
          is_suspended: boolean
          last_xp_reset_at: string | null
          leaderboard_hidden: boolean
          leetcode_url: string | null
          linkedin_url: string | null
          location: string | null
          marketing_emails_enabled: boolean | null
          mobile_number: string | null
          new_feature_alerts_enabled: boolean | null
          notify_achievement_unlock: boolean | null
          notify_discussion_like: boolean
          notify_discussion_reply: boolean
          notify_emails: string[] | null
          notify_goal_milestone: boolean | null
          notify_new_follower: boolean | null
          notify_rare_achievement: boolean | null
          notify_streak_reminder: boolean | null
          notify_velocity_reminder: boolean | null
          occupation: string | null
          onboarding_completed: boolean | null
          other_description: string | null
          other_links: Json | null
          profile_completion_percentage: number | null
          referral_source: string | null
          resume_url: string | null
          role: string | null
          skills: string[] | null
          srs_intervals: number[] | null
          srs_mastery_threshold: number | null
          study_year: Database["public"]["Enums"]["study_year"] | null
          suspended_at: string | null
          suspended_reason: string | null
          target_goal: string | null
          total_xp: number | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
          username: string | null
          website: string | null
          weekly_digest_enabled: boolean | null
          xp_this_week: number | null
        }
        Insert: {
          aspirations?: string[] | null
          bio?: string | null
          branch?: string | null
          codechef_url?: string | null
          codeforces_url?: string | null
          coding_leaderboard_hidden?: boolean
          college_name?: string | null
          company_name?: string | null
          course_name?: string | null
          created_at?: string
          current_experience?: string | null
          current_level?: number | null
          email_notifications_enabled?: boolean | null
          experience?: string | null
          geeksforgeeks_url?: string | null
          github_url?: string | null
          goals?: string[] | null
          hackerrank_url?: string | null
          id?: string
          instagram_url?: string | null
          interested_features?: string[] | null
          interests?: string[] | null
          is_suspended?: boolean
          last_xp_reset_at?: string | null
          leaderboard_hidden?: boolean
          leetcode_url?: string | null
          linkedin_url?: string | null
          location?: string | null
          marketing_emails_enabled?: boolean | null
          mobile_number?: string | null
          new_feature_alerts_enabled?: boolean | null
          notify_achievement_unlock?: boolean | null
          notify_discussion_like?: boolean
          notify_discussion_reply?: boolean
          notify_emails?: string[] | null
          notify_goal_milestone?: boolean | null
          notify_new_follower?: boolean | null
          notify_rare_achievement?: boolean | null
          notify_streak_reminder?: boolean | null
          notify_velocity_reminder?: boolean | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          other_description?: string | null
          other_links?: Json | null
          profile_completion_percentage?: number | null
          referral_source?: string | null
          resume_url?: string | null
          role?: string | null
          skills?: string[] | null
          srs_intervals?: number[] | null
          srs_mastery_threshold?: number | null
          study_year?: Database["public"]["Enums"]["study_year"] | null
          suspended_at?: string | null
          suspended_reason?: string | null
          target_goal?: string | null
          total_xp?: number | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
          username?: string | null
          website?: string | null
          weekly_digest_enabled?: boolean | null
          xp_this_week?: number | null
        }
        Update: {
          aspirations?: string[] | null
          bio?: string | null
          branch?: string | null
          codechef_url?: string | null
          codeforces_url?: string | null
          coding_leaderboard_hidden?: boolean
          college_name?: string | null
          company_name?: string | null
          course_name?: string | null
          created_at?: string
          current_experience?: string | null
          current_level?: number | null
          email_notifications_enabled?: boolean | null
          experience?: string | null
          geeksforgeeks_url?: string | null
          github_url?: string | null
          goals?: string[] | null
          hackerrank_url?: string | null
          id?: string
          instagram_url?: string | null
          interested_features?: string[] | null
          interests?: string[] | null
          is_suspended?: boolean
          last_xp_reset_at?: string | null
          leaderboard_hidden?: boolean
          leetcode_url?: string | null
          linkedin_url?: string | null
          location?: string | null
          marketing_emails_enabled?: boolean | null
          mobile_number?: string | null
          new_feature_alerts_enabled?: boolean | null
          notify_achievement_unlock?: boolean | null
          notify_discussion_like?: boolean
          notify_discussion_reply?: boolean
          notify_emails?: string[] | null
          notify_goal_milestone?: boolean | null
          notify_new_follower?: boolean | null
          notify_rare_achievement?: boolean | null
          notify_streak_reminder?: boolean | null
          notify_velocity_reminder?: boolean | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          other_description?: string | null
          other_links?: Json | null
          profile_completion_percentage?: number | null
          referral_source?: string | null
          resume_url?: string | null
          role?: string | null
          skills?: string[] | null
          srs_intervals?: number[] | null
          srs_mastery_threshold?: number | null
          study_year?: Database["public"]["Enums"]["study_year"] | null
          suspended_at?: string | null
          suspended_reason?: string | null
          target_goal?: string | null
          total_xp?: number | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          username?: string | null
          website?: string | null
          weekly_digest_enabled?: boolean | null
          xp_this_week?: number | null
        }
        Relationships: []
      }
      user_projects: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          external_id: string | null
          id: string
          live_url: string | null
          pinned: boolean
          repo_url: string | null
          sort_order: number
          source: string
          tech_stack: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          live_url?: string | null
          pinned?: boolean
          repo_url?: string | null
          sort_order?: number
          source?: string
          tech_stack?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          live_url?: string | null
          pinned?: boolean
          repo_url?: string | null
          sort_order?: number
          source?: string
          tech_stack?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sheet_prefs: {
        Row: {
          created_at: string
          prefs: Json
          sheet_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          prefs?: Json
          sheet_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          prefs?: Json
          sheet_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_study_focus_sessions: {
        Row: {
          actual_minutes: number | null
          completed_cycles: number
          created_at: string
          ended_at: string | null
          id: string
          notes: string | null
          started_at: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          actual_minutes?: number | null
          completed_cycles?: number
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          actual_minutes?: number | null
          completed_cycles?: number
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_study_profile: {
        Row: {
          created_at: string
          goal: string
          level: string
          notes: string | null
          target_date: string | null
          topics_known: string[]
          updated_at: string
          user_id: string
          weekday_minutes: number
          weekend_minutes: number
        }
        Insert: {
          created_at?: string
          goal: string
          level?: string
          notes?: string | null
          target_date?: string | null
          topics_known?: string[]
          updated_at?: string
          user_id: string
          weekday_minutes?: number
          weekend_minutes?: number
        }
        Update: {
          created_at?: string
          goal?: string
          level?: string
          notes?: string | null
          target_date?: string | null
          topics_known?: string[]
          updated_at?: string
          user_id?: string
          weekday_minutes?: number
          weekend_minutes?: number
        }
        Relationships: []
      }
      user_topic_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          is_revision: boolean
          last_revised_at: string | null
          note: string | null
          review_count: number
          revision_count: number
          revision_history: Json
          sheet_id: string
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          is_revision?: boolean
          last_revised_at?: string | null
          note?: string | null
          review_count?: number
          revision_count?: number
          revision_history?: Json
          sheet_id: string
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          is_revision?: boolean
          last_revised_at?: string | null
          note?: string | null
          review_count?: number
          revision_count?: number
          revision_history?: Json
          sheet_id?: string
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_view: {
        Row: {
          avatar_url: string | null
          completed_count: number | null
          full_name: string | null
          revision_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
      public_user_profiles: {
        Row: {
          aspirations: string[] | null
          bio: string | null
          codechef_url: string | null
          codeforces_url: string | null
          created_at: string | null
          current_level: number | null
          github_url: string | null
          goals: string[] | null
          hackerrank_url: string | null
          instagram_url: string | null
          interests: string[] | null
          leetcode_url: string | null
          linkedin_url: string | null
          location: string | null
          occupation: string | null
          profile_completion_percentage: number | null
          skills: string[] | null
          total_xp: number | null
          twitter_url: string | null
          user_id: string | null
          username: string | null
          website: string | null
          xp_this_week: number | null
        }
        Insert: {
          aspirations?: string[] | null
          bio?: string | null
          codechef_url?: string | null
          codeforces_url?: string | null
          created_at?: string | null
          current_level?: number | null
          github_url?: string | null
          goals?: string[] | null
          hackerrank_url?: string | null
          instagram_url?: string | null
          interests?: string[] | null
          leetcode_url?: string | null
          linkedin_url?: string | null
          location?: string | null
          occupation?: string | null
          profile_completion_percentage?: number | null
          skills?: string[] | null
          total_xp?: number | null
          twitter_url?: string | null
          user_id?: string | null
          username?: string | null
          website?: string | null
          xp_this_week?: number | null
        }
        Update: {
          aspirations?: string[] | null
          bio?: string | null
          codechef_url?: string | null
          codeforces_url?: string | null
          created_at?: string | null
          current_level?: number | null
          github_url?: string | null
          goals?: string[] | null
          hackerrank_url?: string | null
          instagram_url?: string | null
          interests?: string[] | null
          leetcode_url?: string | null
          linkedin_url?: string | null
          location?: string | null
          occupation?: string | null
          profile_completion_percentage?: number | null
          skills?: string[] | null
          total_xp?: number | null
          twitter_url?: string | null
          user_id?: string | null
          username?: string | null
          website?: string | null
          xp_this_week?: number | null
        }
        Relationships: []
      }
      quiz_leaderboard_public: {
        Row: {
          accuracy: number | null
          avg_time_seconds: number | null
          category: string | null
          completed_at: string | null
          difficulty: string | null
          quiz_type: string | null
          score: number | null
          total_questions: number | null
          total_time_seconds: number | null
        }
        Insert: {
          accuracy?: number | null
          avg_time_seconds?: number | null
          category?: string | null
          completed_at?: string | null
          difficulty?: string | null
          quiz_type?: string | null
          score?: number | null
          total_questions?: number | null
          total_time_seconds?: number | null
        }
        Update: {
          accuracy?: number | null
          avg_time_seconds?: number | null
          category?: string | null
          completed_at?: string | null
          difficulty?: string | null
          quiz_type?: string | null
          score?: number | null
          total_questions?: number | null
          total_time_seconds?: number | null
        }
        Relationships: []
      }
      roadmap_leaderboard_view: {
        Row: {
          completed_topics: number | null
          last_completed_at: string | null
          roadmaps_started: number | null
          user_id: string | null
        }
        Relationships: []
      }
      xp_leaderboard_view: {
        Row: {
          avatar_url: string | null
          current_level: number | null
          full_name: string | null
          total_xp: number | null
          user_id: string | null
          username: string | null
          xp_this_week: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_achievement_stats: {
        Args: never
        Returns: {
          achievement_id: string
          earned_count: number
          last_earned: string
        }[]
      }
      admin_adjust_xp: {
        Args: { _amount: number; _reason: string; _user_id: string }
        Returns: undefined
      }
      admin_broadcast_notification: {
        Args: {
          _audience: Json
          _data?: Json
          _message: string
          _title: string
        }
        Returns: number
      }
      admin_dashboard_kpis: { Args: never; Returns: Json }
      admin_delete_ai_content: { Args: { _id: string }; Returns: undefined }
      admin_gamification_history: {
        Args: { _key?: string; _limit?: number }
        Returns: {
          actor_name: string
          changed_at: string
          changed_by: string
          id: string
          new_value: Json
          note: string
          old_value: Json
          rule_key: string
        }[]
      }
      admin_get_ai_insight_overview: {
        Args: { _days?: number }
        Returns: {
          down_count: number
          flag_reason: string
          flagged_at: string
          insight_key: string
          insight_title: string
          is_flagged: boolean
          last_at: string
          net_score: number
          org_count: number
          total_count: number
          up_count: number
        }[]
      }
      admin_get_full_problem: { Args: { _slug: string }; Returns: Json }
      admin_get_gamification_rules: { Args: never; Returns: Json }
      admin_grant_achievement: {
        Args: { _achievement_id: string; _user_id: string }
        Returns: undefined
      }
      admin_grant_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      admin_leaderboard_top: {
        Args: { _limit?: number; _window?: string }
        Returns: {
          avatar_url: string
          current_level: number
          full_name: string
          leaderboard_hidden: boolean
          total_xp: number
          user_id: string
          username: string
          xp_this_week: number
        }[]
      }
      admin_list_ai_insight_feedback: {
        Args: {
          _insight_key?: string
          _limit?: number
          _offset?: number
          _org_id?: string
          _rating?: Database["public"]["Enums"]["ai_insight_rating"]
        }
        Returns: {
          comment: string
          created_at: string
          id: string
          insight_key: string
          insight_title: string
          org_id: string
          org_name: string
          rating: Database["public"]["Enums"]["ai_insight_rating"]
          total_count: number
          updated_at: string
          user_avatar_url: string
          user_email: string
          user_full_name: string
          user_id: string
        }[]
      }
      admin_list_public_tables: {
        Args: never
        Returns: {
          policy_count: number
          rls_enabled: boolean
          table_name: string
        }[]
      }
      admin_list_table_policies: {
        Args: { _table: string }
        Returns: {
          check_expr: string
          command: string
          permissive: string
          policy_name: string
          roles: string[]
          using_expr: string
        }[]
      }
      admin_list_users: {
        Args: { _limit?: number; _offset?: number; _search?: string }
        Returns: {
          avatar_url: string
          current_level: number
          email: string
          full_name: string
          is_suspended: boolean
          joined_at: string
          last_active_at: string
          roles: string[]
          total_xp: number
          user_id: string
          username: string
        }[]
      }
      admin_recent_auth_events: {
        Args: { _limit?: number }
        Returns: {
          action: string
          created_at: string
          id: string
          ip_address: string
          payload: Json
        }[]
      }
      admin_recompute_achievements: {
        Args: { _user_id: string }
        Returns: number
      }
      admin_resolve_report: {
        Args: { _id: string; _new_status: string }
        Returns: undefined
      }
      admin_revoke_achievement: {
        Args: { _achievement_id: string; _user_id: string }
        Returns: undefined
      }
      admin_revoke_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      admin_role_audit: {
        Args: { _action?: string; _limit?: number; _user_id?: string }
        Returns: {
          action: string
          actor_email: string
          actor_id: string
          actor_name: string
          created_at: string
          diff: Json
          id: string
          role: string
          target_email: string
          target_name: string
          target_user_id: string
        }[]
      }
      admin_save_problem: { Args: { payload: Json }; Returns: Json }
      admin_schedule_daily_challenge: {
        Args: { _date: string; _slug: string }
        Returns: undefined
      }
      admin_search_users: {
        Args: { _limit?: number; _q: string }
        Returns: {
          avatar_url: string
          full_name: string
          user_id: string
          username: string
        }[]
      }
      admin_set_ai_content_visibility: {
        Args: { _id: string; _is_public: boolean }
        Returns: undefined
      }
      admin_set_gamification_rule: {
        Args: { _key: string; _note?: string; _value: Json }
        Returns: undefined
      }
      admin_set_insight_flag: {
        Args: {
          _flagged?: boolean
          _insight_key: string
          _insight_title: string
          _reason?: string
        }
        Returns: boolean
      }
      admin_set_leaderboard_hidden: {
        Args: { _hidden: boolean; _user_id: string }
        Returns: undefined
      }
      admin_set_setting: {
        Args: { _key: string; _value: Json }
        Returns: undefined
      }
      admin_suspend_user: {
        Args: { _reason: string; _user_id: string }
        Returns: undefined
      }
      admin_trend_signups: {
        Args: { _days?: number }
        Returns: {
          day: string
          signups: number
        }[]
      }
      admin_trend_submissions: {
        Args: { _days?: number }
        Returns: {
          accepted: number
          day: string
          total: number
        }[]
      }
      admin_unsuspend_user: { Args: { _user_id: string }; Returns: undefined }
      admin_user_detail: { Args: { _user_id: string }; Returns: Json }
      assign_contest_variant: {
        Args: { _contest_id: string; _problem_slug: string }
        Returns: {
          assigned_at: string
          contest_id: string
          id: string
          problem_slug: string
          user_id: string
          variant_id: string
          variant_key: string
        }
        SetofOptions: {
          from: "*"
          to: "contest_user_variants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      audit_daily_completions: { Args: never; Returns: Json }
      audit_daily_completions_all: { Args: never; Returns: Json }
      award_earned_achievements: { Args: never; Returns: string[] }
      award_xp: {
        Args: {
          _amount: number
          _description?: string
          _source: string
          _user_id: string
        }
        Returns: Json
      }
      blog_increment_view: {
        Args: { _post_id: string; _session_id: string }
        Returns: undefined
      }
      blog_publish_scheduled: { Args: never; Returns: number }
      calculate_profile_completion: {
        Args: {
          profile_row: Database["public"]["Tables"]["user_profiles_extended"]["Row"]
        }
        Returns: number
      }
      contest_accept_honor_code: {
        Args: { _contest_id: string }
        Returns: undefined
      }
      contest_aux_unlocked: { Args: { _contest_id: string }; Returns: boolean }
      contest_claim_tab_lock: {
        Args: { _contest_id: string; _tab_id: string }
        Returns: Json
      }
      contest_log_violation: {
        Args: {
          _contest_id: string
          _meta?: Json
          _session_id: string
          _severity?: string
          _type: string
        }
        Returns: Json
      }
      contest_report_stream_health: {
        Args: { _healthy: boolean; _kind: string; _session_id: string }
        Returns: Json
      }
      contest_session_heartbeat:
        | { Args: { _session_id: string }; Returns: Json }
        | { Args: { _fingerprint: Json; _session_id: string }; Returns: Json }
      contest_start_secure_session: {
        Args: { _contest_id: string; _user_agent?: string }
        Returns: string
      }
      get_coding_leaderboard: {
        Args: {
          _limit?: number
          _offset?: number
          _search?: string
          _window?: string
        }
        Returns: {
          acceptance_rate: number
          avatar_url: string
          display_name: string
          fastest_avg_runtime: number
          last_accepted_at: string
          problems_solved: number
          rank: number
          total_accepted: number
          user_id: string
          username: string
          weighted_score: number
        }[]
      }
      get_coding_leaderboard_stats: {
        Args: never
        Returns: {
          total_accepted_today: number
          total_accepted_week: number
          total_participants: number
          total_problems_solved: number
        }[]
      }
      get_contest_registered_count: {
        Args: { _contest_id: string }
        Returns: number
      }
      get_daily_challenge_leaderboard: {
        Args: { _limit?: number }
        Returns: {
          avatar_url: string
          current_streak: number
          display_name: string
          last_completed_at: string
          total_completions: number
          user_id: string
          username: string
          weekly_completions: number
        }[]
      }
      get_fundamentals_leaderboard: {
        Args: { p_limit?: number; p_since?: string; p_type?: string }
        Returns: {
          avatar_url: string
          avg_accuracy: number
          best_accuracy: number
          full_name: string
          total_questions: number
          total_quizzes: number
          total_score: number
          user_id: string
        }[]
      }
      get_quiz_leaderboard: {
        Args: {
          p_difficulty?: string
          p_limit?: number
          p_order_by_total?: boolean
          p_quiz_type: string
          p_since?: string
        }
        Returns: {
          accuracy: number
          avatar_url: string
          avg_time_seconds: number
          completed_at: string
          full_name: string
          id: string
          quiz_type: string
          score: number
          total_questions: number
          total_time_seconds: number
          user_id: string
        }[]
      }
      get_submission_percentiles: {
        Args: { _submission_id: string }
        Returns: {
          memory_beats: number
          memory_kb: number
          runtime_beats: number
          runtime_ms: number
          total_users: number
        }[]
      }
      grant_admin_to_self: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blog_editor: { Args: { _uid: string }; Returns: boolean }
      mirror_attach_all: { Args: never; Returns: number }
      mirror_mark_failure: {
        Args: { _err: string; _id: number }
        Returns: undefined
      }
      recompute_contest_leaderboard: {
        Args: { _contest_id: string }
        Returns: undefined
      }
      register_for_contest: {
        Args: { _contest_id: string; _invite_code?: string }
        Returns: string
      }
      validate_contest_submission: {
        Args: { _contest_id: string; _problem_slug: string }
        Returns: Json
      }
    }
    Enums: {
      ai_insight_rating: "up" | "down"
      app_role: "admin" | "owner" | "moderator" | "user"
      blog_comment_status: "visible" | "hidden" | "reported" | "deleted"
      blog_post_status: "draft" | "scheduled" | "published" | "archived"
      contest_kind:
        | "monthly_long"
        | "weekly_saturday"
        | "weekly_sunday"
        | "biweekly"
        | "other"
      experience_report_reason:
        | "spam"
        | "misinformation"
        | "plagiarism"
        | "offensive"
        | "personal_info"
        | "other"
      experience_report_status: "open" | "resolved" | "dismissed"
      experience_status: "pending" | "approved" | "rejected"
      experience_type: "on_campus" | "off_campus" | "internship" | "referral"
      offer_status: "selected" | "rejected" | "waitlisted" | "in_progress"
      org_member_role: "owner" | "admin" | "recruiter" | "viewer"
      org_type: "college" | "company"
      study_year:
        | "1st Year"
        | "2nd Year"
        | "3rd Year"
        | "4th Year"
        | "5th Year"
        | "Other"
      user_type: "student" | "professional" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_insight_rating: ["up", "down"],
      app_role: ["admin", "owner", "moderator", "user"],
      blog_comment_status: ["visible", "hidden", "reported", "deleted"],
      blog_post_status: ["draft", "scheduled", "published", "archived"],
      contest_kind: [
        "monthly_long",
        "weekly_saturday",
        "weekly_sunday",
        "biweekly",
        "other",
      ],
      experience_report_reason: [
        "spam",
        "misinformation",
        "plagiarism",
        "offensive",
        "personal_info",
        "other",
      ],
      experience_report_status: ["open", "resolved", "dismissed"],
      experience_status: ["pending", "approved", "rejected"],
      experience_type: ["on_campus", "off_campus", "internship", "referral"],
      offer_status: ["selected", "rejected", "waitlisted", "in_progress"],
      org_member_role: ["owner", "admin", "recruiter", "viewer"],
      org_type: ["college", "company"],
      study_year: [
        "1st Year",
        "2nd Year",
        "3rd Year",
        "4th Year",
        "5th Year",
        "Other",
      ],
      user_type: ["student", "professional", "other"],
    },
  },
} as const
