import type { Database } from "@/supabase/types/database.types";

type OrganizationInsert =
  Database["public"]["Tables"]["organizations"]["Insert"];

export function mapOrganizationForm(
  formData: FormData,
): OrganizationInsert {
  return {
    title: String(formData.get("title") ?? "").trim(),
    short_name: String(
      formData.get("short_name") ?? "",
    ).trim(),
    slug: "",
    logo_path:
      String(formData.get("logo_path") ?? "").trim() || null,
    status: formData.get(
      "status",
    ) as OrganizationInsert["status"],
  };
}
