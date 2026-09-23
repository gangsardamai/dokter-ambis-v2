import "server-only";

import { redirect } from "next/navigation";

import { profileService } from "@/services";

export async function requireActiveAdmin() {
  const profile = await profileService.getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status !== "active") {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  return profile;
}
