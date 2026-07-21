import type { Database } from "@/supabase/types/database.types";

type PromotionInsert =
  Database["public"]["Tables"]["promotions"]["Insert"];

export function mapPromotionForm(
  formData: FormData
): PromotionInsert {

  return {

    name:
      formData.get("name") as string,

    code:
      (formData.get("code") as string) || null,

    description:
      (formData.get("description") as string) || null,

    notes:
      (formData.get("notes") as string) || null,

    type:
      formData.get("type") as PromotionInsert["type"],

    value:
      Number(formData.get("value")),

    priority:
      Number(formData.get("priority")),

    quota:
      formData.get("quota")
        ? Number(formData.get("quota"))
        : null,

    requires_code:
      formData.get("requires_code") === "on",

    start_at:
      new Date(
        formData.get("start_at") as string
      ).toISOString(),

    end_at:
      formData.get("end_at")
        ? new Date(
            formData.get("end_at") as string
          ).toISOString()
        : null,

    status: "active",

  };

}