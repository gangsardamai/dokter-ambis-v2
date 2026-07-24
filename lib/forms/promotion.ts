import type { Database } from "@/supabase/types/database.types";

type PromotionInsert =
  Database["public"]["Tables"]["promotions"]["Insert"];

function getText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function toIsoString(value: string): string {
  if (!value) return "";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function mapPromotionForm(
  formData: FormData,
): PromotionInsert {
  const type = getText(formData, "type") as PromotionInsert["type"];
  const rawValue = getText(formData, "value");
  const rawPriority = getText(formData, "priority");
  const rawQuota = getText(formData, "quota");
  const startAt = getText(formData, "start_at");
  const endAt = getText(formData, "end_at");
  const code = getText(formData, "code");
  const description = getText(formData, "description");
  const notes = getText(formData, "notes");

  return {
    name: getText(formData, "name"),
    code: code || null,
    description: description || null,
    notes: notes || null,
    type,
    value:
      type === "free"
        ? 0
        : rawValue
          ? Number(rawValue)
          : Number.NaN,
    priority: rawPriority ? Number(rawPriority) : 1,
    quota: rawQuota ? Number(rawQuota) : null,
    requires_code:
      formData.get("requires_code") === "on",
    start_at: toIsoString(startAt),
    end_at: endAt ? toIsoString(endAt) : null,
    status: "active",
  };
}
