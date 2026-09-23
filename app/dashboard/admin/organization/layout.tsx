import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { leaderAccessService } from "@/services";

export default async function ScopedStaffLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    await leaderAccessService.requireStaffPermission("manage_master_data");
  } catch {
    redirect("/dashboard");
  }

  return children;
}
