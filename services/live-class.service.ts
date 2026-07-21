import { liveClassRepository } from "@/repositories";

import type { Database } from "@/supabase/types/database.types";

type LiveClassInsert =
  Database["public"]["Tables"]["live_classes"]["Insert"];

type LiveClassUpdate =
  Database["public"]["Tables"]["live_classes"]["Update"];

export class LiveClassService {

  /* ========================================
     READ
  ======================================== */

  async getLiveClasses() {
    return await liveClassRepository.getAll();
  }

  async getLiveClassById(
    id: string
  ) {
    return await liveClassRepository.getById(id);
  }

  async getLiveClassesByLesson(
    lessonId: string
  ) {
    return await liveClassRepository.getByLesson(
      lessonId
    );
  }

  async countLiveClasses() {
    return await liveClassRepository.count();
  }

  /* ========================================
     CREATE
  ======================================== */

  async createLiveClass(
    data: LiveClassInsert
  ) {
    return await liveClassRepository.create(
      data
    );
  }

  /* ========================================
     UPDATE
  ======================================== */

  async updateLiveClass(
    id: string,
    data: LiveClassUpdate
  ) {
    return await liveClassRepository.update(
      id,
      data
    );
  }

  /* ========================================
     DELETE
  ======================================== */

  async deleteLiveClass(
    id: string
  ) {
    return await liveClassRepository.delete(
      id
    );
  }

}

export const liveClassService =
  new LiveClassService();