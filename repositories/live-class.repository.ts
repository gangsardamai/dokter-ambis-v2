import { liveClasses } from "@/lib/data/live-classes";
import { LiveClass } from "@/types";

export const liveClassRepository = {
  findAll(): LiveClass[] {
    return liveClasses;
  },

  findByLesson(lessonId: string): LiveClass[] {
    return liveClasses.filter(
      (liveClass) => liveClass.lessonId === lessonId
    );
  },

  create(data: LiveClass): LiveClass {
    return data;
  },

  update(data: LiveClass): LiveClass {
    return data;
  },

  remove(id: string): boolean {
    return true;
  },
};