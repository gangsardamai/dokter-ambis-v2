import type { Database } from "@/supabase/types/database.types";

export type LiveClass =
  Database["public"]["Tables"]["live_classes"]["Row"];

export type LiveClassInsert =
  Database["public"]["Tables"]["live_classes"]["Insert"];

export type LiveClassUpdate =
  Database["public"]["Tables"]["live_classes"]["Update"];