import type { Database } from "@/supabase/types/database.types";

export type Profile =
  Database["public"]["Tables"]["profiles"]["Row"];

export type ProfileInsert =
  Database["public"]["Tables"]["profiles"]["Insert"];

export type ProfileUpdate =
  Database["public"]["Tables"]["profiles"]["Update"];