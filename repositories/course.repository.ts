import type { Database } from "@/supabase/types/database.types";
import { BaseRepository } from "./base.repository";

type Course = Database["public"]["Tables"]["courses"]["Row"];
type CourseInsert = Database["public"]["Tables"]["courses"]["Insert"];
type CourseUpdate = Database["public"]["Tables"]["courses"]["Update"];

export class CourseRepository extends BaseRepository {

  async getAll(): Promise<Course[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("status", "active")
      .order("title");

    if (error) this.handleError(error);

    return data ?? [];
  }

  async getById(id: string): Promise<Course | null> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);

    return data;
  }

  async getBySlug(slug: string): Promise<Course | null> {
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
      .eq("status", "active")
      .order("title");

    if (error) this.handleError(error);

    return data ?? [];
  }

  async exists(id: string): Promise<boolean> {
    const supabase = await this.db();

    const { count, error } = await supabase
      .from("courses")
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
      .from("courses")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) this.handleError(error);

    return count ?? 0;
  }

  async create(data: CourseInsert): Promise<Course> {
    const supabase = await this.db();

    const { data: created, error } = await supabase
      .from("courses")
      .insert(data)
      .select()
      .single();

    if (error) this.handleError(error);

    return created;
  }

  async update(
    id: string,
    data: CourseUpdate
  ): Promise<Course> {

    const supabase = await this.db();

    const { data: updated, error } = await supabase
      .from("courses")
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
      .from("courses")
      .delete()
      .eq("id", id);

    if (error) this.handleError(error);
  }
}

export const courseRepository = new CourseRepository();