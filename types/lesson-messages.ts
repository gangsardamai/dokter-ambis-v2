import type {
  Database,
  LessonMessageThreadStatus,
} from "@/supabase/types/database.app.types";

export type LessonMessageEntry =
  Database["public"]["Tables"]["lesson_message_entries"]["Row"];

export type LessonMessageDisplayEntry = LessonMessageEntry & {
  senderName: string;
};

export interface StudentLessonMessageThread {
  id: string;
  lessonId: string;
  status: LessonMessageThreadStatus;
  lastMessageAt: string;
  messages: LessonMessageDisplayEntry[];
}

export interface AdminLessonMessageListItem {
  id: string;
  status: LessonMessageThreadStatus;
  lastMessageAt: string;
  studentProfileId: string;
  studentName: string;
  studentUniversity: string | null;
  courseId: string;
  courseTitle: string;
  courseUniversity: string;
  programTitle: string;
  lessonId: string | null;
  lessonTitle: string | null;
  latestMessage: string;
  latestSenderRole: "student" | "mentor" | "admin";
  latestSenderName: string;
  unreadCount: number;
}

export interface AdminLessonMessageThreadDetail
  extends AdminLessonMessageListItem {
  messages: LessonMessageDisplayEntry[];
}
