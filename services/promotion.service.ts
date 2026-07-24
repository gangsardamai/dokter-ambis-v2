import {
  promotionRepository,
} from "@/repositories";

import type { Database } from "@/supabase/types/database.types";

type PromotionInsert =
  Database["public"]["Tables"]["promotions"]["Insert"];

type PromotionUpdate =
  Database["public"]["Tables"]["promotions"]["Update"];

export class PromotionService {
  async getAll() {
    return promotionRepository.getAll();
  }

  async getById(
    id: string,
  ) {
    return promotionRepository.getById(id);
  }

  async create(
    data: PromotionInsert,
  ) {
    return promotionRepository.create(data);
  }

  async update(
    id: string,
    data: PromotionUpdate,
  ) {
    return promotionRepository.update(id, data);
  }

  async delete(
    id: string,
  ) {
    return promotionRepository.delete(id);
  }
}

export const promotionService =
  new PromotionService();
