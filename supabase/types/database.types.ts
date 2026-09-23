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
      announcement_courses: {
        Row: {
          announcement_id: string
          course_id: string
          created_at: string
        }
        Insert: {
          announcement_id: string
          course_id: string
          created_at?: string
        }
        Update: {
          announcement_id?: string
          course_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_courses_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_organizations: {
        Row: {
          announcement_id: string
          created_at: string
          organization_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          organization_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_organizations_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          all_students: boolean
          content: string
          created_at: string
          created_by: string
          display_order: number
          ends_at: string | null
          id: string
          is_published: boolean
          show_on_dashboard: boolean
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          all_students?: boolean
          content: string
          created_at?: string
          created_by: string
          display_order?: number
          ends_at?: string | null
          id?: string
          is_published?: boolean
          show_on_dashboard?: boolean
          starts_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          all_students?: boolean
          content?: string
          created_at?: string
          created_by?: string
          display_order?: number
          ends_at?: string | null
          id?: string
          is_published?: boolean
          show_on_dashboard?: boolean
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
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
      course_community_links: {
        Row: {
          course_id: string
          created_at: string
          updated_at: string
          whatsapp_group_url: string
        }
        Insert: {
          course_id: string
          created_at?: string
          updated_at?: string
          whatsapp_group_url: string
        }
        Update: {
          course_id?: string
          created_at?: string
          updated_at?: string
          whatsapp_group_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_community_links_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_mentors: {
        Row: {
          course_id: string
          created_at: string
          is_active: boolean
          mentor_id: string
          removed_at: string | null
          show_in_rating: boolean
        }
        Insert: {
          course_id: string
          created_at?: string
          is_active?: boolean
          mentor_id: string
          removed_at?: string | null
          show_in_rating?: boolean
        }
        Update: {
          course_id?: string
          created_at?: string
          is_active?: boolean
          mentor_id?: string
          removed_at?: string | null
          show_in_rating?: boolean
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
      course_pins: {
        Row: {
          course_id: string
          pinned_at: string
          profile_id: string
        }
        Insert: {
          course_id: string
          pinned_at?: string
          profile_id: string
        }
        Update: {
          course_id?: string
          pinned_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_pins_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_pins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_free: boolean
          mentor_rating_enabled: boolean
          organization_id: string
          payment_account_id: string
          payment_policy: Database["public"]["Enums"]["payment_policy"]
          price: number
          program_id: string
          slug: string
          status: Database["public"]["Enums"]["course_status"]
          thumbnail_path: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_free?: boolean
          mentor_rating_enabled?: boolean
          organization_id: string
          payment_account_id: string
          payment_policy?: Database["public"]["Enums"]["payment_policy"]
          price?: number
          program_id: string
          slug: string
          status?: Database["public"]["Enums"]["course_status"]
          thumbnail_path?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_free?: boolean
          mentor_rating_enabled?: boolean
          organization_id?: string
          payment_account_id?: string
          payment_policy?: Database["public"]["Enums"]["payment_policy"]
          price?: number
          program_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["course_status"]
          thumbnail_path?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_courses_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_courses_payment_account"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_courses_program"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_courses_program_organization"
            columns: ["program_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      device_session_audit: {
        Row: {
          actor_profile_id: string | null
          device_identifier: string
          device_name: string
          device_session_id: string | null
          device_type: Database["public"]["Enums"]["device_type"]
          event_type: string
          id: string
          ip_address: unknown
          last_activity_at: string | null
          last_login_at: string | null
          occurred_at: string
          profile_id: string
          user_agent: string | null
        }
        Insert: {
          actor_profile_id?: string | null
          device_identifier: string
          device_name: string
          device_session_id?: string | null
          device_type: Database["public"]["Enums"]["device_type"]
          event_type: string
          id?: string
          ip_address?: unknown
          last_activity_at?: string | null
          last_login_at?: string | null
          occurred_at?: string
          profile_id: string
          user_agent?: string | null
        }
        Update: {
          actor_profile_id?: string | null
          device_identifier?: string
          device_name?: string
          device_session_id?: string | null
          device_type?: Database["public"]["Enums"]["device_type"]
          event_type?: string
          id?: string
          ip_address?: unknown
          last_activity_at?: string | null
          last_login_at?: string | null
          occurred_at?: string
          profile_id?: string
          user_agent?: string | null
        }
        Relationships: []
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
          payment_timing: Database["public"]["Enums"]["payment_timing"]
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
          payment_timing?: Database["public"]["Enums"]["payment_timing"]
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
          payment_timing?: Database["public"]["Enums"]["payment_timing"]
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
      leader_permissions: {
        Row: {
          created_at: string
          created_by: string | null
          enabled: boolean
          leader_id: string
          permission: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          leader_id: string
          permission: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          leader_id?: string
          permission?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leader_permissions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leader_permissions_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leader_scopes: {
        Row: {
          course_id: string | null
          created_at: string
          created_by: string | null
          id: string
          leader_id: string
          organization_id: string | null
          program_id: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          leader_id: string
          organization_id?: string | null
          program_id?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          leader_id?: string
          organization_id?: string | null
          program_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leader_scopes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leader_scopes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leader_scopes_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leader_scopes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leader_scopes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_files: {
        Row: {
          created_at: string
          file_order: number
          file_path: string
          file_type: Database["public"]["Enums"]["file_type"]
          id: string
          is_required: boolean
          lesson_id: string
          publication_status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          file_order?: number
          file_path: string
          file_type: Database["public"]["Enums"]["file_type"]
          id?: string
          is_required?: boolean
          lesson_id: string
          publication_status?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          file_order?: number
          file_path?: string
          file_type?: Database["public"]["Enums"]["file_type"]
          id?: string
          is_required?: boolean
          lesson_id?: string
          publication_status?: string
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
          publication_status: string
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
          publication_status?: string
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
          publication_status?: string
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
      lesson_message_entries: {
        Row: {
          created_at: string
          id: string
          message: string
          read_at: string | null
          sender_profile_id: string
          sender_role: Database["public"]["Enums"]["profile_role"]
          thread_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          sender_profile_id: string
          sender_role: Database["public"]["Enums"]["profile_role"]
          thread_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          sender_profile_id?: string
          sender_role?: Database["public"]["Enums"]["profile_role"]
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_message_entries_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_message_entries_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "lesson_message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_message_thread_reads: {
        Row: {
          created_at: string
          last_read_at: string
          profile_id: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          last_read_at?: string
          profile_id: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          last_read_at?: string
          profile_id?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_message_thread_reads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_message_thread_reads_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "lesson_message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_message_threads: {
        Row: {
          course_id: string
          created_at: string
          id: string
          last_message_at: string
          lesson_id: string | null
          status: string
          student_profile_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          lesson_id?: string | null
          status?: string
          student_profile_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          lesson_id?: string | null
          status?: string
          student_profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_message_threads_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_message_threads_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_message_threads_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          is_required: boolean
          lesson_order: number
          publication_status: string
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
          is_required?: boolean
          lesson_order: number
          publication_status?: string
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
          is_required?: boolean
          lesson_order?: number
          publication_status?: string
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
      mentor_reviews: {
        Row: {
          course_id: string
          created_at: string
          id: string
          mentor_id: string
          rating: number
          reviewer_profile_id: string
          reviewer_type: string
          suggestion: string | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          mentor_id: string
          rating: number
          reviewer_profile_id: string
          reviewer_type: string
          suggestion?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          mentor_id?: string
          rating?: number
          reviewer_profile_id?: string
          reviewer_type?: string
          suggestion?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_reviews_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentor_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_reviews_reviewer_profile_id_fkey"
            columns: ["reviewer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_general: boolean
          logo_path: string | null
          short_name: string
          slug: string
          status: Database["public"]["Enums"]["organization_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_general?: boolean
          logo_path?: string | null
          short_name: string
          slug: string
          status?: Database["public"]["Enums"]["organization_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_general?: boolean
          logo_path?: string | null
          short_name?: string
          slug?: string
          status?: Database["public"]["Enums"]["organization_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_accounts: {
        Row: {
          account_holder_name: string
          account_number: string
          bank_name: string
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          label: string
          updated_at: string
        }
        Insert: {
          account_holder_name: string
          account_number: string
          bank_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          label: string
          updated_at?: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          bank_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          account_holder_name_snapshot: string
          account_number_snapshot: string
          amount: number
          bank_name_snapshot: string
          created_at: string
          enrollment_id: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_account_id: string
          payment_account_label_snapshot: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_proof_path: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          account_holder_name_snapshot: string
          account_number_snapshot: string
          amount: number
          bank_name_snapshot: string
          created_at?: string
          enrollment_id: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_account_id: string
          payment_account_label_snapshot: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_proof_path?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          account_holder_name_snapshot?: string
          account_number_snapshot?: string
          amount?: number
          bank_name_snapshot?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_account_id?: string
          payment_account_label_snapshot?: string
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
            foreignKeyName: "fk_payments_payment_account"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
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
          created_by: string | null
          description: string | null
          id: string
          organization_id: string
          slug: string
          status: Database["public"]["Enums"]["program_status"]
          thumbnail_path: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id: string
          slug: string
          status?: Database["public"]["Enums"]["program_status"]
          thumbnail_path?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["program_status"]
          thumbnail_path?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_programs_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          explanation_image_path: string | null
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
          explanation_image_path?: string | null
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
          explanation_image_path?: string | null
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
      quiz_results: {
        Row: {
          attempts_used: number
          best_score: number | null
          created_at: string
          first_attempt_at: string | null
          id: string
          last_attempt_at: string | null
          passed: boolean
          profile_id: string
          quiz_id: string
          updated_at: string
        }
        Insert: {
          attempts_used?: number
          best_score?: number | null
          created_at?: string
          first_attempt_at?: string | null
          id?: string
          last_attempt_at?: string | null
          passed?: boolean
          profile_id: string
          quiz_id: string
          updated_at?: string
        }
        Update: {
          attempts_used?: number
          best_score?: number | null
          created_at?: string
          first_attempt_at?: string | null
          id?: string
          last_attempt_at?: string | null
          passed?: boolean
          profile_id?: string
          quiz_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_results_profile"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_quiz_results_quiz"
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
          is_required: boolean
          lesson_id: string
          max_attempt: number
          passing_score: number
          publication_status: string
          quiz_order: number
          shuffle_options: boolean
          shuffle_questions: boolean
          title: string
          total_questions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration: number
          id?: string
          is_required?: boolean
          lesson_id: string
          max_attempt?: number
          passing_score?: number
          publication_status?: string
          quiz_order?: number
          shuffle_options?: boolean
          shuffle_questions?: boolean
          title: string
          total_questions?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration?: number
          id?: string
          is_required?: boolean
          lesson_id?: string
          max_attempt?: number
          passing_score?: number
          publication_status?: string
          quiz_order?: number
          shuffle_options?: boolean
          shuffle_questions?: boolean
          title?: string
          total_questions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quizzes_lesson"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      tryout_answers: {
        Row: {
          answered_at: string | null
          attempt_id: string
          created_at: string
          id: string
          is_marked_for_review: boolean
          question_id: string
          selected_option_id: string | null
          updated_at: string
        }
        Insert: {
          answered_at?: string | null
          attempt_id: string
          created_at?: string
          id?: string
          is_marked_for_review?: boolean
          question_id: string
          selected_option_id?: string | null
          updated_at?: string
        }
        Update: {
          answered_at?: string | null
          attempt_id?: string
          created_at?: string
          id?: string
          is_marked_for_review?: boolean
          question_id?: string
          selected_option_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tryout_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "tryout_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tryout_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "tryout_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tryout_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "tryout_options"
            referencedColumns: ["id"]
          },
        ]
      }
      tryout_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          duration_seconds: number | null
          expires_at: string
          id: string
          option_orders: Json
          profile_id: string
          question_order: string[]
          score: number | null
          started_at: string
          status: string
          submitted_at: string | null
          total_correct: number
          total_questions: number
          total_unanswered: number
          total_wrong: number
          tryout_id: string
          updated_at: string
        }
        Insert: {
          attempt_number: number
          created_at?: string
          duration_seconds?: number | null
          expires_at: string
          id?: string
          option_orders?: Json
          profile_id: string
          question_order: string[]
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          total_correct?: number
          total_questions?: number
          total_unanswered?: number
          total_wrong?: number
          tryout_id: string
          updated_at?: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          duration_seconds?: number | null
          expires_at?: string
          id?: string
          option_orders?: Json
          profile_id?: string
          question_order?: string[]
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          total_correct?: number
          total_questions?: number
          total_unanswered?: number
          total_wrong?: number
          tryout_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tryout_attempts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tryout_attempts_tryout_id_fkey"
            columns: ["tryout_id"]
            isOneToOne: false
            referencedRelation: "tryouts"
            referencedColumns: ["id"]
          },
        ]
      }
      tryout_options: {
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
            foreignKeyName: "tryout_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "tryout_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      tryout_questions: {
        Row: {
          created_at: string
          difficulty: string
          explanation: string | null
          explanation_image_path: string | null
          id: string
          image_path: string | null
          points: number
          question: string
          question_order: number
          topic: string
          tryout_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          difficulty?: string
          explanation?: string | null
          explanation_image_path?: string | null
          id?: string
          image_path?: string | null
          points?: number
          question: string
          question_order: number
          topic?: string
          tryout_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          explanation?: string | null
          explanation_image_path?: string | null
          id?: string
          image_path?: string | null
          points?: number
          question?: string
          question_order?: number
          topic?: string
          tryout_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tryout_questions_tryout_id_fkey"
            columns: ["tryout_id"]
            isOneToOne: false
            referencedRelation: "tryouts"
            referencedColumns: ["id"]
          },
        ]
      }
      tryout_results: {
        Row: {
          attempts_used: number
          best_score: number | null
          created_at: string
          first_attempt_at: string | null
          id: string
          last_attempt_at: string | null
          passed: boolean
          profile_id: string
          tryout_id: string
          updated_at: string
        }
        Insert: {
          attempts_used?: number
          best_score?: number | null
          created_at?: string
          first_attempt_at?: string | null
          id?: string
          last_attempt_at?: string | null
          passed?: boolean
          profile_id: string
          tryout_id: string
          updated_at?: string
        }
        Update: {
          attempts_used?: number
          best_score?: number | null
          created_at?: string
          first_attempt_at?: string | null
          id?: string
          last_attempt_at?: string | null
          passed?: boolean
          profile_id?: string
          tryout_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tryout_results_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tryout_results_tryout_id_fkey"
            columns: ["tryout_id"]
            isOneToOne: false
            referencedRelation: "tryouts"
            referencedColumns: ["id"]
          },
        ]
      }
      tryouts: {
        Row: {
          close_at: string | null
          course_id: string
          created_at: string
          created_by: string
          description: string | null
          duration_minutes: number
          id: string
          max_attempts: number
          open_at: string | null
          passing_score: number
          publication_status: string
          result_release_mode: string
          review_release_mode: string
          shuffle_options: boolean
          shuffle_questions: boolean
          title: string
          updated_at: string
        }
        Insert: {
          close_at?: string | null
          course_id: string
          created_at?: string
          created_by: string
          description?: string | null
          duration_minutes?: number
          id?: string
          max_attempts?: number
          open_at?: string | null
          passing_score?: number
          publication_status?: string
          result_release_mode?: string
          review_release_mode?: string
          shuffle_options?: boolean
          shuffle_questions?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          close_at?: string | null
          course_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          max_attempts?: number
          open_at?: string | null
          passing_score?: number
          publication_status?: string
          result_release_mode?: string
          review_release_mode?: string
          shuffle_options?: boolean
          shuffle_questions?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tryouts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tryouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          duration: number
          id: string
          is_required: boolean
          lesson_id: string
          provider: Database["public"]["Enums"]["video_provider"]
          provider_video_id: string
          publication_status: string
          title: string
          updated_at: string
          version: number
          video_order: number
        }
        Insert: {
          created_at?: string
          duration: number
          id?: string
          is_required?: boolean
          lesson_id: string
          provider: Database["public"]["Enums"]["video_provider"]
          provider_video_id: string
          publication_status?: string
          title: string
          updated_at?: string
          version?: number
          video_order?: number
        }
        Update: {
          created_at?: string
          duration?: number
          id?: string
          is_required?: boolean
          lesson_id?: string
          provider?: Database["public"]["Enums"]["video_provider"]
          provider_video_id?: string
          publication_status?: string
          title?: string
          updated_at?: string
          version?: number
          video_order?: number
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
      admin_approve_all_pending_payments: {
        Args: never
        Returns: {
          account_holder_name_snapshot: string
          account_number_snapshot: string
          amount: number
          bank_name_snapshot: string
          created_at: string
          enrollment_id: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_account_id: string
          payment_account_label_snapshot: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_proof_path: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_create_tryout_question: {
        Args: {
          correct_option_index: number
          difficulty_text: string
          explanation_image_path: string
          explanation_text: string
          option_texts: string[]
          question_image_path: string
          question_points: number
          question_text: string
          target_tryout_id: string
          topic_text: string
        }
        Returns: string
      }
      admin_delete_student_account: {
        Args: { confirmation_email: string; target_profile_id: string }
        Returns: boolean
      }
      admin_get_mentor_detail: {
        Args: { target_profile_id: string }
        Returns: Json
      }
      admin_get_mentor_directory: { Args: never; Returns: Json }
      admin_get_mentor_emails: {
        Args: { target_profile_ids: string[] }
        Returns: {
          email: string
          profile_id: string
        }[]
      }
      admin_get_student_emails: {
        Args: { target_profile_ids: string[] }
        Returns: {
          email: string
          profile_id: string
        }[]
      }
      admin_promote_student_to_mentor: {
        Args: { target_profile_id: string }
        Returns: string
      }
      admin_reset_student_devices: {
        Args: { target_profile_id: string }
        Returns: number
      }
      admin_review_payment: {
        Args: {
          rejection_notes?: string
          target_payment_id: string
          target_status: Database["public"]["Enums"]["payment_status"]
        }
        Returns: {
          account_holder_name_snapshot: string
          account_number_snapshot: string
          amount: number
          bank_name_snapshot: string
          created_at: string
          enrollment_id: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_account_id: string
          payment_account_label_snapshot: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_proof_path: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_course_rating_mentors: {
        Args: { target_course_id: string; target_mentor_ids?: string[] }
        Returns: undefined
      }
      admin_set_default_payment_account: {
        Args: { target_account_id: string }
        Returns: string
      }
      admin_set_mentor_assignment: {
        Args: {
          target_active: boolean
          target_course_id: string
          target_profile_id: string
        }
        Returns: undefined
      }
      admin_set_mentor_rating_enabled: {
        Args: { target_course_id: string; target_enabled: boolean }
        Returns: undefined
      }
      admin_set_student_password: {
        Args: { new_password: string; target_profile_id: string }
        Returns: boolean
      }
      admin_update_enrollment_payment_timing: {
        Args: {
          target_enrollment_id: string
          target_payment_timing: Database["public"]["Enums"]["payment_timing"]
        }
        Returns: undefined
      }
      admin_update_tryout_question: {
        Args: {
          correct_option_index: number
          difficulty_text: string
          explanation_image_path: string
          explanation_text: string
          option_texts: string[]
          question_image_path: string
          question_points: number
          question_text: string
          target_question_id: string
          topic_text: string
        }
        Returns: string
      }
      apply_deferred_promotion_code: {
        Args: { submitted_code: string; target_enrollment_id: string }
        Returns: Json
      }
      apply_promotion_code: {
        Args: { submitted_code: string; target_enrollment_id: string }
        Returns: Json
      }
      can_manage_tryout: {
        Args: { target_tryout_id: string }
        Returns: boolean
      }
      count_unread_lesson_messages: { Args: never; Returns: number }
      create_lesson_with_next_order: {
        Args: {
          lesson_description: string
          lesson_duration: number
          lesson_is_free: boolean
          lesson_is_required: boolean
          lesson_publication_status: string
          lesson_slug: string
          lesson_title: string
          target_course_id: string
          target_folder_id: string
        }
        Returns: {
          course_id: string
          created_at: string
          description: string | null
          duration: number
          folder_id: string | null
          id: string
          is_free: boolean
          is_required: boolean
          lesson_order: number
          publication_status: string
          slug: string
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "lessons"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_profile_role: {
        Args: never
        Returns: Database["public"]["Enums"]["profile_role"]
      }
      finalize_tryout_attempt: {
        Args: { final_status: string; target_attempt_id: string }
        Returns: Json
      }
      get_course_mentor_rating_context: {
        Args: { target_course_id: string }
        Returns: Json
      }
      get_managed_tryout_results: {
        Args: { target_tryout_id: string }
        Returns: {
          attempt_id: string
          attempt_number: number
          duration_seconds: number
          score: number
          status: string
          student_name: string
          submitted_at: string
          total_correct: number
          total_unanswered: number
          total_wrong: number
          university_origin: string
        }[]
      }
      get_message_participant_summaries: {
        Args: { target_profile_ids: string[] }
        Returns: {
          full_name: string
          id: string
          university_origin: string
        }[]
      }
      get_quiz_for_attempt: { Args: { target_quiz_id: string }; Returns: Json }
      get_quiz_review: { Args: { target_quiz_id: string }; Returns: Json }
      get_student_tryout_summaries: {
        Args: { target_course_id: string }
        Returns: Json
      }
      get_tryout_attempt: { Args: { target_attempt_id: string }; Returns: Json }
      get_tryout_result: { Args: { target_attempt_id: string }; Returns: Json }
      get_tryout_review: { Args: { target_attempt_id: string }; Returns: Json }
      is_assigned_mentor: {
        Args: { target_course_id: string; target_profile_id: string }
        Returns: boolean
      }
      manage_delete_tryout_question: {
        Args: { target_question_id: string }
        Returns: string
      }
      mentor_get_course_reviews: {
        Args: { target_course_id: string }
        Returns: Json
      }
      mentor_get_rating_dashboard: { Args: never; Returns: Json }
      register_or_refresh_student_device: {
        Args: {
          p_device_identifier: string
          p_device_name: string
          p_device_type: Database["public"]["Enums"]["device_type"]
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: string
      }
      save_mentor_review: {
        Args: {
          target_course_id: string
          target_mentor_id: string
          target_rating: number
          target_suggestion?: string
        }
        Returns: undefined
      }
      save_tryout_answer: {
        Args: {
          marked_for_review?: boolean
          target_attempt_id: string
          target_option_id: string
          target_question_id: string
        }
        Returns: Json
      }
      set_course_mentors: {
        Args: { target_course_id: string; target_mentor_ids: string[] }
        Returns: undefined
      }
      set_course_payment_account: {
        Args: { target_course_id: string; target_payment_account_id: string }
        Returns: undefined
      }
      set_default_payment_account: {
        Args: { target_payment_account_id: string }
        Returns: undefined
      }
      staff_find_student_by_phone: {
        Args: { submitted_phone: string }
        Returns: {
          full_name: string
          id: string
          phone: string
          university_origin: string
        }[]
      }
      start_tryout_attempt: {
        Args: { target_tryout_id: string }
        Returns: Json
      }
      student_submit_payment: {
        Args: {
          target_amount: number
          target_enrollment_id: string
          target_payment_proof_path: string
        }
        Returns: {
          account_holder_name_snapshot: string
          account_number_snapshot: string
          amount: number
          bank_name_snapshot: string
          created_at: string
          enrollment_id: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_account_id: string
          payment_account_label_snapshot: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_proof_path: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_deferred_zero_payment: {
        Args: { target_enrollment_id: string }
        Returns: Json
      }
      submit_quiz_attempt: {
        Args: { submitted_answers: Json; target_quiz_id: string }
        Returns: Json
      }
      submit_tryout_attempt: {
        Args: { target_attempt_id: string }
        Returns: Json
      }
      submit_zero_payment_enrollment: {
        Args: { target_enrollment_id: string }
        Returns: Json
      }
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
      payment_policy: "upfront_only" | "upfront_or_deferred"
      payment_status: "pending" | "approved" | "rejected"
      payment_timing: "upfront" | "deferred"
      profile_role: "admin" | "mentor" | "student" | "leader"
      profile_status: "active" | "inactive" | "suspended"
      program_status: "coming_soon" | "active" | "inactive"
      promotion_status: "active" | "inactive"
      promotion_type: "fixed_amount" | "percentage" | "special_price" | "free"
      video_provider: "youtube" | "bunny" | "upload" | "google_drive"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      payment_policy: ["upfront_only", "upfront_or_deferred"],
      payment_status: ["pending", "approved", "rejected"],
      payment_timing: ["upfront", "deferred"],
      profile_role: ["admin", "mentor", "student", "leader"],
      profile_status: ["active", "inactive", "suspended"],
      program_status: ["coming_soon", "active", "inactive"],
      promotion_status: ["active", "inactive"],
      promotion_type: ["fixed_amount", "percentage", "special_price", "free"],
      video_provider: ["youtube", "bunny", "upload", "google_drive"],
    },
  },
} as const
