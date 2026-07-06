import { liveClassRepository } from "@/repositories";

export class LiveClassService {

  async getLiveClasses() {
    return await liveClassRepository.getAll();
  }

  async getLiveClassById(id: string) {
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

}

export const liveClassService =
  new LiveClassService();