import type { Database } from "@/supabase/types/database.types";

type OrganizationInsert =
  Database["public"]["Tables"]["organizations"]["Insert"];

export function mapOrganizationForm(
  formData: FormData
): OrganizationInsert {

  return {

    title:
      formData.get("title") as string,

    short_name:
      formData.get("short_name") as string,

    slug:
      formData.get("slug") as string,

    logo_path:
      (formData.get("logo_path") as string) || null,

    status:
      formData.get("status") as OrganizationInsert["status"],

  };

}