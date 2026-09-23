export const LEADER_PERMISSIONS = [
  "manage_master_data",
  "manage_enrollment",
  "manage_messages",
  "manage_announcements",
] as const;

export type LeaderPermission = (typeof LEADER_PERMISSIONS)[number];

export const LEADER_PERMISSION_LABELS: Record<LeaderPermission, string> = {
  manage_master_data: "Master Data",
  manage_enrollment: "Enrollment",
  manage_messages: "Kotak Pesan",
  manage_announcements: "Pengumuman",
};

export function isLeaderPermission(value: string): value is LeaderPermission {
  return (LEADER_PERMISSIONS as readonly string[]).includes(value);
}

export function getLeaderPermissionForHref(
  href: string,
): LeaderPermission | null {
  if (
    href.startsWith("/dashboard/admin/organization") ||
    href.startsWith("/dashboard/admin/program") ||
    href.startsWith("/dashboard/admin/course")
  ) {
    return "manage_master_data";
  }

  if (href.startsWith("/dashboard/admin/enrollment")) {
    return "manage_enrollment";
  }

  if (href.startsWith("/dashboard/admin/messages")) {
    return "manage_messages";
  }

  if (href.startsWith("/dashboard/admin/announcements")) {
    return "manage_announcements";
  }

  return null;
}
