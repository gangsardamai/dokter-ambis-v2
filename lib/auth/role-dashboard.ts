/** Shared login/dashboard destination; unknown roles fail closed. */
export function getRoleDashboard(role: string): string {
  switch (role) {
    case "admin":
    case "leader": return "/dashboard/admin";
    case "mentor": return "/dashboard/mentor";
    case "student": return "/dashboard/student";
    default: return "/login";
  }
}
