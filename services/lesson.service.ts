import { lessonRepository } from "@/repositories";

import type { Database } from "@/supabase/types/database.types";

type LessonInsert =
  Database["public"]["Tables"]["lessons"]["Insert"];

type LessonUpdate =
  Database["public"]["Tables"]["lessons"]["Update"];

type AutomaticLessonInsert = Omit<
  LessonInsert,
  "lesson_order"
>;

export class LessonService {

  /* ========================================
     READ
  ======================================== */

  async getLessons() {
    return await lessonRepository.getAll();
  }

  async getLessonById(
    id: string
  ) {
    return await lessonRepository.getById(id);
  }

  async getLessonDetail(
    slug: string
  ) {
    return await lessonRepository.getBySlug(
      slug
    );
  }

  async getLessonsByCourse(
    courseId: string
  ) {
    return await lessonRepository.getByCourse(
      courseId
    );
  }

  async getLessonsByFolder(
    folderId: string
  ) {
    return await lessonRepository.getByFolder(
      folderId
    );
  }

  async getLessonSummaries(
    folderId: string
  ) {
    return await lessonRepository.getSimpleByFolder(
      folderId
    );
  }

  async countLessons() {
    return await lessonRepository.count();
  }

  /* ========================================
     CREATE
  ======================================== */

  async createLesson(
    data: LessonInsert
  ) {
    return await lessonRepository.create(
      data
    );
  }

  async createLessonWithNextOrder(
    data: AutomaticLessonInsert,
  ) {
    return await lessonRepository.createWithNextOrder(
      data,
    );
  }

  /* ========================================
     UPDATE
  ======================================== */

  async updateLesson(
    id: string,
    data: LessonUpdate
  ) {
    return await lessonRepository.update(
      id,
      data
    );
  }

  /* ========================================
     DELETE
  ======================================== */

  async deleteLesson(
    id: string
  ) {
    return await lessonRepository.delete(
      id
    );
  }

}

export const lessonService =
  new LessonService();