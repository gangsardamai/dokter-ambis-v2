import type { Database } from "@/supabase/types/database.types";

export type ProfileRole =
  Database["public"]["Enums"]["profile_role"];

export interface DashboardMenuItem {
  title: string;
  href: string;
}

export interface DashboardMenuSection {
  title: string;
  items: DashboardMenuItem[];
}

export const dashboardMenus: Record<
  ProfileRole,
  DashboardMenuSection[]
> = {
  admin: [
    {
      title: "MASTER DATA",
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
  title: "PEMBELAJARAN",
  items: [
    {
      title: "Explorer",
      href: "/dashboard/admin/explorer",
    },
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
      title: "Quiz",
      href: "/dashboard/admin/quiz",
    },
    {
      title: "Live Class",
      href: "/dashboard/admin/live-class",
    },
  ],
},
   

    {
      title: "OPERASIONAL",
      items: [
        {
          title: "Promotion",
          href: "/dashboard/admin/promotion",
        },
        {
          title: "Enrollment",
          href: "/dashboard/admin/enrollment",
        },
        {
          title: "Pembayaran",
          href: "/dashboard/admin/payment",
        },
        {
          title: "Peserta",
          href: "/dashboard/admin/participant",
        },
      ],
    },

    {
      title: "SDM",
      items: [
        {
          title: "Mentor",
          href: "/dashboard/admin/mentor",
        },
      ],
    },

    {
      title: "LAPORAN",
      items: [
        {
          title: "Laporan",
          href: "/dashboard/admin/report",
        },
      ],
    },

    {
      title: "PENGATURAN",
      items: [
        {
          title: "Settings",
          href: "/dashboard/admin/settings",
        },
      ],
    },
  ],

  mentor: [
    {
      title: "MENTOR",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard/mentor",
        },
        {
          title: "Materi Saya",
          href: "/dashboard/mentor/course",
        },
        {
          title: "Live Class",
          href: "/dashboard/mentor/live-class",
        },
      ],
    },
  ],

  student: [
    {
      title: "MAHASISWA",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard/student",
        },
        {
          title: "Program Saya",
          href: "/dashboard/student/program",
        },
        {
          title: "Progress",
          href: "/dashboard/student/progress",
        },
      ],
    },
  ],
};