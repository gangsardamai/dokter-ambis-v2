import { deleteStoredCourseFile } from "@/lib/file/delete-stored-course-file";
import {
  lessonFileRepository,
  lessonRepository,
} from "@/repositories";

import type { Database } from "@/supabase/types/database.types";

type LessonFileInsert =
  Database["public"]["Tables"]["lesson_files"]["Insert"];

type LessonFileUpdate =
  Database["public"]["Tables"]["lesson_files"]["Update"];

type LessonFileCreateData = Omit<
  LessonFileInsert,
  "file_order"
>;

export class LessonFileService {
  async getFiles() {
    return await lessonFileRepository.getAll();
  }

  async getFileById(id: string) {
    return await lessonFileRepository.getById(id);
  }

  async getFilesByLesson(lessonId: string) {
    return await lessonFileRepository.getByLesson(lessonId);
  }

  async getFilesByCourse(courseId: string) {
    return await lessonFileRepository.getByCourse(courseId);
  }

  async countFiles() {
    return await lessonFileRepository.count();
  }

  async createFile(data: LessonFileCreateData) {
    const fileOrder = await this.getNextFileOrder(
      data.lesson_id,
    );

    return await lessonFileRepository.create({
      ...data,
      file_order: fileOrder,
    });
  }

  async updateFile(
    id: string,
    data: LessonFileUpdate,
  ) {
    const existing = await lessonFileRepository.getById(id);

    if (!existing) {
      throw new Error(
        "File tidak ditemukan atau Anda tidak memiliki akses.",
      );
    }

    const {
      file_order: _ignoredFileOrder,
      ...safeData
    } = data;
    void _ignoredFileOrder;

    const targetLessonId =
      safeData.lesson_id ?? existing.lesson_id;
    const lessonChanged =
      targetLessonId !== existing.lesson_id;
    const fileOrder = lessonChanged
      ? await this.getNextFileOrder(targetLessonId)
      : existing.file_order;

    return await lessonFileRepository.update(id, {
      ...safeData,
      file_order: fileOrder,
    });
  }

  async deleteFile(
    id: string,
    expectedCourseId?: string,
  ) {
    const file = await lessonFileRepository.getById(id);

    if (!file) {
      throw new Error(
        "File tidak ditemukan atau Anda tidak memiliki akses.",
      );
    }

    const lesson = await lessonRepository.getById(
      file.lesson_id,
    );

    if (!lesson) {
      throw new Error(
        "Lesson pemilik file tidak ditemukan atau tidak dapat diakses.",
      );
    }

    if (
      expectedCourseId &&
      lesson.course_id !== expectedCourseId
    ) {
      throw new Error(
        "File tidak termasuk dalam course yang dipilih.",
      );
    }

    await deleteStoredCourseFile(file.file_path, lesson);
    await lessonFileRepository.delete(id);

    return { courseId: lesson.course_id };
  }

  private async getNextFileOrder(
    lessonId: string,
  ): Promise<number> {
    const files = await lessonFileRepository.getByLesson(
      lessonId,
    );

    return files.reduce(
      (highestOrder, file) =>
        Math.max(highestOrder, file.file_order),
      0,
    ) + 1;
  }
}

export const lessonFileService = new LessonFileService();
