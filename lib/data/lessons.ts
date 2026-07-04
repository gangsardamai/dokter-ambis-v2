import { Lesson } from "@/types";

export const lessons: Lesson[] = [
  {
    id: "anatomi-jantung",
    courseId: "ui-kardiovaskular",
    title: "Anatomi Jantung",
    order: 1,
    description: "Anatomi jantung dan pembuluh darah besar.",
    duration: 45,
    isFree: true,
  },

  {
    id: "fisiologi-jantung",
    courseId: "ui-kardiovaskular",
    title: "Fisiologi Jantung",
    order: 2,
    description: "Fisiologi sistem kardiovaskular.",
    duration: 50,
    isFree: false,
  },

  {
    id: "embriologi",
    courseId: "ui-kardiovaskular",
    title: "Embriologi Sistem Kardiovaskular",
    order: 3,
    description: "Perkembangan embrio sistem kardiovaskular.",
    duration: 38,
    isFree: false,
  },

  {
    id: "histologi",
    courseId: "ui-kardiovaskular",
    title: "Histologi Jantung",
    order: 4,
    description: "Histologi jaringan jantung.",
    duration: 40,
    isFree: false,
  },

  {
    id: "hipertensi",
    courseId: "ui-kardiovaskular",
    title: "Hipertensi",
    order: 5,
    description: "Diagnosis dan terapi hipertensi.",
    duration: 60,
    isFree: false,
  },

  {
    id: "aritmia",
    courseId: "ui-kardiovaskular",
    title: "Aritmia",
    order: 6,
    description: "Gangguan irama jantung.",
    duration: 55,
    isFree: false,
  },

  {
    id: "acs",
    courseId: "ui-kardiovaskular",
    title: "Acute Coronary Syndrome",
    order: 7,
    description: "Sindrom Koroner Akut.",
    duration: 75,
    isFree: false,
  },

  {
    id: "gagal-jantung",
    courseId: "ui-kardiovaskular",
    title: "Gagal Jantung",
    order: 8,
    description: "Diagnosis dan terapi gagal jantung.",
    duration: 55,
    isFree: false,
  },

  {
    id: "syok-kardiogenik",
    courseId: "ui-kardiovaskular",
    title: "Syok Kardiogenik",
    order: 9,
    description: "Penatalaksanaan syok kardiogenik.",
    duration: 35,
    isFree: false,
  },

  {
    id: "final-tryout",
    courseId: "ui-kardiovaskular",
    title: "Final Try Out",
    order: 10,
    description: "Evaluasi akhir blok.",
    duration: 120,
    isFree: false,
  },
];