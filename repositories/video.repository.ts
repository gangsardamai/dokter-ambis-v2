import type { Database } from "@/supabase/types/database.types";
import { BaseRepository } from "./base.repository";

type Video = Database["public"]["Tables"]["videos"]["Row"];
type VideoInsert = Database["public"]["Tables"]["videos"]["Insert"];
type VideoUpdate = Database["public"]["Tables"]["videos"]["Update"];

export class VideoRepository extends BaseRepository {

  async getAll(): Promise<Video[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("created_at");

    if (error) this.handleError(error);

    return data ?? [];
  }

  async getById(id: string): Promise<Video | null> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);

    return data;
  }

  async getByLesson(
    lessonId: string
  ): Promise<Video[]> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("video_order");

    if (error) this.handleError(error);

    return data ?? [];
  }

  async getByCourse(
    courseId: string
  ): Promise<Video[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("videos")
      .select("*, lessons!inner(course_id)")
      .eq("lessons.course_id", courseId)
      .order("video_order");

    if (error) this.handleError(error);

    return (data ?? []).map((row) => {
      const { lessons: _lessons, ...video } = row;
      void _lessons;
      return video;
    });
  }

  async exists(id: string): Promise<boolean> {
    const supabase = await this.db();

    const { count, error } = await supabase
      .from("videos")
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
      .from("videos")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) this.handleError(error);

    return count ?? 0;
  }

  async create(data: VideoInsert): Promise<Video> {
    const supabase = await this.db();

    const { data: created, error } = await supabase
      .from("videos")
      .insert(data)
      .select()
      .single();

    if (error) this.handleError(error);

    return created;
  }

  async update(
    id: string,
    data: VideoUpdate
  ): Promise<Video> {

    const supabase = await this.db();

    const { data: updated, error } = await supabase
      .from("videos")
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
      .from("videos")
      .delete()
      .eq("id", id);

    if (error) this.handleError(error);
  }
}

export const videoRepository = new VideoRepository();