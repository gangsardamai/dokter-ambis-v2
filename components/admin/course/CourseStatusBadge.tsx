import StatusBadge
from "@/components/admin/common/StatusBadge";

import type { Database }
from "@/supabase/types/database.types";

type CourseStatus =
  Database["public"]["Enums"]["course_status"];

interface CourseStatusBadgeProps {

  status: CourseStatus;

}

export default function CourseStatusBadge({

  status,

}: CourseStatusBadgeProps) {

  switch (status) {

    case "active":

      return (

        <StatusBadge
          label="Active"
          color="green"
        />

      );

    case "draft":

      return (

        <StatusBadge
          label="Draft"
          color="yellow"
        />

      );

    case "archived":

      return (

        <StatusBadge
          label="Archived"
          color="gray"
        />

      );

    default:

      return (

        <StatusBadge
          label="Unknown"
          color="gray"
        />

      );

  }

}