import type { ReactNode } from "react";

import { requireActiveAdminOrLeader } from "@/lib/auth/require-active-admin-or-leader";

export default async function ScopedStaffLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireActiveAdminOrLeader();
  return children;
}
