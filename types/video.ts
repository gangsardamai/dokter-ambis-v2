import type { Database } from "@/supabase/types/database.types";

export type Video =
  Database["public"]["Tables"]["videos"]["Row"];

export type VideoInsert =
  Database["public"]["Tables"]["videos"]["Insert"];

export type VideoUpdate =
  Database["public"]["Tables"]["videos"]["Update"];