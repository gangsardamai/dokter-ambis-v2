import type { Database } from "@/supabase/types/database.types";

import { BaseRepository } from "./base.repository";

type LessonFolder =
  Database["public"]["Tables"]["lesson_folders"]["Row"];

type LessonFolderInsert =
  Database["public"]["Tables"]["lesson_folders"]["Insert"];

type LessonFolderUpdate =
  Database["public"]["Tables"]["lesson_folders"]["Update"];

export class FolderRepository extends BaseRepository {

  /* ========================================
     READ
  ======================================== */

  async getAll(): Promise<LessonFolder[]> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("lesson_folders")
      .select("*")
      .order("folder_order");

    if (error) this.handleError(error);

    return data ?? [];

  }

  async getById(
    id: string
  ): Promise<LessonFolder | null> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("lesson_folders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);

    return data;

  }

  async getByCourse(
    courseId: string
  ): Promise<LessonFolder[]> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("lesson_folders")
      .select("*")
      .eq("course_id", courseId)
      .order("folder_order");

    if (error) this.handleError(error);

    return data ?? [];

  }

  async getChildren(
    parentFolderId: string
  ): Promise<LessonFolder[]> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("lesson_folders")
      .select("*")
      .eq("parent_folder_id", parentFolderId)
      .order("folder_order");

    if (error) this.handleError(error);

    return data ?? [];

  }

  async getRootFolders(
    courseId: string
  ): Promise<LessonFolder[]> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("lesson_folders")
      .select("*")
      .eq("course_id", courseId)
      .is("parent_folder_id", null)
      .order("folder_order");

    if (error) this.handleError(error);

    return data ?? [];

  }

  async count(): Promise<number> {

    const supabase = await this.db();

    const { count, error } =
      await supabase
        .from("lesson_folders")
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
    data: LessonFolderInsert
  ): Promise<LessonFolder> {

    const supabase = await this.db();

    const {
      data: created,
      error,
    } = await supabase
      .from("lesson_folders")
      .insert(data)
      .select()
      .single();

    if (error) this.handleError(error);

    return created;

  }

  /* ========================================
     UPDATE
  ======================================== */

  async update(
    id: string,
    data: LessonFolderUpdate
  ): Promise<LessonFolder> {

    const supabase = await this.db();

    const {
      data: updated,
      error,
    } = await supabase
      .from("lesson_folders")
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

    const { error } =
      await supabase
        .from("lesson_folders")
        .delete()
        .eq("id", id);

    if (error) this.handleError(error);

  }

}

export const folderRepository =
  new FolderRepository();