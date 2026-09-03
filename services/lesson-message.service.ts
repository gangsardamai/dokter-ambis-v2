import {
  lessonMessageRepository,
  lessonRepository,
} from "@/repositories";
import type { LessonMessageThreadStatus } from "@/supabase/types/database.app.types";
import type {
  AdminLessonMessageListItem,
  AdminLessonMessageThreadDetail,
  LessonMessageDisplayEntry,
  StudentLessonMessageThread,
} from "@/types/lesson-messages";

import { enrollmentService } from "./enrollment.service";
import { mentorCourseAccessService } from "./mentor-course-access.service";

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalizeMessage(message: string): string {
  const normalized = message.trim();
  if (!normalized) throw new Error("Pesan tidak boleh kosong.");
  if (normalized.length > 2000) {
    throw new Error("Pesan maksimal 2.000 karakter.");
  }
  return normalized;
}

function fallbackSenderName(role: "student" | "mentor" | "admin"): string {
  if (role === "admin") return "Admin Dokter Ambis";
  if (role === "mentor") return "Mentor Dokter Ambis";
  return "Peserta";
}

type Thread = Awaited<
  ReturnType<typeof lessonMessageRepository.getAllThreads>
>[number];

export class LessonMessageService {
  private async attachSenderNames(
    entries: Awaited<
      ReturnType<typeof lessonMessageRepository.getEntriesByThreadIds>
    >,
  ): Promise<LessonMessageDisplayEntry[]> {
    const profiles = await lessonMessageRepository.getProfilesByIds(
      unique(entries.map((entry) => entry.sender_profile_id)),
    );
    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

    return entries.map((entry) => ({
      ...entry,
      senderName:
        profileMap.get(entry.sender_profile_id)?.full_name ??
        fallbackSenderName(entry.sender_role),
    }));
  }

  async getStudentCourseThreads(
    studentProfileId: string,
    courseId: string,
  ): Promise<Record<string, StudentLessonMessageThread>> {
    const threads =
      await lessonMessageRepository.getThreadsForStudentCourse(
        studentProfileId,
        courseId,
      );
    const entries = await this.attachSenderNames(
      await lessonMessageRepository.getEntriesByThreadIds(
        threads.map((thread) => thread.id),
      ),
    );

    const messagesByThread = new Map<string, typeof entries>();
    for (const entry of entries) {
      const current = messagesByThread.get(entry.thread_id) ?? [];
      current.push(entry);
      messagesByThread.set(entry.thread_id, current);
    }

    return Object.fromEntries(
      threads.flatMap((thread) => thread.lesson_id ? [[
        thread.lesson_id,
        {
          id: thread.id,
          lessonId: thread.lesson_id,
          status: thread.status,
          lastMessageAt: thread.last_message_at,
          messages: messagesByThread.get(thread.id) ?? [],
        },
      ]] : []),
    );
  }

