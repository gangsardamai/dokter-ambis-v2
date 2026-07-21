import {
  StatusBadge,
} from "@/components/admin";

import type { Database } from "@/supabase/types/database.types";

type OrganizationStatus =
  Database["public"]["Enums"]["organization_status"];

interface OrganizationStatusBadgeProps {

  status: OrganizationStatus;

}

export default function OrganizationStatusBadge({

  status,

}: OrganizationStatusBadgeProps) {

  return (

    <StatusBadge

      label={
        status === "active"
          ? "Active"
          : "Inactive"
      }

      color={
        status === "active"
          ? "green"
          : "red"
      }

    />

  );

}