import { BaseRepository } from "./base.repository";

import type {
  AdminTryoutResultItem,
  CreateTryoutInput,
  CreateTryoutQuestionInput,
  StartTryoutResult,
  Tryout,
  TryoutAttemptPayload,
  TryoutOption,
  TryoutQuestion,
  TryoutResultPayload,
  UpdateTryoutInput,
} from "@/types/tryout";

interface TryoutCourseRow {
  id: string;
  title: string;
  organizations: { title: string } | null;
  programs: { title: string } | null;
}

interface TryoutWithCourseRow extends Tryout {
  courses: TryoutCourseRow | null;
}


export class TryoutRepository extends BaseRepository {
  async getAllWithCourses(): Promise<TryoutWithCourseRow[]> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("tryouts")
      .select(`
        *,
        courses:course_id(
          id,
          title,
          organizations!fk_courses_organization(title),
          programs!fk_courses_program(title)
        )
      `)
      .order("created_at", { ascending: false });

    if (error) this.handleError(error);
    return (data ?? []) as unknown as TryoutWithCourseRow[];
  }

  async getById(id: string): Promise<TryoutWithCourseRow | null> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("tryouts")
      .select(`
        *,
        courses:course_id(
          id,
          title,
          organizations!fk_courses_organization(title),
          programs!fk_courses_program(title)
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);
    return data as unknown as TryoutWithCourseRow | null;
  }

  async getByCourse(courseId: string): Promise<Tryout[]> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("tryouts")
      .select("*")
      .eq("course_id", courseId)
      .in("publication_status", ["scheduled", "published", "closed"])
      .order("open_at", { ascending: true, nullsFirst: false });

    if (error) this.handleError(error);
    return data ?? [];
  }

  async create(input: CreateTryoutInput): Promise<Tryout> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("tryouts")
      .insert({
        course_id: input.courseId,
        title: input.title,
        description: input.description || null,
        duration_minutes: input.durationMinutes,
        max_attempts: input.maxAttempts,
        passing_score: input.passingScore,
        open_at: input.openAt,
        close_at: input.closeAt,
        result_release_mode: input.resultReleaseMode,
        review_release_mode: input.reviewReleaseMode,
        shuffle_questions: input.shuffleQuestions,
        shuffle_options: input.shuffleOptions,
        publication_status: input.publicationStatus,
        created_by: input.createdBy,
      })
      .select("*")
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async update(id: string, input: UpdateTryoutInput): Promise<Tryout> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("tryouts")
      .update({
        course_id: input.courseId,
        title: input.title,
        description: input.description || null,
        duration_minutes: input.durationMinutes,
        max_attempts: input.maxAttempts,
        passing_score: input.passingScore,
        open_at: input.openAt,
        close_at: input.closeAt,
        result_release_mode: input.resultReleaseMode,
        review_release_mode: input.reviewReleaseMode,
        shuffle_questions: input.shuffleQuestions,
        shuffle_options: input.shuffleOptions,
        publication_status: input.publicationStatus,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async delete(id: string): Promise<void> {
    const supabase = await this.db();
    const { error } = await supabase.from("tryouts").delete().eq("id", id);
    if (error) this.handleError(error);
  }

  async getQuestions(tryoutId: string): Promise<TryoutQuestion[]> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("tryout_questions")
      .select("*")
      .eq("tryout_id", tryoutId)
      .order("question_order");

    if (error) this.handleError(error);
    return data ?? [];
  }

  async getOptions(questionIds: string[]): Promise<TryoutOption[]> {
    if (questionIds.length === 0) return [];

    const supabase = await this.db();
    const { data, error } = await supabase
      .from("tryout_options")
      .select("*")
      .in("question_id", questionIds)
      .order("option_order");

    if (error) this.handleError(error);
    return data ?? [];
  }

  async createQuestion(input: CreateTryoutQuestionInput): Promise<string> {
    const supabase = await this.db();
    const { data, error } = await supabase.rpc(
      "admin_create_tryout_question",
      {
        target_tryout_id: input.tryoutId,
        question_text: input.question,
        explanation_text: input.explanation,
        question_image_path: input.imagePath,
        explanation_image_path: input.explanationImagePath,
        topic_text: input.topic,
        difficulty_text: input.difficulty,
        question_points: input.points,
        option_texts: input.options,
        correct_option_index: input.correctOptionIndex,
      },
    );

    if (error) this.handleError(error);
    return this.requireData(data, "Soal Try Out gagal dibuat.");
  }

  async deleteQuestion(questionId: string): Promise<void> {
    const supabase = await this.db();
    const { error } = await supabase.rpc(
      "manage_delete_tryout_question",
      { target_question_id: questionId },
    );

    if (error) this.handleError(error);
  }

  async countQuestionsByTryout(): Promise<Record<string, number>> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("tryout_questions")
      .select("tryout_id");

    if (error) this.handleError(error);

    return (data ?? []).reduce<Record<string, number>>((counts, row) => {
      counts[row.tryout_id] = (counts[row.tryout_id] ?? 0) + 1;
      return counts;
    }, {});
  }

  async countParticipantsByTryout(): Promise<Record<string, number>> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("tryout_results")
      .select("tryout_id");

    if (error) this.handleError(error);

    return (data ?? []).reduce<Record<string, number>>((counts, row) => {
      counts[row.tryout_id] = (counts[row.tryout_id] ?? 0) + 1;
      return counts;
    }, {});
  }

  async getStudentResults(profileId: string, tryoutIds: string[]) {
    if (tryoutIds.length === 0) return [];

    const supabase = await this.db();
    const { data, error } = await supabase
      .from("tryout_results")
      .select("tryout_id, attempts_used, best_score, passed")
      .eq("profile_id", profileId)
      .in("tryout_id", tryoutIds);

    if (error) this.handleError(error);
    return data ?? [];
  }

  async getActiveAttempts(profileId: string, tryoutIds: string[]) {
    if (tryoutIds.length === 0) return [];

    const supabase = await this.db();
    const { data, error } = await supabase
      .from("tryout_attempts")
      .select("id, tryout_id, expires_at")
      .eq("profile_id", profileId)
      .eq("status", "in_progress")
      .in("tryout_id", tryoutIds);

    if (error) this.handleError(error);
    return data ?? [];
  }

  async startAttempt(tryoutId: string): Promise<StartTryoutResult> {
    const supabase = await this.db();
    const { data, error } = await supabase.rpc("start_tryout_attempt", {
      target_tryout_id: tryoutId,
    });

    if (error) this.handleError(error);
    return data as unknown as StartTryoutResult;
  }

  async getAttempt(attemptId: string): Promise<TryoutAttemptPayload> {
    const supabase = await this.db();
    const { data, error } = await supabase.rpc("get_tryout_attempt", {
      target_attempt_id: attemptId,
    });

    if (error) this.handleError(error);
    return data as unknown as TryoutAttemptPayload;
  }

  async saveAnswer(
    attemptId: string,
    questionId: string,
    optionId: string | null,
    markedForReview: boolean,
  ): Promise<void> {
    const supabase = await this.db();
    const { error } = await supabase.rpc("save_tryout_answer", {
      target_attempt_id: attemptId,
      target_question_id: questionId,
      target_option_id: optionId,
      marked_for_review: markedForReview,
    });

    if (error) this.handleError(error);
  }

  async submitAttempt(attemptId: string): Promise<TryoutResultPayload> {
    const supabase = await this.db();
    const { data, error } = await supabase.rpc("submit_tryout_attempt", {
      target_attempt_id: attemptId,
    });

    if (error) this.handleError(error);
    return data as unknown as TryoutResultPayload;
  }

  async getResult(attemptId: string): Promise<TryoutResultPayload> {
    const supabase = await this.db();
    const { data, error } = await supabase.rpc("get_tryout_result", {
      target_attempt_id: attemptId,
    });

    if (error) this.handleError(error);
    return data as unknown as TryoutResultPayload;
  }

  async getAdminResults(tryoutId: string): Promise<AdminTryoutResultItem[]> {
    const supabase = await this.db();
    const { data, error } = await supabase.rpc(
      "get_managed_tryout_results",
      { target_tryout_id: tryoutId },
    );

    if (error) this.handleError(error);

    return (data ?? []).map((row) => ({
      attemptId: row.attempt_id,
      studentName: row.student_name,
      universityOrigin: row.university_origin,
      attemptNumber: row.attempt_number,
      status: row.status,
      score: row.score,
      totalCorrect: row.total_correct,
      totalWrong: row.total_wrong,
      totalUnanswered: row.total_unanswered,
      durationSeconds: row.duration_seconds,
      submittedAt: row.submitted_at,
    }));
  }
}

export const tryoutRepository = new TryoutRepository();
