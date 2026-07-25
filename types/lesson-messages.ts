import type {
  Database,
  LessonMessageThreadStatus,
} from "@/supabase/types/database.app.types";

export type LessonMessageEntry =
  Database["public"]["Tables"]["lesson_message_entries"]["Row"];

export interface StudentLessonMessageThread {
  id: string;
  lessonId: string;
  status: LessonMessageThreadStatus;
  lastMessageAt: string;
  messages: LessonMessageEntry[];
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
  lessonId: string;
  lessonTitle: string;
  latestMessage: string;
  latestSenderRole: "student" | "admin";
}

export interface AdminLessonMessageThreadDetail
  extends AdminLessonMessageListItem {
  messages: LessonMessageEntry[];
}
