import type { Database } from "@/supabase/types/database.extended.types";

type CourseInsert =
  Database["public"]["Tables"]["courses"]["Insert"];

export function mapCourseForm(
  formData: FormData,
): CourseInsert {
  return {
    organization_id: String(
      formData.get("organization_id") ?? "",
    ),
    program_id: String(formData.get("program_id") ?? ""),
    payment_account_id: String(
      formData.get("payment_account_id") ?? "",
    ),
    title: String(formData.get("title") ?? "").trim(),
    slug: "",
    description:
      String(formData.get("description") ?? "").trim() || null,
    thumbnail_path:
      String(formData.get("thumbnail_path") ?? "").trim() || null,
    status: formData.get("status") as CourseInsert["status"],
    price: Number(formData.get("price") ?? 0),
    is_free: formData.get("is_free") === "on",
  };
}
