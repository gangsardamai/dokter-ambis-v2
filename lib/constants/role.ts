export const ROLES = {
  ADMIN: "admin",
  MENTOR: "mentor",
  STUDENT: "student",
} as const;

export type UserRole =
  (typeof ROLES)[keyof typeof ROLES];