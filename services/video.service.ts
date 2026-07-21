import { videoRepository } from "@/repositories";

import type { Database } from "@/supabase/types/database.types";

type VideoInsert =
  Database["public"]["Tables"]["videos"]["Insert"];

type VideoUpdate =
  Database["public"]["Tables"]["videos"]["Update"];

export class VideoService {

  /* ========================================
     READ
  ======================================== */

  async getVideos() {
    return await videoRepository.getAll();
  }

  async getVideoById(
    id: string
  ) {
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

  /* ========================================
     CREATE
  ======================================== */

  async createVideo(
    data: VideoInsert
  ) {
    return await videoRepository.create(
      data
    );
  }

  /* ========================================
     UPDATE
  ======================================== */

  async updateVideo(
    id: string,
    data: VideoUpdate
  ) {
    return await videoRepository.update(
      id,
      data
    );
  }

  /* ========================================
     DELETE
  ======================================== */

  async deleteVideo(
    id: string
  ) {
    return await videoRepository.delete(
      id
    );
  }

}

export const videoService =
  new VideoService();