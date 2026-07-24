"use server";

import { revalidatePath } from "next/cache";

import { failure, success } from "@/lib/actions/result";
import { validatePromotion } from "@/lib/validators/promotion";
import { promotionService } from "@/services";

import type { Database } from "@/supabase/types/database.types";
import type { ActionResult } from "@/types/action-result";

type PromotionInsert =
  Database["public"]["Tables"]["promotions"]["Insert"];

type PromotionUpdate =
  Database["public"]["Tables"]["promotions"]["Update"];

export async function createPromotionAction(
  data: PromotionInsert,
): Promise<ActionResult> {
  const validation = validatePromotion({
    name: data.name,
    type: data.type,
    value: data.value,
    priority: data.priority ?? 1,
    quota: data.quota ?? null,
    start_at: data.start_at,
    end_at: data.end_at ?? null,
  });

  if (!validation.valid) {
    return failure(validation.message!);
  }

  await promotionService.create(data);

  revalidatePath("/dashboard/admin/promotion");

  return success("Promotion berhasil dibuat.");
}

export async function updatePromotionAction(
  id: string,
  data: PromotionUpdate,
): Promise<ActionResult> {
  const validation = validatePromotion({
    name: data.name ?? "",
    type: data.type ?? "percentage",
    value: data.value ?? Number.NaN,
    priority: data.priority ?? 1,
    quota: data.quota ?? null,
    start_at: data.start_at ?? "",
    end_at: data.end_at ?? null,
  });

  if (!validation.valid) {
    return failure(validation.message!);
  }

  await promotionService.update(id, data);

  revalidatePath("/dashboard/admin/promotion");

  return success("Promotion berhasil diupdate.");
}

export async function deletePromotionAction(
  id: string,
): Promise<ActionResult> {
  await promotionService.delete(id);

  revalidatePath("/dashboard/admin/promotion");

  return success("Promotion berhasil dihapus.");
}
