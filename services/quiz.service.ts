import { Quiz } from "@/types";

import { quizRepository } from "@/lib/repositories/quiz.repository";

export const quizService = {
  getQuizzesByLesson(
    lessonId: string
  ): Quiz[] {
    return quizRepository.findByLesson(
      lessonId
    );
  },
};