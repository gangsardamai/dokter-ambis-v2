import type { Database } from "@/supabase/types/database.types";

export type ProfileRole = Database["public"]["Enums"]["profile_role"];

export interface DashboardMenuItem {
  title: string;
  href: string;
}

export interface DashboardMenuSection {
  title: string;
  items: DashboardMenuItem[];
}

export const dashboardMenus: Record<ProfileRole, DashboardMenuSection[]> = {
  admin: [
    {
      title: "Dashboard",
      items: [
        {
          title: "Ringkasan Admin",
          href: "/dashboard/admin",
        },
      ],
    },
    {
      title: "Master Data",
      items: [
        {
          title: "Universitas",
          href: "/dashboard/admin/organization",
        },
        {
          title: "Program",
          href: "/dashboard/admin/program",
        },
        {
          title: "Course",
          href: "/dashboard/admin/course",
        },
      ],
    },
    {
      title: "Pembelajaran",
      items: [
        {
          title: "Lesson",
          href: "/dashboard/admin/lesson",
        },
        {
          title: "Video",
          href: "/dashboard/admin/video",
        },
        {
          title: "File",
          href: "/dashboard/admin/file",
        },
        {
          title: "Live Class",
          href: "/dashboard/admin/live-class",
        },
      ],
    },
    {
      title: "Operasional",
      items: [
        {
          title: "Promotion",
          href: "/dashboard/admin/promotion",
        },
        {
          title: "Enrollment",
          href: "/dashboard/admin/enrollment",
        },
      ],
    },
  ],

  mentor: [
    {
      title: "Mentor",
      items: [
        {
          title: "Course Ditugaskan",
          href: "/dashboard/mentor",
        },
        {
          title: "Profil",
          href: "/dashboard/mentor/profile",
        },
      ],
    },
  ],

  student: [
    {
      title: "Student",
      items: [
        {
          title: "Course Dimiliki",
          href: "/dashboard/student",
        },
        {
          title: "Cari Course",
          href: "/dashboard/student/course",
        },
        {
          title: "Profil",
          href: "/dashboard/student/profile",
        },
      ],
    },
  ],
};
