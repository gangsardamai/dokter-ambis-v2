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

    return await promotionRepository.getAll();

  }

  async getById(
    id: string
  ) {

    return await promotionRepository.getById(
      id
    );

  }

  async create(
    data: PromotionInsert
  ) {

    return await promotionRepository.create(
      data
    );

  }

  async update(
    id: string,
    data: PromotionUpdate
  ) {

    return await promotionRepository.update(
      id,
      data
    );

  }

  async delete(
    id: string
  ) {

    return await promotionRepository.delete(
      id
    );

  }

}

export const promotionService =
  new PromotionService();