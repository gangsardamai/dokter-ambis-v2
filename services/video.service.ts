import { Video } from "@/types";

import { videoRepository } from "@/lib/repositories/video.repository";

export const videoService = {
  getVideosByLesson(
    lessonId: string
  ): Video[] {
    return videoRepository.findByLesson(
      lessonId
    );
  },
};