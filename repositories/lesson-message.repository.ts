import type {
  Database,
  LessonMessageThreadStatus,
} from "@/supabase/types/database.app.types";

import { BaseRepository } from "./base.repository";

type Thread =
  Database["public"]["Tables"]["lesson_message_threads"]["Row"];
type ThreadInsert =
  Database["public"]["Tables"]["lesson_message_threads"]["Insert"];
type Entry =
  Database["public"]["Tables"]["lesson_message_entries"]["Row"];
type EntryInsert =
  Database["public"]["Tables"]["lesson_message_entries"]["Insert"];

export class LessonMessageRepository extends BaseRepository {
  async getThreadsForStudentCourse(
    studentProfileId: string,
    courseId: string,
  ): Promise<Thread[]> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("lesson_message_threads")
      .select("*")
      .eq("student_profile_id", studentProfileId)
      .eq("course_id", courseId)
      .order("last_message_at", { ascending: false });

    if (error) this.handleError(error);
    return data ?? [];
  }

  async getAllThreads(): Promise<Thread[]> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("lesson_message_threads")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(200);

    if (error) this.handleError(error);
    return data ?? [];
  }

  async getThreadById(id: string): Promise<Thread | null> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("lesson_message_threads")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);
    return data;
  }

  async findStudentLessonThread(
    studentProfileId: string,
    lessonId: string,
  ): Promise<Thread | null> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("lesson_message_threads")
      .select("*")
      .eq("student_profile_id", studentProfileId)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    if (error) this.handleError(error);
    return data;
  }

  async createThread(data: ThreadInsert): Promise<Thread> {
    const supabase = await this.db();
    const { data: created, error } = await supabase
      .from("lesson_message_threads")
      .insert(data)
      .select()
      .single();

    if (error) this.handleError(error);
    return created;
  }

  async getEntriesByThreadIds(
    threadIds: string[],
  ): Promise<Entry[]> {
    if (threadIds.length === 0) return [];

    const supabase = await this.db();
    const { data, error } = await supabase
      .from("lesson_message_entries")
      .select("*")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: true });

    if (error) this.handleError(error);
    return data ?? [];
  }

  async createEntry(data: EntryInsert): Promise<Entry> {
    const supabase = await this.db();
    const { data: created, error } = await supabase
      .from("lesson_message_entries")
      .insert(data)
      .select()
      .single();

    if (error) this.handleError(error);
    return created;
  }

  async updateThreadStatus(
    threadId: string,
    status: LessonMessageThreadStatus,
  ): Promise<void> {
    const supabase = await this.db();
    const { error } = await supabase
      .from("lesson_message_threads")
      .update({ status })
      .eq("id", threadId);

    if (error) this.handleError(error);
  }

  async countOpenThreads(): Promise<number> {
    const supabase = await this.db();
    const { count, error } = await supabase
      .from("lesson_message_threads")
      .select("id", { count: "exact", head: true })
      .eq("status", "open");

    if (error) this.handleError(error);
    return count ?? 0;
  }

  async getProfilesByIds(ids: string[]) {
    if (ids.length === 0) return [];

    const supabase = await this.db();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, university_origin")
      .in("id", ids);

    if (error) this.handleError(error);
    return data ?? [];
  }

  async getCoursesByIds(ids: string[]) {
    if (ids.length === 0) return [];

    const supabase = await this.db();
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, organization_id, program_id")
      .in("id", ids);

    if (error) this.handleError(error);
    return data ?? [];
  }

  async getLessonsByIds(ids: string[]) {
    if (ids.length === 0) return [];

    const supabase = await this.db();
    const { data, error } = await supabase
      .from("lessons")
      .select("id, title, course_id, publication_status")
      .in("id", ids);

    if (error) this.handleError(error);
    return data ?? [];
  }

  async getOrganizationsByIds(ids: string[]) {
    if (ids.length === 0) return [];

    const supabase = await this.db();
    const { data, error } = await supabase
      .from("organizations")
      .select("id, title")
      .in("id", ids);

    if (error) this.handleError(error);
    return data ?? [];
  }

  async getProgramsByIds(ids: string[]) {
    if (ids.length === 0) return [];

    const supabase = await this.db();
    const { data, error } = await supabase
      .from("programs")
      .select("id, title")
      .in("id", ids);

    if (error) this.handleError(error);
    return data ?? [];
  }
}

export const lessonMessageRepository =
  new LessonMessageRepository();
