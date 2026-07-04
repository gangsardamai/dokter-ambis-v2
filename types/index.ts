// ======================================================
// DOKTER AMBIS
// Global Type Definitions
// Blueprint v1.0
// ======================================================

/* =====================================================
   GLOBAL TYPE
===================================================== */

export type Status =
  | "active"
  | "inactive"
  | "coming_soon"
  | "archived";

/* =====================================================
   ORGANIZATION
===================================================== */

export interface Organization {
  id: string;
  title: string;
  shortName: string;
  logoUrl?: string;
  status: Status;
}

/* =====================================================
   PROGRAM
===================================================== */

export interface Program {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  status: Status;
}

/* =====================================================
   COURSE
===================================================== */

export interface Course {
  id: string;
  organizationId: string;
  programId: string;

  title: string;
  description?: string;

  thumbnail?: string;

  mentorId?: string;

  totalLessons: number;

  status: Status;
}

/* =====================================================
   LESSON
===================================================== */

export interface Lesson {
  id: string;

  courseId: string;

  title: string;

  description?: string;

  order: number;

  duration?: number;

  isFree: boolean;
}

/* =====================================================
   VIDEO
===================================================== */

export interface Video {
  id: string;

  lessonId: string;

  title: string;

  youtubeUrl?: string;

  bunnyVideoId?: string;

  duration: number;
}

/* =====================================================
   FILE
===================================================== */

export type FileType =
  | "pdf"
  | "ppt"
  | "docx"
  | "xlsx"
  | "zip";

export interface LessonFile {
  id: string;

  lessonId: string;

  title: string;

  fileType: FileType;

  fileUrl: string;
}

/* =====================================================
   LIVE CLASS
===================================================== */

export interface LiveClass {
  id: string;

  lessonId: string;

  title: string;

  meetingDate: string;

  meetingLink?: string;

  recordingUrl?: string;
}

/* =====================================================
   QUIZ
===================================================== */

export interface Quiz {
  id: string;

  lessonId: string;

  title: string;

  totalQuestions: number;

  duration: number;

  maxAttempt: number;

  passingScore?: number;
}

/* =====================================================
   MENTOR
===================================================== */

export interface Mentor {
  id: string;

  name: string;

  photoUrl?: string;

  specialization?: string;

  status: Status;
}

/* =====================================================
   USER
===================================================== */

export type UserRole =
  | "admin"
  | "mentor"
  | "student";

export interface User {
  id: string;

  fullName: string;

  email: string;

  avatarUrl?: string;

  role: UserRole;

  status: Status;
}