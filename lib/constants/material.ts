export const Lesson_STATUS = {
  LOCKED: "locked",
  OPEN: "open",
  COMPLETED: "completed",
} as const;

export type LessonStatus =
  (typeof Lesson_STATUS)[keyof typeof Lesson_STATUS];