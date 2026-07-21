import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import {
  profileService,
} from "@/services";

interface StudentLayoutProps {
  children: ReactNode;
}

export default async function StudentLayout({
  children,
}: StudentLayoutProps) {
  const profile =
    await profileService.getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "student") {
    if (profile.role === "admin") {
      redirect("/dashboard/admin");
    }

    if (profile.role === "mentor") {
      redirect("/dashboard/mentor");
    }

    redirect("/login");
  }

  return children;
}