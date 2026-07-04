import { videos } from "@/lib/data/videos";
import { Video } from "@/types";

export const videoRepository = {
  findAll(): Video[] {
    return videos;
  },

  findByLesson(lessonId: string): Video[] {
    return videos.filter(
      (video) => video.lessonId === lessonId
    );
  },

  create(data: Video): Video {
    return data;
  },

  update(data: Video): Video {
    return data;
  },

  remove(id: string): boolean {
    return true;
  },
};