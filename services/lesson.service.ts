import { createUniqueSlug } from "@/lib/slug";
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

function getInternalDuration(value: number | null | undefined): number {
  return Number.isInteger(value) && Number(value) > 0
    ? Number(value)
    : 1;
}

export class LessonService {
  async getLessons() {
    return await lessonRepository.getAll();
  }

  async getLessonById(id: string) {
    return await lessonRepository.getById(id);
  }

  async getLessonDetail(slug: string) {
    return await lessonRepository.getBySlug(slug);
  }

  async getLessonsByCourse(courseId: string) {
    return await lessonRepository.getByCourse(courseId);
  }

  async getLessonsByFolder(folderId: string) {
    return await lessonRepository.getByFolder(folderId);
  }

  async getLessonSummaries(folderId: string) {
    return await lessonRepository.getSimpleByFolder(folderId);
  }

  async countLessons() {
    return await lessonRepository.count();
  }

  async createLesson(data: LessonInsert) {
    const slug = await this.generateUniqueSlug(data.title);

    return await lessonRepository.create({
      ...data,
      slug,
      duration: getInternalDuration(data.duration),
    });
  }

  async createLessonWithNextOrder(
    data: AutomaticLessonInsert,
  ) {
    const slug = await this.generateUniqueSlug(data.title);

    return await lessonRepository.createWithNextOrder({
      ...data,
      slug,
      duration: getInternalDuration(data.duration),
    });
  }

  async updateLesson(id: string, data: LessonUpdate) {
    const existing = await lessonRepository.getById(id);

    if (!existing) {
      throw new Error("Lesson tidak ditemukan.");
    }

    return await lessonRepository.update(id, {
      ...data,
      slug: existing.slug,
      duration: data.duration ?? existing.duration,
    });
  }

  async deleteLesson(id: string) {
    return await lessonRepository.delete(id);
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    return await createUniqueSlug(
      title,
      async (candidate) =>
        (await lessonRepository.getBySlug(candidate)) === null,
    );
  }
}

export const lessonService = new LessonService();
