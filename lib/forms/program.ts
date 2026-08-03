import type { Database } from "@/supabase/types/database.types";

type ProgramInsert =
  Database["public"]["Tables"]["programs"]["Insert"];

export function mapProgramForm(
  formData: FormData,
): ProgramInsert {
  return {
    organization_id: String(
      formData.get("organization_id") ?? "",
    ),
    title: String(formData.get("title") ?? "").trim(),
    slug: "",
    description:
      String(formData.get("description") ?? "").trim() || null,
    thumbnail_path:
      String(formData.get("thumbnail_path") ?? "").trim() || null,
    status: formData.get("status") as ProgramInsert["status"],
  };
}
