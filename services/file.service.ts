import { lessonFileRepository } from "@/repositories";

import type { Database } from "@/supabase/types/database.types";

type LessonFileInsert =
  Database["public"]["Tables"]["lesson_files"]["Insert"];

type LessonFileUpdate =
  Database["public"]["Tables"]["lesson_files"]["Update"];

export class LessonFileService {

  /* ========================================
     READ
  ======================================== */

  async getFiles() {
    return await lessonFileRepository.getAll();
  }

  async getFileById(
    id: string
  ) {
    return await lessonFileRepository.getById(id);
  }

  async getFilesByLesson(
    lessonId: string
  ) {
    return await lessonFileRepository.getByLesson(
      lessonId
    );
  }

  async countFiles() {
    return await lessonFileRepository.count();
  }

  /* ========================================
     CREATE
  ======================================== */

  async createFile(
    data: LessonFileInsert
  ) {
    return await lessonFileRepository.create(
      data
    );
  }

  /* ========================================
     UPDATE
  ======================================== */

  async updateFile(
    id: string,
    data: LessonFileUpdate
  ) {
    return await lessonFileRepository.update(
      id,
      data
    );
  }

  /* ========================================
     DELETE
  ======================================== */

  async deleteFile(
    id: string
  ) {
    return await lessonFileRepository.delete(
      id
    );
  }

}

export const lessonFileService =
  new LessonFileService();