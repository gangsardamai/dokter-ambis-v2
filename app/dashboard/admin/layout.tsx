import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { profileService } from "@/services";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const profile = await profileService.getCurrentProfile();

  if (!profile || profile.status !== "active") {
    redirect("/login");
  }

  if (profile.role === "admin" || profile.role === "leader") {
    return children;
  }

  if (profile.role === "mentor") redirect("/dashboard/mentor");
  if (profile.role === "student") redirect("/dashboard/student");

  redirect("/login");
}
