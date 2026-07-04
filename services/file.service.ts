import { LessonFile } from "@/types";

import { fileRepository } from "@/lib/repositories/file.repository";

export const fileService = {
  getFilesByLesson(
    lessonId: string
  ): LessonFile[] {
    return fileRepository.findByLesson(
      lessonId
    );
  },
};