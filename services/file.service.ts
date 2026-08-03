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

  async createFile(data: LessonFileInsert) {
    return await lessonFileRepository.create(data);
  }

  async updateFile(
    id: string,
    data: LessonFileUpdate,
  ) {
    return await lessonFileRepository.update(id, data);
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
}

export const lessonFileService = new LessonFileService();
