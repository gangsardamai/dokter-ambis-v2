import { files } from "@/lib/data/files";
import { LessonFile } from "@/types";

export const fileRepository = {
  findAll(): LessonFile[] {
    return files;
  },

  findByLesson(lessonId: string): LessonFile[] {
    return files.filter(
      (file) => file.lessonId === lessonId
    );
  },

  create(data: LessonFile): LessonFile {
    return data;
  },

  update(data: LessonFile): LessonFile {
    return data;
  },

  remove(id: string): boolean {
    return true;
  },
};