import { lessons } from "@/lib/data/lessons";
import { Lesson } from "@/types";

export const lessonRepository = {
  findAll(): Lesson[] {
    return lessons;
  },

  findById(id: string): Lesson | undefined {
    return lessons.find((lesson) => lesson.id === id);
  },

  findByCourse(courseId: string): Lesson[] {
    return lessons.filter(
      (lesson) => lesson.courseId === courseId
    );
  },

  create(data: Lesson): Lesson {
    return data;
  },

  update(data: Lesson): Lesson {
    return data;
  },

  remove(id: string): boolean {
    return true;
  },
};