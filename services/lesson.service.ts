import { lessonRepository } from "@/repositories";

export class LessonService {

  async getLessons() {
    return await lessonRepository.getAll();
  }

  async getLessonById(id: string) {
    return await lessonRepository.getById(id);
  }

  async getLessonBySlug(slug: string) {
    return await lessonRepository.getBySlug(slug);
  }

  async getLessonDetail(slug: string) {
    return await lessonRepository.getDetailBySlug(slug);
  }

  async getLessonsByCourse(courseId: string) {
    return await lessonRepository.getByCourse(courseId);
  }

  async countLessons() {
    return await lessonRepository.count();
  }

}

export const lessonService =
  new LessonService();