import type { Database } from "@/supabase/types/database.types";

import { BaseRepository } from "./base.repository";

type Course =
  Database["public"]["Tables"]["courses"]["Row"];

type CourseInsert =
  Database["public"]["Tables"]["courses"]["Insert"];

type CourseUpdate =
  Database["public"]["Tables"]["courses"]["Update"];

type OrganizationSummary = Pick<
  Database["public"]["Tables"]["organizations"]["Row"],
  "id" | "title" | "short_name" | "slug" | "status"
>;

type ProgramSummary = Pick<
  Database["public"]["Tables"]["programs"]["Row"],
  "id" | "title" | "slug" | "status"
>;

export type CourseDetails = Course & {
  organization: OrganizationSummary | null;
  program: ProgramSummary | null;
};

export class CourseRepository extends BaseRepository {
  /* ========================================
     READ
  ======================================== */

  async getAll(): Promise<Course[]> {
    const supabase =
      await this.db();

    const { data, error } =
      await supabase
        .from("courses")
        .select("*")
        .order("title");

    if (error) {
      this.handleError(error);
    }

    return data ?? [];
  }

  async getAvailableCourses(): Promise<Course[]> {
    const supabase =
      await this.db();

    const { data, error } =
      await supabase
        .from("courses")
        .select("*")
        .eq("status", "active")
        .order("title");

    if (error) {
      this.handleError(error);
    }

    return data ?? [];
  }

  async getAvailableCourseDetails(): Promise<
    CourseDetails[]
  > {
    const supabase =
      await this.db();

    const { data, error } =
      await supabase
        .from("courses")
        .select(`
          *,
          organization:organizations!fk_courses_organization (
            id,
            title,
            short_name,
            slug,
            status
          ),
          program:programs!fk_courses_program (
            id,
            title,
            slug,
            status
          )
        `)
        .eq("status", "active")
        .order("title");

    if (error) {
      this.handleError(error);
    }

    return (
      data ?? []
    ) as CourseDetails[];
  }

  async getAvailableCourseDetailById(
    id: string,
  ): Promise<CourseDetails | null> {
    const supabase =
      await this.db();

    const { data, error } =
      await supabase
        .from("courses")
        .select(`
          *,
          organization:organizations!fk_courses_organization (
            id,
            title,
            short_name,
            slug,
            status
          ),
          program:programs!fk_courses_program (
            id,
            title,
            slug,
            status
          )
        `)
        .eq("id", id)
        .eq("status", "active")
        .maybeSingle();

    if (error) {
      this.handleError(error);
    }

    return data as CourseDetails | null;
  }

  async getById(
    id: string,
  ): Promise<Course | null> {
    const supabase =
      await this.db();

    const { data, error } =
      await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
      this.handleError(error);
    }

    return data;
  }

  async getBySlug(
    slug: string,
  ): Promise<Course | null> {
    const supabase =
      await this.db();

    const { data, error } =
      await supabase
        .from("courses")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

    if (error) {
      this.handleError(error);
    }

    return data;
  }

  async getByOrganization(
    organizationId: string,
  ): Promise<Course[]> {
    const supabase =
      await this.db();

    const { data, error } =
      await supabase
        .from("courses")
        .select("*")
        .eq(
          "organization_id",
          organizationId,
        )
        .order("title");

    if (error) {
      this.handleError(error);
    }

    return data ?? [];
  }

  async count(): Promise<number> {
    const supabase =
      await this.db();

    const { count, error } =
      await supabase
        .from("courses")
        .select("*", {
          count: "exact",
          head: true,
        });

    if (error) {
      this.handleError(error);
    }

    return count ?? 0;
  }

  /* ========================================
     CREATE
  ======================================== */

  async create(
    data: CourseInsert,
  ): Promise<Course> {
    const supabase =
      await this.db();

    const {
      data: created,
      error,
    } = await supabase
      .from("courses")
      .insert(data)
      .select()
      .single();

    if (error) {
      this.handleError(error);
    }

    return created;
  }

  /* ========================================
     UPDATE
  ======================================== */

  async update(
    id: string,
    data: CourseUpdate,
  ): Promise<Course> {
    const supabase =
      await this.db();

    const {
      data: updated,
      error,
    } = await supabase
      .from("courses")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      this.handleError(error);
    }

    return updated;
  }

  /* ========================================
     DELETE
  ======================================== */

  async delete(
    id: string,
  ): Promise<void> {
    const supabase =
      await this.db();

    const { error } =
      await supabase
        .from("courses")
        .delete()
        .eq("id", id);

    if (error) {
      this.handleError(error);
    }
  }
}

export const courseRepository =
  new CourseRepository();