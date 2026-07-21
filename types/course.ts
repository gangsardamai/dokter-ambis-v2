import type { Database } from "@/supabase/types/database.types";

export type Course =
  Database["public"]["Tables"]["courses"]["Row"];

export type CourseInsert =
  Database["public"]["Tables"]["courses"]["Insert"];

export type CourseUpdate =
  Database["public"]["Tables"]["courses"]["Update"];