import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import {
  DashboardHeader,
  DashboardLayout,
} from "@/components/dashboard";

import {
  authService,
  lessonMessageService,
  profileService,
} from "@/services";

interface DashboardRootLayoutProps {
  children: ReactNode;
}

export default async function DashboardRootLayout({
  children,
}: DashboardRootLayoutProps) {
  const authenticated = await authService.isAuthenticated();

  if (!authenticated) {
    redirect("/login");
  }

  const profile = await profileService.getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status !== "active") {
    redirect("/login");
  }

  let messageUnreadCount = 0;

  if (profile.role === "admin") {
    try {
      messageUnreadCount = await lessonMessageService.countOpenThreads();
    } catch {
      // Migration pesan mungkin belum diterapkan pada environment ini.
      messageUnreadCount = 0;
    }
  }

  return (
    <DashboardLayout
      role={profile.role}
      messageUnreadCount={messageUnreadCount}
    >
      <DashboardHeader profile={profile} />
      {children}
    </DashboardLayout>
  );
}
