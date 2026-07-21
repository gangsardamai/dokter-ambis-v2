import { redirect } from "next/navigation";

import {
  authService,
  profileService,
} from "@/services";

export default async function DashboardPage() {

  const isAuthenticated =
    await authService.isAuthenticated();

  if (!isAuthenticated) {

    redirect("/login");

  }

  const profile =
    await profileService.getCurrentProfile();

  if (!profile) {

    redirect("/login");

  }

  if (profile.status !== "active") {

    redirect("/login");

  }

  if (profile.role === "admin") {

    redirect("/dashboard/admin");

  }

  if (profile.role === "mentor") {

    redirect("/dashboard/mentor");

  }

  if (profile.role === "student") {

    redirect("/dashboard/student");

  }

  redirect("/login");

}