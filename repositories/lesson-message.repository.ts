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
type ThreadRead =
  Database["public"]["Tables"]["lesson_message_thread_reads"]["Row"];

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

  async getThreadsForStudent(studentProfileId: string): Promise<Thread[]> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("lesson_message_threads")
      .select("*")
      .eq("student_profile_id", studentProfileId)
      .order("last_message_at", { ascending: false })
      .limit(200);

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

  async getThreadsByCourseIds(courseIds: string[]): Promise<Thread[]> {
    if (courseIds.length === 0) return [];

    const supabase = await this.db();
    const { data, error } = await supabase
      .from("lesson_message_threads")
      .select("*")
      .in("course_id", courseIds)
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

  async getReadStatesByThreadIds(
    threadIds: string[],
    profileId: string,
  ): Promise<ThreadRead[]> {
    if (threadIds.length === 0) return [];

    const supabase = await this.db();
    const { data, error } = await supabase
      .from("lesson_message_thread_reads")
      .select("*")
      .eq("profile_id", profileId)
      .in("thread_id", threadIds);

    if (error) this.handleError(error);
    return data ?? [];
  }

  async markThreadRead(
    threadId: string,
    profileId: string,
    lastReadAt: string,
  ): Promise<void> {
    const supabase = await this.db();
    const { data: existing, error: readError } = await supabase
      .from("lesson_message_thread_reads")
      .select("last_read_at")
      .eq("thread_id", threadId)
      .eq("profile_id", profileId)
      .maybeSingle();
    if (readError) this.handleError(readError);

    const nextReadAt = existing?.last_read_at &&
      existing.last_read_at > lastReadAt
      ? existing.last_read_at
      : lastReadAt;
    const { error } = await supabase
      .from("lesson_message_thread_reads")
      .upsert(
        {
          thread_id: threadId,
          profile_id: profileId,
          last_read_at: nextReadAt,
        },
        { onConflict: "thread_id,profile_id" },
      );

    if (error) this.handleError(error);
  }

  async countUnreadMessages(): Promise<number> {
    const supabase = await this.db();
    const { data, error } = await supabase.rpc(
      "count_unread_lesson_messages",
    );

    if (error) this.handleError(error);
    return Number(data ?? 0);
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

  async countOpenThreadsByCourseIds(courseIds: string[]): Promise<number> {
    if (courseIds.length === 0) return 0;

    const supabase = await this.db();
    const { count, error } = await supabase
      .from("lesson_message_threads")
      .select("id", { count: "exact", head: true })
      .in("course_id", courseIds)
      .eq("status", "open");

    if (error) this.handleError(error);
    return count ?? 0;
  }

  async getProfilesByIds(ids: string[]) {
    if (ids.length === 0) return [];

    const supabase = await this.db();
    const { data, error } = await supabase.rpc(
      "get_message_participant_summaries",
      { target_profile_ids: ids },
    );

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
