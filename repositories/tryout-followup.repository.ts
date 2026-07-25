import { BaseRepository } from "./base.repository";

import type {
  CreateTryoutQuestionInput,
  StudentTryoutSummary,
  TryoutReviewPayload,
} from "@/types/tryout";

export class TryoutFollowupRepository extends BaseRepository {
  async getStudentSummaries(
    courseId: string,
  ): Promise<StudentTryoutSummary[]> {
    const supabase = await this.db();
    const { data, error } = await supabase.rpc(
      "get_student_tryout_summaries",
      { target_course_id: courseId },
    );

    if (error) this.handleError(error);
    return (data ?? []) as unknown as StudentTryoutSummary[];
  }

  async getReview(attemptId: string): Promise<TryoutReviewPayload> {
    const supabase = await this.db();
    const { data, error } = await supabase.rpc("get_tryout_review", {
      target_attempt_id: attemptId,
    });

    if (error) this.handleError(error);
    return data as unknown as TryoutReviewPayload;
  }

  async updateQuestion(
    questionId: string,
    input: Omit<CreateTryoutQuestionInput, "tryoutId">,
  ): Promise<string> {
    const supabase = await this.db();
    const { data, error } = await supabase.rpc(
      "admin_update_tryout_question",
      {
        target_question_id: questionId,
        question_text: input.question,
        explanation_text: input.explanation,
        topic_text: input.topic,
        difficulty_text: input.difficulty,
        question_points: input.points,
        option_texts: input.options,
        correct_option_index: input.correctOptionIndex,
      },
    );

    if (error) this.handleError(error);
    return this.requireData(data, "Soal Try Out gagal diperbarui.");
  }
}

export const tryoutFollowupRepository = new TryoutFollowupRepository();
