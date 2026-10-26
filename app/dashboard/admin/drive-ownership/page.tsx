import { requireActiveAdmin } from "@/lib/auth/require-active-admin";
import DriveOwnershipPilot from "./pilot";

export const dynamic = "force-dynamic";

export default async function DriveOwnershipPage() {
  await requireActiveAdmin();
  return <DriveOwnershipPilot />;
}
