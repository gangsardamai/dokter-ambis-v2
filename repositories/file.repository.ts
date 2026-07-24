import type { Database } from "@/supabase/types/database.types";
import { BaseRepository } from "./base.repository";

type LessonFile = Database["public"]["Tables"]["lesson_files"]["Row"];
type LessonFileInsert = Database["public"]["Tables"]["lesson_files"]["Insert"];
type LessonFileUpdate = Database["public"]["Tables"]["lesson_files"]["Update"];

export class LessonFileRepository extends BaseRepository {

  async getAll(): Promise<LessonFile[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("lesson_files")
      .select("*")
      .order("created_at");

    if (error) this.handleError(error);

    return data ?? [];
  }

  async getById(id: string): Promise<LessonFile | null> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("lesson_files")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);

    return data;
  }

  async getByLesson(
    lessonId: string
  ): Promise<LessonFile[]> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("lesson_files")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("file_order");

    if (error) this.handleError(error);

    return data ?? [];
  }

  async getByCourse(
    courseId: string
  ): Promise<LessonFile[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("lesson_files")
      .select("*, lessons!inner(course_id)")
      .eq("lessons.course_id", courseId)
      .order("file_order");

    if (error) this.handleError(error);

    return (data ?? []).map((row) => {
      const { lessons: _lessons, ...file } = row;
      void _lessons;
      return file;
    });
  }

  async exists(id: string): Promise<boolean> {
    const supabase = await this.db();

    const { count, error } = await supabase
      .from("lesson_files")
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
      .from("lesson_files")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) this.handleError(error);

    return count ?? 0;
  }

  async create(
    data: LessonFileInsert
  ): Promise<LessonFile> {

    const supabase = await this.db();

    const { data: created, error } = await supabase
      .from("lesson_files")
      .insert(data)
      .select()
      .single();

    if (error) this.handleError(error);

    return created;
  }

  async update(
    id: string,
    data: LessonFileUpdate
  ): Promise<LessonFile> {

    const supabase = await this.db();

    const { data: updated, error } = await supabase
      .from("lesson_files")
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
      .from("lesson_files")
      .delete()
      .eq("id", id);

    if (error) this.handleError(error);
  }
}

export const lessonFileRepository =
  new LessonFileRepository();