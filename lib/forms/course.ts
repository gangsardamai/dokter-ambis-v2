import type { Database } from "@/supabase/types/database.extended.types";

type CourseInsert = Database["public"]["Tables"]["courses"]["Insert"];

export function mapCourseForm(formData: FormData): CourseInsert {
  const paymentPolicy = String(
    formData.get("payment_policy") ?? "upfront_only",
  );

  return {
    organization_id: String(formData.get("organization_id") ?? ""),
    program_id: String(formData.get("program_id") ?? ""),
    payment_account_id: String(formData.get("payment_account_id") ?? ""),
    payment_policy:
      paymentPolicy === "upfront_or_deferred"
        ? "upfront_or_deferred"
        : "upfront_only",
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
