import type { Database } from "@/supabase/types/database.types";

type ProgramStatus =
  Database["public"]["Enums"]["program_status"];

interface Props {
  status: ProgramStatus;
}

export default function ProgramStatusBadge({
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