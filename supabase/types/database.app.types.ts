import {
  Constants as GeneratedConstants,
} from "./database.types";

import type {
  Database as GeneratedDatabase,
  Json,
} from "./database.types";

export type { Json };

export type LessonMessageThreadStatus =
  | "open"
  | "answered"
  | "closed";

type GeneratedPublic =
  GeneratedDatabase["public"];
type GeneratedVideos =
  GeneratedPublic["Tables"]["videos"];

type VideoProvider =
  | GeneratedPublic["Enums"]["video_provider"]
  | "google_drive";

type VideosWithGoogleDrive = {
  Row: Omit<
    GeneratedVideos["Row"],
    "provider"
  > & {
    provider: VideoProvider;
  };
  Insert: Omit<
    GeneratedVideos["Insert"],
    "provider"
  > & {
    provider: VideoProvider;
  };
  Update: Omit<
    GeneratedVideos["Update"],
    "provider"
  > & {
    provider?: VideoProvider;
  };
  Relationships:
    GeneratedVideos["Relationships"];
};

type LessonMessageThreads = {
  Row: {
    id: string;
    student_profile_id: string;
    course_id: string;
    lesson_id: string | null;
    status: LessonMessageThreadStatus;
    last_message_at: string;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    student_profile_id: string;
    course_id: string;
    lesson_id?: string | null;
    status?: LessonMessageThreadStatus;
    last_message_at?: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    student_profile_id?: string;
    course_id?: string;
    lesson_id?: string | null;
    status?: LessonMessageThreadStatus;
    last_message_at?: string;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "lesson_message_threads_student_profile_id_fkey";
      columns: ["student_profile_id"];
      isOneToOne: false;
      referencedRelation: "profiles";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "lesson_message_threads_course_id_fkey";
      columns: ["course_id"];
      isOneToOne: false;
      referencedRelation: "courses";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "lesson_message_threads_lesson_id_fkey";
      columns: ["lesson_id"];
      isOneToOne: false;
      referencedRelation: "lessons";
      referencedColumns: ["id"];
    },
  ];
};

type LessonMessageEntries = {
  Row: {
    id: string;
    thread_id: string;
    sender_profile_id: string;
    sender_role: GeneratedPublic["Enums"]["profile_role"];
    message: string;
    read_at: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    thread_id: string;
    sender_profile_id: string;
    sender_role: GeneratedPublic["Enums"]["profile_role"];
    message: string;
    read_at?: string | null;
    created_at?: string;
  };
  Update: {
    id?: string;
    thread_id?: string;
    sender_profile_id?: string;
    sender_role?: GeneratedPublic["Enums"]["profile_role"];
    message?: string;
    read_at?: string | null;
    created_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "lesson_message_entries_thread_id_fkey";
      columns: ["thread_id"];
      isOneToOne: false;
      referencedRelation: "lesson_message_threads";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "lesson_message_entries_sender_profile_id_fkey";
      columns: ["sender_profile_id"];
      isOneToOne: false;
      referencedRelation: "profiles";
      referencedColumns: ["id"];
    },
  ];
};

type LessonMessageThreadReads = {
  Row: {
    thread_id: string;
    profile_id: string;
    last_read_at: string;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    thread_id: string;
    profile_id: string;
    last_read_at?: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    thread_id?: string;
    profile_id?: string;
    last_read_at?: string;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "lesson_message_thread_reads_thread_id_fkey";
      columns: ["thread_id"];
      isOneToOne: false;
      referencedRelation: "lesson_message_threads";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "lesson_message_thread_reads_profile_id_fkey";
      columns: ["profile_id"];
      isOneToOne: false;
      referencedRelation: "profiles";
      referencedColumns: ["id"];
    },
  ];
};

type PublicWithApplicationExtensions = Omit<
  GeneratedPublic,
  "Tables" | "Enums" | "Functions"
> & {
  Tables: Omit<
    GeneratedPublic["Tables"],
    "videos"
  > & {
    videos: VideosWithGoogleDrive;
    lesson_message_threads: LessonMessageThreads;
    lesson_message_entries: LessonMessageEntries;
    lesson_message_thread_reads: LessonMessageThreadReads;
  };
  Functions: GeneratedPublic["Functions"] & {
    count_unread_lesson_messages: {
      Args: Record<PropertyKey, never>;
      Returns: number;
    };
  };
  Enums: Omit<
    GeneratedPublic["Enums"],
    "video_provider"
  > & {
    video_provider: VideoProvider;
  };
};

export type Database = Omit<
  GeneratedDatabase,
  "public"
> & {
  public: PublicWithApplicationExtensions;
};

type DatabaseWithoutInternals = Omit<
  Database,
  "__InternalSupabase"
>;

type DefaultSchema =
  DatabaseWithoutInternals[
    Extract<keyof Database, "public">
  ];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (
        DefaultSchema["Tables"] &
          DefaultSchema["Views"]
      )
    | {
        schema: keyof DatabaseWithoutInternals;
      },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (
        DatabaseWithoutInternals[
          DefaultSchemaTableNameOrOptions["schema"]
        ]["Tables"] &
          DatabaseWithoutInternals[
            DefaultSchemaTableNameOrOptions["schema"]
          ]["Views"]
      )
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (
      DatabaseWithoutInternals[
        DefaultSchemaTableNameOrOptions["schema"]
      ]["Tables"] &
        DatabaseWithoutInternals[
          DefaultSchemaTableNameOrOptions["schema"]
        ]["Views"]
    )[TableName] extends {
      Row: infer Row;
    }
    ? Row
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (
        DefaultSchema["Tables"] &
          DefaultSchema["Views"]
      )
    ? (
        DefaultSchema["Tables"] &
          DefaultSchema["Views"]
      )[DefaultSchemaTableNameOrOptions] extends {
        Row: infer Row;
      }
      ? Row
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | {
        schema: keyof DatabaseWithoutInternals;
      },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[
        DefaultSchemaTableNameOrOptions["schema"]
      ]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[
      DefaultSchemaTableNameOrOptions["schema"]
    ]["Tables"][TableName] extends {
      Insert: infer Insert;
    }
    ? Insert
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer Insert;
      }
      ? Insert
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | {
        schema: keyof DatabaseWithoutInternals;
      },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[
        DefaultSchemaTableNameOrOptions["schema"]
      ]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[
      DefaultSchemaTableNameOrOptions["schema"]
    ]["Tables"][TableName] extends {
      Update: infer Update;
    }
    ? Update
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer Update;
      }
      ? Update
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | {
        schema: keyof DatabaseWithoutInternals;
      },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[
        DefaultSchemaEnumNameOrOptions["schema"]
      ]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[
      DefaultSchemaEnumNameOrOptions["schema"]
    ]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | {
        schema: keyof DatabaseWithoutInternals;
      },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[
        PublicCompositeTypeNameOrOptions["schema"]
      ]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[
      PublicCompositeTypeNameOrOptions["schema"]
    ]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  ...GeneratedConstants,
  public: {
    ...GeneratedConstants.public,
    Enums: {
      ...GeneratedConstants.public.Enums,
      video_provider: [
        ...GeneratedConstants.public.Enums.video_provider,
        "google_drive",
      ],
    },
  },
} as const;
