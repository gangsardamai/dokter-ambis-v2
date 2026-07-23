import type { Database } from "@/supabase/types/database.types";
import { BaseRepository } from "./base.repository";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type QuizInsert = Database["public"]["Tables"]["quizzes"]["Insert"];
type QuizUpdate = Database["public"]["Tables"]["quizzes"]["Update"];

export class QuizRepository extends BaseRepository {

  async getAll(): Promise<Quiz[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .order("created_at");

    if (error) this.handleError(error);

    return data ?? [];
  }

  async getById(id: string): Promise<Quiz | null> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);

    return data;
  }

  async getByLesson(
    lessonId: string
  ): Promise<Quiz[]> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("quiz_order");

    if (error) this.handleError(error);

    return data ?? [];
  }

  async getByCourse(
    courseId: string
  ): Promise<Quiz[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("quizzes")
      .select("*, lessons!inner(course_id)")
      .eq("lessons.course_id", courseId)
      .order("quiz_order");

    if (error) this.handleError(error);

    return (data ?? []).map((row) => {
      const { lessons: _lessons, ...quiz } = row;
      void _lessons;
      return quiz;
    });
  }

  async exists(id: string): Promise<boolean> {
    const supabase = await this.db();

    const { count, error } = await supabase
      .from("quizzes")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("id", id);

    if (error) this.handleError(error);

    return (count ?? 0) > 0;
  }

  async count(): Promise<number> {
    const supabase = await this.db();

    const { count, error } = await supabase
      .from("quizzes")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) this.handleError(error);

    return count ?? 0;
  }

  async create(
    data: QuizInsert
  ): Promise<Quiz> {

    const supabase = await this.db();

    const { data: created, error } = await supabase
      .from("quizzes")
      .insert(data)
      .select()
      .single();

    if (error) this.handleError(error);

    return created;
  }

  async update(
    id: string,
    data: QuizUpdate
  ): Promise<Quiz> {

    const supabase = await this.db();

    const { data: updated, error } = await supabase
      .from("quizzes")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) this.handleError(error);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const supabase = await this.db();

    const { error } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", id);

    if (error) this.handleError(error);
  }
}

export const quizRepository =
  new QuizRepository();