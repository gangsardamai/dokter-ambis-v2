import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import {
  profileService,
} from "@/services";

interface MentorLayoutProps {
  children: ReactNode;
}

export default async function MentorLayout({
  children,
}: MentorLayoutProps) {
  const profile =
    await profileService.getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "mentor") {
    if (profile.role === "admin") {
      redirect("/dashboard/admin");
    }

    if (profile.role === "student") {
      redirect("/dashboard/student");
    }

    redirect("/login");
  }

  return children;
}