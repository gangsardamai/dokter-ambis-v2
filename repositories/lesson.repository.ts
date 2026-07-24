import type { Database } from "@/supabase/types/database.types";

import { BaseRepository } from "./base.repository";

type Lesson =
  Database["public"]["Tables"]["lessons"]["Row"];

type LessonInsert =
  Database["public"]["Tables"]["lessons"]["Insert"];

type LessonUpdate =
  Database["public"]["Tables"]["lessons"]["Update"];

export type AutomaticLessonInsert = Omit<
  LessonInsert,
  "lesson_order"
>;

interface RpcError {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
}

interface RpcResponse<T> {
  data: T | T[] | null;
  error: RpcError | null;
}

interface LessonRpcClient {
  rpc<T>(
    functionName: string,
    args: Record<string, unknown>,
  ): Promise<RpcResponse<T>>;
}

export class LessonRepository extends BaseRepository {

  /* ========================================
     READ
  ======================================== */

  async getAll(): Promise<Lesson[]> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .order("lesson_order");

    if (error) this.handleError(error);

    return data ?? [];
  }

  async getById(
    id: string
  ): Promise<Lesson | null> {

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

  async getByFolder(
    folderId: string
  ): Promise<Lesson[]> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("folder_id", folderId)
      .order("lesson_order");

    if (error) this.handleError(error);

    return data ?? [];
  }

  async getSimpleByFolder(
    folderId: string
  ) {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("lessons")
      .select(`
        id,
        title,
        lesson_order,
        duration,
        is_free
      `)
      .eq("folder_id", folderId)
      .order("lesson_order");

    if (error) this.handleError(error);

    return data ?? [];
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

  /* ========================================
     CREATE
  ======================================== */

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

  async createWithNextOrder(
    data: AutomaticLessonInsert,
  ): Promise<Lesson> {
    const supabase = await this.db();
    const client = supabase as unknown as LessonRpcClient;

    const { data: result, error } = await client.rpc<Lesson>(
      "create_lesson_with_next_order",
      {
        target_course_id: data.course_id,
        target_folder_id: data.folder_id ?? null,
        lesson_title: data.title,
        lesson_slug: data.slug,
        lesson_description: data.description ?? "",
        lesson_duration: data.duration,
        lesson_is_free: data.is_free ?? false,
        lesson_is_required: data.is_required ?? true,
        lesson_publication_status:
          data.publication_status ?? "draft",
      },
    );

    if (error) this.handleError(error);

    const created = Array.isArray(result)
      ? result[0] ?? null
      : result;

    return this.requireData(
      created,
      "Lesson gagal dibuat.",
    );
  }

  /* ========================================
     UPDATE
  ======================================== */

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

  /* ========================================
     DELETE
  ======================================== */

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