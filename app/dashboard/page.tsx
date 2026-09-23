import { getRoleDashboard } from "@/lib/auth/role-dashboard";
import { redirect } from "next/navigation";

import { authService, profileService } from "@/services";

export default async function DashboardPage() {
  const isAuthenticated = await authService.isAuthenticated();
  if (!isAuthenticated) redirect("/login");

  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.status !== "active") redirect("/login");

  redirect(getRoleDashboard(profile.role));
}
