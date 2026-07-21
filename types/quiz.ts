import type { Database } from "@/supabase/types/database.types";

export type Quiz =
  Database["public"]["Tables"]["quizzes"]["Row"];

export type QuizInsert =
  Database["public"]["Tables"]["quizzes"]["Insert"];

export type QuizUpdate =
  Database["public"]["Tables"]["quizzes"]["Update"];