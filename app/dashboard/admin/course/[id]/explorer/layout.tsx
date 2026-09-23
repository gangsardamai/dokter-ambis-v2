import type { ReactNode } from "react";

import { requireActiveAdmin } from "@/lib/auth/require-active-admin";

export default async function AdminOnlyLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireActiveAdmin();
  return children;
}
