export const ROLES = {
  ADMIN: "admin",
  LEADER: "leader",
  MENTOR: "mentor",
  STUDENT: "student",
} as const;

export type UserRole =
  (typeof ROLES)[keyof typeof ROLES];