import { Lesson } from "@/types";

import { lessonRepository } from "@/lib/repositories/lesson.repository";

export const lessonService = {
  getLessons(): Lesson[] {
    return lessonRepository.findAll();
  },

  getLessonById(
    id: string
  ): Lesson | undefined {
    return lessonRepository.findById(id);
  },

  getLessonsByCourse(
    courseId: string
  ): Lesson[] {
    return lessonRepository.findByCourse(courseId);
  },
};