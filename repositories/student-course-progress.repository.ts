import type { Database } from "@/supabase/types/database.types";

import { BaseRepository } from "./base.repository";

type Folder = Database["public"]["Tables"]["lesson_folders"]["Row"];
type Lesson = Database["public"]["Tables"]["lessons"]["Row"];
type LessonProgress = Database["public"]["Tables"]["lesson_progress"]["Row"];
type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type QuizResult = Database["public"]["Tables"]["quiz_results"]["Row"];

export interface StudentCourseProgressData {
  folders: Pick<Folder, "id" | "title" | "folder_order">[];
  lessons: Pick<
    Lesson,
    | "id"
    | "folder_id"
    | "title"
    | "lesson_order"
    | "is_required"
    | "publication_status"
  >[];
  lessonProgress: Pick<
    LessonProgress,
    "lesson_id" | "is_completed" | "completed_at"
  >[];
  quizzes: Pick<
    Quiz,
    | "id"
    | "lesson_id"
    | "title"
    | "passing_score"
    | "quiz_order"
    | "publication_status"
  >[];
  quizResults: Pick<
    QuizResult,
    "quiz_id" | "attempts_used" | "best_score" | "last_attempt_at"
  >[];
}

export class StudentCourseProgressRepository extends BaseRepository {
  async getCourseProgressData(
    profileId: string,
    courseId: string,
  ): Promise<StudentCourseProgressData> {
    const supabase = await this.db();

    const [folderResponse, lessonResponse] = await Promise.all([
      supabase
        .from("lesson_folders")
        .select("id, title, folder_order")
        .eq("course_id", courseId)
        .eq("publication_status", "published")
        .order("folder_order"),
      supabase
        .from("lessons")
        .select(
          "id, folder_id, title, lesson_order, is_required, publication_status",
        )
        .eq("course_id", courseId)
        .eq("publication_status", "published")
        .order("lesson_order"),
    ]);

    if (folderResponse.error) this.handleError(folderResponse.error);
    if (lessonResponse.error) this.handleError(lessonResponse.error);

    const folders = folderResponse.data ?? [];
    const lessons = lessonResponse.data ?? [];
    const lessonIds = lessons.map((lesson) => lesson.id);

    if (lessonIds.length === 0) {
      return {
        folders,
        lessons,
        lessonProgress: [],
        quizzes: [],
        quizResults: [],
      };
    }

    const [progressResponse, quizResponse] = await Promise.all([
      supabase
        .from("lesson_progress")
        .select("lesson_id, is_completed, completed_at")
        .eq("profile_id", profileId)
        .in("lesson_id", lessonIds),
      supabase
        .from("quizzes")
        .select(
          "id, lesson_id, title, passing_score, quiz_order, publication_status",
        )
        .eq("publication_status", "published")
        .in("lesson_id", lessonIds)
        .order("quiz_order"),
    ]);

    if (progressResponse.error) this.handleError(progressResponse.error);
    if (quizResponse.error) this.handleError(quizResponse.error);

    const quizzes = quizResponse.data ?? [];
    const quizIds = quizzes.map((quiz) => quiz.id);

    if (quizIds.length === 0) {
      return {
        folders,
        lessons,
        lessonProgress: progressResponse.data ?? [],
        quizzes,
        quizResults: [],
      };
    }

    const { data: quizResults, error: quizResultError } = await supabase
      .from("quiz_results")
      .select("quiz_id, attempts_used, best_score, last_attempt_at")
      .eq("profile_id", profileId)
      .in("quiz_id", quizIds);

    if (quizResultError) this.handleError(quizResultError);

    return {
      folders,
      lessons,
      lessonProgress: progressResponse.data ?? [],
      quizzes,
      quizResults: quizResults ?? [],
    };
  }

  async getLessonForCompletion(
    lessonId: string,
  ): Promise<
    Pick<Lesson, "id" | "course_id" | "publication_status"> | null
  > {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("lessons")
      .select("id, course_id, publication_status")
      .eq("id", lessonId)
      .maybeSingle();

    if (error) this.handleError(error);

    return data;
  }

  async getLessonCompletion(
    profileId: string,
    lessonId: string,
  ): Promise<Pick<LessonProgress, "is_completed"> | null> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("lesson_progress")
      .select("is_completed")
      .eq("profile_id", profileId)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    if (error) this.handleError(error);

    return data;
  }

  async setLessonCompletion(
    profileId: string,
    lessonId: string,
    completed: boolean,
  ): Promise<boolean> {
    const supabase = await this.db();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("lesson_progress")
      .upsert(
        {
          profile_id: profileId,
          lesson_id: lessonId,
          is_completed: completed,
          progress_percent: completed ? 100 : 0,
          last_position_seconds: 0,
          last_accessed_at: now,
          completed_at: completed ? now : null,
          updated_at: now,
        },
        {
          onConflict: "profile_id,lesson_id",
        },
      )
      .select("is_completed")
      .single();

    if (error) this.handleError(error);

    return data.is_completed;
  }
}

export const studentCourseProgressRepository =
  new StudentCourseProgressRepository();
