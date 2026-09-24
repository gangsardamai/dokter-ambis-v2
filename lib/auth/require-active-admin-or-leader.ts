import "server-only";

import { redirect } from "next/navigation";

import { getRoleDashboard } from "@/lib/auth/role-dashboard";
import { isAdminConsoleRole } from "@/lib/auth/role-access";
import { profileService } from "@/services";

export async function requireActiveAdminOrLeader() {
  const profile = await profileService.getCurrentProfile();

  if (!profile || profile.status !== "active") {
    redirect("/login");
  }

  if (!isAdminConsoleRole(profile.role)) {
    redirect(getRoleDashboard(profile.role));
  }

  return profile;
}
