import type { Database } from "@/supabase/types/database.types";

type OrganizationStatus =
  Database["public"]["Enums"]["organization_status"];

interface Props {
  status: OrganizationStatus;
}

export default function OrganizationStatusBadge({
  status,
}: Props) {

  const active =
    status === "active";

  return (
    <span
      className={
        active
          ? "rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700"
          : "rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
      }
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}