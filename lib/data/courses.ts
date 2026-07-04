import { Course } from "@/types";

export const courses: Course[] = [
  // =========================================
  // UNIVERSITAS INDONESIA
  // =========================================

  {
    id: "ui-kardiovaskular",
    organizationId: "ui",
    programId: "blok",

    title: "Blok Kardiovaskular",

    description:
      "Mempelajari anatomi, fisiologi, patologi, dan terapi penyakit kardiovaskular.",

    totalLessons: 10,

    thumbnail: "/images/courses/kardiovaskular.jpg",

    mentorId: "mentor-1",

    status: "active",
  },

  {
    id: "ui-respirasi",
    organizationId: "ui",
    programId: "blok",

    title: "Blok Respirasi",

    description:
      "Pembelajaran sistem respirasi.",

    totalLessons: 8,

    thumbnail: "/images/courses/respirasi.jpg",

    mentorId: "mentor-2",

    status: "active",
  },

  // =========================================
  // UNIVERSITAS AIRLANGGA
  // =========================================

  {
    id: "unair-kardiovaskular",
    organizationId: "unair",
    programId: "blok",

    title: "Blok Kardiovaskular",

    description:
      "Blok Kardiovaskular FK UNAIR.",

    totalLessons: 10,

    thumbnail: "/images/courses/kardiovaskular.jpg",

    mentorId: "mentor-1",

    status: "active",
  },

  // =========================================
  // UNIVERSITAS JEMBER
  // =========================================

  {
    id: "unej-kardiovaskular",
    organizationId: "unej",
    programId: "blok",

    title: "Blok Kardiovaskular",

    description:
      "Blok Kardiovaskular FK UNEJ.",

    totalLessons: 10,

    thumbnail: "/images/courses/kardiovaskular.jpg",

    mentorId: "mentor-1",

    status: "active",
  },
];