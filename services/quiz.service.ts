import { quizRepository } from "@/repositories";

import type { Database } from "@/supabase/types/database.types";

type QuizInsert =
  Database["public"]["Tables"]["quizzes"]["Insert"];

type QuizUpdate =
  Database["public"]["Tables"]["quizzes"]["Update"];

export class QuizService {

  /* ========================================
     READ
  ======================================== */

  async getQuizzes() {
    return await quizRepository.getAll();
  }

  async getQuizById(
    id: string
  ) {
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

  /* ========================================
     CREATE
  ======================================== */

  async createQuiz(
    data: QuizInsert
  ) {
    return await quizRepository.create(
      data
    );
  }

  /* ========================================
     UPDATE
  ======================================== */

  async updateQuiz(
    id: string,
    data: QuizUpdate
  ) {
    return await quizRepository.update(
      id,
      data
    );
  }

  /* ========================================
     DELETE
  ======================================== */

  async deleteQuiz(
    id: string
  ) {
    return await quizRepository.delete(
      id
    );
  }

}

export const quizService =
  new QuizService();