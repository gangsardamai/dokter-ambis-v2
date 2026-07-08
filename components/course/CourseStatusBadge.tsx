import type { Database } from "@/supabase/types/database.types";

type CourseStatus =
  Database["public"]["Enums"]["course_status"];

interface Props {
  status: CourseStatus;
}

export default function CourseStatusBadge({
  status,
}: Props) {

  const styles: Record<CourseStatus, string> = {
    draft:
      "rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700",

    active:
      "rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700",

    archived:
      "rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700",
  };

  const labels: Record<CourseStatus, string> = {
    draft: "Draft",
    active: "Active",
    archived: "Archived",
  };

  return (
    <span className={styles[status]}>
      {labels[status]}
    </span>
  );
}