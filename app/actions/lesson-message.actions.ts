"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  lessonMessageService,
  profileService,
} from "@/services";

export interface LessonMessageActionResult {
  success: boolean;
  message: string;
}

export async function sendLessonMessageAction(
  courseId: string,
  lessonId: string,
  message: string,
): Promise<LessonMessageActionResult> {
  const profile = await profileService.getCurrentProfile();

  if (!profile || profile.role !== "student") {
    return {
      success: false,
      message: "Sesi peserta tidak valid.",
    };
  }

  try {
    await lessonMessageService.sendStudentMessage({
      studentProfileId: profile.id,
      courseId,
      lessonId,
      message,
    });

    revalidatePath(`/dashboard/student/my-course/${courseId}`);
    revalidatePath("/dashboard/student/messages");
    revalidatePath("/dashboard/admin/messages");
    revalidatePath("/dashboard/mentor/messages");

    return {
      success: true,
      message: "Pesan berhasil dikirim ke tim pengajar Dokter Ambis.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Pesan gagal dikirim.",
    };
  }
}

export async function createStudentCourseQuestionAction(
  _previousState: LessonMessageActionResult,
  formData: FormData,
): Promise<LessonMessageActionResult> {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "student") {
    return { success: false, message: "Sesi peserta tidak valid." };
  }

  const courseId = String(formData.get("courseId") ?? "");
  const message = String(formData.get("message") ?? "");
  let threadId: string;

  try {
    threadId = await lessonMessageService.createStudentCourseQuestion({
      studentProfileId: profile.id,
      courseId,
      message,
    });
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Pertanyaan gagal dikirim.",
    };
  }

  revalidatePath("/dashboard/student/messages");
  revalidatePath("/dashboard/admin/messages");
  revalidatePath("/dashboard/mentor/messages");
  redirect(`/dashboard/student/messages/${threadId}`);
}

export async function replyStudentMessageAction(
  threadId: string,
  _previousState: LessonMessageActionResult,
  formData: FormData,
): Promise<LessonMessageActionResult> {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "student") {
    return { success: false, message: "Sesi peserta tidak valid." };
  }

  try {
    await lessonMessageService.replyAsStudent({
      studentProfileId: profile.id,
      threadId,
      message: String(formData.get("message") ?? ""),
    });
    revalidatePath("/dashboard/student/messages");
    revalidatePath(`/dashboard/student/messages/${threadId}`);
    revalidatePath("/dashboard/admin/messages");
    revalidatePath("/dashboard/mentor/messages");
    return { success: true, message: "Pesan berhasil dikirim." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Pesan gagal dikirim.",
    };
  }
}

export async function markLessonMessageThreadReadAction(
  threadId: string,
  readThrough: string,
): Promise<number> {
  const profile = await profileService.getCurrentProfile();
  if (!profile) return 0;

  try {
    const count = await lessonMessageService.markThreadRead(
      profile.id,
      threadId,
      readThrough,
    );
    revalidatePath("/dashboard", "layout");
    return count;
  } catch {
    return lessonMessageService.countUnreadMessages().catch(() => 0);
  }
}

export async function getLessonMessageUnreadCountAction(): Promise<number> {
  const profile = await profileService.getCurrentProfile();
  if (!profile) return 0;
  return lessonMessageService.countUnreadMessages().catch(() => 0);
}

export async function replyLessonMessageAction(
  threadId: string,
  formData: FormData,
): Promise<void> {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Hanya Admin yang dapat menjawab pesan.");
  }

  const message = String(formData.get("message") ?? "");
  const courseId = await lessonMessageService.replyAsAdmin({
    adminProfileId: profile.id,
    threadId,
    message,
  });

  revalidatePath("/dashboard/admin/messages");
  revalidatePath(`/dashboard/admin/messages/${threadId}`);
  revalidatePath("/dashboard/mentor/messages");
  revalidatePath(`/dashboard/mentor/messages/${threadId}`);
  revalidatePath(`/dashboard/student/my-course/${courseId}`);
  revalidatePath("/dashboard/student/messages");
}


export async function replyLessonMessageAsMentorAction(
  threadId: string,
  formData: FormData,
): Promise<void> {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "mentor") {
    throw new Error("Hanya Mentor yang dapat menggunakan aksi ini.");
  }

  const message = String(formData.get("message") ?? "");
  const courseId = await lessonMessageService.replyAsMentor({
    mentorProfileId: profile.id,
    threadId,
    message,
  });

  revalidatePath("/dashboard/mentor/messages");
  revalidatePath(`/dashboard/mentor/messages/${threadId}`);
  revalidatePath("/dashboard/admin/messages");
  revalidatePath(`/dashboard/admin/messages/${threadId}`);
  revalidatePath(`/dashboard/student/my-course/${courseId}`);
  revalidatePath("/dashboard/student/messages");
}

export async function closeLessonMessageThreadAction(
  threadId: string,
): Promise<void> {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Hanya Admin yang dapat menutup pesan.");
  }

  const courseId = await lessonMessageService.setThreadStatus(
    threadId,
    "closed",
  );

  revalidatePath("/dashboard/admin/messages");
  revalidatePath(`/dashboard/admin/messages/${threadId}`);
  revalidatePath("/dashboard/mentor/messages");
  revalidatePath(`/dashboard/mentor/messages/${threadId}`);
  revalidatePath(`/dashboard/student/my-course/${courseId}`);
  revalidatePath("/dashboard/student/messages");
}

export async function reopenLessonMessageThreadAction(
  threadId: string,
): Promise<void> {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Hanya Admin yang dapat membuka kembali pesan.");
  }

  const courseId = await lessonMessageService.setThreadStatus(
    threadId,
    "open",
  );

  revalidatePath("/dashboard/admin/messages");
  revalidatePath(`/dashboard/admin/messages/${threadId}`);
  revalidatePath("/dashboard/mentor/messages");
  revalidatePath(`/dashboard/mentor/messages/${threadId}`);
  revalidatePath(`/dashboard/student/my-course/${courseId}`);
  revalidatePath("/dashboard/student/messages");
}
