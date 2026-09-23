import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import {
  DashboardHeader,
  DashboardLayout,
} from "@/components/dashboard";

import {
  lessonMessageService,
  profileService,
} from "@/services";

interface DashboardRootLayoutProps {
  children: ReactNode;
}

export default async function DashboardRootLayout({
  children,
}: DashboardRootLayoutProps) {
  const profile = await profileService.getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status !== "active") {
    redirect("/login");
  }

  let messageUnreadCount = 0;

  try {
    messageUnreadCount = await lessonMessageService.countUnreadMessages();
  } catch {
    // Fitur pesan mungkin belum tersedia pada environment ini.
    messageUnreadCount = 0;
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
