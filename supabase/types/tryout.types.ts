import type { Json } from "./database.types";

export type TryoutPublicationStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "closed";

export type TryoutAttemptStatus =
  | "in_progress"
  | "submitted"
  | "expired";

export type TryoutDifficulty = "easy" | "medium" | "hard";
export type TryoutResultReleaseMode = "immediate" | "after_close";
export type TryoutReviewReleaseMode =
  | "immediate"
  | "after_close"
  | "never";

export type TryoutTables = {
  tryouts: {
    Row: {
      id: string;
      course_id: string;
      title: string;
      description: string | null;
      duration_minutes: number;
      max_attempts: number;
      passing_score: number;
      open_at: string | null;
      close_at: string | null;
      result_release_mode: TryoutResultReleaseMode;
      review_release_mode: TryoutReviewReleaseMode;
      shuffle_questions: boolean;
      shuffle_options: boolean;
      publication_status: TryoutPublicationStatus;
      created_by: string;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      course_id: string;
      title: string;
      description?: string | null;
      duration_minutes?: number;
      max_attempts?: number;
      passing_score?: number;
      open_at?: string | null;
      close_at?: string | null;
      result_release_mode?: TryoutResultReleaseMode;
      review_release_mode?: TryoutReviewReleaseMode;
      shuffle_questions?: boolean;
      shuffle_options?: boolean;
      publication_status?: TryoutPublicationStatus;
      created_by: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<TryoutTables["tryouts"]["Insert"]>;
    Relationships: [
      {
        foreignKeyName: "tryouts_course_id_fkey";
        columns: ["course_id"];
        isOneToOne: false;
        referencedRelation: "courses";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "tryouts_created_by_fkey";
        columns: ["created_by"];
        isOneToOne: false;
        referencedRelation: "profiles";
        referencedColumns: ["id"];
      },
    ];
  };
  tryout_questions: {
    Row: {
      id: string;
      tryout_id: string;
      question_order: number;
      question: string;
      explanation: string | null;
      image_path: string | null;
      explanation_image_path: string | null;
      topic: string;
      difficulty: TryoutDifficulty;
      points: number;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      tryout_id: string;
      question_order: number;
      question: string;
      explanation?: string | null;
      image_path?: string | null;
      explanation_image_path?: string | null;
      topic?: string;
      difficulty?: TryoutDifficulty;
      points?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<TryoutTables["tryout_questions"]["Insert"]>;
    Relationships: [
      {
        foreignKeyName: "tryout_questions_tryout_id_fkey";
        columns: ["tryout_id"];
        isOneToOne: false;
        referencedRelation: "tryouts";
        referencedColumns: ["id"];
      },
    ];
  };
  tryout_options: {
    Row: {
      id: string;
      question_id: string;
      option_order: number;
      option_text: string;
      image_path: string | null;
      is_correct: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      question_id: string;
      option_order: number;
      option_text: string;
      image_path?: string | null;
      is_correct?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<TryoutTables["tryout_options"]["Insert"]>;
    Relationships: [
      {
        foreignKeyName: "tryout_options_question_id_fkey";
        columns: ["question_id"];
        isOneToOne: false;
        referencedRelation: "tryout_questions";
        referencedColumns: ["id"];
      },
    ];
  };
  tryout_attempts: {
    Row: {
      id: string;
      tryout_id: string;
      profile_id: string;
      attempt_number: number;
      status: TryoutAttemptStatus;
      started_at: string;
      expires_at: string;
      submitted_at: string | null;
      duration_seconds: number | null;
      question_order: string[];
      option_orders: Json;
      score: number | null;
      total_questions: number;
      total_correct: number;
      total_wrong: number;
      total_unanswered: number;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      tryout_id: string;
      profile_id: string;
      attempt_number: number;
      status?: TryoutAttemptStatus;
      started_at?: string;
      expires_at: string;
      submitted_at?: string | null;
      duration_seconds?: number | null;
      question_order: string[];
      option_orders?: Json;
      score?: number | null;
      total_questions?: number;
      total_correct?: number;
      total_wrong?: number;
      total_unanswered?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<TryoutTables["tryout_attempts"]["Insert"]>;
    Relationships: [];
  };
  tryout_answers: {
    Row: {
      id: string;
      attempt_id: string;
      question_id: string;
      selected_option_id: string | null;
      is_marked_for_review: boolean;
      answered_at: string | null;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      attempt_id: string;
      question_id: string;
      selected_option_id?: string | null;
      is_marked_for_review?: boolean;
      answered_at?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<TryoutTables["tryout_answers"]["Insert"]>;
    Relationships: [];
  };
  tryout_results: {
    Row: {
      id: string;
      tryout_id: string;
      profile_id: string;
      attempts_used: number;
      best_score: number | null;
      passed: boolean;
      first_attempt_at: string | null;
      last_attempt_at: string | null;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      tryout_id: string;
      profile_id: string;
      attempts_used?: number;
      best_score?: number | null;
      passed?: boolean;
      first_attempt_at?: string | null;
      last_attempt_at?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<TryoutTables["tryout_results"]["Insert"]>;
    Relationships: [];
  };
};

export type TryoutFunctions = {
  start_tryout_attempt: {
    Args: { target_tryout_id: string };
    Returns: Json;
  };
  get_tryout_attempt: {
    Args: { target_attempt_id: string };
    Returns: Json;
  };
  save_tryout_answer: {
    Args: {
      target_attempt_id: string;
      target_question_id: string;
      target_option_id: string | null;
      marked_for_review?: boolean;
    };
    Returns: Json;
  };
  submit_tryout_attempt: {
    Args: { target_attempt_id: string };
    Returns: Json;
  };
  get_tryout_result: {
    Args: { target_attempt_id: string };
    Returns: Json;
  };
  admin_create_tryout_question: {
    Args: {
      target_tryout_id: string;
      question_text: string;
      explanation_text: string;
      topic_text: string;
      difficulty_text: TryoutDifficulty;
      question_points: number;
      option_texts: string[];
      correct_option_index: number;
    };
    Returns: string;
  };
};
