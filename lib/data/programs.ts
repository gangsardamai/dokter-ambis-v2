import { Program } from "@/types";

export const programs: Program[] = [
  {
    id: "blok",
    title: "Program Belajar Sesuai Blok",
    slug: "belajar-sesuai-blok",

    description:
      "Program pembelajaran berdasarkan blok sesuai kurikulum masing-masing universitas.",

    thumbnail: "/images/programs/blok.jpg",

    status: "active",
  },

  {
    id: "ukmppd",
    title: "Try Out UKMPPD",

    slug: "try-out-ukmppd",

    description:
      "Simulasi Try Out UKMPPD berbasis Computer Assisted Test (CAT).",

    thumbnail: "/images/programs/ukmppd.jpg",

    status: "coming_soon",
  },
];