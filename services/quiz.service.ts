import { quizRepository } from "@/repositories";

export class QuizService {

  async getQuizzes() {
    return await quizRepository.getAll();
  }

  async getQuizById(id: string) {
    return await quizRepository.getById(id);
  }

  async getQuizzesByLesson(
    lessonId: string
  ) {
    return await quizRepository.getByLesson(
      lessonId
    );
  }

  async countQuizzes() {
    return await quizRepository.count();
  }

}

export const quizService =
  new QuizService();