import { createClient } from "@/lib/supabase/server";

import type { Database } from "@/supabase/types/database.types";

type Promotion =
  Database["public"]["Tables"]["promotions"]["Row"];

type PromotionInsert =
  Database["public"]["Tables"]["promotions"]["Insert"];

type PromotionUpdate =
  Database["public"]["Tables"]["promotions"]["Update"];

export interface PromotionApplicationResult {
  promotion_id: string;
  promotion_code: string;
  promotion_name: string;
  discount_amount: number;
  final_amount: number;
}

export class PromotionRepository {
  async getAll(): Promise<Promotion[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .order("priority")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async getById(
    id: string,
  ): Promise<Promotion | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async applyCode(
    enrollmentId: string,
    code: string,
  ): Promise<PromotionApplicationResult> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
      "apply_promotion_code",
      {
        target_enrollment_id: enrollmentId,
        submitted_code: code,
      },
    );

    if (error) {
      throw error;
    }

    return data as unknown as PromotionApplicationResult;
  }

  async create(
    promotion: PromotionInsert,
  ): Promise<Promotion> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("promotions")
      .insert(promotion)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async update(
    id: string,
    promotion: PromotionUpdate,
  ): Promise<Promotion> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("promotions")
      .update(promotion)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async delete(
    id: string,
  ): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("promotions")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }
  }
}

export const promotionRepository =
  new PromotionRepository();
