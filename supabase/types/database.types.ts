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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          profile_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          profile_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          profile_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_activity_logs_profile"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_announcements: {
        Row: {
          content: string
          course_id: string
          created_at: string
          created_by: string
          id: string
          is_published: boolean
          published_at: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          created_by: string
          id?: string
          is_published?: boolean
          published_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_published?: boolean
          published_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_course_announcements_course"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_course_announcements_creator"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_mentors: {
        Row: {
          course_id: string
          created_at: string
          mentor_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          mentor_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          mentor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_course_mentors_course"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_course_mentors_mentor"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentor_details"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_free: boolean
          organization_id: string
          price: number
          program_id: string
          slug: string
          status: Database["public"]["Enums"]["course_status"]
          thumbnail_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_free?: boolean
          organization_id: string
          price?: number
          program_id: string
          slug: string
          status?: Database["public"]["Enums"]["course_status"]
          thumbnail_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_free?: boolean
          organization_id?: string
          price?: number
          program_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["course_status"]
          thumbnail_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_courses_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_courses_program"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      device_sessions: {
        Row: {
          created_at: string
          device_identifier: string
          device_name: string
          device_type: Database["public"]["Enums"]["device_type"]
          id: string
          ip_address: unknown
          is_active: boolean
          last_activity_at: string
          last_login_at: string
          profile_id: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          device_identifier: string
          device_name: string
          device_type: Database["public"]["Enums"]["device_type"]
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity_at?: string
          last_login_at?: string
          profile_id: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          device_identifier?: string
          device_name?: string
          device_type?: Database["public"]["Enums"]["device_type"]
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity_at?: string
          last_login_at?: string
          profile_id?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_device_sessions_profile"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          activated_at: string | null
          category: Database["public"]["Enums"]["enrollment_category"]
          course_id: string
          created_at: string
          discount_amount: number
          enrolled_at: string
          expired_at: string | null
          id: string
          price_snapshot: number
          profile_id: string
          promotion_code_snapshot: string | null
          promotion_id: string | null
          promotion_name_snapshot: string | null
          status: Database["public"]["Enums"]["enrollment_status"]
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          category?: Database["public"]["Enums"]["enrollment_category"]
          course_id: string
          created_at?: string
          discount_amount?: number
          enrolled_at?: string
          expired_at?: string | null
          id?: string
          price_snapshot: number
          profile_id: string
          promotion_code_snapshot?: string | null
          promotion_id?: string | null
          promotion_name_snapshot?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          category?: Database["public"]["Enums"]["enrollment_category"]
          course_id?: string
          created_at?: string
          discount_amount?: number
          enrolled_at?: string
          expired_at?: string | null
          id?: string
          price_snapshot?: number
          profile_id?: string
          promotion_code_snapshot?: string | null
          promotion_id?: string | null
          promotion_name_snapshot?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_enrollment_course"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_enrollment_profile"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_enrollments_promotion"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_files: {
        Row: {
          created_at: string
          file_path: string
          file_type: Database["public"]["Enums"]["file_type"]
          id: string
          lesson_id: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          file_path: string
          file_type: Database["public"]["Enums"]["file_type"]
          id?: string
          lesson_id: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          file_path?: string
          file_type?: Database["public"]["Enums"]["file_type"]
          id?: string
          lesson_id?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_lesson_files_lesson"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_folders: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          folder_order: number
          id: string
          parent_folder_id: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          folder_order?: number
          id?: string
          parent_folder_id?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          folder_order?: number
          id?: string
          parent_folder_id?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lesson_folders_course"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lesson_folders_parent"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "lesson_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          last_accessed_at: string
          last_position_seconds: number
          lesson_id: string
          profile_id: string
          progress_percent: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          last_accessed_at?: string
          last_position_seconds?: number
          lesson_id: string
          profile_id: string
          progress_percent?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          last_accessed_at?: string
          last_position_seconds?: number
          lesson_id?: string
          profile_id?: string
          progress_percent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lesson_progress_lesson"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lesson_progress_profile"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          duration: number
          folder_id: string | null
          id: string
          is_free: boolean
          lesson_order: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          duration: number
          folder_id?: string | null
          id?: string
          is_free?: boolean
          lesson_order: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          duration?: number
          folder_id?: string | null
          id?: string
          is_free?: boolean
          lesson_order?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lessons_course"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lessons_folder"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "lesson_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      live_classes: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          meeting_date: string
          meeting_link: string | null
          recording_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          meeting_date: string
          meeting_link?: string | null
          recording_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          meeting_date?: string
          meeting_link?: string | null
          recording_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_live_classes_lesson"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_details: {
        Row: {
          bio: string | null
          created_at: string
          education: string | null
          id: string
          photo_path: string | null
          profile_id: string
          specialization: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          education?: string | null
          id?: string
          photo_path?: string | null
          profile_id: string
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          education?: string | null
          id?: string
          photo_path?: string | null
          profile_id?: string
          specialization?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_mentor_profile"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_path: string | null
          short_name: string
          slug: string
          status: Database["public"]["Enums"]["organization_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_path?: string | null
          short_name: string
          slug: string
          status?: Database["public"]["Enums"]["organization_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_path?: string | null
          short_name?: string
          slug?: string
          status?: Database["public"]["Enums"]["organization_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          enrollment_id: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_proof_path: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          enrollment_id: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_proof_path?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          enrollment_id?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_proof_path?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_payments_enrollment"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_payments_verifier"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          full_name: string
          id: string
          phone: string
          role: Database["public"]["Enums"]["profile_role"]
          status: Database["public"]["Enums"]["profile_status"]
          university_origin: string | null
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          full_name: string
          id: string
          phone: string
          role?: Database["public"]["Enums"]["profile_role"]
          status?: Database["public"]["Enums"]["profile_status"]
          university_origin?: string | null
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          role?: Database["public"]["Enums"]["profile_role"]
          status?: Database["public"]["Enums"]["profile_status"]
          university_origin?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          slug: string
          status: Database["public"]["Enums"]["program_status"]
          thumbnail_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          slug: string
          status?: Database["public"]["Enums"]["program_status"]
          thumbnail_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          slug?: string
          status?: Database["public"]["Enums"]["program_status"]
          thumbnail_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          code: string | null
          course_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_at: string | null
          id: string
          max_discount: number | null
          minimum_purchase: number | null
          name: string
          notes: string | null
          priority: number
          quota: number | null
          requires_code: boolean
          special_price: number | null
          start_at: string
          status: Database["public"]["Enums"]["promotion_status"]
          type: Database["public"]["Enums"]["promotion_type"]
          updated_at: string
          updated_by: string | null
          usage_per_user: number
          used_count: number
          value: number
        }
        Insert: {
          code?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          max_discount?: number | null
          minimum_purchase?: number | null
          name: string
          notes?: string | null
          priority?: number
          quota?: number | null
          requires_code?: boolean
          special_price?: number | null
          start_at: string
          status?: Database["public"]["Enums"]["promotion_status"]
          type: Database["public"]["Enums"]["promotion_type"]
          updated_at?: string
          updated_by?: string | null
          usage_per_user?: number
          used_count?: number
          value: number
        }
        Update: {
          code?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          max_discount?: number | null
          minimum_purchase?: number | null
          name?: string
          notes?: string | null
          priority?: number
          quota?: number | null
          requires_code?: boolean
          special_price?: number | null
          start_at?: string
          status?: Database["public"]["Enums"]["promotion_status"]
          type?: Database["public"]["Enums"]["promotion_type"]
          updated_at?: string
          updated_by?: string | null
          usage_per_user?: number
          used_count?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_promotions_course"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_promotions_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_answers: {
        Row: {
          answered_at: string
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          question_id: string
          selected_option_id: string | null
          updated_at: string
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id: string
          selected_option_id?: string | null
          updated_at?: string
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
          selected_option_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_answers_attempt"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_quiz_answers_option"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "quiz_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_quiz_answers_question"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          duration_seconds: number | null
          id: string
          profile_id: string
          quiz_id: string
          score: number | null
          started_at: string
          submitted_at: string | null
          total_correct: number
          total_questions: number
          total_unanswered: number
          total_wrong: number
          updated_at: string
        }
        Insert: {
          attempt_number: number
          created_at?: string
          duration_seconds?: number | null
          id?: string
          profile_id: string
          quiz_id: string
          score?: number | null
          started_at: string
          submitted_at?: string | null
          total_correct?: number
          total_questions: number
          total_unanswered?: number
          total_wrong?: number
          updated_at?: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          duration_seconds?: number | null
          id?: string
          profile_id?: string
          quiz_id?: string
          score?: number | null
          started_at?: string
          submitted_at?: string | null
          total_correct?: number
          total_questions?: number
          total_unanswered?: number
          total_wrong?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_attempts_profile"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_quiz_attempts_quiz"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_options: {
        Row: {
          created_at: string
          id: string
          image_path: string | null
          is_correct: boolean
          option_order: number
          option_text: string
          question_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_path?: string | null
          is_correct?: boolean
          option_order: number
          option_text: string
          question_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string | null
          is_correct?: boolean
          option_order?: number
          option_text?: string
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_options_question"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          explanation: string | null
          id: string
          image_path: string | null
          points: number
          question: string
          question_order: number
          question_type: string
          quiz_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id?: string
          image_path?: string | null
          points?: number
          question: string
          question_order: number
          question_type?: string
          quiz_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          image_path?: string | null
          points?: number
          question?: string
          question_order?: number
          question_type?: string
          quiz_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_questions_quiz"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          duration: number
          id: string
          lesson_id: string
          max_attempt: number
          passing_score: number
          title: string
          total_questions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration: number
          id?: string
          lesson_id: string
          max_attempt?: number
          passing_score?: number
          title: string
          total_questions: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration?: number
          id?: string
          lesson_id?: string
          max_attempt?: number
          passing_score?: number
          title?: string
          total_questions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quizzes_lesson"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          duration: number
          id: string
          lesson_id: string
          provider: Database["public"]["Enums"]["video_provider"]
          provider_video_id: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          duration: number
          id?: string
          lesson_id: string
          provider: Database["public"]["Enums"]["video_provider"]
          provider_video_id: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          duration?: number
          id?: string
          lesson_id?: string
          provider?: Database["public"]["Enums"]["video_provider"]
          provider_video_id?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_videos_lesson"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_course_access: {
        Args: { target_course_id: string }
        Returns: boolean
      }
      is_active_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      course_status: "draft" | "active" | "archived"
      device_type: "desktop" | "laptop" | "tablet" | "mobile"
      enrollment_category: "regular" | "separated"
      enrollment_status:
        | "pending_payment"
        | "pending_approval"
        | "active"
        | "expired"
        | "cancelled"
      file_type:
        | "pdf"
        | "ppt"
        | "pptx"
        | "doc"
        | "docx"
        | "xls"
        | "xlsx"
        | "zip"
        | "mp3"
      organization_status: "active" | "inactive"
      payment_method: "bank_transfer" | "qris" | "free"
      payment_status: "pending" | "approved" | "rejected"
      profile_role: "admin" | "mentor" | "student"
      profile_status: "active" | "inactive" | "suspended"
      program_status: "coming_soon" | "active" | "inactive"
      promotion_status: "active" | "inactive"
      promotion_type: "fixed_amount" | "percentage" | "special_price" | "free"
      video_provider: "youtube" | "bunny" | "upload"
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
      course_status: ["draft", "active", "archived"],
      device_type: ["desktop", "laptop", "tablet", "mobile"],
      enrollment_category: ["regular", "separated"],
      enrollment_status: [
        "pending_payment",
        "pending_approval",
        "active",
        "expired",
        "cancelled",
      ],
      file_type: [
        "pdf",
        "ppt",
        "pptx",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "zip",
        "mp3",
      ],
      organization_status: ["active", "inactive"],
      payment_method: ["bank_transfer", "qris", "free"],
      payment_status: ["pending", "approved", "rejected"],
      profile_role: ["admin", "mentor", "student"],
      profile_status: ["active", "inactive", "suspended"],
      program_status: ["coming_soon", "active", "inactive"],
      promotion_status: ["active", "inactive"],
      promotion_type: ["fixed_amount", "percentage", "special_price", "free"],
      video_provider: ["youtube", "bunny", "upload"],
    },
  },
} as const
