import type { Database } from "@/supabase/types/database.types";

export type ExplorerFolder =
  Database["public"]["Tables"]["lesson_folders"]["Row"];

export type ExplorerLesson =
  Database["public"]["Tables"]["lessons"]["Row"];

export type ExplorerFile =
  Database["public"]["Tables"]["lesson_files"]["Row"];

export type ExplorerVideo =
  Database["public"]["Tables"]["videos"]["Row"];

export type ExplorerQuiz =
  Database["public"]["Tables"]["quizzes"]["Row"];

export interface ExplorerLessonContent {
  lesson: ExplorerLesson;
  files: ExplorerFile[];
  videos: ExplorerVideo[];
  quizzes: ExplorerQuiz[];
}

export interface ExplorerFolderContent {
  folder: ExplorerFolder;
  lessons: ExplorerLessonContent[];
}

export interface CourseExplorerContent {
  folders: ExplorerFolderContent[];
  ungroupedLessons: ExplorerLessonContent[];
}

export interface QuizAttemptOption {
  id: string;
  option_order: number;
  option_text: string;
  image_path: string | null;
}

export interface QuizAttemptQuestion {
  id: string;
  question_order: number;
  question: string;
  image_path: string | null;
  question_type: string;
  points: number;
  options: QuizAttemptOption[];
}

export interface QuizAttemptPayload {
  id: string;
  title: string;
  duration: number;
  passing_score: number;
  max_attempt: number;
  attempts_used: number;
  attempts_remaining: number;
  can_attempt: boolean;
  questions: QuizAttemptQuestion[];
}

export interface QuizSubmissionResult {
  attempt_id: string;
  attempt_number: number;
  score: number;
  best_score: number;
  passing_score: number;
  passed: boolean;
  attempts_remaining: number;
  show_review: boolean;
}

export interface QuizReviewOption extends QuizAttemptOption {
  is_correct: boolean;
}

export interface QuizReviewQuestion {
  id: string;
  question_order: number;
  question: string;
  image_path: string | null;
  explanation: string | null;
  explanation_image_path: string | null;
  selected_option_id: string | null;
  options: QuizReviewOption[];
}

export interface QuizReviewPayload {
  quiz_id: string;
  title: string;
  attempts_used: number;
  questions: QuizReviewQuestion[];
}
