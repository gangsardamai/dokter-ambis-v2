import type { Database } from "@/supabase/types/database.types";

export type LessonFile =
  Database["public"]["Tables"]["lesson_files"]["Row"];

export type LessonFileInsert =
  Database["public"]["Tables"]["lesson_files"]["Insert"];

export type LessonFileUpdate =
  Database["public"]["Tables"]["lesson_files"]["Update"];