import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import {
  DashboardLayout,
  DashboardHeader,
} from "@/components/dashboard";

import {
  authService,
  profileService,
} from "@/services";

interface DashboardRootLayoutProps {
  children: ReactNode;
}

export default async function DashboardRootLayout({
  children,
}: DashboardRootLayoutProps) {

  const authenticated =
    await authService.isAuthenticated();

  if (!authenticated) {

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

  return (

    <DashboardLayout>

      <DashboardHeader
        profile={profile}
      />

      {children}

    </DashboardLayout>

  );

}