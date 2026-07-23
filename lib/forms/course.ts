import type { Database } from "@/supabase/types/database.types";

type CourseInsert =
  Database["public"]["Tables"]["courses"]["Insert"];

export function mapCourseForm(
  formData: FormData
): CourseInsert {

  return {

    organization_id:
      formData.get("organization_id") as string,

    program_id:
      formData.get("program_id") as string,

    title:
      formData.get("title") as string,

    slug:
      (formData.get("slug") as string).toLowerCase(),

    description:
      (formData.get("description") as string) || null,

    thumbnail_path:
      (formData.get("thumbnail_path") as string) || null,

    status:
      formData.get("status") as CourseInsert["status"],

    price:
      Number(
        formData.get("price")
      ),

    is_free:
      formData.get("is_free") === "on",

  };

}