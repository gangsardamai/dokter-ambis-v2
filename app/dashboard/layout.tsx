import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import {
  DashboardHeader,
  DashboardLayout,
} from "@/components/dashboard";
import {
  leaderAccessService,
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

  if (!profile || profile.status !== "active") {
    redirect("/login");
  }

  const leaderPermissions =
    profile.role === "leader"
      ? await leaderAccessService.getEnabledPermissions(profile.id)
      : [];

  let messageUnreadCount = 0;
  try {
    messageUnreadCount = await lessonMessageService.countUnreadMessages();
  } catch {
    messageUnreadCount = 0;
  }

  return (
    <DashboardLayout
      role={profile.role}
      leaderPermissions={leaderPermissions}
      messageUnreadCount={messageUnreadCount}
    >
      <DashboardHeader profile={profile} />
      {children}
    </DashboardLayout>
  );
}
