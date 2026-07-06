import type { Database } from "@/supabase/types/database.types";
import { BaseRepository } from "./base.repository";

type Lesson = Database["public"]["Tables"]["lessons"]["Row"];
type LessonInsert = Database["public"]["Tables"]["lessons"]["Insert"];
type LessonUpdate = Database["public"]["Tables"]["lessons"]["Update"];

export class LessonRepository extends BaseRepository {

  async getAll(): Promise<Lesson[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .order("lesson_order");

    if (error) this.handleError(error);

    return data ?? [];
  }

  async getById(id: string): Promise<Lesson | null> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);

    return data;
  }

  async getBySlug(
    slug: string
  ): Promise<Lesson | null> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) this.handleError(error);

    return data;
  }

  /**
   * Digunakan oleh:
   * app/materi/[lessonSlug]/page.tsx
   *
   * Saat ini sama dengan getBySlug().
   * Nanti apabila halaman materi membutuhkan relasi
   * Course / Mentor / Progress, cukup ubah method ini
   * tanpa mengubah Page ataupun Service.
   */
  async getDetailBySlug(
    slug: string
  ): Promise<Lesson | null> {

    return await this.getBySlug(slug);

  }

  async getByCourse(
    courseId: string
  ): Promise<Lesson[]> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("lesson_order");

    if (error) this.handleError(error);

    return data ?? [];
  }

  async exists(
    id: string
  ): Promise<boolean> {

    const supabase = await this.db();

    const { count, error } = await supabase
      .from("lessons")
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
      .from("lessons")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) this.handleError(error);

    return count ?? 0;
  }

  async create(
    data: LessonInsert
  ): Promise<Lesson> {

    const supabase = await this.db();

    const { data: created, error } = await supabase
      .from("lessons")
      .insert(data)
      .select()
      .single();

    if (error) this.handleError(error);

    return created;
  }

  async update(
    id: string,
    data: LessonUpdate
  ): Promise<Lesson> {

    const supabase = await this.db();

    const { data: updated, error } = await supabase
      .from("lessons")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) this.handleError(error);

    return updated;
  }

  async delete(
    id: string
  ): Promise<void> {

    const supabase = await this.db();

    const { error } = await supabase
      .from("lessons")
      .delete()
      .eq("id", id);

    if (error) this.handleError(error);
  }

}

export const lessonRepository =
  new LessonRepository();