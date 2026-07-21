import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import {
  profileService,
} from "@/services";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({
  children,
}: AdminLayoutProps) {
  const profile =
    await profileService.getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    if (profile.role === "mentor") {
      redirect("/dashboard/mentor");
    }

    if (profile.role === "student") {
      redirect("/dashboard/student");
    }

    redirect("/login");
  }

  return children;
}