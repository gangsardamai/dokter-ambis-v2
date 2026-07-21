import type { Database } from "@/supabase/types/database.types";

type ProgramInsert =
  Database["public"]["Tables"]["programs"]["Insert"];

export function mapProgramForm(
  formData: FormData
): ProgramInsert {

  return {

    title:
      formData.get("title") as string,

    slug:
      formData.get("slug") as string,

    description:
      (formData.get("description") as string) || null,

    thumbnail_path:
      (formData.get("thumbnail_path") as string) || null,

    status:
      formData.get("status") as ProgramInsert["status"],

  };

}