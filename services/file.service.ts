import { lessonFileRepository } from "@/repositories";

export class LessonFileService {

  async getFiles() {
    return await lessonFileRepository.getAll();
  }

  async getFileById(id: string) {
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

}

export const lessonFileService =
  new LessonFileService();