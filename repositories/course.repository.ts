import type { Database } from "@/supabase/types/database.types";

import { BaseRepository } from "./base.repository";

type Course =
  Database["public"]["Tables"]["courses"]["Row"];

type CourseInsert =
  Database["public"]["Tables"]["courses"]["Insert"];

type CourseUpdate =
  Database["public"]["Tables"]["courses"]["Update"];

export class CourseRepository extends BaseRepository {

  /* ========================================
     READ
  ======================================== */

  async getAll(): Promise<Course[]> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("title");

    if (error) this.handleError(error);

    return data ?? [];

  }

  async getById(
    id: string
  ): Promise<Course | null> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);

    return data;

  }

  async getBySlug(
    slug: string
  ): Promise<Course | null> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) this.handleError(error);

    return data;

  }

  async getByOrganization(
    organizationId: string
  ): Promise<Course[]> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("organization_id", organizationId)
      .order("title");

    if (error) this.handleError(error);

    return data ?? [];

  }

  async count(): Promise<number> {

    const supabase = await this.db();

    const { count, error } =
      await supabase
        .from("courses")
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
    data: CourseInsert
  ): Promise<Course> {

    const supabase = await this.db();

    const {
      data: created,
      error,
    } = await supabase
      .from("courses")
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
    data: CourseUpdate
  ): Promise<Course> {

    const supabase = await this.db();

    const {
      data: updated,
      error,
    } = await supabase
      .from("courses")
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
        .from("courses")
        .delete()
        .eq("id", id);

    if (error) this.handleError(error);

  }

}

export const courseRepository =
  new CourseRepository();