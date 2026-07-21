"use server";

import { revalidatePath } from "next/cache";

import { quizService } from "@/services";

import type { Database } from "@/supabase/types/database.types";

type QuizInsert =
  Database["public"]["Tables"]["quizzes"]["Insert"];

type QuizUpdate =
  Database["public"]["Tables"]["quizzes"]["Update"];

export async function createQuizAction(
  data: QuizInsert
) {

  await quizService.createQuiz(data);

  revalidatePath(
    "/dashboard/admin/quiz"
  );

}

export async function updateQuizAction(
  id: string,
  data: QuizUpdate
) {

  await quizService.updateQuiz(
    id,
    data
  );

  revalidatePath(
    "/dashboard/admin/quiz"
  );

  revalidatePath(
    `/dashboard/admin/quiz/${id}`
  );

}

export async function deleteQuizAction(
  id: string
) {

  await quizService.deleteQuiz(id);

  revalidatePath(
    "/dashboard/admin/quiz"
  );

}