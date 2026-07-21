import type { Database } from "@/supabase/types/database.types";

export type Lesson =
  Database["public"]["Tables"]["lessons"]["Row"];

export type LessonInsert =
  Database["public"]["Tables"]["lessons"]["Insert"];

export type LessonUpdate =
  Database["public"]["Tables"]["lessons"]["Update"];