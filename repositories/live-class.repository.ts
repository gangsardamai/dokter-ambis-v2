import type { Database } from "@/supabase/types/database.types";
import { BaseRepository } from "./base.repository";

type LiveClass = Database["public"]["Tables"]["live_classes"]["Row"];
type LiveClassInsert = Database["public"]["Tables"]["live_classes"]["Insert"];
type LiveClassUpdate = Database["public"]["Tables"]["live_classes"]["Update"];

export class LiveClassRepository extends BaseRepository {

  async getAll(): Promise<LiveClass[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("live_classes")
      .select("*")
      .order("meeting_date");

    if (error) this.handleError(error);

    return data ?? [];
  }

  async getById(id: string): Promise<LiveClass | null> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("live_classes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);

    return data;
  }

  async getByLesson(
    lessonId: string
  ): Promise<LiveClass[]> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("live_classes")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("meeting_date");

    if (error) this.handleError(error);

    return data ?? [];
  }

  async exists(id: string): Promise<boolean> {
    const supabase = await this.db();

    const { count, error } = await supabase
      .from("live_classes")
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
      .from("live_classes")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) this.handleError(error);

    return count ?? 0;
  }

  async create(
    data: LiveClassInsert
  ): Promise<LiveClass> {

    const supabase = await this.db();

    const { data: created, error } = await supabase
      .from("live_classes")
      .insert(data)
      .select()
      .single();

    if (error) this.handleError(error);

    return created;
  }

  async update(
    id: string,
    data: LiveClassUpdate
  ): Promise<LiveClass> {

    const supabase = await this.db();

    const { data: updated, error } = await supabase
      .from("live_classes")
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
      .from("live_classes")
      .delete()
      .eq("id", id);

    if (error) this.handleError(error);
  }
}

export const liveClassRepository =
  new LiveClassRepository();