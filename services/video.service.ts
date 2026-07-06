import { videoRepository } from "@/repositories";

export class VideoService {

  async getVideos() {
    return await videoRepository.getAll();
  }

  async getVideoById(id: string) {
    return await videoRepository.getById(id);
  }

  async getVideosByLesson(
    lessonId: string
  ) {
    return await videoRepository.getByLesson(
      lessonId
    );
  }

  async countVideos() {
    return await videoRepository.count();
  }

}

export const videoService =
  new VideoService();