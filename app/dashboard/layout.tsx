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

type MessageProfileRole = "student" | "mentor" | "admin";

async function getMessageNotificationCount(
  profileId: string,
  role: MessageProfileRole,
): Promise<number> {
  const threads =
    role === "student"
      ? await lessonMessageService.getStudentInbox(profileId)
      : role === "mentor"
        ? await lessonMessageService.getMentorInbox(profileId)
        : await lessonMessageService.getAdminInbox(profileId);

  return threads.filter(
    (thread) =>
      thread.status === "open" &&
      thread.latestSenderRole === "student",
  ).length;
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

  try {
    messageUnreadCount = await getMessageNotificationCount(
      profile.id,
      profile.role,
    );
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
