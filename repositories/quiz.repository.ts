import { quizzes } from "@/lib/data/quizzes";
import { Quiz } from "@/types";

export const quizRepository = {
  findAll(): Quiz[] {
    return quizzes;
  },

  findByLesson(lessonId: string): Quiz[] {
    return quizzes.filter(
      (quiz) => quiz.lessonId === lessonId
    );
  },

  create(data: Quiz): Quiz {
    return data;
  },

  update(data: Quiz): Quiz {
    return data;
  },

  remove(id: string): boolean {
    return true;
  },
};