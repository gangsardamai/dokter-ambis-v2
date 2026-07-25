import {
  lessonMessageRepository,
  lessonRepository,
} from "@/repositories";
import type { LessonMessageThreadStatus } from "@/supabase/types/database.app.types";
import type {
  AdminLessonMessageListItem,
  AdminLessonMessageThreadDetail,
  StudentLessonMessageThread,
} from "@/types/lesson-messages";

import { enrollmentService } from "./enrollment.service";

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalizeMessage(message: string): string {
  const normalized = message.trim();

  if (!normalized) {
    throw new Error("Pesan tidak boleh kosong.");
  }

  if (normalized.length > 2000) {
    throw new Error("Pesan maksimal 2.000 karakter.");
  }

  return normalized;
}

export class LessonMessageService {
  async getStudentCourseThreads(
    studentProfileId: string,
    courseId: string,
  ): Promise<Record<string, StudentLessonMessageThread>> {
    const threads =
      await lessonMessageRepository.getThreadsForStudentCourse(
        studentProfileId,
        courseId,
      );
    const entries = await lessonMessageRepository.getEntriesByThreadIds(
      threads.map((thread) => thread.id),
    );

    const messagesByThread = new Map<string, typeof entries>();
    for (const entry of entries) {
      const current = messagesByThread.get(entry.thread_id) ?? [];
      current.push(entry);
      messagesByThread.set(entry.thread_id, current);
    }

    return Object.fromEntries(
      threads.map((thread) => [
        thread.lesson_id,
        {
          id: thread.id,
          lessonId: thread.lesson_id,
          status: thread.status,
          lastMessageAt: thread.last_message_at,
          messages: messagesByThread.get(thread.id) ?? [],
        },
      ]),
    );
  }

  async sendStudentMessage(input: {
    studentProfileId: string;
    courseId: string;
    lessonId: string;
    message: string;
  }): Promise<void> {
    const message = normalizeMessage(input.message);
    const enrollment = await enrollmentService.getActiveCourseEnrollment(
      input.studentProfileId,
      input.courseId,
    );

    if (!enrollment) {
      throw new Error("Akses course tidak aktif.");
    }

    const lesson = await lessonRepository.getById(input.lessonId);
    if (
      !lesson ||
      lesson.course_id !== input.courseId ||
      lesson.publication_status !== "published"
    ) {
      throw new Error("Lesson tidak tersedia untuk peserta.");
    }

    let thread =
      await lessonMessageRepository.findStudentLessonThread(
        input.studentProfileId,
        input.lessonId,
      );

    if (!thread) {
      thread = await lessonMessageRepository.createThread({
        student_profile_id: input.studentProfileId,
        course_id: input.courseId,
        lesson_id: input.lessonId,
      });
    }

    await lessonMessageRepository.createEntry({
      thread_id: thread.id,
      sender_profile_id: input.studentProfileId,
      sender_role: "student",
      message,
    });
  }

  async getAdminInbox(): Promise<AdminLessonMessageListItem[]> {
    const threads = await lessonMessageRepository.getAllThreads();
    if (threads.length === 0) return [];

    const entries = await lessonMessageRepository.getEntriesByThreadIds(
      threads.map((thread) => thread.id),
    );
    const [profiles, courses, lessons] = await Promise.all([
      lessonMessageRepository.getProfilesByIds(
        unique(threads.map((thread) => thread.student_profile_id)),
      ),
      lessonMessageRepository.getCoursesByIds(
        unique(threads.map((thread) => thread.course_id)),
      ),
      lessonMessageRepository.getLessonsByIds(
        unique(threads.map((thread) => thread.lesson_id)),
      ),
    ]);

    const [organizations, programs] = await Promise.all([
      lessonMessageRepository.getOrganizationsByIds(
        unique(courses.map((course) => course.organization_id)),
      ),
      lessonMessageRepository.getProgramsByIds(
        unique(courses.map((course) => course.program_id)),
      ),
    ]);

    const profileMap = new Map(profiles.map((item) => [item.id, item]));
    const courseMap = new Map(courses.map((item) => [item.id, item]));
    const lessonMap = new Map(lessons.map((item) => [item.id, item]));
    const organizationMap = new Map(
      organizations.map((item) => [item.id, item.title]),
    );
    const programMap = new Map(
      programs.map((item) => [item.id, item.title]),
    );
    const entriesByThread = new Map<string, typeof entries>();

    for (const entry of entries) {
      const current = entriesByThread.get(entry.thread_id) ?? [];
      current.push(entry);
      entriesByThread.set(entry.thread_id, current);
    }

    return threads.map((thread) => {
      const profile = profileMap.get(thread.student_profile_id);
      const course = courseMap.get(thread.course_id);
      const lesson = lessonMap.get(thread.lesson_id);
      const threadEntries = entriesByThread.get(thread.id) ?? [];
      const latestEntry = threadEntries.at(-1);

      return {
        id: thread.id,
        status: thread.status,
        lastMessageAt: thread.last_message_at,
        studentProfileId: thread.student_profile_id,
        studentName: profile?.full_name ?? "Peserta tidak ditemukan",
        studentUniversity: profile?.university_origin ?? null,
        courseId: thread.course_id,
        courseTitle: course?.title ?? "Course tidak ditemukan",
        courseUniversity: course
          ? organizationMap.get(course.organization_id) ??
            "Universitas belum tersedia"
          : "Universitas belum tersedia",
        programTitle: course
          ? programMap.get(course.program_id) ?? "Program belum tersedia"
          : "Program belum tersedia",
        lessonId: thread.lesson_id,
        lessonTitle: lesson?.title ?? "Lesson tidak ditemukan",
        latestMessage: latestEntry?.message ?? "Belum ada isi pesan.",
        latestSenderRole:
          latestEntry?.sender_role === "admin" ? "admin" : "student",
      };
    });
  }

  async getAdminThreadDetail(
    threadId: string,
  ): Promise<AdminLessonMessageThreadDetail | null> {
    const item = (await this.getAdminInbox()).find(
      (thread) => thread.id === threadId,
    );

    if (!item) return null;

    const messages = await lessonMessageRepository.getEntriesByThreadIds([
      threadId,
    ]);

    return {
      ...item,
      messages,
    };
  }

  async replyAsAdmin(input: {
    adminProfileId: string;
    threadId: string;
    message: string;
  }): Promise<string> {
    const message = normalizeMessage(input.message);
    const thread = await lessonMessageRepository.getThreadById(
      input.threadId,
    );

    if (!thread) {
      throw new Error("Percakapan tidak ditemukan.");
    }

    await lessonMessageRepository.createEntry({
      thread_id: thread.id,
      sender_profile_id: input.adminProfileId,
      sender_role: "admin",
      message,
    });

    return thread.course_id;
  }

  async setThreadStatus(
    threadId: string,
    status: LessonMessageThreadStatus,
  ): Promise<string> {
    const thread = await lessonMessageRepository.getThreadById(threadId);
    if (!thread) throw new Error("Percakapan tidak ditemukan.");

    await lessonMessageRepository.updateThreadStatus(threadId, status);
    return thread.course_id;
  }

  async countOpenThreads(): Promise<number> {
    return lessonMessageRepository.countOpenThreads();
  }
}

export const lessonMessageService = new LessonMessageService();
