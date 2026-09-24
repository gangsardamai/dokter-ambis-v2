export function isAdminConsoleRole(role: string): boolean {
  return role === "admin" || role === "leader";
}