  async getStudentInbox(
    studentProfileId: string,
  ): Promise<AdminLessonMessageListItem[]> {
    return this.buildInbox(
      await lessonMessageRepository.getThreadsForStudent(studentProfileId),
      studentProfileId,
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

    if (!enrollment) throw new Error("Akses course tidak aktif.");

    const lesson = await lessonRepository.getById(input.lessonId);
    if (
      !lesson ||
      lesson.course_id !== input.courseId ||
      lesson.publication_status !== "published"
    ) {
      throw new Error("Lesson tidak tersedia untuk peserta.");
    }

    let thread = await lessonMessageRepository.findStudentLessonThread(
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

  async createStudentCourseQuestion(input: {
    studentProfileId: string;
    courseId: string;
    message: string;
  }): Promise<string> {
    const message = normalizeMessage(input.message);
    const enrollment = await enrollmentService.getActiveCourseEnrollment(
      input.studentProfileId,
      input.courseId,
    );
    if (!enrollment) throw new Error("Akses course tidak aktif.");

    const thread = await lessonMessageRepository.createThread({
      student_profile_id: input.studentProfileId,
      course_id: input.courseId,
      lesson_id: null,
    });
    await lessonMessageRepository.createEntry({
      thread_id: thread.id,
      sender_profile_id: input.studentProfileId,
      sender_role: "student",
      message,
    });
    return thread.id;
  }

  async replyAsStudent(input: {
    studentProfileId: string;
    threadId: string;
    message: string;
  }): Promise<string> {
    const message = normalizeMessage(input.message);
    const thread = await lessonMessageRepository.getThreadById(input.threadId);
    if (!thread || thread.student_profile_id !== input.studentProfileId) {
      throw new Error("Percakapan tidak ditemukan.");
    }

    const enrollment = await enrollmentService.getActiveCourseEnrollment(
      input.studentProfileId,
      thread.course_id,
    );
    if (!enrollment) throw new Error("Akses course tidak aktif.");

    await lessonMessageRepository.createEntry({
      thread_id: thread.id,
      sender_profile_id: input.studentProfileId,
      sender_role: "student",
      message,
    });
    return thread.course_id;
  }

  private async buildInbox(
    threads: Thread[],
    readerProfileId: string,
  ): Promise<AdminLessonMessageListItem[]> {
    if (threads.length === 0) return [];

    const entries = await lessonMessageRepository.getEntriesByThreadIds(
      threads.map((thread) => thread.id),
    );
    const [profiles, courses, lessons, readStates] = await Promise.all([
      lessonMessageRepository.getProfilesByIds(
        unique([
          ...threads.map((thread) => thread.student_profile_id),
          ...entries.map((entry) => entry.sender_profile_id),
        ]),
      ),
      lessonMessageRepository.getCoursesByIds(
        unique(threads.map((thread) => thread.course_id)),
      ),
      lessonMessageRepository.getLessonsByIds(
        unique(
          threads.flatMap((thread) =>
            thread.lesson_id ? [thread.lesson_id] : [],
          ),
        ),
      ),
      lessonMessageRepository.getReadStatesByThreadIds(
        threads.map((thread) => thread.id),
        readerProfileId,
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
    const readAtByThread = new Map(
      readStates.map((item) => [item.thread_id, item.last_read_at]),
    );

    for (const entry of entries) {
      const current = entriesByThread.get(entry.thread_id) ?? [];
      current.push(entry);
      entriesByThread.set(entry.thread_id, current);
    }

    return threads.map((thread) => {
      const profile = profileMap.get(thread.student_profile_id);
      const course = courseMap.get(thread.course_id);
      const lesson = thread.lesson_id
        ? lessonMap.get(thread.lesson_id)
        : undefined;
      const threadEntries = entriesByThread.get(thread.id) ?? [];
      const latestEntry = threadEntries.at(-1);
      const readAt = readAtByThread.get(thread.id);
      const unreadCount = threadEntries.filter(
        (entry) =>
          entry.sender_profile_id !== readerProfileId &&
          (!readAt || entry.created_at > readAt),
      ).length;

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
        lessonTitle: thread.lesson_id
          ? lesson?.title ?? "Lesson tidak ditemukan"
          : null,
        latestMessage: latestEntry?.message ?? "Belum ada isi pesan.",
        latestSenderRole: latestEntry?.sender_role ?? "student",
        latestSenderName: latestEntry
          ? profileMap.get(latestEntry.sender_profile_id)?.full_name ??
            fallbackSenderName(latestEntry.sender_role)
          : "Peserta",
        unreadCount,
      };
    });
  }

  async getAdminInbox(
    adminProfileId: string,
  ): Promise<AdminLessonMessageListItem[]> {
    return this.buildInbox(
      await lessonMessageRepository.getAllThreads(),
      adminProfileId,
    );
  }

  async getMentorInbox(
    mentorProfileId: string,
  ): Promise<AdminLessonMessageListItem[]> {
    const courseIds =
      await mentorCourseAccessService.getAssignedCourseIds(mentorProfileId);
    return this.buildInbox(
      await lessonMessageRepository.getThreadsByCourseIds(courseIds),
      mentorProfileId,
    );
  }

  private async getThreadDetailFromInbox(
    threadId: string,
    inbox: AdminLessonMessageListItem[],
  ): Promise<AdminLessonMessageThreadDetail | null> {
    const item = inbox.find((thread) => thread.id === threadId);
    if (!item) return null;

    return {
      ...item,
      messages: await this.attachSenderNames(
        await lessonMessageRepository.getEntriesByThreadIds([threadId]),
      ),
    };
  }

  async getAdminThreadDetail(
    adminProfileId: string,
    threadId: string,
  ): Promise<AdminLessonMessageThreadDetail | null> {
    return this.getThreadDetailFromInbox(
      threadId,
      await this.getAdminInbox(adminProfileId),
    );
  }

  async getStudentThreadDetail(
    studentProfileId: string,
    threadId: string,
  ): Promise<AdminLessonMessageThreadDetail | null> {
    return this.getThreadDetailFromInbox(
      threadId,
      await this.getStudentInbox(studentProfileId),
    );
  }

  async getMentorThreadDetail(
    mentorProfileId: string,
    threadId: string,
  ): Promise<AdminLessonMessageThreadDetail | null> {
    return this.getThreadDetailFromInbox(
      threadId,
      await this.getMentorInbox(mentorProfileId),
    );
  }

  async replyAsAdmin(input: {
    adminProfileId: string;
    threadId: string;
    message: string;
  }): Promise<string> {
    const message = normalizeMessage(input.message);
    const thread = await lessonMessageRepository.getThreadById(input.threadId);
    if (!thread) throw new Error("Percakapan tidak ditemukan.");

    await lessonMessageRepository.createEntry({
      thread_id: thread.id,
      sender_profile_id: input.adminProfileId,
      sender_role: "admin",
      message,
    });
    return thread.course_id;
  }

  async replyAsMentor(input: {
    mentorProfileId: string;
    threadId: string;
    message: string;
  }): Promise<string> {
    const message = normalizeMessage(input.message);
    const thread = await lessonMessageRepository.getThreadById(input.threadId);
    if (!thread) throw new Error("Percakapan tidak ditemukan.");
    if (thread.status === "closed") {
      throw new Error("Thread sudah ditutup Admin.");
    }

    await mentorCourseAccessService.requireAssigned(
      input.mentorProfileId,
      thread.course_id,
    );
    await lessonMessageRepository.createEntry({
      thread_id: thread.id,
      sender_profile_id: input.mentorProfileId,
      sender_role: "mentor",
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

  async countOpenThreadsForMentor(profileId: string): Promise<number> {
    const courseIds =
      await mentorCourseAccessService.getAssignedCourseIds(profileId);
    return lessonMessageRepository.countOpenThreadsByCourseIds(courseIds);
  }

  async countUnreadMessages(): Promise<number> {
    return lessonMessageRepository.countUnreadMessages();
  }

  async markThreadRead(
    profileId: string,
    threadId: string,
    readThrough: string,
  ): Promise<number> {
    const thread = await lessonMessageRepository.getThreadById(threadId);
    if (!thread) throw new Error("Percakapan tidak ditemukan.");

    const requestedTime = new Date(readThrough).getTime();
    const threadTime = new Date(thread.last_message_at).getTime();
    const safeTime = Number.isFinite(requestedTime)
      ? Math.min(requestedTime, threadTime, Date.now())
      : Math.min(threadTime, Date.now());

    await lessonMessageRepository.markThreadRead(
      threadId,
      profileId,
      new Date(safeTime).toISOString(),
    );
    return this.countUnreadMessages();
  }
}

export const lessonMessageService = new LessonMessageService();
