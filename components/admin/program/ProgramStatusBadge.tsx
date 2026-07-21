import {
  StatusBadge,
} from "@/components/admin";

import type { Database } from "@/supabase/types/database.types";

type ProgramStatus =
  Database["public"]["Enums"]["program_status"];

interface ProgramStatusBadgeProps {

  status: ProgramStatus;

}

export default function ProgramStatusBadge({

  status,

}: ProgramStatusBadgeProps) {

  const label =
    status === "active"
      ? "Active"
      : status === "coming_soon"
      ? "Coming Soon"
      : "Inactive";

  const color =
    status === "active"
      ? "green"
      : status === "coming_soon"
      ? "yellow"
      : "red";

  return (

    <StatusBadge

      label={label}

      color={color}

    />

  );

}