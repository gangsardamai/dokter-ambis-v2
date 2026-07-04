import { LiveClass } from "@/types";

import { liveClassRepository } from "@/lib/repositories/live-class.repository";

export const liveClassService = {
  getLiveClassesByLesson(
    lessonId: string
  ): LiveClass[] {
    return liveClassRepository.findByLesson(
      lessonId
    );
  },
};